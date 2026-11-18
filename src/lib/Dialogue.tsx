import { Alert, Platform } from "react-native";

// Sur le web (navigateur), Alert.alert ne fait rien du tout.
// On utilise donc window.alert / window.confirm sur le web, et Alert sur le téléphone.

export const alerter = (titre: string, message: string) => {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.alert(titre + "\n\n" + message);
    return;
  }
  Alert.alert(titre, message);
};

export const confirmer = (
  titre: string,
  message: string,
  texteBouton: string,
  action: () => void
) => {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.confirm(titre + "\n\n" + message)) action();
    return;
  }
  Alert.alert(titre, message, [
    { text: "Annuler", style: "cancel" },
    { text: texteBouton, style: "destructive", onPress: action },
  ]);
};