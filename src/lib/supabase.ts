import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import "react-native-url-polyfill/auto";

const SUPABASE_URL: string = "https://qbpiawczlafcsjcysdwt.supabase.co";
const SUPABASE_CLE: string = "sb_publishable_CCa6a0Aa0b3jGIiutnAlcw_WtqQu14X";

export const configure = SUPABASE_CLE !== "COLLE_TA_CLE_PUBLIQUE_ICI";

// Sur le web, Expo prépare d'abord les pages sur l'ordinateur (sans navigateur).
// Il n'y a alors ni "window" ni stockage : on désactive la session à ce moment-là.
const surServeur = typeof window === "undefined";

export const supabase = createClient(SUPABASE_URL, SUPABASE_CLE, {
  auth: {
    // Téléphone : AsyncStorage. Navigateur : stockage par défaut du navigateur.
    ...(Platform.OS !== "web" ? { storage: AsyncStorage } : {}),
    autoRefreshToken: !surServeur,
    persistSession: !surServeur,
    detectSessionInUrl: false,
  },
});