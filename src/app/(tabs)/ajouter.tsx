import React, { useState } from "react";
import { useRouter } from "expo-router";
import FormulaireDette from "../../lib/FormulaireDette";

// Onglet AJOUTER : après l'enregistrement, on revient à la liste
export default function PageAjouter() {
  const router = useRouter();
  const [cle, setCle] = useState(0);

  return (
    <FormulaireDette
      key={cle}
      onTermine={() => {
        setCle((c) => c + 1); // vide le formulaire
        router.navigate("/");
      }}
    />
  );
}