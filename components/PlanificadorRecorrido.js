import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';

export default function PlanificadorRecorrido({ clientes, onCerrar, onIniciarRecorrido, ubicacionActual }) {
  const [puntoPartida, setPuntoPartida] = useState(null);
  const [paradas, setParadas] = useState([]);
  const [mostrarSeleccionPartida, setMostrarSeleccionPartida] = useState(false);
  const [mostrarSeleccionParada, setMostrarSeleccionParada] = useState(false);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [busquedaUbicacion, setBusquedaUbicacion] = useState('');
  const [mostrarOpcionesParada, setMostrarOpcionesParada] = useState(false);
  const [modoTransporte, setModoTransporte] = useState('driving'); // driving, walking

  // Seleccionar ubicación actual como punto de partida
  const usarUbicacionActual = () => {
    if (ubicacionActual) {
      setPuntoPartida({
        tipo: 'ubicacion',
        nombre: 'Mi ubicación',
        coords: ubicacionActual,
      });
      setMostrarSeleccionPartida(false);
    } else {
      Alert.alert('Error', 'No se pudo obtener tu ubicación actual');
    }
  };

  // Seleccionar un cliente como punto de partida
  const seleccionarClientePartida = (cliente) => {
    setPuntoPartida({
      tipo: 'cliente',
      nombre: cliente.nombre,
      coords: { lat: cliente.ubicacion.lat, lng: cliente.ubicacion.lng },
      cliente: cliente,
    });
    setMostrarSeleccionPartida(false);
  };

  // Agregar parada (cliente)
  const agregarParadaCliente = (cliente) => {
    // Verificar que no esté ya agregado
    if (paradas.some(p => p.tipo === 'cliente' && p.cliente.id === cliente.id)) {
      Alert.alert('Aviso', 'Este cliente ya está en la lista de paradas');
      return;
    }

    setParadas([...paradas, {
      tipo: 'cliente',
      nombre: cliente.nombre,
      coords: { lat: cliente.ubicacion.lat, lng: cliente.ubicacion.lng },
      cliente: cliente,
    }]);
    setMostrarSeleccionParada(false);
    setMostrarOpcionesParada(false);
    setBusquedaCliente('');
  };

  // Agregar parada (ubicación personalizada)
  const agregarParadaUbicacion = async () => {
    if (!busquedaUbicacion.trim()) {
      Alert.alert('Atención', 'Escribe una dirección');
      return;
    }

    try {
      const apiKey = "AIzaSyBB5349oJcl7zB67bVAFgZbNMZ-I_mYx4k";
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        busquedaUbicacion
      )}&key=${apiKey}&language=es&region=ar&components=country:ar`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        const direccion = data.results[0].formatted_address;
        
        setParadas([...paradas, {
          tipo: 'ubicacion',
          nombre: direccion,
          coords: { lat: location.lat, lng: location.lng },
        }]);
        
        setMostrarSeleccionParada(false);
        setMostrarOpcionesParada(false);
        setBusquedaUbicacion('');
      } else {
        Alert.alert('Error', 'No se encontró la dirección');
      }
    } catch (error) {
      console.error('Error al buscar ubicación:', error);
      Alert.alert('Error', 'No se pudo buscar la ubicación');
    }
  };

  // Eliminar parada
  const eliminarParada = (index) => {
    const nuevasParadas = paradas.filter((_, i) => i !== index);
    setParadas(nuevasParadas);
  };

  // Iniciar el recorrido
  const iniciarRecorrido = () => {
    if (!puntoPartida) {
      Alert.alert('Atención', 'Debes seleccionar un punto de partida');
      return;
    }
    if (paradas.length === 0) {
      Alert.alert('Atención', 'Debes agregar al menos una parada');
      return;
    }

    onIniciarRecorrido({ puntoPartida, paradas, modoTransporte });
    onCerrar();
  };

  // Filtrar clientes por búsqueda
  const clientesFiltrados = clientes.filter(c =>
    c.nombre?.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
    c.dni?.includes(busquedaCliente)
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Planificar recorrido</Text>
        <TouchableOpacity onPress={onCerrar} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Selector de modo de transporte */}
        <View style={styles.modoTransporteContainer}>
          <Text style={styles.modoTransporteLabel}>Modo de transporte:</Text>
          <View style={styles.modoTransporteBotones}>
            <TouchableOpacity
              style={[
                styles.modoTransporteBoton,
                modoTransporte === 'driving' && styles.modoTransporteBotonActivo
              ]}
              onPress={() => setModoTransporte('driving')}
            >
              <Text style={[
                styles.modoTransporteTexto,
                modoTransporte === 'driving' && styles.modoTransporteTextoActivo
              ]}>🚗 Vehículo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modoTransporteBoton,
                modoTransporte === 'walking' && styles.modoTransporteBotonActivo
              ]}
              onPress={() => setModoTransporte('walking')}
            >
              <Text style={[
                styles.modoTransporteTexto,
                modoTransporte === 'walking' && styles.modoTransporteTextoActivo
              ]}>🚶 Caminando</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Campo de punto de partida */}
        <View style={styles.routeContainer}>
          <View style={styles.iconColumn}>
            <View style={styles.circleIcon} />
            {paradas.length > 0 && <View style={styles.verticalLine} />}
          </View>
          
          <View style={styles.inputColumn}>
            <TouchableOpacity
              style={styles.routeInput}
              onPress={() => setMostrarSeleccionPartida(!mostrarSeleccionPartida)}
            >
              <Text style={puntoPartida ? styles.routeInputTextFilled : styles.routeInputTextPlaceholder}>
                {puntoPartida ? puntoPartida.nombre : 'Seleccionar punto de partida'}
              </Text>
            </TouchableOpacity>

            {mostrarSeleccionPartida && (
              <View style={styles.optionsDropdown}>
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={usarUbicacionActual}
                >
                  <Text style={styles.optionIcon}>📱</Text>
                  <Text style={styles.optionText}>Mi ubicación actual</Text>
                </TouchableOpacity>
                <View style={styles.dividerThin} />
                <Text style={styles.optionSubtitle}>Seleccionar cliente:</Text>
                <ScrollView style={styles.optionsScroll}>
                  {clientes.map(cliente => (
                    <TouchableOpacity
                      key={cliente.id}
                      style={styles.optionItem}
                      onPress={() => seleccionarClientePartida(cliente)}
                    >
                      <View style={[styles.clienteBadgeSmall, { backgroundColor: cliente.color }]}>
                        <Text style={styles.clienteBadgeTextSmall}>
                          {cliente.nombre?.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.clienteInfoInline}>
                        <Text style={styles.optionText}>{cliente.nombre}</Text>
                        <Text style={styles.optionSubtext}>{cliente.direccion || 'Sin dirección'}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {puntoPartida && (
            <TouchableOpacity onPress={() => setPuntoPartida(null)} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Campos de paradas */}
        {paradas.map((parada, index) => (
          <View key={index} style={styles.routeContainer}>
            <View style={styles.iconColumn}>
              <View style={styles.stopNumber}>
                <Text style={styles.stopNumberText}>{index + 1}</Text>
              </View>
              {index < paradas.length - 1 && <View style={styles.verticalLine} />}
            </View>
            
            <View style={styles.inputColumn}>
              <View style={styles.routeInput}>
                {parada.tipo === 'cliente' && (
                  <View style={[styles.clienteBadgeTiny, { backgroundColor: parada.cliente.color }]}>
                    <Text style={styles.clienteBadgeTinyText}>
                      {parada.nombre.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.paradaTextContainer}>
                  <Text style={styles.routeInputTextFilled}>{parada.nombre}</Text>
                  {parada.cliente?.direccion && (
                    <Text style={styles.paradaSubtext}>{parada.cliente.direccion}</Text>
                  )}
                </View>
              </View>
            </View>

            <TouchableOpacity onPress={() => eliminarParada(index)} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Botón agregar parada */}
        <View style={styles.addStopContainer}>
          <TouchableOpacity
            style={styles.addStopButton}
            onPress={() => setMostrarSeleccionParada(!mostrarSeleccionParada)}
          >
            <Text style={styles.addStopIcon}>+</Text>
            <Text style={styles.addStopText}>Agregar parada</Text>
          </TouchableOpacity>

          {mostrarSeleccionParada && (
            <View style={styles.optionsDropdown}>
              {/* Opciones: Cliente o Ubicación */}
              {!mostrarOpcionesParada ? (
                <>
                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() => setMostrarOpcionesParada('cliente')}
                  >
                    <Text style={styles.optionIcon}>👤</Text>
                    <Text style={styles.optionText}>Seleccionar cliente</Text>
                  </TouchableOpacity>
                  <View style={styles.dividerThin} />
                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() => setMostrarOpcionesParada('ubicacion')}
                  >
                    <Text style={styles.optionIcon}>📍</Text>
                    <Text style={styles.optionText}>Agregar ubicación</Text>
                  </TouchableOpacity>
                </>
              ) : mostrarOpcionesParada === 'cliente' ? (
                <>
                  <View style={styles.searchContainer}>
                    <TouchableOpacity 
                      onPress={() => setMostrarOpcionesParada(false)}
                      style={styles.backButton}
                    >
                      <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={styles.searchInputInline}
                      placeholder="Buscar cliente..."
                      value={busquedaCliente}
                      onChangeText={setBusquedaCliente}
                    />
                  </View>
                  <ScrollView style={styles.optionsScroll}>
                    {clientesFiltrados.map(cliente => (
                      <TouchableOpacity
                        key={cliente.id}
                        style={styles.optionItem}
                        onPress={() => agregarParadaCliente(cliente)}
                      >
                        <View style={[styles.clienteBadgeSmall, { backgroundColor: cliente.color }]}>
                          <Text style={styles.clienteBadgeTextSmall}>
                            {cliente.nombre?.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.clienteInfoInline}>
                          <Text style={styles.optionText}>{cliente.nombre}</Text>
                          <Text style={styles.optionSubtext}>DNI: {cliente.dni}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              ) : (
                <>
                  <View style={styles.searchContainer}>
                    <TouchableOpacity 
                      onPress={() => setMostrarOpcionesParada(false)}
                      style={styles.backButton}
                    >
                      <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={styles.searchInputInline}
                      placeholder="Escribe una dirección..."
                      value={busquedaUbicacion}
                      onChangeText={setBusquedaUbicacion}
                      onSubmitEditing={agregarParadaUbicacion}
                      returnKeyType="search"
                    />
                  </View>
                  <TouchableOpacity 
                    style={styles.searchButton}
                    onPress={agregarParadaUbicacion}
                  >
                    <Text style={styles.searchButtonText}>🔍 Buscar ubicación</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Botón iniciar */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.startButton} onPress={iniciarRecorrido}>
          <Text style={styles.startButtonText}>🚀 Iniciar recorrido</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  closeText: {
    fontSize: 24,
    color: '#999',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  modoTransporteContainer: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modoTransporteLabel: {
    fontSize: 14,
    color: '#5F6368',
    marginBottom: 10,
    fontWeight: '600',
  },
  modoTransporteBotones: {
    flexDirection: 'row',
    gap: 10,
  },
  modoTransporteBoton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  modoTransporteBotonActivo: {
    borderColor: '#4285F4',
    backgroundColor: '#E8F0FE',
  },
  modoTransporteTexto: {
    fontSize: 14,
    color: '#5F6368',
    fontWeight: '600',
  },
  modoTransporteTextoActivo: {
    color: '#4285F4',
  },
  routeContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  iconColumn: {
    width: 40,
    alignItems: 'center',
    paddingTop: 12,
  },
  circleIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#5F6368',
    marginBottom: 4,
  },
  stopNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stopNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  verticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 4,
    minHeight: 20,
  },
  inputColumn: {
    flex: 1,
    marginRight: 10,
  },
  routeInput: {
    backgroundColor: '#F1F3F4',
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  routeInputTextPlaceholder: {
    fontSize: 15,
    color: '#5F6368',
  },
  routeInputTextFilled: {
    fontSize: 15,
    color: '#202124',
    fontWeight: '500',
  },
  clearButton: {
    padding: 12,
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: 20,
    color: '#5F6368',
  },
  optionsDropdown: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    maxHeight: 300,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  optionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  optionText: {
    fontSize: 15,
    color: '#202124',
    fontWeight: '500',
  },
  optionSubtext: {
    fontSize: 13,
    color: '#5F6368',
    marginTop: 2,
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#5F6368',
    padding: 12,
    fontWeight: '600',
    backgroundColor: '#F8F9FA',
  },
  optionsScroll: {
    maxHeight: 200,
  },
  dividerThin: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  clienteBadgeSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clienteBadgeTextSmall: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  clienteBadgeTiny: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  clienteBadgeTinyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  clienteInfoInline: {
    flex: 1,
  },
  paradaTextContainer: {
    flex: 1,
  },
  paradaSubtext: {
    fontSize: 12,
    color: '#5F6368',
    marginTop: 2,
  },
  addStopContainer: {
    marginTop: 10,
  },
  addStopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F1F3F4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  addStopIcon: {
    fontSize: 20,
    color: '#4285F4',
    marginRight: 8,
    fontWeight: 'bold',
  },
  addStopText: {
    fontSize: 15,
    color: '#4285F4',
    fontWeight: '500',
  },
  searchInputInline: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    fontSize: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 12,
  },
  backButtonText: {
    fontSize: 24,
    color: '#4285F4',
  },
  searchButton: {
    padding: 15,
    backgroundColor: '#F1F3F4',
    alignItems: 'center',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  searchButtonText: {
    fontSize: 15,
    color: '#4285F4',
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 4,
  },
  startButton: {
    backgroundColor: '#4285F4',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
