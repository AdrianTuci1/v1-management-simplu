import Dexie from 'dexie';

// Configurare IndexedDB cu Dexie
class AppDatabase extends Dexie {
  constructor() {
    super('AppDB');
    
    // Versiunea bazei de date
    this.version(1).stores({
      clients: 'id',
      timeline: 'id',
      packages: 'id',
      members: 'id',
      appointments: 'id, date, doctor, patient, status', // Store pentru programări
      appointmentCounts: 'date, count', // Cache pentru numărul de programări
      patients: 'id, name, email, phone, status, city, county', // Store pentru pacienți
      products: 'id, name, category, price, stock, reorderLevel', // Store pentru produse
      productCounts: 'category, count', // Cache pentru numărul de produse per categorie
      users: 'id, email, licenseNumber, specialization, status, role', // Store pentru utilizatori (medici)
      roles: 'id, name, description, status', // Store pentru roluri
      permissions: 'id, resource, action, description' // Store pentru permisiuni
    });
  }
}

// Instanță globală a bazei de date
export const db = new AppDatabase();

// Wrapper pentru compatibilitate cu codul existent
export const indexedDb = {
  async put(storeName, value) {
    try {
      // Verifică dacă store-ul există
      if (!db.table(storeName)) {
        console.warn(`Store ${storeName} does not exist`);
        return;
      }
      return db.table(storeName).put(value);
    } catch (error) {
      console.warn(`Failed to put to ${storeName}:`, error);
    }
  },
  
  async bulkPut(storeName, values) {
    try {
      // Verifică dacă store-ul există
      if (!db.table(storeName)) {
        console.warn(`Store ${storeName} does not exist`);
        return;
      }
      return db.table(storeName).bulkPut(values);
    } catch (error) {
      console.warn(`Failed to bulkPut to ${storeName}:`, error);
    }
  },
  
  async get(storeName, key) {
    return db.table(storeName).get(key);
  },
  
  async getAll(storeName) {
    return db.table(storeName).toArray();
  },
  
  async delete(storeName, key) {
    return db.table(storeName).delete(key);
  },
  
  async clear(storeName) {
    return db.table(storeName).clear();
  },
  
  // Metode specifice pentru programări
  async getAppointmentsByDate(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return db.appointments
      .where('date')
      .between(startOfDay.toISOString(), endOfDay.toISOString())
      .toArray();
  },
  
  async getAppointmentsByDateRange(startDate, endDate) {
    return db.appointments
      .where('date')
      .between(startDate.toISOString(), endDate.toISOString())
      .toArray();
  },
  
  async getAppointmentCount(date) {
    const dateKey = date.toISOString().split('T')[0];
    const cached = await db.appointmentCounts.get(dateKey);
    return cached ? cached.count : 0;
  },
  
  async setAppointmentCount(date, count) {
    const dateKey = date.toISOString().split('T')[0];
    return db.appointmentCounts.put({ date: dateKey, count });
  },
  
  async clearAppointmentCounts() {
    return db.appointmentCounts.clear();
  },
  
  // Metode specifice pentru pacienți
  async getPatientsByStatus(status) {
    return db.patients
      .where('status')
      .equals(status)
      .toArray();
  },
  
  async searchPatients(searchTerm) {
    const term = searchTerm.toLowerCase();
    return db.patients
      .filter(patient => 
        patient.name.toLowerCase().includes(term) ||
        patient.email.toLowerCase().includes(term) ||
        (patient.phone && patient.phone.includes(term)) ||
        (patient.cnp && patient.cnp.includes(term))
      )
      .toArray();
  },
  
  async getPatientsByCity(city) {
    return db.patients
      .where('city')
      .equals(city)
      .toArray();
  },
  
  async count(storeName) {
    return db.table(storeName).count();
  },
  
  // Metode specifice pentru produse
  async getProductsByCategory(category) {
    return db.products
      .where('category')
      .equals(category)
      .toArray();
  },
  
  async getLowStockProducts() {
    return db.products
      .filter(product => product.stock <= product.reorderLevel)
      .toArray();
  },
  
  async searchProducts(searchTerm) {
    const term = searchTerm.toLowerCase();
    return db.products
      .filter(product => 
        product.name.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term)
      )
      .toArray();
  },
  
  async getProductCount(category) {
    const cached = await db.productCounts.get(category);
    return cached ? cached.count : 0;
  },
  
  async setProductCount(category, count) {
    return db.productCounts.put({ category, count });
  },
  
  async clearProductCounts() {
    return db.productCounts.clear();
  },
  
  // Metode specifice pentru utilizatori (medici)
  async getUsersByStatus(status) {
    return db.users
      .where('status')
      .equals(status)
      .toArray();
  },
  
  async getUsersBySpecialization(specialization) {
    return db.users
      .where('specialization')
      .equals(specialization)
      .toArray();
  },
  
  async searchUsers(searchTerm) {
    const term = searchTerm.toLowerCase();
    return db.users
      .filter(user => 
        user.firstName?.toLowerCase().includes(term) ||
        user.lastName?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.specialization?.toLowerCase().includes(term) ||
        user.licenseNumber?.toLowerCase().includes(term)
      )
      .toArray();
  },
  
  async getUserByEmail(email) {
    return db.users
      .where('email')
      .equals(email.toLowerCase())
      .first();
  },
  
  async getUserByLicense(licenseNumber) {
    return db.users
      .where('licenseNumber')
      .equals(licenseNumber)
      .first();
  },
  
  async getUsersByRole(role) {
    return db.users
      .where('role')
      .equals(role)
      .toArray();
  },
  
  // Metode specifice pentru roluri
  async getRolesByStatus(status) {
    return db.roles
      .where('status')
      .equals(status)
      .toArray();
  },
  
  async searchRoles(searchTerm) {
    const term = searchTerm.toLowerCase();
    return db.roles
      .filter(role => 
        role.name.toLowerCase().includes(term) ||
        role.description.toLowerCase().includes(term)
      )
      .toArray();
  },
  
  async getRoleByName(name) {
    return db.roles
      .where('name')
      .equals(name)
      .first();
  },
  
  // Metode specifice pentru permisiuni
  async getPermissionsByResource(resource) {
    return db.permissions
      .where('resource')
      .equals(resource)
      .toArray();
  },
  
  async getPermissionsByAction(action) {
    return db.permissions
      .where('action')
      .equals(action)
      .toArray();
  },
  
  async searchPermissions(searchTerm) {
    const term = searchTerm.toLowerCase();
    return db.permissions
      .filter(permission => 
        permission.resource.toLowerCase().includes(term) ||
        permission.action.toLowerCase().includes(term) ||
        permission.description.toLowerCase().includes(term)
      )
      .toArray();
  },
  
  async getPermissionByResourceAndAction(resource, action) {
    return db.permissions
      .filter(permission => 
        permission.resource === resource && permission.action === action
      )
      .first();
  }
};


