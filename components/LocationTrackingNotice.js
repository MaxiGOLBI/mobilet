import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const LocationTrackingNotice = () => {
  // Animación para el ícono de localización
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    // Crear una animación de pulso continua
    const pulse = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.2,
        duration: 1000,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.ease,
        useNativeDriver: true,
      })
    ]);

    Animated.loop(pulse).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <MaterialIcons name="location-on" size={18} color="#4CAF50" />
      </Animated.View>
      <Text style={styles.title}>Ubicación Activa</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 16,
    width: '100%',
    maxWidth: 280,
  },
  title: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 6,
    fontWeight: '500',
  }
});

export default LocationTrackingNotice;