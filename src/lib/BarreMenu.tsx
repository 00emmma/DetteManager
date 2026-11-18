import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BLEU, BORDURE, GRIS } from "./utils";

export const ONGLETS = [
  { nom: "index", libelle: "Dettes", icone: "📒" },
  { nom: "ajouter", libelle: "Ajouter", icone: "➕" },
  { nom: "compte", libelle: "Compte", icone: "☁️" },
  { nom: "reglages", libelle: "Réglages", icone: "⚙️" },
];

// Chemin d'un onglet : "index" = page d'accueil "/"
export const cheminOnglet = (nom: string) => (nom === "index" ? "/" : "/" + nom);

type Props = {
  actif?: string; // nom de l'onglet à mettre en valeur
  onChoisir: (nom: string) => void;
};

// Menu du bas : le même sur toutes les pages
export default function BarreMenu({ actif, onChoisir }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[b.barre, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {ONGLETS.map((o) => {
        const selectionne = o.nom === actif;
        return (
          <TouchableOpacity
            key={o.nom}
            style={b.item}
            activeOpacity={0.7}
            onPress={() => onChoisir(o.nom)}
          >
            <View style={[b.trait, selectionne && { backgroundColor: BLEU }]} />
            <Text style={[b.icone, !selectionne && { opacity: 0.45 }]}>{o.icone}</Text>
            <Text style={[b.libelle, selectionne && { color: BLEU }]}>{o.libelle}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const b = StyleSheet.create({
  barre: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: BORDURE,
  },
  item: { flex: 1, alignItems: "center", paddingBottom: 2 },
  trait: { width: 30, height: 3, borderRadius: 2, backgroundColor: "transparent", marginBottom: 6 },
  icone: { fontSize: 22 },
  libelle: { fontSize: 11, fontWeight: "700", color: GRIS, marginTop: 2 },
});