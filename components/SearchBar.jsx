// Componente de barra de búsqueda de direcciones usando Google Places Autocomplete.
// Permite escribir, ver sugerencias y, al elegir o presionar Enter, obtener coordenadas
// para recentrar el mapa en el contenedor padre.
import React, { useRef } from "react";
import { Platform, View } from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";

// Barra de búsqueda para direcciones. Devuelve { latitude, longitude } al padre.
// onPlaceSelected: función que recibe { latitude, longitude }
export default function SearchBar({ onPlaceSelected } = {}) {
  // Referencia al componente para leer el texto actual cuando se presiona Enter
  const placesRef = useRef(null);
  return (
    // Contenedor absoluto sobre el mapa. zIndex alto para que la lista quede por encima
    <View style={{ flex: 1, zIndex: 1, pointerEvents: "box-none" }}>
      <GooglePlacesAutocomplete
        // Placeholder del input
        placeholder="Buscar dirección..."
        // Evita errores internos cuando la lib intenta filtrar lugares predefinidos
        predefinedPlaces={[]}
        // Pide detalles del lugar para obtener geometry (lat,lng)
        fetchDetails={true}
        // Timeout explícito para evitar valores undefined en nativo (Hermes)
        timeout={15000}
        // Ref para leer el texto al presionar Enter
        ref={placesRef}
        // Configuraciones UX de entrada
        minLength={1}
        debounce={200}
        enablePoweredByContainer={false}
        keyboardShouldPersistTaps="always"
        textInputProps={{
          returnKeyType: "search",
          onSubmitEditing: async () => {
            try {
              // Geocodifica el texto actual cuando el usuario presiona Enter
              const query = placesRef.current?.getAddressText?.() || "";
              if (!query.trim()) return;
              const key = "AIzaSyBB5349oJcl7zB67bVAFgZbNMZ-I_mYx4k"; // API Key del dashboard
              const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
                query
              )}&key=${key}&language=es&region=ar&components=country:ar`;
              const res = await fetch(url);
              const json = await res.json();
              const first = json?.results?.[0];
              const loc = first?.geometry?.location;
              if (loc) {
                onPlaceSelected?.({ latitude: loc.lat, longitude: loc.lng });
              }
            } catch (e) {
              // Silencia fallos de red/geocoding para no romper la UX
            }
          },
        }}
        onPress={(data, details = null) => {
          // Al elegir una sugerencia, obtener geometry
          if (!details || !details.geometry) return;
          const { lat, lng } = details.geometry.location;
          onPlaceSelected && onPlaceSelected({ latitude: lat, longitude: lng });
        }}
        GooglePlacesDetailsQuery={{
          // Pedir geometry con máxima precisión
          fields: ["geometry", "formatted_address"],
        }}
        query={{
          // Clave con API de Places/Geocoding habilitadas
          key: "AIzaSyBB5349oJcl7zB67bVAFgZbNMZ-I_mYx4k", // API Key del dashboard
          language: "es",
          // Bias de búsqueda hacia Argentina (Córdoba)
          location: "-31.4, -64.2",
          radius: 50000, // 50km de radio
          // Componentes para restringir a Argentina
          components: "country:ar",
          // Tipos de lugares más precisos
          types: "address",
        }}
        styles={{
          // Capa absoluta arriba; la anchura del input la definimos en textInputContainer
          container: {
            position: "absolute",
            top: Platform.OS === "ios" ? 100 : 90,
            left: "-50%",
            right: 0,
            width: "100%",
            zIndex: 10,
          },
          // El contenedor del input ocupa el 90% del ancho y queda centrado
          textInputContainer: {
            width: "90%",
            alignSelf: "center",
            borderRadius: 8,
            overflow: "hidden",
          },
          // Input con altura cómoda
          textInput: {
            height: 44,
            fontSize: 16,
            backgroundColor: "#fff",
            borderRadius: 8,
            paddingHorizontal: 12,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 4,
            elevation: 2,
          },
          // Lista de sugerencias a 90% y centrada también
          listView: {
            backgroundColor: "white",
            zIndex: 1000,
            elevation: 3,
            width: "90%",
            alignSelf: "center",
            marginTop: 4,
            borderRadius: 8,
            overflow: "hidden",
          },
        }}
      />
    </View>
  );
}