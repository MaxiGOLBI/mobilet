import * as Location from 'expo-location';
import { doc, setDoc, updateDoc, arrayUnion, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebaseInit';
import { getAuth } from 'firebase/auth';

const LOCATION_TRACKING_SECONDS = 30;
const LOCATIONS_COLLECTION = 'locations';
let locationTimer = null;

const initializeLocationDocument = async (userId, email) => {
  try {
    const locationRef = doc(db, LOCATIONS_COLLECTION, userId);
    const locationDoc = await getDoc(locationRef);
    
    if (!locationDoc.exists()) {
      await setDoc(locationRef, {
        userId,
        email,
        locations: [],
        lastLocation: null,
        lastUpdate: serverTimestamp(),
        createdAt: serverTimestamp()
      });
    }
  } catch (error) {
    throw error;
  }
};

export const startLocationTracking = async () => {
  try {
    // Detener cualquier timer existente
    if (locationTimer) {
      clearInterval(locationTimer);
      locationTimer = null;
    }

    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Solicitar permisos de ubicación
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permiso de ubicación denegado');
    }

    // Inicializar documento de ubicación
    await initializeLocationDocument(user.uid, user.email);

    const saveCurrentLocation = async () => {
      try {
        // Verificar que el usuario siga autenticado
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
          stopLocationTracking();
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        // Usar hora local del dispositivo y simplemente formatearla para Argentina
        const now = new Date();
        
        // Crear timestamp para Argentina (UTC-3) - restar 3 horas al UTC
        const argentinaTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
        
        console.log('📍 Nueva ubicación obtenida tras 30 segundos:', {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          hora: now.toLocaleString('es-AR')
        });

        const locationPoint = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: argentinaTime.toISOString(), // Ahora guarda la hora correcta de Argentina
          accuracy: location.coords.accuracy
        };

        // Verificar nuevamente que el usuario siga autenticado antes de guardar
        if (!auth.currentUser) {
          // Usuario se desautenticó - detener silenciosamente
          stopLocationTracking();
          return;
        }

        const locationRef = doc(db, LOCATIONS_COLLECTION, auth.currentUser.uid);

        await updateDoc(locationRef, {
          locations: arrayUnion(locationPoint),
          lastLocation: locationPoint,
          lastUpdate: serverTimestamp()
        });
        
      } catch (error) {
        // Error silencioso
      }
    };

    // Ejecutar inmediatamente la primera vez
    await saveCurrentLocation();

    // Configurar timer para ejecutar cada 30 segundos exactos
    locationTimer = setInterval(saveCurrentLocation, LOCATION_TRACKING_SECONDS * 1000);
  } catch (err) {
    throw err;
  }
};

export const stopLocationTracking = () => {
  if (locationTimer) {
    clearInterval(locationTimer);
    locationTimer = null;
    // Solo mostrar mensaje si es una parada manual (no automática por logout)
  }
};