import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { configure, supabase } from "./supabase";
import { Dette, Devise, Sens, dejaPaye, formater, reste } from "./utils";

const CLE_DETTES = "dettes";
const CLE_ACCUEIL = "accueil_vu";
const CLE_DEVISE = "devise_defaut";
const CLE_ATTENTE = "sync_en_attente";
const CLE_VERSION = "sync_version";

type Champs = {
  nom: string;
  montant: number;
  devise: Devise;
  note: string;
  date: string; // date ISO
  sens?: Sens;
  echeance?: string; // date limite ISO
};

type Store = {
  pret: boolean;
  accueilVu: boolean;
  dettes: Dette[];
  deviseDefaut: Devise;
  commencer: () => void;
  changerDeviseDefaut: (d: Devise) => void;
  ajouterDette: (c: Champs) => void;
  modifierDette: (id: string, c: Champs) => string | null;
  supprimerDette: (id: string) => void;
  ajouterPaiement: (detteId: string, montant: number, date: string) => string | null;
  modifierPaiement: (
    detteId: string,
    paiementId: string,
    montant: number,
    date: string
  ) => string | null;
  supprimerPaiement: (detteId: string, paiementId: string) => void;
  exporter: () => string;
  importer: (texte: string) => string | null;
  toutEffacer: () => void;
  // ----- Compte et sauvegarde en ligne -----
  configure: boolean;
  email: string | null;
  derniereSync: string | null;
  syncEnCours: boolean;
  conflit: boolean;
  inscrire: (email: string, mdp: string) => Promise<string | null>;
  connecter: (email: string, mdp: string) => Promise<string | null>;
  deconnecter: () => Promise<void>;
  supprimerCompte: () => Promise<string | null>;
  synchroniser: () => Promise<string | null>;
  resoudreConflit: (choix: "telephone" | "compte") => Promise<string | null>;
};

const Contexte = createContext<Store>({} as Store);
export const useDettes = () => useContext(Contexte);

// Remet les données au bon format (anciennes versions ou sauvegarde importée)
const normaliser = (brut: any[]): Dette[] =>
  brut.map((x: any, i: number) => {
    const id = String(x.id ?? Date.now() + "-" + i);
    const date = x.date || new Date(Number(x.id) || Date.now()).toISOString();
    let paiements: any[] = Array.isArray(x.paiements)
      ? x.paiements
      : x.paye
      ? [{ montant: x.montant }]
      : [];
    paiements = paiements
      .filter((p: any) => typeof p?.montant === "number")
      .map((p: any, j: number) => ({
        id: String(p.id ?? id + "p" + j),
        montant: p.montant,
        date: p.date || date,
      }));
    return {
      id,
      nom: String(x.nom),
      montant: x.montant,
      devise: (x.devise === "FC" ? "FC" : "USD") as Devise,
      note: x.note ? String(x.note) : "",
      date,
      paiements,
      sens: (x.sens === "jeDois" ? "jeDois" : "onMeDoit") as Sens,
      echeance: x.echeance ? String(x.echeance) : undefined,
    };
  });

const traduireErreur = (message: string) => {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou mot de passe incorrect.";
  if (m.includes("already registered")) return "Un compte existe déjà avec cet e-mail. Connecte-toi.";
  if (m.includes("at least")) return "Le mot de passe doit contenir au moins 6 caractères.";
  if (m.includes("rate limit")) return "Trop de tentatives. Réessaie dans quelques minutes.";
  if (m.includes("network")) return "Pas de connexion internet.";
  if (m.includes("not confirmed")) return "Confirme d'abord ton e-mail, puis reconnecte-toi.";
  return "Erreur : " + message;
};

export function DettesProvider({ children }: { children: React.ReactNode }) {
  const [pret, setPret] = useState(false);
  const [accueilVu, setAccueilVu] = useState(false);
  const [dettes, setDettes] = useState<Dette[]>([]);
  const [deviseDefaut, setDeviseDefaut] = useState<Devise>("FC");
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [derniereSync, setDerniereSync] = useState<string | null>(null);
  const [syncEnCours, setSyncEnCours] = useState(false);
  const [conflit, setConflit] = useState(false);

  // Références pour toujours lire les valeurs les plus récentes
  const dettesRef = useRef<Dette[]>([]);
  const userIdRef = useRef<string | null>(null);
  const conflitRef = useRef(false);
  const fileRef = useRef<Promise<void>>(Promise.resolve());
  const synchroRef = useRef<() => Promise<string | null>>(async () => null);
  dettesRef.current = dettes;
  userIdRef.current = userId;
  conflitRef.current = conflit;

  // Chargement des données du téléphone
  useEffect(() => {
    (async () => {
      const [d, a, dev, v] = await Promise.all([
        AsyncStorage.getItem(CLE_DETTES),
        AsyncStorage.getItem(CLE_ACCUEIL),
        AsyncStorage.getItem(CLE_DEVISE),
        AsyncStorage.getItem(CLE_VERSION),
      ]);
      if (d) setDettes(normaliser(JSON.parse(d)));
      if (dev === "FC" || dev === "USD") setDeviseDefaut(dev);
      if (v) {
        try {
          setDerniereSync(JSON.parse(v).misAJour);
        } catch (e) {}
      }
      setAccueilVu(a === "oui");
      setPret(true);
    })();
  }, []);

  // Suivi de la connexion au compte
  useEffect(() => {
    if (!configure) return;
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
      setEmail(data.session?.user.email ?? null);
    });
    const { data: abonnement } = supabase.auth.onAuthStateChange((_evenement, session) => {
      setUserId(session?.user.id ?? null);
      setEmail(session?.user.email ?? null);
    });
    return () => abonnement.subscription.unsubscribe();
  }, []);

  // Rafraîchissement de la session et synchronisation au retour dans l'app
  useEffect(() => {
    if (!configure) return;
    const abo = AppState.addEventListener("change", (etat) => {
      if (etat === "active") {
        supabase.auth.startAutoRefresh();
        if (userIdRef.current) synchroRef.current();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });
    return () => abo.remove();
  }, []);

  // Synchronisation dès que l'utilisateur est connecté
  useEffect(() => {
    if (pret && userId) synchroRef.current();
  }, [pret, userId]);

  // ----- Synchronisation avec le compte en ligne -----
  const pousser = async (liste: Dette[], uid: string): Promise<string | null> => {
    try {
      await AsyncStorage.setItem(CLE_ATTENTE, "oui");
      const { data, error } = await supabase
        .from("sauvegardes")
        .upsert({ user_id: uid, donnees: liste, mis_a_jour: new Date().toISOString() })
        .select("mis_a_jour")
        .single();
      if (error || !data) return "Sauvegarde en ligne impossible pour le moment.";
      await AsyncStorage.setItem(CLE_ATTENTE, "non");
      await AsyncStorage.setItem(
        CLE_VERSION,
        JSON.stringify({ userId: uid, misAJour: data.mis_a_jour })
      );
      setDerniereSync(data.mis_a_jour);
      return null;
    } catch (e) {
      return "Sauvegarde en ligne impossible pour le moment.";
    }
  };

  const versionConnue = async (uid: string): Promise<string | null> => {
    const v = await AsyncStorage.getItem(CLE_VERSION);
    if (!v) return null;
    try {
      const o = JSON.parse(v);
      return o.userId === uid ? o.misAJour : null;
    } catch (e) {
      return null;
    }
  };

  const chargerDepuisCompte = async (donnees: any[], version: string, uid: string) => {
    const liste = normaliser(donnees);
    setDettes(liste);
    await AsyncStorage.setItem(CLE_DETTES, JSON.stringify(liste));
    await AsyncStorage.setItem(CLE_ATTENTE, "non");
    await AsyncStorage.setItem(CLE_VERSION, JSON.stringify({ userId: uid, misAJour: version }));
    setDerniereSync(version);
  };

  const synchroniser = async (): Promise<string | null> => {
    const uid = userIdRef.current;
    if (!uid || !configure) return null;
    if (conflitRef.current) return null;
    setSyncEnCours(true);
    try {
      const { data, error } = await supabase
        .from("sauvegardes")
        .select("donnees, mis_a_jour")
        .maybeSingle();
      if (error) return "Impossible de joindre le serveur. Vérifie ta connexion internet.";

      const locales = dettesRef.current;
      const attente = (await AsyncStorage.getItem(CLE_ATTENTE)) === "oui";
      const connue = await versionConnue(uid);

      // Rien sur le serveur : on envoie ce qu'il y a sur le téléphone
      if (!data) {
        if (locales.length > 0 || attente) return await pousser(locales, uid);
        return null;
      }

      const cloud: any[] = Array.isArray(data.donnees) ? data.donnees : [];

      // Premier lien entre ce téléphone et ce compte
      if (connue === null) {
        if (locales.length === 0) {
          await chargerDepuisCompte(cloud, data.mis_a_jour, uid);
        } else if (cloud.length === 0) {
          return await pousser(locales, uid);
        } else if (JSON.stringify(normaliser(cloud)) === JSON.stringify(locales)) {
          await AsyncStorage.setItem(
            CLE_VERSION,
            JSON.stringify({ userId: uid, misAJour: data.mis_a_jour })
          );
          setDerniereSync(data.mis_a_jour);
        } else {
          setConflit(true);
        }
        return null;
      }

      // Modifications faites hors ligne : on les envoie
      if (attente) return await pousser(locales, uid);

      // Le compte a été modifié depuis un autre téléphone : on récupère
      if (data.mis_a_jour !== connue) {
        await chargerDepuisCompte(cloud, data.mis_a_jour, uid);
      }
      return null;
    } catch (e) {
      return "Synchronisation impossible pour le moment.";
    } finally {
      setSyncEnCours(false);
    }
  };
  synchroRef.current = synchroniser;

  const resoudreConflit = async (choix: "telephone" | "compte"): Promise<string | null> => {
    const uid = userIdRef.current;
    if (!uid) return "Tu n'es pas connecté.";
    setSyncEnCours(true);
    try {
      if (choix === "telephone") {
        const erreur = await pousser(dettesRef.current, uid);
        if (erreur) return erreur;
      } else {
        const { data, error } = await supabase
          .from("sauvegardes")
          .select("donnees, mis_a_jour")
          .maybeSingle();
        if (error || !data) return "Impossible de récupérer ta sauvegarde en ligne.";
        await chargerDepuisCompte(
          Array.isArray(data.donnees) ? data.donnees : [],
          data.mis_a_jour,
          uid
        );
      }
      setConflit(false);
      return null;
    } catch (e) {
      return "Opération impossible pour le moment.";
    } finally {
      setSyncEnCours(false);
    }
  };

  // ----- Compte : inscription, connexion, déconnexion, suppression -----
  const nettoyerSync = async () => {
    await AsyncStorage.removeItem(CLE_ATTENTE);
    await AsyncStorage.removeItem(CLE_VERSION);
    setDerniereSync(null);
    setConflit(false);
  };

  const inscrire = async (mail: string, mdp: string): Promise<string | null> => {
    if (!configure) return "La connexion en ligne n'est pas encore configurée.";
    try {
      const { data, error } = await supabase.auth.signUp({ email: mail.trim(), password: mdp });
      if (error) return traduireErreur(error.message);
      if (!data.session) {
        return "Compte créé. Confirme ton e-mail, puis connecte-toi.";
      }
      return null;
    } catch (e) {
      return "Pas de connexion internet.";
    }
  };

  const connecter = async (mail: string, mdp: string): Promise<string | null> => {
    if (!configure) return "La connexion en ligne n'est pas encore configurée.";
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: mail.trim(),
        password: mdp,
      });
      if (error) return traduireErreur(error.message);
      return null;
    } catch (e) {
      return "Pas de connexion internet.";
    }
  };

  const deconnecter = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    await nettoyerSync();
    setUserId(null);
    setEmail(null);
  };

  const supprimerCompte = async (): Promise<string | null> => {
    if (!userIdRef.current) return "Tu n'es pas connecté.";
    try {
      const { error } = await supabase.rpc("supprimer_mon_compte");
      if (error) return "Suppression impossible pour le moment. Vérifie ta connexion internet.";
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch (e) {}
      await nettoyerSync();
      setUserId(null);
      setEmail(null);
      return null;
    } catch (e) {
      return "Suppression impossible pour le moment. Vérifie ta connexion internet.";
    }
  };

  // ----- Enregistrement local, puis envoi au compte si connecté -----
  const maj = (liste: Dette[]) => {
    setDettes(liste);
    AsyncStorage.setItem(CLE_DETTES, JSON.stringify(liste));
    const uid = userIdRef.current;
    if (uid) {
      AsyncStorage.setItem(CLE_ATTENTE, "oui");
      fileRef.current = fileRef.current.then(async () => {
        if (!conflitRef.current) await pousser(liste, uid);
      });
    }
  };

  const commencer = () => {
    AsyncStorage.setItem(CLE_ACCUEIL, "oui");
    setAccueilVu(true);
  };

  const changerDeviseDefaut = (d: Devise) => {
    setDeviseDefaut(d);
    AsyncStorage.setItem(CLE_DEVISE, d);
  };

  // ----- DETTES : créer, modifier, supprimer -----
  const ajouterDette = (c: Champs) => {
    const nouvelle = normaliser([{ ...c, id: Date.now().toString(), paiements: [] }])[0];
    maj([nouvelle, ...dettes]);
  };

  const modifierDette = (id: string, c: Champs) => {
    const d = dettes.find((x) => x.id === id);
    if (!d) return "Dette introuvable.";
    if (c.montant < dejaPaye(d)) {
      return (
        "Le montant ne peut pas être plus petit que ce qui est déjà payé (" +
        formater(dejaPaye(d), d.devise) +
        ")."
      );
    }
    maj(dettes.map((x) => (x.id === id ? normaliser([{ ...x, ...c }])[0] : x)));
    return null;
  };

  const supprimerDette = (id: string) => {
    maj(dettes.filter((x) => x.id !== id));
  };

  // ----- PAIEMENTS (récupérations) : créer, modifier, supprimer -----
  const ajouterPaiement = (detteId: string, montant: number, date: string) => {
    const d = dettes.find((x) => x.id === detteId);
    if (!d) return "Dette introuvable.";
    if (montant > reste(d) + 0.001) {
      return "Ce paiement dépasse le reste à payer (" + formater(reste(d), d.devise) + ").";
    }
    const nouveau = { id: Date.now().toString(), montant, date };
    maj(
      dettes.map((x) =>
        x.id === detteId ? { ...x, paiements: [...x.paiements, nouveau] } : x
      )
    );
    return null;
  };

  const modifierPaiement = (
    detteId: string,
    paiementId: string,
    montant: number,
    date: string
  ) => {
    const d = dettes.find((x) => x.id === detteId);
    if (!d) return "Dette introuvable.";
    const ancien = d.paiements.find((p) => p.id === paiementId);
    if (!ancien) return "Paiement introuvable.";
    const max = reste(d) + ancien.montant;
    if (montant > max + 0.001) {
      return "Ce paiement dépasse le maximum possible (" + formater(max, d.devise) + ").";
    }
    maj(
      dettes.map((x) =>
        x.id === detteId
          ? {
              ...x,
              paiements: x.paiements.map((p) =>
                p.id === paiementId ? { ...p, montant, date } : p
              ),
            }
          : x
      )
    );
    return null;
  };

  const supprimerPaiement = (detteId: string, paiementId: string) => {
    maj(
      dettes.map((x) =>
        x.id === detteId
          ? { ...x, paiements: x.paiements.filter((p) => p.id !== paiementId) }
          : x
      )
    );
  };

  // ----- SAUVEGARDE MANUELLE : exporter / importer -----
  const exporter = () =>
    JSON.stringify({ app: "DetteManager", version: 1, dettes });

  const importer = (texte: string) => {
    let donnees: any;
    try {
      donnees = JSON.parse(texte.trim());
    } catch (e) {
      return "Ce texte n'est pas une sauvegarde valide.";
    }
    const liste = Array.isArray(donnees) ? donnees : donnees?.dettes;
    if (!Array.isArray(liste)) return "Ce texte n'est pas une sauvegarde valide.";
    const valide = liste.every(
      (x: any) => x && typeof x.nom === "string" && typeof x.montant === "number" && x.montant > 0
    );
    if (!valide) return "La sauvegarde contient des données incorrectes.";
    maj(normaliser(liste));
    return null;
  };

  const toutEffacer = () => maj([]);

  return (
    <Contexte.Provider
      value={{
        pret,
        accueilVu,
        dettes,
        deviseDefaut,
        commencer,
        changerDeviseDefaut,
        ajouterDette,
        modifierDette,
        supprimerDette,
        ajouterPaiement,
        modifierPaiement,
        supprimerPaiement,
        exporter,
        importer,
        toutEffacer,
        configure,
        email,
        derniereSync,
        syncEnCours,
        conflit,
        inscrire,
        connecter,
        deconnecter,
        supprimerCompte,
        synchroniser,
        resoudreConflit,
      }}
    >
      {children}
    </Contexte.Provider>
  );
}