import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { doc, setDoc, updateDoc, arrayUnion, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getAuth } from 'firebase/auth';

const LOCATION_TRACKING_SECONDS = 10; // Actualizar cada 10 segundos para tiempo real
const LOCATIONS_COLLECTION = 'locations';
const LOCATION_TASK_NAME = 'background-location-task';
let locationTimer = null;
let locationSubscription = null;

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
    // Detener cualquier timer o subscription existente
    if (locationTimer) {
      clearInterval(locationTimer);
      locationTimer = null;
    }
    if (locationSubscription) {
      locationSubscription.remove();
      locationSubscription = null;
    }

    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Solicitar permisos de ubicación en primer plano
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

        const now = new Date();
        const argentinaTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
        
        console.log('📍 Ubicación actualizada en tiempo real:', {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          hora: now.toLocaleString('es-AR')
        });

        const locationPoint = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: argentinaTime.toISOString(),
          accuracy: location.coords.accuracy,
          speed: location.coords.speed || 0,
          heading: location.coords.heading || 0
        };

        if (!auth.currentUser) {
          stopLocationTracking();
          return;
        }

        const locationRef = doc(db, LOCATIONS_COLLECTION, auth.currentUser.uid);

        await updateDoc(locationRef, {
          locations: arrayUnion(locationPoint),
          lastLocation: locationPoint,
          lastUpdate: serverTimestamp(),
          isActive: true
        });
        
      } catch (error) {
        // Error silencioso
      }
    };

    // Ejecutar inmediatamente la primera vez
    await saveCurrentLocation();

    // Configurar timer para ejecutar cada 10 segundos (tiempo real)
    locationTimer = setInterval(saveCurrentLocation, LOCATION_TRACKING_SECONDS * 1000);
    
    console.log('✅ Seguimiento de ubicación en tiempo real iniciado (cada 10 segundos)');
  } catch (err) {
    throw err;
  }
};

export const stopLocationTracking = async () => {
  if (locationTimer) {
    clearInterval(locationTimer);
    locationTimer = null;
  }
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }
  
  // Marcar como inactivo en Firestore
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const locationRef = doc(db, LOCATIONS_COLLECTION, user.uid);
      await updateDoc(locationRef, {
        isActive: false,
        lastUpdate: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error al marcar ubicación como inactiva:', error);
  }
  
  console.log('🛑 Seguimiento de ubicación detenido');
};

// Función para obtener la última ubicación de un usuario
export const getLastLocation = async (userId) => {
  try {
    const locationRef = doc(db, LOCATIONS_COLLECTION, userId);
    const locationDoc = await getDoc(locationRef);
    
    if (locationDoc.exists()) {
      return locationDoc.data().lastLocation;
    }
    return null;
  } catch (error) {
    console.error('Error al obtener última ubicación:', error);
    return null;
  }
};