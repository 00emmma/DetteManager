import { Tabs } from "expo-router";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDettes } from "../../lib/store";
import { BLEU } from "../../lib/utils";

const icone = (emoji: string) => () => <Text style={{ fontSize: 22 }}>{emoji}</Text>;

export default function TabsLayout() {
  const { pret, accueilVu, commencer } = useDettes();

  if (!pret) return null;

  // ----- Écran d'accueil (premier lancement) -----
  if (!accueilVu) {
    return (
      <SafeAreaView style={a.accueil}>
        <Text style={a.emoji}>📒</Text>
        <Text style={a.titre}>DetteManager</Text>
        <Text style={a.texte}>
          Note qui te doit de l'argent, en francs ou en dollars, et ne
          l'oublie plus jamais.
        </Text>
        <Text style={a.points}>
          ✓ Sans compte, sans inscription{"\n"}✓ Fonctionne sans internet
          {"\n"}✓ Tes données restent sur ton téléphone
        </Text>
        <TouchableOpacity style={a.boutonBlanc} onPress={commencer}>
          <Text style={a.texteBoutonBleu}>Commencer</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ----- Menu de navigation en bas -----
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: BLEU },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
        tabBarActiveTintColor: BLEU,
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Mes dettes", tabBarLabel: "Dettes", tabBarIcon: icone("📒") }}
      />
      <Tabs.Screen
        name="ajouter"
        options={{ title: "Nouvelle dette", tabBarLabel: "Ajouter", tabBarIcon: icone("➕") }}
      />
      <Tabs.Screen
        name="compte"
        options={{ title: "Compte", tabBarLabel: "Compte", tabBarIcon: icone("☁️") }}
      />
      <Tabs.Screen
        name="reglages"
        options={{ title: "Réglages", tabBarLabel: "Réglages", tabBarIcon: icone("⚙️") }}
      />
    </Tabs>
  );
}

const a = StyleSheet.create({
  accueil: {
    flex: 1,
    backgroundColor: BLEU,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emoji: { fontSize: 64 },
  titre: { color: "#fff", fontSize: 32, fontWeight: "bold", marginTop: 8 },
  texte: {
    color: "#e6edff",
    fontSize: 17,
    textAlign: "center",
    marginTop: 16,
    lineHeight: 24,
  },
  points: { color: "#fff", fontSize: 15, marginTop: 24, lineHeight: 26 },
  boutonBlanc: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 48,
    marginTop: 36,
  },
  texteBoutonBleu: { color: BLEU, fontWeight: "bold", fontSize: 17 },
});