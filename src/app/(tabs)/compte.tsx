import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useDettes } from "../../lib/store";
import { s } from "../../lib/styles";
import { BLEU, ROUGE, VERT, estPaye, formaterDate } from "../../lib/utils";

const tempsRelatif = (iso: string) => {
const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
if (minutes < 1) return "À l'instant";
if (minutes < 60) return "Il y a " + minutes + " min";
const heures = Math.floor(minutes / 60);
if (heures < 24) return "Il y a " + heures + " h";
return "Le " + formaterDate(iso);
};

const Stat = ({ valeur, label }: { valeur: number; label: string }) => (
<View style={r.stat}>
<Text style={r.statValeur}>{valeur}</Text>
<Text style={r.statLabel}>{label}</Text>
</View>
);

export default function PageCompte() {
const {
configure,
email,
dettes,
derniereSync,
syncEnCours,
conflit,
inscrire,
connecter,
deconnecter,
supprimerCompte,
synchroniser,
resoudreConflit,
} = useDettes();

const [mode, setMode] = useState<"connexion" | "inscription">("connexion");
const [mail, setMail] = useState("");
const [mdp, setMdp] = useState("");
const [voirMdp, setVoirMdp] = useState(false);
const [occupe, setOccupe] = useState(false);

const valider = async () => {
if (!/\S+@\S+.\S+/.test(mail.trim())) {
Alert.alert("Erreur", "Entre une adresse e-mail valide.");
return;
}
if (mdp.length < 6) {
Alert.alert("Erreur", "Le mot de passe doit contenir au moins 6 caractères.");
return;
}
setOccupe(true);
const erreur =
mode === "inscription" ? await inscrire(mail, mdp) : await connecter(mail, mdp);
setOccupe(false);
if (erreur) {
Alert.alert(mode === "inscription" ? "Inscription" : "Connexion", erreur);
} else {
setMdp("");
}
};

const synchroManuelle = async () => {
const erreur = await synchroniser();
Alert.alert(erreur ? "Erreur" : "Terminé", erreur ?? "Tes données sont à jour.");
};

const choisir = (choix: "telephone" | "compte") => {
const message =
choix === "telephone"
? "Les dettes de ton compte en ligne seront remplacées par celles de ce téléphone."
: "Les dettes de ce téléphone seront remplacées par celles de ton compte en ligne.";
Alert.alert("Confirmer", message, [
{ text: "Annuler", style: "cancel" },
{
text: "Confirmer",
onPress: async () => {
const erreur = await resoudreConflit(choix);
if (erreur) Alert.alert("Erreur", erreur);
},
},
]);
};

const confirmerDeconnexion = () =>
Alert.alert("Se déconnecter", "Tes dettes restent sur ce téléphone et sur ton compte.", [
{ text: "Annuler", style: "cancel" },
{ text: "Se déconnecter", onPress: () => deconnecter() },
]);

const confirmerSuppression = () =>
Alert.alert(
"Supprimer mon compte",
"Ton compte et ta sauvegarde en ligne seront supprimés définitivement. Les dettes resteront sur ce téléphone.",
[
{ text: "Annuler", style: "cancel" },
{
text: "Supprimer",
style: "destructive",
onPress: async () => {
const erreur = await supprimerCompte();
Alert.alert(erreur ? "Erreur" : "Terminé", erreur ?? "Ton compte a été supprimé.");
},
},
]
);

// ----- Connexion pas encore configurée -----
if (!configure) {
return (
<ScrollView style={s.page}>
<Text style={s.sousTitre}>Sauvegarde en ligne</Text>
<View style={s.carte}>
<Text style={r.texte}>
La sauvegarde en ligne n'est pas encore configurée. Ouvre le fichier
src/lib/supabase.ts et colle ta clé publique.
</Text>
</View>
</ScrollView>
);
}

// ----- Utilisateur connecté -----
if (email) {
const enCours = dettes.filter((d) => !estPaye(d)).length;
const nbPaiements = dettes.reduce((somme, d) => somme + d.paiements.length, 0);

return (  
  <ScrollView style={s.page}>  
    {/* Profil */}  
    <View style={[s.carte, r.profil]}>  
      <View style={r.avatar}>  
        <Text style={r.avatarTexte}>{email.charAt(0).toUpperCase()}</Text>  
      </View>  
      <View style={{ flex: 1 }}>  
        <Text style={r.email} numberOfLines={1}>  
          {email}  
        </Text>  
        <View style={r.badge}>  
          <View style={r.point} />  
          <Text style={r.badgeTexte}>Connecté</Text>  
        </View>  
      </View>  
    </View>  

    {/* Statut de la sauvegarde */}  
    <View style={[s.carte, { marginTop: 12 }]}>  
      <View style={r.ligneStatut}>  
        <Text style={r.iconeStatut}>{syncEnCours ? "🔄" : conflit ? "⚠️" : "✅"}</Text>  
        <View style={{ flex: 1 }}>  
          <Text style={r.titre}>  
            {syncEnCours  
              ? "Synchronisation en cours..."  
              : conflit  
              ? "Action requise"  
              : "Sauvegarde à jour"}  
          </Text>  
          <Text style={r.texte}>  
            {derniereSync  
              ? "Dernière sauvegarde : " + tempsRelatif(derniereSync)  
              : "Aucune sauvegarde en ligne pour le moment."}  
          </Text>  
        </View>  
      </View>  

      <View style={r.stats}>  
        <Stat valeur={dettes.length} label="Dettes" />  
        <View style={r.separateur} />  
        <Stat valeur={enCours} label="En cours" />  
        <View style={r.separateur} />  
        <Stat valeur={nbPaiements} label="Paiements" />  
      </View>  

      <Text style={r.note}>  
        Tes dettes sont envoyées automatiquement à chaque modification. Connecte-toi  
        sur un autre téléphone pour les retrouver.  
      </Text>  
    </View>  

    {/* Conflit ou synchronisation manuelle */}  
    {conflit ? (  
      <View style={[s.carte, r.alerte]}>  
        <Text style={r.titre}>Quelles dettes garder ?</Text>  
        <Text style={r.texte}>  
          Il y a des dettes sur ce téléphone ET sur ton compte. Choisis la version à  
          conserver.  
        </Text>  
        <TouchableOpacity style={s.bouton} onPress={() => choisir("telephone")}>  
          <Text style={s.texteBouton}>Garder celles du téléphone</Text>  
        </TouchableOpacity>  
        <TouchableOpacity style={s.boutonContour} onPress={() => choisir("compte")}>  
          <Text style={s.texteContour}>Garder celles du compte</Text>  
        </TouchableOpacity>  
      </View>  
    ) : (  
      <TouchableOpacity  
        style={[s.bouton, { marginTop: 12 }]}  
        onPress={synchroManuelle}  
        disabled={syncEnCours}  
      >  
        {syncEnCours ? (  
          <ActivityIndicator color="#fff" />  
        ) : (  
          <Text style={s.texteBouton}>🔄  Synchroniser maintenant</Text>  
        )}  
      </TouchableOpacity>  
    )}  

    {/* Session */}  
    <TouchableOpacity style={s.boutonContour} onPress={confirmerDeconnexion}>  
      <Text style={s.texteContour}>Se déconnecter</Text>  
    </TouchableOpacity>  

    {/* Zone dangereuse */}  
    <View style={r.danger}>  
      <Text style={r.dangerTitre}>Zone dangereuse</Text>  
      <Text style={r.texte}>  
        Supprime définitivement ton compte et ta sauvegarde en ligne. Les dettes  
        restent sur ce téléphone.  
      </Text>  
      <TouchableOpacity style={r.boutonSuppression} onPress={confirmerSuppression}>  
        <Text style={r.boutonSuppressionTexte}>Supprimer mon compte</Text>  
      </TouchableOpacity>  
    </View>  
    <View style={{ height: 32 }} />  
  </ScrollView>  
);

}

// ----- Utilisateur non connecté -----
return (
<ScrollView style={s.page} keyboardShouldPersistTaps="handled">
<View style={r.hero}>
<Text style={r.heroEmoji}>☁️</Text>
<Text style={r.heroTitre}>Sauvegarde en ligne</Text>
<Text style={r.heroTexte}>Ne perds plus jamais tes dettes. Facultatif et gratuit.</Text>
</View>

<View style={s.carte}>  
    <Text style={r.avantage}>✓  Retrouve tes dettes sur un nouveau téléphone</Text>  
    <Text style={r.avantage}>✓  Sauvegarde automatique à chaque modification</Text>  
    <Text style={r.avantage}>✓  Fonctionne même après une réinstallation</Text>  
  </View>  

  <View style={r.segment}>  
    {(["connexion", "inscription"] as const).map((m) => (  
      <TouchableOpacity  
        key={m}  
        style={[r.segmentItem, mode === m && r.segmentActif]}  
        onPress={() => setMode(m)}  
      >  
        <Text style={mode === m ? r.segmentTexteActif : r.segmentTexte}>  
          {m === "connexion" ? "Se connecter" : "Créer un compte"}  
        </Text>  
      </TouchableOpacity>  
    ))}  
  </View>  

  <Text style={s.label}>Adresse e-mail</Text>  
  <TextInput  
    style={s.champ}  
    value={mail}  
    onChangeText={setMail}  
    keyboardType="email-address"  
    autoCapitalize="none"  
    autoCorrect={false}  
    placeholder="ton@email.com"  
  />  

  <Text style={s.label}>Mot de passe (6 caractères minimum)</Text>  
  <View style={r.champMdp}>  
    <TextInput  
      style={r.inputMdp}  
      value={mdp}  
      onChangeText={setMdp}  
      secureTextEntry={!voirMdp}  
      autoCapitalize="none"  
      placeholder="Mot de passe"  
    />  
    <TouchableOpacity onPress={() => setVoirMdp(!voirMdp)}>  
      <Text style={r.voir}>{voirMdp ? "Masquer" : "Afficher"}</Text>  
    </TouchableOpacity>  
  </View>  

  <TouchableOpacity style={s.bouton} onPress={valider} disabled={occupe}>  
    {occupe ? (  
      <ActivityIndicator color="#fff" />  
    ) : (  
      <Text style={s.texteBouton}>  
        {mode === "connexion" ? "Se connecter" : "Créer mon compte"}  
      </Text>  
    )}  
  </TouchableOpacity>  

  <Text style={r.mention}>  
    Ton e-mail sert uniquement à retrouver tes données. Tu peux supprimer ton compte  
    à tout moment.  
  </Text>  
  <View style={{ height: 32 }} />  
</ScrollView>

);
}

const r = StyleSheet.create({
titre: { fontSize: 16, fontWeight: "bold", color: "#222" },
texte: { fontSize: 14, color: "#555", lineHeight: 21, marginTop: 2 },
note: { fontSize: 12, color: "#888", lineHeight: 18, marginTop: 14 },
alerte: { borderWidth: 1.5, borderColor: "#e0a100", marginTop: 12 },

// Profil
profil: { flexDirection: "row", alignItems: "center" },
avatar: {
width: 52,
height: 52,
borderRadius: 26,
backgroundColor: BLEU,
alignItems: "center",
justifyContent: "center",
marginRight: 14,
},
avatarTexte: { color: "#fff", fontSize: 22, fontWeight: "bold" },
email: { fontSize: 16, fontWeight: "600", color: "#222" },
badge: {
flexDirection: "row",
alignItems: "center",
alignSelf: "flex-start",
backgroundColor: "#e6f6ee",
borderRadius: 12,
paddingHorizontal: 10,
paddingVertical: 3,
marginTop: 6,
},
point: { width: 8, height: 8, borderRadius: 4, backgroundColor: VERT, marginRight: 6 },
badgeTexte: { fontSize: 12, fontWeight: "600", color: VERT },

// Statut et statistiques
ligneStatut: { flexDirection: "row", alignItems: "center" },
iconeStatut: { fontSize: 28, marginRight: 12 },
stats: {
flexDirection: "row",
marginTop: 16,
paddingTop: 14,
borderTopWidth: 1,
borderTopColor: "#eee",
},
stat: { flex: 1, alignItems: "center" },
statValeur: { fontSize: 22, fontWeight: "bold", color: BLEU },
statLabel: { fontSize: 12, color: "#777", marginTop: 2 },
separateur: { width: 1, backgroundColor: "#eee" },

// Zone dangereuse
danger: {
marginTop: 28,
padding: 14,
borderRadius: 8,
borderWidth: 1,
borderColor: "#f1c4c4",
backgroundColor: "#fff8f8",
},
dangerTitre: { fontSize: 14, fontWeight: "bold", color: ROUGE },
boutonSuppression: {
borderWidth: 1.5,
borderColor: ROUGE,
borderRadius: 8,
padding: 12,
alignItems: "center",
marginTop: 12,
},
boutonSuppressionTexte: { color: ROUGE, fontWeight: "bold", fontSize: 14 },

// Écran non connecté
hero: { alignItems: "center", paddingVertical: 20 },
heroEmoji: { fontSize: 48 },
heroTitre: { fontSize: 22, fontWeight: "bold", marginTop: 6 },
heroTexte: { fontSize: 14, color: "#666", textAlign: "center", marginTop: 6 },
avantage: { fontSize: 14, color: "#333", lineHeight: 26 },
segment: {
flexDirection: "row",
backgroundColor: "#e8eaf0",
borderRadius: 10,
padding: 4,
marginVertical: 16,
},
segmentItem: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
segmentActif: { backgroundColor: "#fff" },
segmentTexte: { color: "#666", fontWeight: "600" },
segmentTexteActif: { color: BLEU, fontWeight: "bold" },
champMdp: {
flexDirection: "row",
alignItems: "center",
backgroundColor: "#fff",
borderRadius: 8,
borderWidth: 1,
borderColor: "#e0e0e0",
paddingHorizontal: 12,
marginBottom: 12,
},
inputMdp: { flex: 1, paddingVertical: 12, fontSize: 16 },
voir: { color: BLEU, fontWeight: "600", fontSize: 13, paddingLeft: 8 },
mention: { fontSize: 12, color: "#888", textAlign: "center", lineHeight: 18, marginTop: 16 },
});