import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Image, Keyboard, TouchableWithoutFeedback, ActivityIndicator } from 'react-native';
import { auth } from '../../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';


export default function LoginScreen({ userImage }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleLogin = async () => {
    try {
      setError('');
      setLoading(true);

      // Validaciones básicas
      if (!email || !password) {
        setError('Por favor ingresa email y contraseña');
        return;
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Por favor ingresa un correo electrónico válido');
        return;
      }

      // Validar longitud mínima de contraseña
      if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return;
      }

      // Limpiar el email y convertir a minúsculas
      const cleanEmail = email.trim().toLowerCase();
      
      console.log('Intentando iniciar sesión con:', cleanEmail); // Para depuración

      // Intentar inicio de sesión
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password.trim());
      
      if (!userCredential.user) {
        throw new Error('No se pudo obtener la información del usuario');
      }
      
      setError(''); // Limpiar cualquier error previo
      
    } catch (error) {
      let errorMessage = 'Error al iniciar sesión';
      
      // Mensajes de error más amigables y específicos
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'El formato del correo electrónico no es válido';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Esta cuenta ha sido deshabilitada. Por favor, contacta al soporte';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No existe una cuenta con este correo. Contacta al administrador para obtener acceso';
          break;
        case 'auth/wrong-password':
          errorMessage = 'La contraseña es incorrecta. Por favor verifica e intenta nuevamente';
          break;
        case 'auth/invalid-credential':
          errorMessage = '❌ Datos incorrectos. Por favor verifica tu email y contraseña';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos fallidos. Por favor, intenta más tarde';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Error de conexión. Verifica tu conexión a internet';
          break;
        default:
          errorMessage = 'Error al iniciar sesión. Por favor, intenta nuevamente';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.form}>
        <Image source={userImage} style={styles.userImage} />
        <Text style={styles.title}>Iniciar Sesión</Text>
        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="oneTimeCode"
          autoComplete="off"
          passwordRules="none"
          spellCheck={false}
          autoCorrect={false}
          keyboardType="default"
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleLogin} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  form: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    alignSelf: 'center',
    marginTop: 40,
  },
  userImage: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    height: 48,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  switchText: {
    color: '#007bff',
    textAlign: 'center',
    marginTop: 8,
    textDecorationLine: 'underline',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
});
