import { UsersService, LocationsService, ClientsService, SalesService } from './services';

// Exportar instancias de los servicios
export const usersService = new UsersService();
export const locationsService = new LocationsService();
export const clientsService = new ClientsService();
export const salesService = new SalesService();

// Exportar todas las colecciones y servicios
export * from './collections';
export * from './services';