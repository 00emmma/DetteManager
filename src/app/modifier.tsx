import { useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";
import BarreMenu, { cheminOnglet } from "../lib/BarreMenu";
import FormulaireDette from "../lib/FormulaireDette";

// Page pour MODIFIER une dette existante
export default function PageModifier() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const retour = () => (router.canGoBack() ? router.back() : router.replace("/"));

  return (
    <View style={{ flex: 1 }}>
      <FormulaireDette id={id} annulable onTermine={retour} />
      <BarreMenu actif="index" onChoisir={(nom) => router.navigate(cheminOnglet(nom) as any)} />
    </View>
  );
}