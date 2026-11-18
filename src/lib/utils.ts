export type Devise = "FC" | "USD";

export type Paiement = { id: string; montant: number; date: string };

// "onMeDoit" = quelqu'un me doit de l'argent ; "jeDois" = c'est moi qui dois
export type Sens = "onMeDoit" | "jeDois";

export type Dette = {
  id: string;
  nom: string;
  montant: number;
  devise: Devise;
  note: string;
  date: string;
  paiements: Paiement[];
  sens?: Sens; // absent = "onMeDoit" (anciennes dettes)
  echeance?: string; // date limite (ISO), facultative
};

// ----- Couleurs de l'application -----
export const BLEU = "#1d4ed8";
export const BLEU_FONCE = "#172554";
export const VERT = "#16a34a";
export const ROUGE = "#dc2626";
export const FOND = "#f1f5f9";
export const TEXTE = "#0f172a";
export const GRIS = "#64748b";
export const BORDURE = "#e2e8f0";

export const arrondi = (n: number) => Math.round(n * 100) / 100;

const separerMilliers = (n: string) => n.replace(/\B(?=(\d{3})+(?!\d))/g, " ");

// FC : "50 000 FC" / USD : "$16 500" ou "$16 500.50"
export const formater = (m: number, d: Devise) => {
  if (d === "FC") return separerMilliers(Math.round(m).toString()) + " FC";
  const [entier, decimales] = m.toFixed(2).split(".");
  return "$" + separerMilliers(entier) + (decimales === "00" ? "" : "." + decimales);
};

export const formaterDate = (iso: string) => {
  const x = new Date(iso);
  const j = String(x.getDate()).padStart(2, "0");
  const m = String(x.getMonth() + 1).padStart(2, "0");
  return j + "/" + m + "/" + x.getFullYear();
};

export const dateDuJour = () => formaterDate(new Date().toISOString());

// Transforme "25/12/2026" en date ISO. Retourne null si la date est invalide.
export const lireDate = (texte: string): string | null => {
  const m = texte.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const j = Number(m[1]);
  const mo = Number(m[2]);
  const a = Number(m[3]);
  const d = new Date(a, mo - 1, j, 12, 0, 0);
  if (d.getFullYear() !== a || d.getMonth() !== mo - 1 || d.getDate() !== j)
    return null;
  return d.toISOString();
};

export const lireMontant = (t: string) =>
  parseFloat(t.replace(/\s/g, "").replace(",", "."));

export const dejaPaye = (d: Dette) =>
  arrondi(d.paiements.reduce((somme, p) => somme + p.montant, 0));

export const reste = (d: Dette) => Math.max(0, arrondi(d.montant - dejaPaye(d)));

export const estPaye = (d: Dette) => reste(d) <= 0;

export const initiale = (nom: string) => nom.trim().charAt(0).toUpperCase() || "?";

export const pourcentagePaye = (d: Dette) =>
  d.montant > 0 ? Math.min(100, Math.round((dejaPaye(d) / d.montant) * 100)) : 0;

// ----- Sens de la dette et échéance -----
export const sensDe = (d: Dette): Sens => d.sens ?? "onMeDoit";

export const totalSens = (liste: Dette[], sens: Sens, dev: Devise) =>
  liste
    .filter((x) => sensDe(x) === sens && x.devise === dev)
    .reduce((somme, x) => somme + reste(x), 0);

// Nombre de jours entre aujourd'hui et la date (négatif = date dépassée)
export const joursRestants = (iso: string) => {
  const cible = new Date(iso);
  cible.setHours(0, 0, 0, 0);
  const auj = new Date();
  auj.setHours(0, 0, 0, 0);
  return Math.round((cible.getTime() - auj.getTime()) / 86400000);
};

// Texte court : "dans 3 jours", "demain", "en retard de 2 jours"...
export const texteEcheance = (iso: string) => {
  const j = joursRestants(iso);
  if (j === 0) return "aujourd'hui";
  if (j === 1) return "demain";
  if (j === -1) return "hier";
  if (j > 1 && j < 7) return "dans " + j + " jours";
  if (j >= 7 && j < 30) {
    const sem = Math.round(j / 7);
    return "dans " + sem + (sem > 1 ? " semaines" : " semaine");
  }
  if (j >= 30) return "dans " + Math.round(j / 30) + " mois";
  const retard = -j;
  if (retard < 7) return "en retard de " + retard + " jours";
  if (retard < 30) {
    const sem = Math.round(retard / 7);
    return "en retard de " + sem + (sem > 1 ? " semaines" : " semaine");
  }
  return "en retard de " + Math.round(retard / 30) + " mois";
};

export const estEnRetard = (d: Dette) =>
  !!d.echeance && !estPaye(d) && joursRestants(d.echeance) < 0;