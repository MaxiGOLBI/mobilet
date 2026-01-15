import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { auth } from '../firebaseInit';
import { signOut } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WelcomeScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogout = async () => {
    try {
      setLoading(true);
      // Limpiar todos los datos persistentes
      await AsyncStorage.clear();
      await signOut(auth);
    } catch (error) {
      setError('Error al cerrar sesión');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.form, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.form}>
      <Text style={styles.title}>¡Bienvenido!</Text>
      <Text style={styles.email}>{user?.email}</Text>
      
      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    alignSelf: 'center',
    marginTop: 40,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  email: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },

  button: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorText: {
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 16,
  },
});
