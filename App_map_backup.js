import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Text, Dimensions } from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import ClienteForm from "./components/ClienteForm";
import SearchBar from "./components/SearchBarSimple";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "./firebaseConfig";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

// Colores predefinidos para los marcadores de clientes
const colores = ["#007bff", "#28a745", "#ffc107", "#dc3545", "#6f42c1", "#fd7e14"];

export default function App() {
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [clientes, setClientes] = useState([]);
  const mapRef = useRef(null);
  const markerRefs = useRef({});

  // Escuchar cambios en Firestore
  useEffect(() => {
    const q = query(collection(db, "clientes"), orderBy("fecha_registro", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          color: data.color || colores[Math.floor(Math.random() * colores.length)],
          nombre: data.nombre || '',
          dni: data.dni || '',
          telefono: data.telefono || '',
          producto: data.producto || '',
          direccion: data.direccion || '',
          ubicacion: data.ubicacion || {},
          ...data,
        };
      });
      setClientes(lista);
    });
    return () => unsubscribe();
  }, []);

  const handleMapPress = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setUbicacionSeleccionada({ lat: latitude, lng: longitude });
  };

  const abrirFormulario = () => {
    if (!ubicacionSeleccionada) {
      alert("Primero selecciona un punto en el mapa");
      return;
    }
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setUbicacionSeleccionada(null);
  };

  // Función para manejar la selección de lugares desde el SearchBar
  const handlePlaceSelected = (coords) => {
    if (mapRef.current && coords) {
      mapRef.current.animateToRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      // Opcional: también marcar como ubicación seleccionada
      setUbicacionSeleccionada({ lat: coords.latitude, lng: coords.longitude });
    }
  };

  // 🔹 Cambiado para evitar duplicados
  const handleClienteCreado = (cliente) => {
    // No agregamos manualmente al estado para evitar duplicados
    // setClientes((prev) => [...prev, cliente]);

    setTimeout(() => {
      const marker = markerRefs.current[cliente.id];
      if (marker) {
        marker.showCallout();
        mapRef.current.animateToRegion({
          latitude: cliente.ubicacion.lat,
          longitude: cliente.ubicacion.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    }, 500);

    setUbicacionSeleccionada(null);
  };

  const handleSeleccionarCliente = (clienteId) => {
    const marker = markerRefs.current[clienteId];
    if (marker) {
      marker.showCallout();
      const cliente = clientes.find((c) => c.id === clienteId);
      if (cliente) {
        mapRef.current.animateToRegion({
          latitude: cliente.ubicacion.lat,
          longitude: cliente.ubicacion.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {/* Barra de búsqueda sobre el mapa */}
        <SearchBar onPlaceSelected={handlePlaceSelected} />
        
        <MapView
          style={styles.map}
          ref={mapRef}
          initialRegion={{ latitude: -31.4, longitude: -64.2, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
          showsUserLocation={true}
          onPress={handleMapPress}
        >
          {clientes.map(
            (cliente) =>
              cliente.ubicacion?.lat && cliente.ubicacion?.lng && (
                <Marker
                  key={cliente.id}
                  coordinate={{
                    latitude: cliente.ubicacion.lat,
                    longitude: cliente.ubicacion.lng,
                  }}
                  title={cliente.nombre}
                  description={`DNI: ${cliente.dni} - Producto: ${cliente.producto}`}
                >
                  <View style={[styles.circulo, { backgroundColor: cliente.color || "#007bff" }]}> 
                    <Text style={styles.inicial}>{cliente.nombre?.charAt(0).toUpperCase()}</Text>
                  </View>
                </Marker>
              )
          )}

          {ubicacionSeleccionada && (
            <Marker
              coordinate={{ latitude: ubicacionSeleccionada.lat, longitude: ubicacionSeleccionada.lng }}
              pinColor="red"
              title="Ubicación seleccionada"
            />
          )}
        </MapView>

        <TouchableOpacity style={styles.fab} onPress={abrirFormulario}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>

        {mostrarFormulario && (
          <View style={styles.formOverlay}>
            <ClienteForm
              ubicacion={ubicacionSeleccionada}
              onCerrar={cerrarFormulario}
              onClienteCreado={handleClienteCreado}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const { height, width } = Dimensions.get("window");

const styles = StyleSheet.create({
  map: { flex: 1 },
  calloutContainer: {
    minWidth: 200,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 5,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#007bff',
  },
  calloutText: {
    fontSize: 14,
    marginBottom: 3,
    color: '#333',
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  fabText: { color: "#fff", fontSize: 30, fontWeight: "bold" },
  formOverlay: {
    position: "absolute",
    top: height * 0.1,
    left: width * 0.05,
    width: width * 0.9,
    maxHeight: height * 0.7,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderRadius: 15,
    padding: 10,
    elevation: 5,
  },
  circulo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  inicial: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
