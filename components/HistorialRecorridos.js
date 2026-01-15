import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function HistorialRecorridos({ onCerrar, onVerRecorrido }) {
  const [recorridos, setRecorridos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'recorridos'),
      orderBy('fechaInicio', 'desc'),
      limit(200)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRecorridos(lista);
      setCargando(false);
    });

    return () => unsubscribe();
  }, []);

  const formatearFecha = (timestamp) => {
    if (!timestamp) return '';
    const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return fecha.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEstadoRecorrido = (recorrido) => {
    if (recorrido.finalizado) {
      return { texto: 'Completado', color: '#28a745', icon: '✓' };
    }
    return { texto: 'En progreso', color: '#ffc107', icon: '⟳' };
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial de recorridos</Text>
        <TouchableOpacity onPress={onCerrar} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      {cargando ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4285F4" />
          <Text style={styles.loadingText}>Cargando historial...</Text>
        </View>
      ) : recorridos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📍</Text>
          <Text style={styles.emptyTitle}>No hay recorridos</Text>
          <Text style={styles.emptyText}>
            Los recorridos que inicies aparecerán aquí
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={true}
          bounces={true}
        >
          {recorridos.map((recorrido) => {
            const estado = getEstadoRecorrido(recorrido);
            return (
              <TouchableOpacity
                key={recorrido.id}
                style={styles.recorridoCard}
                onPress={() => onVerRecorrido(recorrido)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>
                      {recorrido.paradas?.length || 0} parada{recorrido.paradas?.length !== 1 ? 's' : ''}
                    </Text>
                    <View style={[styles.estadoBadge, { backgroundColor: estado.color }]}>
                      <Text style={styles.estadoBadgeText}>
                        {estado.icon} {estado.texto}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.cardFecha}>
                    {formatearFecha(recorrido.fechaInicio)}
                  </Text>
                </View>

                <View style={styles.cardBody}>
                  {/* Punto de partida */}
                  <View style={styles.puntoRow}>
                    <View style={styles.puntoIconContainer}>
                      <View style={styles.puntoIconCirculo} />
                    </View>
                    <View style={styles.puntoInfo}>
                      <Text style={styles.puntoLabel}>Partida</Text>
                      <Text style={styles.puntoTexto} numberOfLines={1}>
                        {recorrido.puntoPartida?.nombre || 'Sin nombre'}
                      </Text>
                    </View>
                  </View>

                  {/* Línea conectora */}
                  {recorrido.paradas && recorrido.paradas.length > 0 && (
                    <View style={styles.lineaConectora} />
                  )}

                  {/* Paradas */}
                  {recorrido.paradas && recorrido.paradas.length > 0 && (
                    <View style={styles.paradasContainer}>
                      <Text style={styles.paradasLabel}>
                        {recorrido.paradas.length} parada{recorrido.paradas.length !== 1 ? 's' : ''}
                      </Text>
                      {recorrido.paradas.slice(0, 2).map((parada, index) => (
                        <Text key={index} style={styles.paradaItem} numberOfLines={1}>
                          {index + 1}. {parada.nombre}
                        </Text>
                      ))}
                      {recorrido.paradas.length > 2 && (
                        <Text style={styles.paradaMas}>
                          +{recorrido.paradas.length - 2} más
                        </Text>
                      )}
                    </View>
                  )}
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.verDetalles}>Ver detalles →</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#5F6368',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#5F6368',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  recorridoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  cardHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#202124',
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: 'bold',
  },
  cardFecha: {
    fontSize: 13,
    color: '#5F6368',
  },
  cardBody: {
    padding: 15,
  },
  puntoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  puntoIconContainer: {
    width: 30,
    alignItems: 'center',
    marginRight: 10,
  },
  puntoIconCirculo: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#5F6368',
  },
  puntoInfo: {
    flex: 1,
  },
  puntoLabel: {
    fontSize: 11,
    color: '#5F6368',
    marginBottom: 2,
  },
  puntoTexto: {
    fontSize: 14,
    color: '#202124',
    fontWeight: '500',
  },
  lineaConectora: {
    width: 2,
    height: 20,
    backgroundColor: '#E0E0E0',
    marginLeft: 14,
    marginVertical: 5,
  },
  paradasContainer: {
    marginLeft: 30,
    marginTop: 5,
  },
  paradasLabel: {
    fontSize: 11,
    color: '#5F6368',
    marginBottom: 5,
    fontWeight: '600',
  },
  paradaItem: {
    fontSize: 13,
    color: '#202124',
    marginBottom: 3,
  },
  paradaMas: {
    fontSize: 12,
    color: '#4285F4',
    fontWeight: '600',
    marginTop: 2,
  },
  cardFooter: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F4',
    alignItems: 'flex-end',
  },
  verDetalles: {
    fontSize: 14,
    color: '#4285F4',
    fontWeight: '600',
  },
});
