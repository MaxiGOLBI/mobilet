import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../firebaseInit';
import { onAuthStateChanged } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Escuchar cambios en el estado de autenticación
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;

      if (user) {
        // Usuario autenticado - solo guardar información esencial
        const essentialUserData = {
          uid: user.uid,
          email: user.email,
        };
        setUser(essentialUserData);
        await AsyncStorage.setItem('user', JSON.stringify(essentialUserData));
      } else {
        // Usuario no autenticado
        setUser(null);
        await AsyncStorage.removeItem('user');
      }
      setLoading(false);
    });

    // Verificar si hay un usuario guardado en AsyncStorage
    const loadStoredUser = async () => {
      if (!mounted) return;

      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser && mounted) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error al cargar usuario guardado:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadStoredUser();

    // Limpiar el listener y marcar el componente como desmontado
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};