import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, ActivityIndicator, Platform, StatusBar, Alert } from "react-native";
import MapView, { Marker, Callout, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import ClienteForm from "./components/ClienteForm";
import PlanificadorRecorrido from "./components/PlanificadorRecorrido";
import HistorialRecorridos from "./components/HistorialRecorridos";
import SearchBar from "./components/SearchBarSimple";
import { SafeAreaView } from "react-native-safe-area-context";
import { db, auth } from "./firebaseConfig";
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { stopLocationTracking } from "./services/locationService";
import { useAuth } from "./contexts/AuthContext";

// Colores predefinidos para los marcadores de clientes
const colores = ["#007bff", "#28a745", "#ffc107", "#dc3545", "#6f42c1", "#fd7e14"];

export default function App() {
  const { user } = useAuth();
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [mostrarPlanificador, setMostrarPlanificador] = useState(false);
  const [ubicacionActual, setUbicacionActual] = useState(null);
  const [recorridoActivo, setRecorridoActivo] = useState(null);
  const [rutasPolyline, setRutasPolyline] = useState([]);
  const [rutaAlternativa, setRutaAlternativa] = useState([]);
  const [posicionActual, setPosicionActual] = useState(null);
  const [rutaRecorrida, setRutaRecorrida] = useState([]);
  const [cargandoRuta, setCargandoRuta] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [recorridoIdActual, setRecorridoIdActual] = useState(null);
  const mapRef = useRef(null);
  const markerRefs = useRef({});
  const locationSubscription = useRef(null);

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

  // Obtener ubicación actual al iniciar
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setUbicacionActual({
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          });
        }
      } catch (error) {
        console.error('Error obteniendo ubicación:', error);
      }
    })();
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

  const irAMiUbicacion = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permiso de ubicación denegado');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      if (mapRef.current && location) {
        mapRef.current.animateToRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      }
    } catch (error) {
      console.error('Error al obtener ubicación:', error);
      alert('No se pudo obtener tu ubicación');
    }
  };

  const empezarRecorrido = () => {
    setMenuAbierto(false);
    setMostrarPlanificador(true);
  };

  const cerrarPlanificador = () => {
    setMostrarPlanificador(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await stopLocationTracking();
              await signOut(auth);
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
              Alert.alert('Error', 'No se pudo cerrar sesión');
            }
          },
        },
      ]
    );
  };

  const handleIniciarRecorrido = async (recorrido) => {
    console.log('Recorrido iniciado:', recorrido);
    setCargandoRuta(true);
    
    try {
      // Guardar recorrido en Firebase
      const recorridoDoc = await addDoc(collection(db, 'recorridos'), {
        puntoPartida: recorrido.puntoPartida,
        paradas: recorrido.paradas,
        modoTransporte: recorrido.modoTransporte,
        fechaInicio: serverTimestamp(),
        finalizado: false,
      });
      
      setRecorridoIdActual(recorridoDoc.id);
      
      // Crear array de waypoints (todas las coordenadas)
      const puntos = [recorrido.puntoPartida.coords, ...recorrido.paradas.map(p => p.coords)];
      
      // Obtener la ruta completa usando Google Directions API
      const apiKey = "AIzaSyBB5349oJcl7zB67bVAFgZbNMZ-I_mYx4k";
      
      // Crear origin y destination con mayor precisión
      const origin = `${puntos[0].lat.toFixed(7)},${puntos[0].lng.toFixed(7)}`;
      const destination = `${puntos[puntos.length - 1].lat.toFixed(7)},${puntos[puntos.length - 1].lng.toFixed(7)}`;
      
      // Crear waypoints intermedios si hay más de 2 puntos
      let waypointsParam = '';
      if (puntos.length > 2) {
        const waypoints = puntos.slice(1, -1).map(p => `${p.lat.toFixed(7)},${p.lng.toFixed(7)}`).join('|');
        waypointsParam = `&waypoints=optimize:true|${waypoints}`; // optimize:true para optimizar orden
      }
      
      // Modo de transporte
      const modo = recorrido.modoTransporte || 'driving';
      
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}${waypointsParam}&mode=${modo}&alternatives=true&key=${apiKey}&language=es&region=ar`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.routes.length > 0) {
        // Decodificar el polyline de la ruta principal
        const points = decodePolyline(data.routes[0].overview_polyline.points);
        setRutasPolyline(points);
        
        // Decodificar ruta alternativa si existe
        if (data.routes.length > 1) {
          const altPoints = decodePolyline(data.routes[1].overview_polyline.points);
          setRutaAlternativa(altPoints);
        } else {
          setRutaAlternativa([]);
        }
        
        // Iniciar seguimiento de ubicación
        iniciarSeguimientoUbicacion();
        
        // Guardar el recorrido activo
        setRecorridoActivo({
          ...recorrido,
          duracionEstimada: data.routes[0].legs.reduce((sum, leg) => sum + leg.duration.value, 0),
          distanciaTotal: data.routes[0].legs.reduce((sum, leg) => sum + leg.distance.value, 0),
        });
        
        // Ajustar el mapa para mostrar toda la ruta
        const allCoords = puntos.map(p => ({ latitude: p.lat, longitude: p.lng }));
        if (mapRef.current && allCoords.length > 0) {
          setTimeout(() => {
            mapRef.current.fitToCoordinates(allCoords, {
              edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
              animated: true,
            });
          }, 500);
        }
      } else {
        alert(`No se pudo calcular la ruta: ${data.status}`);
      }
    } catch (error) {
      console.error('Error al calcular ruta:', error);
      alert('Error al calcular la ruta');
    } finally {
      setCargandoRuta(false);
    }
  };

  // Función para decodificar polyline de Google
  const decodePolyline = (encoded) => {
    const points = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  };

  const finalizarRecorrido = async () => {
    // Detener seguimiento de ubicación
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    
    // Solo actualizar Firebase si no es una visualización
    if (recorridoIdActual && !recorridoActivo?.esVisualizacion) {
      try {
        await updateDoc(doc(db, 'recorridos', recorridoIdActual), {
          finalizado: true,
          fechaFin: serverTimestamp(),
        });
      } catch (error) {
        console.error('Error al finalizar recorrido:', error);
      }
    }
    setRecorridoActivo(null);
    setRutasPolyline([]);
    setRutaAlternativa([]);
    setRutaRecorrida([]);
    setPosicionActual(null);
    setRecorridoIdActual(null);
  };

  // Iniciar seguimiento de ubicación en tiempo real
  const iniciarSeguimientoUbicacion = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 3000, // Actualizar cada 3 segundos
          distanceInterval: 10, // O cada 10 metros
        },
        (location) => {
          const nuevaPosicion = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setPosicionActual(nuevaPosicion);
          
          // Agregar a la ruta recorrida
          setRutaRecorrida((prev) => [...prev, nuevaPosicion]);
        }
      );
    } catch (error) {
      console.error('Error al iniciar seguimiento:', error);
    }
  };

  const verRecorrido = () => {
    setMenuAbierto(false);
    setMostrarHistorial(true);
  };

  const cerrarHistorial = () => {
    setMostrarHistorial(false);
  };

  const handleVerRecorrido = async (recorrido) => {
    setMostrarHistorial(false);
    setCargandoRuta(true);
    
    try {
      // Crear array de waypoints (todas las coordenadas)
      const puntos = [recorrido.puntoPartida.coords, ...recorrido.paradas.map(p => p.coords)];
      
      // Obtener la ruta completa usando Google Directions API
      const apiKey = "AIzaSyBB5349oJcl7zB67bVAFgZbNMZ-I_mYx4k";
      
      // Crear origin y destination con mayor precisión
      const origin = `${puntos[0].lat.toFixed(7)},${puntos[0].lng.toFixed(7)}`;
      const destination = `${puntos[puntos.length - 1].lat.toFixed(7)},${puntos[puntos.length - 1].lng.toFixed(7)}`;
      
      // Crear waypoints intermedios si hay más de 2 puntos
      let waypointsParam = '';
      if (puntos.length > 2) {
        const waypoints = puntos.slice(1, -1).map(p => `${p.lat.toFixed(7)},${p.lng.toFixed(7)}`).join('|');
        waypointsParam = `&waypoints=optimize:true|${waypoints}`;
      }
      
      // Usar el modo de transporte guardado o 'driving' por defecto
      const modo = recorrido.modoTransporte || 'driving';
      
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}${waypointsParam}&mode=${modo}&alternatives=true&key=${apiKey}&language=es&region=ar`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.routes.length > 0) {
        // Decodificar el polyline de la ruta
        const points = decodePolyline(data.routes[0].overview_polyline.points);
        setRutasPolyline(points);
        
        // Decodificar ruta alternativa si existe
        if (data.routes.length > 1) {
          const altPoints = decodePolyline(data.routes[1].overview_polyline.points);
          setRutaAlternativa(altPoints);
        } else {
          setRutaAlternativa([]);
        }
        
        // Guardar el recorrido activo (sin crear nuevo registro en Firebase)
        setRecorridoActivo({
          puntoPartida: recorrido.puntoPartida,
          paradas: recorrido.paradas,
          modoTransporte: modo,
          esVisualizacion: true, // Marca para indicar que es solo visualización
        });
        
        // Ajustar el mapa para mostrar toda la ruta
        const allCoords = puntos.map(p => ({ latitude: p.lat, longitude: p.lng }));
        if (mapRef.current && allCoords.length > 0) {
          setTimeout(() => {
            mapRef.current.fitToCoordinates(allCoords, {
              edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
              animated: true,
            });
          }, 500);
        }
      } else {
        alert(`No se pudo calcular la ruta: ${data.status}`);
      }
    } catch (error) {
      console.error('Error al calcular ruta:', error);
      alert('Error al calcular la ruta');
    } finally {
      setCargandoRuta(false);
    }
  };

  const toggleMenu = () => {
    setMenuAbierto(!menuAbierto);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#064083' }} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#064083" />
      <View style={{ flex: 1 }}>
        {/* Header superior */}
        <View style={styles.header}>
          {/* Menú hamburguesa */}
          <TouchableOpacity style={styles.headerButton} onPress={toggleMenu}>
            <View style={styles.hamburgerIcon}>
              <View style={styles.hamburgerLineHeader} />
              <View style={styles.hamburgerLineHeader} />
              <View style={styles.hamburgerLineHeader} />
            </View>
          </TouchableOpacity>

          {/* Barra de búsqueda integrada */}
          <View style={styles.searchContainer}>
            <SearchBar onPlaceSelected={handlePlaceSelected} />
          </View>

          {/* Botón agregar cliente */}
          {!recorridoActivo && (
            <TouchableOpacity style={styles.headerButton} onPress={abrirFormulario}>
              <Text style={styles.headerButtonIcon}>+</Text>
            </TouchableOpacity>
          )}

          {/* Botón volver a ubicación */}
          <TouchableOpacity style={styles.headerButton} onPress={irAMiUbicacion}>
            <Text style={styles.headerButtonIcon}>📍</Text>
          </TouchableOpacity>
        </View>

        {/* Menú desplegable */}
        {menuAbierto && (
          <View style={styles.menuDropdown}>
            <TouchableOpacity style={styles.menuItem} onPress={empezarRecorrido}>
              <Text style={styles.menuItemText}>🚀 Empezar recorrido</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={verRecorrido}>
              <Text style={styles.menuItemText}>📍 Ver recorrido</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Text style={[styles.menuItemText, { color: '#dc3545' }]}>🚪 Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <MapView
          style={styles.map}
          ref={mapRef}
          initialRegion={{ latitude: -31.4, longitude: -64.2, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
          showsUserLocation={true} // Muestra tu ubicación actual como punto azul
          showsMyLocationButton={false} // Botón para recentrar en tu ubicación
          followsUserLocation={false} // No seguir automáticamente
          onPress={handleMapPress}
        >
          {/* Ruta alternativa (punteada en gris) */}
          {rutaAlternativa.length > 0 && (
            <Polyline
              coordinates={rutaAlternativa}
              strokeColor="#9E9E9E"
              strokeWidth={4}
              lineDashPattern={[10, 10]}
              zIndex={1}
            />
          )}

          {/* Tramo recorrido (gris sólido) */}
          {rutaRecorrida.length > 1 && (
            <Polyline
              coordinates={rutaRecorrida}
              strokeColor="#757575"
              strokeWidth={5}
              zIndex={3}
            />
          )}

          {/* Ruta principal (azul) */}
          {rutasPolyline.length > 0 && (
            <Polyline
              coordinates={rutasPolyline}
              strokeColor="#4285F4"
              strokeWidth={5}
              zIndex={2}
            />
          )}

          {/* Mostrar marcadores del recorrido activo */}
          {recorridoActivo && (
            <>
              {/* Marcador de punto de partida */}
              <Marker
                coordinate={{
                  latitude: recorridoActivo.puntoPartida.coords.lat,
                  longitude: recorridoActivo.puntoPartida.coords.lng,
                }}
                title="Punto de partida"
                description={recorridoActivo.puntoPartida.nombre}
              >
                <View style={styles.marcadorPartida}>
                  <Text style={styles.marcadorPartidaText}>A</Text>
                </View>
              </Marker>

              {/* Marcadores de paradas numeradas */}
              {recorridoActivo.paradas.map((parada, index) => (
                <Marker
                  key={`parada-${index}`}
                  coordinate={{
                    latitude: parada.coords.lat,
                    longitude: parada.coords.lng,
                  }}
                  title={`Parada ${index + 1}`}
                  description={parada.nombre}
                >
                  <View style={styles.marcadorParada}>
                    <Text style={styles.marcadorParadaText}>{index + 1}</Text>
                  </View>
                </Marker>
              ))}
            </>
          )}

          {/* Marcadores de clientes normales (solo si no hay recorrido activo) */}
          {!recorridoActivo && clientes.map(
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

          {ubicacionSeleccionada && !recorridoActivo && (
            <Marker
              coordinate={{ latitude: ubicacionSeleccionada.lat, longitude: ubicacionSeleccionada.lng }}
              pinColor="red"
              title="Ubicación seleccionada"
            />
          )}
        </MapView>

        {/* Powered by text en la parte inferior */}
        <View style={styles.poweredByContainer}>
          <Text style={styles.poweredByText}>powered by Bit and Brain</Text>
        </View>

        {/* Indicador de carga */}
        {cargandoRuta && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4285F4" />
            <Text style={styles.loadingText}>Calculando ruta...</Text>
          </View>
        )}

        {/* Panel de información del recorrido */}
        {recorridoActivo && (
          <View style={styles.recorridoPanel}>
            <Text style={styles.recorridoPanelTitle}>
              {recorridoActivo.esVisualizacion ? 'Viendo recorrido: ' : 'Recorrido: '}
              {recorridoActivo.paradas.length} parada{recorridoActivo.paradas.length > 1 ? 's' : ''}
            </Text>
            <TouchableOpacity style={styles.finalizarButton} onPress={finalizarRecorrido}>
              <Text style={styles.finalizarButtonText}>
                {recorridoActivo.esVisualizacion ? 'Cerrar visualización' : 'Finalizar recorrido'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {mostrarFormulario && (
          <View style={styles.formOverlay}>
            <ClienteForm
              ubicacion={ubicacionSeleccionada}
              onCerrar={cerrarFormulario}
              onClienteCreado={handleClienteCreado}
            />
          </View>
        )}

        {mostrarPlanificador && (
          <View style={styles.formOverlay}>
            <PlanificadorRecorrido
              clientes={clientes}
              onCerrar={cerrarPlanificador}
              onIniciarRecorrido={handleIniciarRecorrido}
              ubicacionActual={ubicacionActual}
            />
          </View>
        )}

        {mostrarHistorial && (
          <View style={styles.formOverlay}>
            <HistorialRecorridos
              onCerrar={cerrarHistorial}
              onVerRecorrido={handleVerRecorrido}
            />
          </View>
        )}

        {/* Indicador de tracking activo */}
        <View style={styles.trackingIndicator}>
          <View style={styles.trackingDot} />
          <Text style={styles.trackingText}>📍 Ubicación en tiempo real</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const { height, width } = Dimensions.get("window");

const styles = StyleSheet.create({
  map: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064083',
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 4 : 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    zIndex: 1000,
  },
  headerButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  headerButtonIcon: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  hamburgerIcon: {
    width: 24,
    height: 24,
    justifyContent: 'space-around',
  },
  hamburgerLineHeader: {
    width: 24,
    height: 3,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  searchContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  hamburgerButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 50,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    zIndex: 100,
  },
  hamburgerLine: {
    width: 25,
    height: 3,
    backgroundColor: '#007bff',
    marginVertical: 2,
    borderRadius: 2,
  },
  menuDropdown: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 60,
    left: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    zIndex: 999,
    minWidth: 220,
    overflow: 'hidden',
  },
  menuItem: {
    padding: 15,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
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
  formOverlay: {
    position: "absolute",
    top: height * 0.18,
    left: width * 0.05,
    width: width * 0.9,
    maxHeight: height * 0.75,
    backgroundColor: "#ffffff",
    borderRadius: 15,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
  marcadorPartida: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#34A853',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 5,
  },
  marcadorPartidaText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  marcadorParada: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 5,
  },
  marcadorParadaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    top: '45%',
    left: '50%',
    transform: [{ translateX: -75 }, { translateY: -50 }],
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 10,
    width: 150,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  recorridoPanel: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  recorridoPanelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  finalizarButton: {
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  finalizarButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  poweredByContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  poweredByText: {
    fontSize: 11,
    color: '#757575',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
  },
  trackingIndicator: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 70 : 80,
    right: 10,
    backgroundColor: 'rgba(76, 175, 80, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    zIndex: 100,
  },
  trackingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 6,
  },
  trackingText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});
