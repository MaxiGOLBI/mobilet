// Pantalla de mapa con barra de búsqueda y centrado por ubicación actual
import React, { useEffect, useState } from "react"; // Hooks de estado y efectos
import { StyleSheet, View, ActivityIndicator, Alert } from "react-native"; // UI básica
import MapView, { Marker } from "react-native-maps"; // Mapa y marcador
import * as Location from "expo-location"; // Permisos y ubicación actual
import SearchBar from "../components/SearchBar";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { SafeAreaView } from "react-native-safe-area-context";

const MapScreen = () => {
  // Coordenadas crudas del usuario (no usadas para render directamente)
  const [location, setLocation] = useState(null);
  // Región visible del mapa
  const [region, setRegion] = useState(null);
  // Indicador de carga inicial
  const [loading, setLoading] = useState(true);
  // Marcador de búsqueda para mostrar ubicación exacta encontrada
  const [searchMarker, setSearchMarker] = useState(null);

  useEffect(() => {
    // Al montar: pedir permisos y obtener posición actual
    (async () => {
      try {
        // Solicitar permisos de ubicación al usuario
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          // Permiso denegado: mostrar alerta y detener spinner
          Alert.alert(
            "Permiso denegado",
            "No se puede acceder a la ubicación sin permisos."
          );
          setLoading(false);
          return;
        }

        // Obtener la ubicación actual del dispositivo
        let loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords); // Guardar coordenadas crudas
        setRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } catch (error) {
        // Error al obtener la ubicación
        console.error("Error al obtener la ubicación:", error);
        Alert.alert("Error", "No se pudo obtener la ubicación.");
      } finally {
        // Finalizar estado de carga
        setLoading(false);
      }
    })();
  }, []); // El array vacío asegura que este efecto solo se ejecute una vez al montar el componente.

  // Recentrar el mapa cuando el usuario selecciona un lugar en la barra
  const handlePlaceSelected = (coords) => {
    console.log("Coordenadas seleccionadas:", coords);
    // Actualizar región para centrar el mapa
    setRegion({
      ...coords,
      latitudeDelta: 0.005, // Zoom más cercano para ver mejor la ubicación
      longitudeDelta: 0.005,
    });
    // Colocar marcador en la ubicación buscada
    setSearchMarker(coords);
  };

  if (loading) {
    // Mientras se obtiene la ubicación, mostrar spinner
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Barra de búsqueda de direcciones */}
      <SearchBar onPlaceSelected={handlePlaceSelected} />

      {region && (
        // Si hay región disponible, renderizar mapa centrado
        <MapView
          style={styles.map}
          region={region}
          showsUserLocation={true} // Punto azul de ubicación actual
          showsMyLocationButton={true} // Botón para recentrar en tu ubicación
          followsUserLocation={false} // No seguir automáticamente (para mejor control)
        >
          {/* Marcador de la ubicación buscada */}
          {searchMarker && (
            <Marker
              coordinate={{
                latitude: searchMarker.latitude,
                longitude: searchMarker.longitude,
              }}
              pinColor="red"
              title="Ubicación buscada"
              description="Esta es la ubicación que buscaste"
            />
          )}
        </MapView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, // Ocupa todo el espacio disponible.
    justifyContent: "center", // Centra el contenido verticalmente.
    alignItems: "center", // Centra el contenido horizontalmente.
  },
  map: {
    width: "100%", // El mapa ocupa todo el ancho de la pantalla.
    height: "100%", // El mapa ocupa todo el alto de la pantalla.
  },
});

export default MapScreen;
