import React from 'react';
import { SafeAreaView } from "react-native";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginScreen from './assets/screens/LoginScreen';
import WelcomeScreen from './assets/screens/WelcomeScreen';

// Componente principal que maneja la autenticación
function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {/* Aquí podrías agregar un spinner de carga */}
      </SafeAreaView>
    );
  }

  // Si no hay usuario autenticado, mostrar LoginScreen
  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <LoginScreen />
      </SafeAreaView>
    );
  }

  // Si hay usuario autenticado, mostrar WelcomeScreen (que incluye el mapa)
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <WelcomeScreen />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}