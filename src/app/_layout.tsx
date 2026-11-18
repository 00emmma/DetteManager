import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import { DettesProvider } from "../lib/store";
import { BLEU } from "../lib/utils";

export default function RootLayout() {
  return (
    <DettesProvider>
      <StatusBar barStyle="light-content" backgroundColor={BLEU} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: BLEU },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="dette/[id]" options={{ title: "Détail de la dette" }} />
        <Stack.Screen name="paiement" options={{ title: "Paiement" }} />
        <Stack.Screen name="modifier" options={{ title: "Modifier la dette" }} />
      </Stack>
    </DettesProvider>
  );
}