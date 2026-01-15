// Definición de las colecciones de Firestore
export const COLLECTIONS = {
  USERS: 'users',
  LOCATIONS: 'locations',
  CLIENTS: 'clients',
  SALES: 'sales',
};

// Estructura de cada colección
export const COLLECTION_STRUCTURE = {
  users: {
    id: 'string',
    email: 'string',
    name: 'string',
    role: 'string', // 'admin' | 'seller'
    createdAt: 'timestamp',
    updatedAt: 'timestamp',
  },
  locations: {
    id: 'string',
    userId: 'string',
    latitude: 'number',
    longitude: 'number',
    timestamp: 'timestamp',
  },
  clients: {
    id: 'string',
    name: 'string',
    phone: 'string',
    address: 'string',
    location: {
      latitude: 'number',
      longitude: 'number',
    },
    sellerId: 'string',
    createdAt: 'timestamp',
    updatedAt: 'timestamp',
  },
  sales: {
    id: 'string',
    clientId: 'string',
    sellerId: 'string',
    amount: 'number',
    products: 'array',
    location: {
      latitude: 'number',
      longitude: 'number',
    },
    timestamp: 'timestamp',
  },
};