import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useDettes } from "../../lib/store";
import {
  BLEU,
  BLEU_FONCE,
  BORDURE,
  dejaPaye,
  estEnRetard,
  estPaye,
  FOND,
  formater,
  formaterDate,
  GRIS,
  initiale,
  pourcentagePaye,
  reste,
  ROUGE,
  sensDe,
  TEXTE,
  texteEcheance,
  VERT,
} from "../../lib/utils";

const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

const ombre = {
  shadowColor: "#0f172a",
  shadowOpacity: 0.07,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};

const Ligne = ({
  label,
  valeur,
  couleur,
  dernier,
}: {
  label: string;
  valeur: string;
  couleur?: string;
  dernier?: boolean;
}) => (
  <View style={[t.rangee, dernier && { borderBottomWidth: 0 }]}>
    <Text style={t.rangeeLabel}>{label}</Text>
    <Text style={[t.rangeeValeur, couleur ? { color: couleur } : null]}>{valeur}</Text>
  </View>
);

// Page DÉTAIL d'une dette
export default function PageDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { dettes, supprimerDette } = useDettes();
  const d = dettes.find((x) => x.id === id);

  if (!d) return null;

  const moi = sensDe(d) === "onMeDoit";
  const accent = moi ? VERT : ROUGE;
  const accentClair = moi ? "#4ade80" : "#f87171";
  const paye = estPaye(d);
  const retard = estEnRetard(d);
  const pct = pourcentagePaye(d);

  const statut = paye
    ? { texte: "Soldée", fond: VERT }
    : retard
    ? { texte: "En retard", fond: ROUGE }
    : { texte: "En cours", fond: "#d97706" };

  const confirmerSuppression = () =>
    Alert.alert("Supprimer cette dette ?", "Elle sera supprimée définitivement, avec son historique.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => {
          supprimerDette(d.id);
          router.back();
        },
      },
    ]);

  return (
    <ScrollView style={t.page} showsVerticalScrollIndicator={false}>
      {/* ----- Carte principale ----- */}
      <View style={t.hero}>
        <View style={t.identite}>
          <View style={t.avatar}>
            <Text style={t.avatarTexte}>{initiale(d.nom)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={t.nom} numberOfLines={1}>
              {d.nom}
            </Text>
            <View style={[t.sensPuce, { backgroundColor: accent }]}>
              <Text style={t.sensTexte}>{moi ? "On me doit" : "Je dois"}</Text>
            </View>
          </View>
          <View style={[t.statut, { backgroundColor: statut.fond }]}>
            <Text style={t.statutTexte}>{statut.texte}</Text>
          </View>
        </View>

        <Text style={t.heroLabel}>
          {paye ? "DETTE SOLDÉE" : moi ? "RESTE À RÉCUPÉRER" : "RESTE À REMBOURSER"}
        </Text>
        <Text style={t.heroMontant}>
          {paye ? formater(d.montant, d.devise) : formater(reste(d), d.devise)}
        </Text>

        <View style={t.barreFond}>
          <View style={[t.barre, { width: (pct + "%") as any, backgroundColor: accentClair }]} />
        </View>
        <View style={t.heroBas}>
          <Text style={t.heroSous}>
            {moi ? "Récupéré" : "Remboursé"} : {formater(dejaPaye(d), d.devise)}
          </Text>
          <Text style={t.heroSous}>
            {pct}% de {formater(d.montant, d.devise)}
          </Text>
        </View>
      </View>

      {/* ----- Action principale ----- */}
      {!paye ? (
        <TouchableOpacity
          style={[t.actionPrincipale, { backgroundColor: accent }]}
          activeOpacity={0.9}
          onPress={() => router.push({ pathname: "/paiement", params: { detteId: d.id } })}
        >
          <Text style={t.actionPrincipaleTexte}>
            {moi ? "+  Récupérer de l'argent" : "+  Rembourser"}
          </Text>
        </TouchableOpacity>
      ) : null}

      {/* ----- Informations ----- */}
      <Text style={t.section}>Informations</Text>
      <View style={t.carte}>
        <Ligne label="Montant de la dette" valeur={formater(d.montant, d.devise)} />
        <Ligne label="Date de la dette" valeur={formaterDate(d.date)} />
        {d.echeance ? (
          <Ligne
            label="Échéance"
            valeur={
              formaterDate(d.echeance) +
              (paye ? "" : " · " + majuscule(texteEcheance(d.echeance)))
            }
            couleur={retard ? ROUGE : undefined}
            dernier={!d.note}
          />
        ) : (
          <Ligne label="Échéance" valeur="Non définie" dernier={!d.note} />
        )}
        {d.note ? <Ligne label="Note" valeur={d.note} dernier /> : null}
      </View>

      {/* ----- Historique ----- */}
      <Text style={t.section}>
        {moi ? "Récupérations" : "Remboursements"} ({d.paiements.length})
      </Text>
      {d.paiements.length === 0 ? (
        <View style={[t.carte, t.videCarte]}>
          <Text style={t.videTexte}>
            {moi ? "Aucune récupération" : "Aucun remboursement"} pour le moment.
          </Text>
        </View>
      ) : (
        d.paiements.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={t.ligne}
            activeOpacity={0.85}
            onPress={() =>
              router.push({ pathname: "/paiement", params: { detteId: d.id, paiementId: p.id } })
            }
          >
            <View style={[t.icone, { backgroundColor: moi ? "#dcfce7" : "#fee2e2" }]}>
              <Text style={[t.iconeTexte, { color: accent }]}>{moi ? "↓" : "↑"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[t.pMontant, { color: accent }]}>
                {moi ? "+ " : "- "}
                {formater(p.montant, d.devise)}
              </Text>
              <Text style={t.pDate}>{formaterDate(p.date)} · touche pour modifier</Text>
            </View>
            <Text style={t.fleche}>›</Text>
          </TouchableOpacity>
        ))
      )}

      {/* ----- Modifier / supprimer ----- */}
      <View style={t.actions}>
        <TouchableOpacity
          style={[t.action, { borderColor: BLEU }]}
          onPress={() => router.push({ pathname: "/modifier", params: { id: d.id } })}
        >
          <Text style={[t.actionTexte, { color: BLEU }]}>Modifier</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[t.action, { borderColor: ROUGE }]} onPress={confirmerSuppression}>
          <Text style={[t.actionTexte, { color: ROUGE }]}>Supprimer</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const t = StyleSheet.create({
  page: { flex: 1, backgroundColor: FOND, padding: 16 },

  hero: { backgroundColor: BLEU_FONCE, borderRadius: 22, padding: 18, ...ombre },
  identite: { flexDirection: "row", alignItems: "center", marginBottom: 22 },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarTexte: { color: "#fff", fontSize: 21, fontWeight: "800" },
  nom: { color: "#fff", fontSize: 20, fontWeight: "800" },
  sensPuce: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 5,
  },
  sensTexte: { color: "#fff", fontSize: 11, fontWeight: "700" },
  statut: { borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5 },
  statutTexte: { color: "#fff", fontSize: 11, fontWeight: "800" },

  heroLabel: { color: "#93c5fd", fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  heroMontant: { color: "#fff", fontSize: 36, fontWeight: "800", marginTop: 4 },
  barreFond: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.16)",
    marginTop: 18,
    overflow: "hidden",
  },
  barre: { height: 8, borderRadius: 4 },
  heroBas: { flexDirection: "row", justifyContent: "space-between", marginTop: 9 },
  heroSous: { color: "#bfdbfe", fontSize: 12 },

  actionPrincipale: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 14,
    ...ombre,
  },
  actionPrincipaleTexte: { color: "#fff", fontSize: 16, fontWeight: "800" },

  section: { fontSize: 16, fontWeight: "800", color: TEXTE, marginTop: 24, marginBottom: 10 },
  carte: { backgroundColor: "#fff", borderRadius: 16, paddingHorizontal: 16, ...ombre },
  rangee: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDURE,
  },
  rangeeLabel: { fontSize: 14, color: GRIS },
  rangeeValeur: {
    fontSize: 14,
    fontWeight: "700",
    color: TEXTE,
    flex: 1,
    textAlign: "right",
    paddingLeft: 16,
  },
  videCarte: { paddingVertical: 22, alignItems: "center" },
  videTexte: { fontSize: 14, color: GRIS },

  ligne: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    ...ombre,
  },
  icone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconeTexte: { fontSize: 20, fontWeight: "800" },
  pMontant: { fontSize: 16, fontWeight: "800" },
  pDate: { fontSize: 12, color: GRIS, marginTop: 2 },
  fleche: { fontSize: 26, color: "#cbd5e1", paddingHorizontal: 4 },

  actions: { flexDirection: "row", gap: 12, marginTop: 22 },
  action: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  actionTexte: { fontWeight: "800", fontSize: 15 },
});