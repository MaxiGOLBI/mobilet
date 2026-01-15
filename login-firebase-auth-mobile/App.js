import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableWithoutFeedback, Keyboard, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginScreen from './screens/LoginScreen';
import WelcomeScreen from './screens/WelcomeScreen';

const userImage = require('./assets/User.png');

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007bff" />
      </SafeAreaView>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.container}>
        {user ? (
          <WelcomeScreen />
        ) : (
          <LoginScreen userImage={userImage} />
        )}
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

export default function App() {

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: '#fff',
  },
});
