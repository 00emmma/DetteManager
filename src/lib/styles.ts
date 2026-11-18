import { StyleSheet } from "react-native";
import { BLEU, BORDURE, FOND, GRIS, ROUGE, TEXTE } from "./utils";

// Ombre légère pour les cartes
export const ombre = {
  shadowColor: "#0f172a",
  shadowOpacity: 0.07,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};

export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: FOND, padding: 16 },
  sousTitre: { fontSize: 17, fontWeight: "700", color: TEXTE, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: "600", color: GRIS, marginBottom: 6, marginLeft: 2 },
  champ: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: BORDURE,
    fontSize: 16,
    color: TEXTE,
  },
  devises: { flexDirection: "row", gap: 10, marginBottom: 14 },
  devise: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BORDURE,
    alignItems: "center",
  },
  deviseActive: { backgroundColor: BLEU, borderColor: BLEU },
  texteChoix: { color: GRIS, fontWeight: "600" },
  texteChoixActif: { color: "#fff", fontWeight: "700" },

  bouton: {
    backgroundColor: BLEU,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
    ...ombre,
  },
  boutonContour: {
    borderWidth: 1.5,
    borderColor: BLEU,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "#fff",
  },
  texteContour: { color: BLEU, fontWeight: "700", fontSize: 15 },
  boutonDanger: {
    backgroundColor: ROUGE,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 12,
  },
  texteBouton: { color: "#fff", fontWeight: "700", fontSize: 16 },

  carte: { backgroundColor: "#fff", borderRadius: 16, padding: 16, ...ombre },
  ligne: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    ...ombre,
  },
  nom: { fontSize: 16, fontWeight: "700", color: TEXTE },
  montant: { fontSize: 15, color: BLEU, fontWeight: "700", marginTop: 2 },
  note: { fontSize: 13, color: GRIS, marginTop: 2 },
  fleche: { fontSize: 26, color: "#cbd5e1", paddingHorizontal: 4 },
  vide: { textAlign: "center", color: "#94a3b8", marginTop: 24, lineHeight: 22 },
});