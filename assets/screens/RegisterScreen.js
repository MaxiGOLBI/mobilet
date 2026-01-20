import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Image, Keyboard, TouchableWithoutFeedback, ActivityIndicator, ScrollView } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function RegisterScreen({ onSwitch, userImage }) {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    try {
      setError('');
      setLoading(true);

      // Validaciones
      if (!formData.nombre.trim() || !formData.apellido.trim()) {
        setError('Por favor ingresa tu nombre y apellido');
        return;
      }

      if (!formData.email || !formData.password) {
        setError('Por favor completa todos los campos obligatorios');
        return;
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Por favor ingresa un correo electrónico válido');
        return;
      }

      // Validar longitud de contraseña
      if (formData.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return;
      }

      // Validar que las contraseñas coincidan
      if (formData.password !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }

      // Validar teléfono si se proporciona
      if (formData.telefono && formData.telefono.length < 10) {
        setError('Por favor ingresa un número de teléfono válido');
        return;
      }

      const cleanEmail = formData.email.trim().toLowerCase();
      
      console.log('Intentando registrar usuario:', cleanEmail);

      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        cleanEmail, 
        formData.password.trim()
      );

      // Crear perfil del usuario en Firestore
      await setDoc(doc(db, 'usuarios', userCredential.user.uid), {
        uid: userCredential.user.uid,
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        email: cleanEmail,
        telefono: formData.telefono.trim() || '',
        rol: 'vendedor', // Por defecto es vendedor/repartidor
        activo: true,
        fechaRegistro: serverTimestamp(),
        ultimaConexion: serverTimestamp()
      });

      console.log('✅ Usuario registrado exitosamente');
      setError('');
      
    } catch (error) {
      let errorMessage = 'Error al registrar usuario';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Este correo ya está registrado. ¿Deseas iniciar sesión?';
          setTimeout(() => {
            onSwitch();
          }, 2000);
          break;
        case 'auth/invalid-email':
          errorMessage = 'El formato del correo electrónico no es válido';
          break;
        case 'auth/weak-password':
          errorMessage = 'La contraseña es muy débil. Usa al menos 6 caracteres';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Error de conexión. Verifica tu conexión a internet';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'El registro está deshabilitado. Contacta al administrador';
          break;
        default:
          errorMessage = `Error: ${error.message}`;
      }
      
      setError(errorMessage);
      console.error('Error en registro:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.form}>
          <Image source={userImage} style={styles.userImage} />
          <Text style={styles.title}>Registrarse</Text>
          <Text style={styles.subtitle}>Crear cuenta de vendedor/repartidor</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Nombre *"
            value={formData.nombre}
            onChangeText={(value) => updateField('nombre', value)}
            autoCapitalize="words"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Apellido *"
            value={formData.apellido}
            onChangeText={(value) => updateField('apellido', value)}
            autoCapitalize="words"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Correo electrónico *"
            value={formData.email}
            onChangeText={(value) => updateField('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Teléfono (opcional)"
            value={formData.telefono}
            onChangeText={(value) => updateField('telefono', value)}
            keyboardType="phone-pad"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Contraseña *"
            value={formData.password}
            onChangeText={(value) => updateField('password', value)}
            secureTextEntry
            textContentType="oneTimeCode"
            autoComplete="off"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Confirmar contraseña *"
            value={formData.confirmPassword}
            onChangeText={(value) => updateField('confirmPassword', value)}
            secureTextEntry
            textContentType="oneTimeCode"
            autoComplete="off"
          />
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleRegister} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Registrarse</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity onPress={onSwitch}>
            <Text style={styles.switchText}>¿Ya tienes cuenta? Iniciar sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
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
    marginBottom: 8,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    height: 48,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: '#28a745',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
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
    fontSize: 14,
  },
});
