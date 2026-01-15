import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { app } from '../firebaseInit';

// Inicializar Firestore
const db = getFirestore(app);

// Crear un nuevo usuario en Firestore
export const createUserDocument = async (uid, userData) => {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      email: userData.email
    });
    return true;
  } catch (error) {
    console.error('Error al crear documento de usuario:', error);
    if (error.code === 'unavailable') {
      // Si estamos offline, intentamos guardar los datos localmente
      try {
        await setDoc(userRef, {
          email: userData.email
        });
        return true;
      } catch (localError) {
        console.error('Error al guardar localmente:', localError);
        return false;
      }
    }
    return false;
  }
};

// Obtener datos de usuario
export const getUserData = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data();
    } else {
      console.log('No se encontró el usuario');
      return null;
    }
  } catch (error) {
    console.error('Error al obtener datos del usuario:', error);
    // Si estamos offline, intentamos obtener los datos del caché local
    if (error.code === 'unavailable') {
      try {
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          return userSnap.data();
        }
      } catch (localError) {
        console.error('Error al obtener datos locales:', localError);
      }
    }
    return null;
  }
};

// Actualizar datos de usuario
export const updateUserData = async (uid, userData) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...userData,
      updatedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error('Error al actualizar datos del usuario:', error);
    return false;
  }
};