import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";

// Colores predefinidos para los marcadores de clientes
const colores = ["#007bff", "#28a745", "#ffc107", "#dc3545", "#6f42c1", "#fd7e14"];

export default function MapaClientes({ onMarcadorSeleccionado }) {
  // Estado para la lista de clientes
  const [clientes, setClientes] = useState([]);
  // Estado para la ubicación temporal seleccionada en el mapa
  const [marcadorTemporal, setMarcadorTemporal] = useState(null);
  // Referencia al MapView para poder manipular la cámara si se necesitara
  const mapRef = useRef(null);

  // useEffect para escuchar la colección "clientes" en tiempo real
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "clientes"), (snapshot) => {
      const lista = snapshot.docs.map((doc) => {
        const data = doc.data();
        // Maneja la ubicación: si está en formato Firestore GeoPoint o lat/lng
        const ubicacion = data.ubicacion?.lat !== undefined
          ? data.ubicacion
          : data.ubicacion?.toJSON
          ? { lat: data.ubicacion.latitude, lng: data.ubicacion.longitude }
          : null;

        return {
          id: doc.id, // id del documento
          color: colores[Math.floor(Math.random() * colores.length)], // asigna color aleatorio
          ...data,
          ubicacion,
        };
      });
      setClientes(lista); // actualiza el estado con la lista de clientes
    });
    return () => unsubscribe(); // limpia la suscripción al desmontar
  }, []);

  // Función que se ejecuta al presionar sobre el mapa
  const handlePressMapa = (e) => {
    const coords = e.nativeEvent.coordinate; // obtiene lat/lng del toque
    setMarcadorTemporal(coords); // guarda la ubicación temporal
    if (onMarcadorSeleccionado) onMarcadorSeleccionado(coords); // notifica al componente padre
  };

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={mapRef} // referencia para manipular el mapa si se quiere
        style={styles.map}
        initialRegion={{ latitude: -31.4, longitude: -64.2, latitudeDelta: 0.05, longitudeDelta: 0.05 }} // región inicial
        showsUserLocation={true} // muestra la ubicación del usuario como punto azul
        showsMyLocationButton={true} // botón para recentrar en tu ubicación
        followsUserLocation={false} // no seguir automáticamente
        onPress={handlePressMapa} // captura toque en el mapa
      >
        {/* Renderiza los marcadores de los clientes */}
        {clientes.map(cliente =>
          cliente.ubicacion?.lat && cliente.ubicacion?.lng && (
            <Marker
              key={cliente.id} // key única
              coordinate={{ latitude: cliente.ubicacion.lat, longitude: cliente.ubicacion.lng }}
            >
              {/* Marcador personalizado: círculo con inicial */}
              <View style={[styles.circulo, { backgroundColor: cliente.color }]}>
                <Text style={styles.inicial}>{cliente.nombre.charAt(0).toUpperCase()}</Text>
              </View>
              {/* Callout o burbuja que muestra info del cliente */}
              <Callout>
                <Text>{cliente.nombre} - DNI: {cliente.dni}</Text>
                <Text>Producto: {cliente.producto}</Text>
              </Callout>
            </Marker>
          )
        )}

        {/* Marcador temporal que se coloca al tocar el mapa */}
        {marcadorTemporal && <Marker coordinate={marcadorTemporal} pinColor="red" />}
      </MapView>
    </SafeAreaView>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  // Estilo del círculo de los marcadores
  circulo: { width: 30, height: 30, borderRadius: 15, justifyContent: "center", alignItems: "center" },
  // Estilo de la letra inicial dentro del círculo
  inicial: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});