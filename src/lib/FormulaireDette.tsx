import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useDettes } from "./store";
import { s } from "./styles";
import {
  Devise,
  ROUGE,
  Sens,
  VERT,
  dateDuJour,
  formaterDate,
  lireDate,
  lireMontant,
  sensDe,
} from "./utils";

type Props = {
  id?: string; // si présent : on modifie cette dette
  annulable?: boolean;
  onTermine: () => void;
};

export default function FormulaireDette({ id, annulable, onTermine }: Props) {
  const { dettes, ajouterDette, modifierDette, deviseDefaut } = useDettes();
  const existante = id ? dettes.find((d) => d.id === id) : undefined;

  const [sens, setSens] = useState<Sens>(existante ? sensDe(existante) : "onMeDoit");
  const [nom, setNom] = useState(existante?.nom ?? "");
  const [montant, setMontant] = useState(existante ? String(existante.montant) : "");
  const [devise, setDevise] = useState<Devise>(existante?.devise ?? deviseDefaut);
  const [date, setDate] = useState(existante ? formaterDate(existante.date) : dateDuJour());
  const [echeance, setEcheance] = useState(
    existante?.echeance ? formaterDate(existante.echeance) : ""
  );
  const [note, setNote] = useState(existante?.note ?? "");

  // Si la devise par défaut change dans les réglages, on l'applique ici
  useEffect(() => {
    if (!existante) setDevise(deviseDefaut);
  }, [deviseDefaut]);

  const enregistrer = () => {
    const valeur = lireMontant(montant);
    const dateIso = lireDate(date);
    if (!nom.trim() || isNaN(valeur) || valeur <= 0) {
      Alert.alert("Erreur", "Entre un nom et un montant valide.");
      return;
    }
    if (!dateIso) {
      Alert.alert("Erreur", "La date doit être au format JJ/MM/AAAA (ex : 25/12/2026).");
      return;
    }
    let echeanceIso: string | undefined = undefined;
    if (echeance.trim()) {
      const e = lireDate(echeance);
      if (!e) {
        Alert.alert("Erreur", "La date d'échéance doit être au format JJ/MM/AAAA, ou vide.");
        return;
      }
      echeanceIso = e;
    }
    const champs = {
      nom: nom.trim(),
      montant: valeur,
      devise,
      note: note.trim(),
      date: dateIso,
      sens,
      echeance: echeanceIso,
    };
    if (existante) {
      const erreur = modifierDette(existante.id, champs);
      if (erreur) {
        Alert.alert("Erreur", erreur);
        return;
      }
    } else {
      ajouterDette(champs);
    }
    onTermine();
  };

  return (
    <ScrollView style={s.page} keyboardShouldPersistTaps="handled">
      {/* Qui doit à qui ? */}
      <View style={f.sens}>
        <TouchableOpacity
          style={[f.sensItem, sens === "onMeDoit" && { backgroundColor: VERT, borderColor: VERT }]}
          onPress={() => setSens("onMeDoit")}
        >
          <Text style={sens === "onMeDoit" ? f.sensTexteActif : f.sensTexte}>On me doit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[f.sensItem, sens === "jeDois" && { backgroundColor: ROUGE, borderColor: ROUGE }]}
          onPress={() => setSens("jeDois")}
        >
          <Text style={sens === "jeDois" ? f.sensTexteActif : f.sensTexte}>Je dois</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.label}>
        {sens === "onMeDoit" ? "Nom (qui te doit ?)" : "Nom (à qui dois-tu ?)"}
      </Text>
      <TextInput style={s.champ} value={nom} onChangeText={setNom} placeholder="Ex : Jean" />

      <Text style={s.label}>Montant</Text>
      <TextInput
        style={s.champ}
        value={montant}
        onChangeText={setMontant}
        keyboardType="numeric"
        placeholder="Ex : 50000"
      />

      <Text style={s.label}>Devise</Text>
      <View style={s.devises}>
        {(["FC", "USD"] as Devise[]).map((d) => (
          <TouchableOpacity
            key={d}
            style={[s.devise, devise === d && s.deviseActive]}
            onPress={() => setDevise(d)}
          >
            <Text style={devise === d ? s.texteChoixActif : s.texteChoix}>
              {d === "FC" ? "Francs (FC)" : "Dollars (USD)"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Date de la dette (JJ/MM/AAAA)</Text>
      <TextInput style={s.champ} value={date} onChangeText={setDate} placeholder="JJ/MM/AAAA" />

      <Text style={s.label}>Date d'échéance (facultatif)</Text>
      <TextInput
        style={s.champ}
        value={echeance}
        onChangeText={setEcheance}
        placeholder="JJ/MM/AAAA : date limite de remboursement"
      />

      <Text style={s.label}>Note (facultatif)</Text>
      <TextInput style={s.champ} value={note} onChangeText={setNote} />

      <TouchableOpacity style={s.bouton} onPress={enregistrer}>
        <Text style={s.texteBouton}>
          {existante ? "Enregistrer les modifications" : "Enregistrer"}
        </Text>
      </TouchableOpacity>
      {annulable ? (
        <TouchableOpacity style={s.boutonContour} onPress={onTermine}>
          <Text style={s.texteContour}>Annuler</Text>
        </TouchableOpacity>
      ) : null}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const f = StyleSheet.create({
  sens: { flexDirection: "row", gap: 10, marginBottom: 18 },
  sensItem: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  sensTexte: { color: "#64748b", fontWeight: "700", fontSize: 15 },
  sensTexteActif: { color: "#fff", fontWeight: "800", fontSize: 15 },
});