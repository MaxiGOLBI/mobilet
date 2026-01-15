import { db } from '../app/firebaseConfig';
import { collection, addDoc, doc, getDoc, getDocs, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { COLLECTIONS } from './collections';

// Clase base para operaciones CRUD genéricas
class FirestoreService {
  constructor(collectionName) {
    this.collectionRef = collection(db, collectionName);
  }

  // Crear un nuevo documento
  async create(data) {
    try {
      const docRef = await addDoc(this.collectionRef, {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  // Obtener un documento por ID
  async getById(id) {
    try {
      const docRef = doc(this.collectionRef, id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
      console.error('Error getting document:', error);
      throw error;
    }
  }

  // Obtener todos los documentos
  async getAll() {
    try {
      const querySnapshot = await getDocs(this.collectionRef);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting documents:', error);
      throw error;
    }
  }

  // Actualizar un documento
  async update(id, data) {
    try {
      const docRef = doc(this.collectionRef, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date(),
      });
      return true;
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  // Eliminar un documento
  async delete(id) {
    try {
      const docRef = doc(this.collectionRef, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  // Consulta personalizada
  async query(conditions) {
    try {
      const q = query(this.collectionRef, ...conditions);
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error querying documents:', error);
      throw error;
    }
  }
}