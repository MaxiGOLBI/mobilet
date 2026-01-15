import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebaseConfig from './firebaseConfig';

// Inicializa la app
const app = initializeApp(firebaseConfig);

// Inicializa Auth con persistencia para React Native
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Inicializa Firestore con configuración para persistencia offline
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
  cache: {
    persistence: true
  }
});

export { app, auth, db };