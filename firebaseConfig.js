import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// 🔹 Configuración de Firebase
// ⚠️ IMPORTANTE: Reemplaza estos valores con tu configuración real de Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDBJF1c4rBgmBefKDmvzevR2Bjw-yXpAzY",
  authDomain: "appterreno-43897.firebaseapp.com",
  projectId: "appterreno-43897",
  storageBucket: "appterreno-43897.firebaseapp.com",
  messagingSenderId: "549454179951",
  appId: "1:549454179951:android:xxxxxxxxxxxxx", // Obtén el correcto de Firebase Console
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Auth
export const auth = getAuth(app);

// Exportar Firestore
export const db = getFirestore(app);
