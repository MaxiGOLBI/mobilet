import { FirestoreService } from './firestore.service';
import { COLLECTIONS } from './collections';

// Servicio específico para usuarios
export class UsersService extends FirestoreService {
  constructor() {
    super(COLLECTIONS.USERS);
  }

  // Métodos específicos para usuarios
  async getUserByEmail(email) {
    const users = await this.query([where('email', '==', email)]);
    return users[0] || null;
  }
}

// Servicio específico para ubicaciones
export class LocationsService extends FirestoreService {
  constructor() {
    super(COLLECTIONS.LOCATIONS);
  }

  // Métodos específicos para ubicaciones
  async getLocationsByUserId(userId) {
    return await this.query([where('userId', '==', userId)]);
  }

  async addLocation(userId, latitude, longitude) {
    return await this.create({
      userId,
      latitude,
      longitude,
      timestamp: new Date(),
    });
  }
}

// Servicio específico para clientes
export class ClientsService extends FirestoreService {
  constructor() {
    super(COLLECTIONS.CLIENTS);
  }

  // Métodos específicos para clientes
  async getClientsBySellerId(sellerId) {
    return await this.query([where('sellerId', '==', sellerId)]);
  }
}

// Servicio específico para ventas
export class SalesService extends FirestoreService {
  constructor() {
    super(COLLECTIONS.SALES);
  }

  // Métodos específicos para ventas
  async getSalesBySellerId(sellerId) {
    return await this.query([where('sellerId', '==', sellerId)]);
  }

  async getSalesByClientId(clientId) {
    return await this.query([where('clientId', '==', clientId)]);
  }
}