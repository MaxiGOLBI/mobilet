import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 🔹 Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDBJF1c4rBgmBefKDmvzevR2Bjw-yXpAzY",
  authDomain: "appterreno-43897.firebaseapp.com",
  projectId: "appterreno-43897",
  storageBucket: "appterreno-43897.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdefg12345",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Auth con persistencia
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Exportar Firestore
export const db = getFirestore(app);
