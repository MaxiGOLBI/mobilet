# AppTerreno

Este proyecto es una aplicación de React Native que utiliza `react-native-maps` y `expo-location` para mostrar un mapa con la ubicación actual del usuario.

## Requisitos previos

Antes de comenzar, asegúrate de tener instalado lo siguiente:

- [Node.js](https://nodejs.org/) (versión LTS recomendada)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (instalado globalmente con `npm install -g expo-cli`)
- Un emulador de Android/iOS o un dispositivo físico con la aplicación **Expo Go** instalada.

## Pasos para levantar el proyecto

1. **Clonar el repositorio**

   Clona este repositorio en tu máquina local:

2. **Navegar al directorio del proyecto**

   Ve al directorio del proyecto clonado:

   ```bash
   cd AppTerreno
   ```

3. **Instalar las dependencias**

   Instala los paquetes necesarios ejecutando:

   ```bash
   npm install --legacy-peer-deps
   ```

   O configura npm para usar `--legacy-peer-deps` por defecto:

   ```bash
   npm config set legacy-peer-deps true
   npm install
   ```

   Esto instalará todas las dependencias listadas en el archivo `package.json`.

4. **Levantar el servidor de desarrollo**

   Inicia el servidor de desarrollo de Expo:

   ```bash
   npx expo start
   ```

5. **Probar la aplicación**

   - Escanea el código QR que aparece en la terminal o en la interfaz web de Expo con la aplicación **Expo Go** en tu dispositivo físico.
   - Si estás usando un emulador, selecciona la opción correspondiente en la interfaz de Expo para abrir la aplicación en el emulador.

   También puedes usar:
   ```bash
   npx expo start --android  # Para Android
   npx expo start --ios      # Para iOS
   ```

## Notas importantes

- Si estás probando en un emulador, asegúrate de configurar una ubicación simulada para que el mapa pueda mostrar una ubicación válida.
- Si estás probando en un dispositivo físico, asegúrate de habilitar los permisos de ubicación para la aplicación **Expo Go**.

## Dependencias principales

- **expo-location**: Para obtener la ubicación del usuario.
- **react-native-maps**: Para mostrar mapas interactivos.
