import React, { useState } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Share,
  Linking,
  StyleSheet,
} from "react-native";
import { useDettes } from "../../lib/store";
import { s } from "../../lib/styles";
import { Devise, dejaPaye, estPaye, formater, reste } from "../../lib/utils";

// Mets ici ton lien pour recevoir les avis, par exemple un lien WhatsApp
// de la forme "https://wa.me/NUMERO_AVEC_INDICATIF" ou un lien Google Forms.
const LIEN_AVIS = "";

const Section = ({ titre, children }: { titre: string; children: React.ReactNode }) => (
  <View style={{ marginBottom: 24 }}>
    <Text style={s.sousTitre}>{titre}</Text>
    {children}
  </View>
);

export default function PageReglages() {
  const { dettes, deviseDefaut, changerDeviseDefaut, exporter, importer, toutEffacer } =
    useDettes();
  const [restaurer, setRestaurer] = useState(false);
  const [texte, setTexte] = useState("");

  const enCours = dettes.filter((d) => !estPaye(d)).length;
  const payees = dettes.length - enCours;

  const stat = (dev: Devise) => {
    const l = dettes.filter((x) => x.devise === dev);
    return {
      prete: l.reduce((somme, x) => somme + x.montant, 0),
      recupere: l.reduce((somme, x) => somme + dejaPaye(x), 0),
      reste: l.reduce((somme, x) => somme + reste(x), 0),
    };
  };

  const partager = async () => {
    if (dettes.length === 0) {
      Alert.alert("Rien à sauvegarder", "Ajoute d'abord au moins une dette.");
      return;
    }
    try {
      await Share.share({ message: exporter(), title: "Sauvegarde DetteManager" });
    } catch (e) {
      Alert.alert("Erreur", "Impossible de partager la sauvegarde.");
    }
  };

  const lancerRestauration = () => {
    if (!texte.trim()) {
      Alert.alert("Erreur", "Colle d'abord le texte de ta sauvegarde.");
      return;
    }
    Alert.alert(
      "Restaurer la sauvegarde",
      "Les dettes actuelles seront remplacées par celles de la sauvegarde.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Restaurer",
          onPress: () => {
            const erreur = importer(texte);
            if (erreur) {
              Alert.alert("Erreur", erreur);
              return;
            }
            setTexte("");
            setRestaurer(false);
            Alert.alert("Terminé", "Ta sauvegarde a été restaurée.");
          },
        },
      ]
    );
  };

  const donnerAvis = () => {
    if (!LIEN_AVIS) {
      Alert.alert("Bientôt disponible", "Le lien pour donner ton avis n'est pas encore configuré.");
      return;
    }
    Linking.openURL(LIEN_AVIS).catch(() =>
      Alert.alert("Erreur", "Impossible d'ouvrir le lien.")
    );
  };

  const confirmerEffacement = () =>
    Alert.alert("Tout effacer", "Toutes les dettes et tous les paiements seront supprimés.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Effacer",
        style: "destructive",
        onPress: () => {
          toutEffacer();
          Alert.alert("Terminé", "Toutes les données ont été effacées.");
        },
      },
    ]);

  return (
    <ScrollView style={s.page} keyboardShouldPersistTaps="handled">
      <Section titre="Préférences">
        <Text style={s.label}>Devise par défaut pour les nouvelles dettes</Text>
        <View style={s.devises}>
          {(["FC", "USD"] as Devise[]).map((d) => (
            <TouchableOpacity
              key={d}
              style={[s.devise, deviseDefaut === d && s.deviseActive]}
              onPress={() => changerDeviseDefaut(d)}
            >
              <Text style={deviseDefaut === d ? s.texteChoixActif : s.texteChoix}>
                {d === "FC" ? "Francs (FC)" : "Dollars (USD)"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Section>

      <Section titre="Statistiques">
        <View style={s.carte}>
          <Text style={r.ligne}>Dettes en cours : {enCours}</Text>
          <Text style={r.ligne}>Dettes payées : {payees}</Text>
          {(["FC", "USD"] as Devise[]).map((dev) => {
            const st = stat(dev);
            return (
              <View key={dev} style={r.bloc}>
                <Text style={r.devise}>{dev}</Text>
                <Text style={r.ligne}>Prêté : {formater(st.prete, dev)}</Text>
                <Text style={r.ligne}>Récupéré : {formater(st.recupere, dev)}</Text>
                <Text style={r.ligne}>Reste : {formater(st.reste, dev)}</Text>
              </View>
            );
          })}
        </View>
      </Section>

      <Section titre="Sauvegarde">
        <View style={s.carte}>
          <Text style={r.ligne}>
            Tes données sont uniquement sur ce téléphone. Envoie-toi une sauvegarde
            (WhatsApp, e-mail...) pour ne rien perdre si tu changes de téléphone.
          </Text>
        </View>
        <TouchableOpacity style={s.bouton} onPress={partager}>
          <Text style={s.texteBouton}>Partager une sauvegarde</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.boutonContour} onPress={() => setRestaurer(!restaurer)}>
          <Text style={s.texteContour}>
            {restaurer ? "Fermer la restauration" : "Restaurer une sauvegarde"}
          </Text>
        </TouchableOpacity>
        {restaurer ? (
          <View style={{ marginTop: 12 }}>
            <Text style={s.label}>Colle ici le texte de ta sauvegarde</Text>
            <TextInput
              style={[s.champ, { minHeight: 100, textAlignVertical: "top" }]}
              value={texte}
              onChangeText={setTexte}
              multiline
              placeholder='{"app":"DetteManager", ...}'
            />
            <TouchableOpacity style={s.bouton} onPress={lancerRestauration}>
              <Text style={s.texteBouton}>Restaurer</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </Section>

      <Section titre="Aide et avis">
        <TouchableOpacity style={s.boutonContour} onPress={donnerAvis}>
          <Text style={s.texteContour}>Donner mon avis</Text>
        </TouchableOpacity>
        <View style={[s.carte, { marginTop: 12 }]}>
          <Text style={r.devise}>Confidentialité</Text>
          <Text style={r.ligne}>
            DetteManager ne collecte aucune donnée personnelle. Il n'y a ni compte
            ni serveur : tout reste enregistré sur ton téléphone. Si tu désinstalles
            l'application sans sauvegarde, tes dettes sont perdues.
          </Text>
        </View>
      </Section>

      <Section titre="Zone dangereuse">
        <TouchableOpacity style={[s.boutonDanger, { marginTop: 0 }]} onPress={confirmerEffacement}>
          <Text style={s.texteBouton}>Effacer toutes les données</Text>
        </TouchableOpacity>
      </Section>

      <Text style={{ textAlign: "center", color: "#aaa", marginBottom: 32 }}>
        DetteManager · Version 1.4.0
      </Text>
    </ScrollView>
  );
}

const r = StyleSheet.create({
  ligne: { fontSize: 14, color: "#444", lineHeight: 21, marginTop: 2 },
  devise: { fontSize: 15, fontWeight: "bold", color: "#222", marginTop: 2 },
  bloc: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#eee" },
});