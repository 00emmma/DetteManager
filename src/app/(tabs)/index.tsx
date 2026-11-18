import { useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useDettes } from "../../lib/store";
import {
  BLEU,
  BORDURE,
  Dette,
  Devise,
  FOND,
  GRIS,
  ROUGE,
  Sens,
  TEXTE,
  VERT,
  dejaPaye,
  estEnRetard,
  estPaye,
  formater,
  formaterDate,
  initiale,
  pourcentagePaye,
  reste,
  sensDe,
  texteEcheance,
  totalSens,
} from "../../lib/utils";

type Tri = "echeance" | "montant" | "nom" | "recent";

const TRIS: { cle: Tri; texte: string }[] = [
  { cle: "echeance", texte: "Date d'échéance" },
  { cle: "montant", texte: "Montant" },
  { cle: "nom", texte: "Nom" },
  { cle: "recent", texte: "Plus récentes" },
];

const DEVISES: Devise[] = ["FC", "USD"];

const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

const ombre = {
  shadowColor: "#0f172a",
  shadowOpacity: 0.07,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};

const comparer = (tri: Tri, historique: boolean) => (a: Dette, b: Dette) => {
  if (tri === "montant") {
    return historique ? b.montant - a.montant : reste(b) - reste(a);
  }
  if (tri === "nom") return a.nom.localeCompare(b.nom);
  if (tri === "recent") return b.date.localeCompare(a.date);
  // Par échéance : les plus proches (ou en retard) d'abord, puis celles sans échéance
  if (a.echeance && b.echeance) return a.echeance.localeCompare(b.echeance);
  if (a.echeance) return -1;
  if (b.echeance) return 1;
  return b.date.localeCompare(a.date);
};

export default function PageAccueil() {
  const router = useRouter();
  const { dettes } = useDettes();

  const [tri, setTri] = useState<Tri>("echeance");
  const [menuTri, setMenuTri] = useState(false);
  const [historique, setHistorique] = useState(false);
  const [rechercheOuverte, setRechercheOuverte] = useState(false);
  const [recherche, setRecherche] = useState("");

  const cartes: { sens: Sens; titre: string; couleur: string }[] = [
    { sens: "jeDois", titre: "Je dois", couleur: ROUGE },
    { sens: "onMeDoit", titre: "On me doit", couleur: VERT },
  ];

  const q = recherche.trim().toLowerCase();
  const liste = dettes
    .filter((d) => (historique ? estPaye(d) : !estPaye(d)))
    .filter((d) => d.nom.toLowerCase().includes(q))
    .sort(comparer(tri, historique));

  const entete = (
    <View>
      {/* Je dois / On me doit */}
      <View style={l.cartes}>
        {cartes.map((c) => (
          <View key={c.sens} style={[l.carteTotal, { backgroundColor: c.couleur }]}>
            <Text style={l.carteTitre}>{c.titre}</Text>
            {DEVISES.map((dev) => (
              <Text key={dev} style={l.carteMontant}>
                {formater(totalSens(dettes, c.sens, dev), dev)}
              </Text>
            ))}
          </View>
        ))}
      </View>

      {/* Barres : part de chaque côté, et solde */}
      <View style={l.barres}>
        {DEVISES.map((dev) => {
          const a = totalSens(dettes, "onMeDoit", dev);
          const b = totalSens(dettes, "jeDois", dev);
          const net = a - b;
          return (
            <View key={dev} style={l.ligneBarre}>
              <Text style={l.devBarre}>{dev}</Text>
              <View style={l.barreFond}>
                {a + b > 0 ? (
                  <>
                    <View style={{ flex: b, backgroundColor: ROUGE }} />
                    <View style={{ flex: a, backgroundColor: VERT }} />
                  </>
                ) : null}
              </View>
              <Text style={[l.net, { color: net >= 0 ? VERT : ROUGE }]}>
                {(net >= 0 ? "+" : "-") + formater(Math.abs(net), dev)}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Historique et recherche */}
      <View style={l.boutons}>
        <TouchableOpacity
          style={[l.bouton, historique && l.boutonActif]}
          onPress={() => setHistorique(!historique)}
        >
          <Text style={historique ? l.boutonTexteActif : l.boutonTexte}>Historique</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[l.bouton, rechercheOuverte && l.boutonActif]}
          onPress={() => {
            if (rechercheOuverte) setRecherche("");
            setRechercheOuverte(!rechercheOuverte);
          }}
        >
          <Text style={rechercheOuverte ? l.boutonTexteActif : l.boutonTexte}>Recherche</Text>
        </TouchableOpacity>
      </View>

      {rechercheOuverte ? (
        <TextInput
          style={l.champRecherche}
          value={recherche}
          onChangeText={setRecherche}
          placeholder="Rechercher un nom"
          placeholderTextColor="#94a3b8"
          autoFocus
        />
      ) : null}

      {/* Tri */}
      <View style={l.ligneTri}>
        <TouchableOpacity onPress={() => setMenuTri(!menuTri)}>
          <Text style={l.triTexte}>
            Tri :{" "}
            <Text style={l.triValeur}>
              {TRIS.find((t) => t.cle === tri)!.texte} ▾
            </Text>
          </Text>
        </TouchableOpacity>
        <Text style={l.compte}>({liste.length})</Text>
      </View>

      {menuTri ? (
        <View style={l.menuTri}>
          {TRIS.map((t) => (
            <TouchableOpacity
              key={t.cle}
              style={l.optionTri}
              onPress={() => {
                setTri(t.cle);
                setMenuTri(false);
              }}
            >
              <Text style={[l.optionTexte, tri === t.cle && { color: BLEU, fontWeight: "700" }]}>
                {tri === t.cle ? "✓  " : "     "}
                {t.texte}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {historique ? <Text style={l.infoHistorique}>Historique : dettes soldées</Text> : null}
    </View>
  );

  const vide = (
    <View style={l.vide}>
      <Text style={l.videTitre}>
        {q
          ? "Aucun résultat"
          : historique
          ? "Aucune dette soldée"
          : "Aucune dette en cours"}
      </Text>
      <Text style={l.videTexte}>
        {!historique && !q
          ? "Appuie sur le bouton + pour noter ta première dette."
          : "Rien à afficher pour le moment."}
      </Text>
    </View>
  );

  return (
    <View style={l.page}>
      <FlatList
        data={liste}
        keyExtractor={(i) => i.id}
        ListHeaderComponent={entete}
        ListEmptyComponent={vide}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const moi = sensDe(item) === "onMeDoit";
          const couleur = moi ? VERT : ROUGE;
          const paye = estPaye(item);
          const retard = estEnRetard(item);
          const deja = dejaPaye(item);
          const montant = formater(item.montant, item.devise);
          return (
            <TouchableOpacity
              style={[l.carte, { borderLeftColor: couleur }]}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: "/dette/[id]", params: { id: item.id } })}
            >
              {item.echeance && !paye ? (
                <Text style={[l.echeance, retard && { color: ROUGE, fontWeight: "700" }]}>
                  {majuscule(texteEcheance(item.echeance))}
                </Text>
              ) : null}

              <View style={l.haut}>
                <View style={[l.avatar, { backgroundColor: moi ? "#dcfce7" : "#fee2e2" }]}>
                  <Text style={[l.avatarTexte, { color: couleur }]}>{initiale(item.nom)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={l.phrase}>
                    {moi ? (
                      <>
                        <Text style={[l.nom, { color: couleur }]}>{item.nom}</Text> te doit {montant}
                      </>
                    ) : (
                      <>
                        Tu dois {montant} à <Text style={[l.nom, { color: couleur }]}>{item.nom}</Text>
                      </>
                    )}
                  </Text>
                  {paye ? (
                    <Text style={[l.detail, { color: VERT, fontWeight: "700" }]}>Soldée ✓</Text>
                  ) : deja > 0 ? (
                    <Text style={l.detail}>
                      {moi ? "A payé " : "Tu as payé "}
                      {formater(deja, item.devise)} · reste {formater(reste(item), item.devise)}
                    </Text>
                  ) : (
                    <Text style={l.detail} numberOfLines={1}>
                      {formaterDate(item.date)}
                      {item.note ? " · " + item.note : ""}
                    </Text>
                  )}
                </View>
              </View>

              {!paye && deja > 0 ? (
                <View style={l.progFond}>
                  <View
                    style={[
                      l.prog,
                      { width: (pourcentagePaye(item) + "%") as any, backgroundColor: couleur },
                    ]}
                  />
                </View>
              ) : null}

              {!paye ? (
                <TouchableOpacity
                  style={[l.action, { borderColor: couleur }]}
                  onPress={() =>
                    router.push({ pathname: "/paiement", params: { detteId: item.id } })
                  }
                >
                  <Text style={[l.actionTexte, { color: couleur }]}>
                    {moi ? "Récupérer" : "Rembourser"}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </TouchableOpacity>
          );
        }}
      />

      {/* Bouton + */}
      <TouchableOpacity style={l.fab} onPress={() => router.navigate("/ajouter")}>
        <Text style={l.fabTexte}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const l = StyleSheet.create({
  page: { flex: 1, backgroundColor: FOND, paddingHorizontal: 16, paddingTop: 14 },

  cartes: { flexDirection: "row", gap: 12 },
  carteTotal: { flex: 1, borderRadius: 18, padding: 16, ...ombre },
  carteTitre: { color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: "700", marginBottom: 6 },
  carteMontant: { color: "#fff", fontSize: 19, fontWeight: "800", marginTop: 2 },

  barres: { marginTop: 14, gap: 8 },
  ligneBarre: { flexDirection: "row", alignItems: "center" },
  devBarre: { width: 40, fontSize: 13, fontWeight: "700", color: TEXTE },
  barreFond: {
    flex: 1,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#e2e8f0",
    flexDirection: "row",
    overflow: "hidden",
  },
  net: { minWidth: 86, textAlign: "right", fontSize: 13, fontWeight: "700", paddingLeft: 8 },

  boutons: { flexDirection: "row", gap: 10, marginTop: 16 },
  bouton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: BORDURE,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  boutonActif: { backgroundColor: BLEU, borderColor: BLEU },
  boutonTexte: { color: GRIS, fontWeight: "700", fontSize: 14 },
  boutonTexteActif: { color: "#fff", fontWeight: "700", fontSize: 14 },

  champRecherche: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDURE,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginTop: 12,
    fontSize: 15,
    color: TEXTE,
  },

  ligneTri: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 10,
  },
  triTexte: { fontSize: 14, color: GRIS },
  triValeur: { color: BLEU, fontWeight: "700" },
  compte: { fontSize: 14, color: GRIS, fontWeight: "600" },
  menuTri: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDURE,
    marginBottom: 10,
    ...ombre,
  },
  optionTri: { paddingVertical: 12, paddingHorizontal: 14 },
  optionTexte: { fontSize: 15, color: TEXTE },
  infoHistorique: { fontSize: 13, color: GRIS, marginBottom: 8, fontStyle: "italic" },

  carte: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderLeftWidth: 6,
    padding: 14,
    marginBottom: 12,
    ...ombre,
  },
  echeance: { fontSize: 12, color: GRIS, fontStyle: "italic", textAlign: "right", marginBottom: 6 },
  haut: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarTexte: { fontSize: 18, fontWeight: "800" },
  phrase: { fontSize: 16, color: TEXTE },
  nom: { fontWeight: "800" },
  detail: { fontSize: 13, color: GRIS, marginTop: 4 },

  progFond: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "#e2e8f0",
    marginTop: 12,
    overflow: "hidden",
  },
  prog: { height: 5, borderRadius: 3 },

  action: {
    alignSelf: "flex-end",
    borderWidth: 1.5,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  actionTexte: { fontWeight: "700", fontSize: 13 },

  vide: { alignItems: "center", paddingVertical: 40 },
  videTitre: { fontSize: 17, fontWeight: "700", color: TEXTE },
  videTexte: { fontSize: 14, color: GRIS, textAlign: "center", marginTop: 6, lineHeight: 21 },

  fab: {
    position: "absolute",
    right: 18,
    bottom: 18,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: BLEU,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabTexte: { color: "#fff", fontSize: 34, lineHeight: 38, fontWeight: "400" },
});