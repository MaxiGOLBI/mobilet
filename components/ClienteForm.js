import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import { db } from "../firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Colores predefinidos para asignar a clientes (se usa al generar marcador)
const colores = ["#007bff", "#28a745", "#ffc107", "#dc3545", "#6f42c1", "#fd7e14"];

export default function ClienteForm({
  usuarioId = "u123",      // ID del usuario asignado al cliente
  ubicacion,               // Lat/Lng seleccionada en el mapa
  onCerrar,                // Función para cerrar el formulario
  onClienteCreado,         // Función para notificar al componente padre que se creó un cliente
}) {
  // Estados para los campos del formulario
  const [nombre, setNombre] = useState("");
  const [dni, setDni] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [producto, setProducto] = useState("");

  // Función que se ejecuta al presionar "Guardar Cliente"
  const handleSubmit = async () => {
    // Validación: todos los campos y ubicación son obligatorios
    if (!nombre || !dni || !telefono || !direccion || !producto || !ubicacion) {
      Alert.alert("Error", "Completa todos los campos y selecciona una ubicación");
      return;
    }

    // Validar longitud del DNI (mínimo 7, máximo 8)
    if (dni.length < 7 || dni.length > 8) {
      Alert.alert("Error", "El DNI debe tener entre 7 y 8 dígitos");
      return;
    }

    try {
      // Crear objeto cliente con los datos del formulario
      const clienteDoc = {
        nombre,
        dni,
        telefono,
        direccion,
        producto,
        ubicacion: { lat: ubicacion.lat, lng: ubicacion.lng }, // lat/lng seleccionada
        fecha_registro: serverTimestamp(), // fecha de creación automática
        asignado_a: usuarioId,             // usuario asignado
      };

      // Guardar el cliente en Firestore
      const docRef = await addDoc(collection(db, "clientes"), clienteDoc);

      // Agregar color aleatorio para el marcador
      const clienteConColor = {
        id: docRef.id,
        ...clienteDoc,
        color: colores[Math.floor(Math.random() * colores.length)],
      };

      // Notificar al componente padre que se creó un cliente
      if (onClienteCreado) onClienteCreado(clienteConColor);

      Alert.alert("Éxito", "Cliente registrado correctamente");

      // Limpiar campos del formulario
      setNombre("");
      setDni("");
      setTelefono("");
      setDireccion("");
      setProducto("");

      // Cerrar formulario si existe la función
      if (onCerrar) onCerrar();
    } catch (error) {
      console.error("Error al guardar cliente: ", error);
      Alert.alert("Error", "No se pudo registrar el cliente");
    }
  };

  return (
    // KeyboardAvoidingView para evitar que el teclado tape los inputs
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.flexContainer}
    >
      {/* ScrollView para permitir desplazamiento si hay muchos campos */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.title}>Registrar Cliente</Text>

          {/* Inputs para los campos del formulario */}
          <TextInput
            placeholder="Nombre completo *"
            value={nombre}
            onChangeText={setNombre}
            style={styles.input}
          />
          <TextInput
            placeholder="DNI *"
            value={dni}
            onChangeText={(text) => {
              // Permitir solo números y máximo 8 dígitos
              const numericText = text.replace(/[^0-9]/g, '');
              if (numericText.length <= 8) {
                setDni(numericText);
              }
            }}
            keyboardType="numeric"
            maxLength={8}
            style={styles.input}
          />
          <TextInput
            placeholder="Teléfono *"
            value={telefono}
            onChangeText={(text) => {
              // Permitir solo números y máximo 10 dígitos
              const numericText = text.replace(/[^0-9]/g, '');
              if (numericText.length <= 10) {
                setTelefono(numericText);
              }
            }}
            keyboardType="phone-pad"
            maxLength={10}
            style={styles.input}
          />
          <TextInput
            placeholder="Referencias del domicilio"
            value={direccion}
            onChangeText={setDireccion}
            style={styles.input}
          />

          {/* Selección de producto */}
          <Text style={styles.label}>Producto de interés *</Text>
          <View style={styles.productoContainer}>
            {["Fibra Claro", "Fibra Movistar", "ADT"].map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.productoButton,
                  producto === item && styles.productoButtonActivo,
                ]}
                onPress={() => setProducto(item)}
              >
                <Text
                  style={[
                    styles.productoText,
                    producto === item && styles.productoTextActivo,
                  ]}
                  numberOfLines={1}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Mostrar ubicación seleccionada en el mapa */}
          {ubicacion && (
            <View style={styles.ubicacionContainer}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                <Text style={{ marginRight: 5, fontSize: 18 }}>📍</Text>
                <Text style={styles.ubicacionLabel}>Ubicación seleccionada:</Text>
              </View>
              <Text style={styles.ubicacionTexto}>Lat: {ubicacion.lat.toFixed(6)}</Text>
              <Text style={styles.ubicacionTexto}>Lng: {ubicacion.lng.toFixed(6)}</Text>
            </View>
          )}

          {/* Botones de acción: Guardar o Cancelar */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSubmit}
            >
              <Text style={styles.buttonText}>Guardar Cliente</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCerrar}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Obtener ancho de la pantalla para estilos responsivos
const { width } = Dimensions.get("window");

// Estilos del formulario
const styles = StyleSheet.create({
  flexContainer: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: "flex-start", paddingTop: 10 },
  container: {
    width: width * 0.85,
    alignSelf: "center",
    padding: 15,
    backgroundColor: "transparent",
    borderRadius: 15,
    marginBottom: 15,
  },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 12, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    marginVertical: 6,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  label: { fontSize: 15, fontWeight: "bold", marginTop: 12, marginBottom: 6 },
  productoContainer: { flexDirection: "row", justifyContent: "flex-start", marginTop: 5 },
  productoButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: "#ebebeb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  productoButtonActivo: { backgroundColor: "#007bff" },
  productoText: { fontWeight: "bold", color: "#000", textAlign: "center", flexWrap: "nowrap" },
  productoTextActivo: { fontWeight: "bold", color: "#fff" },
  ubicacionContainer: { flexDirection: "column", alignItems: "flex-start", marginTop: 8 },
  ubicacionLabel: { fontWeight: "bold" },
  ubicacionTexto: { fontStyle: "italic", fontWeight: "bold", textAlign: "left" },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  button: { flex: 0.48, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  saveButton: { backgroundColor: "#007bff" },
  cancelButton: { backgroundColor: "#dc3545" },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});