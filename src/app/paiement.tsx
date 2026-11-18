import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useDettes } from "../lib/store";
import {
  BLEU,
  BLEU_FONCE,
  BORDURE,
  Devise,
  FOND,
  GRIS,
  ROUGE,
  TEXTE,
  VERT,
  arrondi,
  dateDuJour,
  estPaye,
  formater,
  formaterDate,
  initiale,
  lireDate,
  lireMontant,
  reste,
  sensDe,
} from "../lib/utils";

const ombre = {
  shadowColor: "#0f172a",
  shadowOpacity: 0.07,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};

// Arrondi adapté à la devise : entier pour les francs, centimes pour les dollars
const arrondiDevise = (x: number, dev: Devise) => (dev === "FC" ? Math.round(x) : arrondi(x));

// Page RÉCUPÉRATION / REMBOURSEMENT : enregistrer, modifier ou supprimer un paiement
export default function PagePaiement() {
  const router = useRouter();
  const params = useLocalSearchParams<{ detteId?: string; paiementId?: string }>();
  const { dettes, ajouterPaiement, modifierPaiement, supprimerPaiement } = useDettes();

  const [detteId, setDetteId] = useState<string | undefined>(params.detteId);
  const d = detteId ? dettes.find((x) => x.id === detteId) : undefined;
  const p = d && params.paiementId ? d.paiements.find((x) => x.id === params.paiementId) : undefined;

  const [montant, setMontant] = useState(p ? String(p.montant) : "");
  const [date, setDate] = useState(p ? formaterDate(p.date) : dateDuJour());

  // La dette n'existe plus
  if (params.detteId && !d) return null;

  // ----- Étape 1 : choisir la dette concernée -----
  if (!d) {
    const actives = dettes.filter((x) => !estPaye(x));
    return (
      <ScrollView style={t.page}>
        <Stack.Screen options={{ title: "Nouveau paiement" }} />
        <Text style={t.titreEtape}>Pour quelle dette ?</Text>
        {actives.length === 0 ? (
          <View style={[t.carte, { alignItems: "center", paddingVertical: 28 }]}>
            <Text style={t.vide}>Aucune dette en cours.{"\n"}Ajoute d'abord une dette.</Text>
          </View>
        ) : (
          actives.map((x) => {
            const moiX = sensDe(x) === "onMeDoit";
            const couleur = moiX ? VERT : ROUGE;
            return (
              <TouchableOpacity
                key={x.id}
                style={[t.choix, { borderLeftColor: couleur }]}
                activeOpacity={0.85}
                onPress={() => setDetteId(x.id)}
              >
                <View style={[t.avatarPetit, { backgroundColor: moiX ? "#dcfce7" : "#fee2e2" }]}>
                  <Text style={[t.avatarPetitTexte, { color: couleur }]}>{initiale(x.nom)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={t.choixNom}>{x.nom}</Text>
                  <Text style={t.choixSous}>
                    {moiX ? "Te doit" : "Tu dois"} · reste {formater(reste(x), x.devise)}
                  </Text>
                </View>
                <Text style={t.fleche}>›</Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    );
  }

  // ----- Étape 2 : montant et date -----
  const moi = sensDe(d) === "onMeDoit";
  const accent = moi ? VERT : ROUGE;
  const mot = moi ? "récupération" : "remboursement";
  const resteDispo = p ? reste(d) + p.montant : reste(d);

  const valeur = lireMontant(montant);
  const valide = !isNaN(valeur) && valeur > 0;
  const depasse = valide && valeur > resteDispo + 0.001;
  const nouveauReste = Math.max(0, arrondi(resteDispo - (valide ? valeur : 0)));

  const rapide = (part: number) => setMontant(String(arrondiDevise(resteDispo * part, d.devise)));

  const enregistrer = () => {
    const dateIso = lireDate(date);
    if (!valide) {
      Alert.alert("Erreur", "Entre un montant valide.");
      return;
    }
    if (!dateIso) {
      Alert.alert("Erreur", "La date doit être au format JJ/MM/AAAA (ex : 25/12/2026).");
      return;
    }
    const erreur = p
      ? modifierPaiement(d.id, p.id, valeur, dateIso)
      : ajouterPaiement(d.id, valeur, dateIso);
    if (erreur) {
      Alert.alert("Erreur", erreur);
      return;
    }
    router.back();
  };

  const confirmerSuppression = () => {
    if (!p) return;
    Alert.alert("Supprimer ce paiement ?", "Il sera retiré de l'historique de la dette.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => {
          supprimerPaiement(d.id, p.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView style={t.page} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Stack.Screen
        options={{
          title: p
            ? "Modifier le " + mot
            : moi
            ? "Nouvelle récupération"
            : "Nouveau remboursement",
        }}
      />

      {/* ----- Résumé de la dette ----- */}
      <View style={t.hero}>
        <View style={t.identite}>
          <View style={t.avatar}>
            <Text style={t.avatarTexte}>{initiale(d.nom)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={t.heroNom} numberOfLines={1}>
              {d.nom}
            </Text>
            <View style={[t.pastille, { backgroundColor: accent }]}>
              <Text style={t.pastilleTexte}>{moi ? "On me doit" : "Je dois"}</Text>
            </View>
          </View>
          {!p && !params.detteId ? (
            <TouchableOpacity onPress={() => setDetteId(undefined)}>
              <Text style={t.changer}>Changer</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <Text style={t.heroLabel}>{moi ? "RESTE À RÉCUPÉRER" : "RESTE À REMBOURSER"}</Text>
        <Text style={t.heroMontant}>{formater(resteDispo, d.devise)}</Text>
        <Text style={t.heroSous}>sur une dette de {formater(d.montant, d.devise)}</Text>
      </View>

      {/* ----- Montant ----- */}
      <Text style={t.label}>{moi ? "Montant récupéré" : "Montant remboursé"}</Text>
      <View style={[t.carte, depasse && { borderColor: ROUGE, borderWidth: 1.5 }]}>
        <View style={t.ligneMontant}>
          <TextInput
            style={t.inputMontant}
            value={montant}
            onChangeText={setMontant}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#cbd5e1"
          />
          <Text style={t.devise}>{d.devise}</Text>
        </View>
        <View style={t.rapides}>
          {[
            ["25 %", 0.25],
            ["50 %", 0.5],
            ["Tout le reste", 1],
          ].map(([texte, part]) => (
            <TouchableOpacity
              key={String(texte)}
              style={t.puceRapide}
              onPress={() => rapide(part as number)}
            >
              <Text style={t.puceRapideTexte}>{texte}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {depasse ? (
        <Text style={t.erreur}>
          Ce montant dépasse le reste à payer ({formater(resteDispo, d.devise)}).
        </Text>
      ) : valide ? (
        <Text style={t.apercu}>
          Nouveau reste : <Text style={{ color: nouveauReste === 0 ? VERT : TEXTE, fontWeight: "800" }}>
            {nouveauReste === 0 ? "Dette soldée ✓" : formater(nouveauReste, d.devise)}
          </Text>
        </Text>
      ) : null}

      {/* ----- Date ----- */}
      <Text style={t.label}>Date</Text>
      <View style={t.ligneDate}>
        <TextInput
          style={t.inputDate}
          value={date}
          onChangeText={setDate}
          placeholder="JJ/MM/AAAA"
          placeholderTextColor="#94a3b8"
        />
        <TouchableOpacity style={t.aujourdhui} onPress={() => setDate(dateDuJour())}>
          <Text style={t.aujourdhuiTexte}>Aujourd'hui</Text>
        </TouchableOpacity>
      </View>

      {/* ----- Actions ----- */}
      <TouchableOpacity
        style={[t.bouton, { backgroundColor: depasse ? "#94a3b8" : accent }]}
        activeOpacity={0.9}
        disabled={depasse}
        onPress={enregistrer}
      >
        <Text style={t.boutonTexte}>
          {p ? "Enregistrer les modifications" : "Enregistrer le " + mot}
        </Text>
      </TouchableOpacity>

      {p ? (
        <TouchableOpacity style={t.boutonContourRouge} onPress={confirmerSuppression}>
          <Text style={t.boutonContourRougeTexte}>Supprimer ce paiement</Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity style={t.annuler} onPress={() => router.back()}>
        <Text style={t.annulerTexte}>Annuler</Text>
      </TouchableOpacity>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const t = StyleSheet.create({
  page: { flex: 1, backgroundColor: FOND, padding: 16 },

  // Choix de la dette
  titreEtape: { fontSize: 18, fontWeight: "800", color: TEXTE, marginBottom: 14 },
  choix: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderLeftWidth: 6,
    padding: 14,
    marginBottom: 10,
    ...ombre,
  },
  avatarPetit: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarPetitTexte: { fontSize: 17, fontWeight: "800" },
  choixNom: { fontSize: 16, fontWeight: "800", color: TEXTE },
  choixSous: { fontSize: 13, color: GRIS, marginTop: 2 },
  fleche: { fontSize: 26, color: "#cbd5e1", paddingHorizontal: 4 },
  vide: { textAlign: "center", color: GRIS, lineHeight: 22 },

  // Résumé
  hero: { backgroundColor: BLEU_FONCE, borderRadius: 22, padding: 18, ...ombre },
  identite: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarTexte: { color: "#fff", fontSize: 19, fontWeight: "800" },
  heroNom: { color: "#fff", fontSize: 18, fontWeight: "800" },
  pastille: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 4,
  },
  pastilleTexte: { color: "#fff", fontSize: 11, fontWeight: "700" },
  changer: { color: "#93c5fd", fontWeight: "700", fontSize: 14, paddingLeft: 8 },
  heroLabel: { color: "#93c5fd", fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  heroMontant: { color: "#fff", fontSize: 30, fontWeight: "800", marginTop: 4 },
  heroSous: { color: "#bfdbfe", fontSize: 12, marginTop: 4 },

  // Saisie
  label: { fontSize: 13, fontWeight: "700", color: GRIS, marginTop: 22, marginBottom: 8, marginLeft: 2 },
  carte: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "transparent",
    ...ombre,
  },
  ligneMontant: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  inputMontant: {
    flex: 1,
    fontSize: 38,
    fontWeight: "800",
    color: TEXTE,
    textAlign: "center",
    paddingVertical: 6,
  },
  devise: { fontSize: 18, fontWeight: "800", color: GRIS, paddingRight: 6 },
  rapides: { flexDirection: "row", gap: 8, marginTop: 12, justifyContent: "center" },
  puceRapide: {
    backgroundColor: "#eff6ff",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  puceRapideTexte: { color: BLEU, fontWeight: "700", fontSize: 13 },
  apercu: { fontSize: 14, color: GRIS, textAlign: "center", marginTop: 12 },
  erreur: { fontSize: 13, color: ROUGE, fontWeight: "700", textAlign: "center", marginTop: 12 },

  ligneDate: { flexDirection: "row", gap: 10, alignItems: "center" },
  inputDate: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDURE,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: TEXTE,
  },
  aujourdhui: {
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  aujourdhuiTexte: { color: BLEU, fontWeight: "700", fontSize: 13 },

  // Boutons
  bouton: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 26, ...ombre },
  boutonTexte: { color: "#fff", fontSize: 16, fontWeight: "800" },
  boutonContourRouge: {
    borderWidth: 1.5,
    borderColor: ROUGE,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
    backgroundColor: "#fff",
  },
  boutonContourRougeTexte: { color: ROUGE, fontWeight: "800", fontSize: 15 },
  annuler: { alignItems: "center", paddingVertical: 16 },
  annulerTexte: { color: GRIS, fontWeight: "700", fontSize: 15 },
});