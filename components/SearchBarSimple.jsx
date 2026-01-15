// Componente de barra de búsqueda simplificado sin Google Places Autocomplete
// Usa geocodificación directa cuando el usuario presiona Enter
import React, { useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";

export default function SearchBarSimple({ onPlaceSelected } = {}) {
  const [searchText, setSearchText] = useState("");

  const handleSearch = async () => {
    if (!searchText.trim()) return;
    
    try {
      const key = "AIzaSyBB5349oJcl7zB67bVAFgZbNMZ-I_mYx4k"; // API Key del dashboard
      // Agregar region y components para mayor precisión en Argentina
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        searchText
      )}&key=${key}&language=es&region=ar&components=country:ar`;
      
      const res = await fetch(url);
      const json = await res.json();
      const first = json?.results?.[0];
      const loc = first?.geometry?.location;
      
      if (loc && onPlaceSelected) {
        onPlaceSelected({ latitude: loc.lat, longitude: loc.lng });
        setSearchText(""); // Limpiar después de buscar
      }
    } catch (error) {
      console.error("Error en geocodificación:", error);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.textInput}
        placeholder="Buscar dirección..."
        placeholderTextColor="#999"
        value={searchText}
        onChangeText={setSearchText}
        returnKeyType="search"
        onSubmitEditing={handleSearch}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  textInput: {
    height: 40,
    fontSize: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    paddingHorizontal: 16,
    color: '#333',
  },
});