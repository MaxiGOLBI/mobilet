import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { auth } from '../../firebaseConfig';
import { signOut } from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startLocationTracking, stopLocationTracking } from '../../services/locationService';
import LocationTrackingNotice from '../../components/LocationTrackingNotice';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const initializeTracking = async () => {
      try {
        setLoading(true);
        await startLocationTracking();
      } catch (err) {
        setError('Error al iniciar el seguimiento de ubicación');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    initializeTracking();
  }, []);

  const handleLogout = async () => {
    try {
      setLoading(true);
      // Detener el tracking de ubicación antes de cerrar sesión
      stopLocationTracking();
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
      <View style={styles.container}>
        <View style={styles.form}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>¡Bienvenido!</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <TouchableOpacity style={styles.button} onPress={handleLogout}>
          <Text style={styles.buttonText}>Cerrar sesión</Text>
        </TouchableOpacity>
        <LocationTrackingNotice />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  form: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 80,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#000',
  },
  email: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
});
