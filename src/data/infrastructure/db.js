import Dexie from 'dexie';

// Configurare IndexedDB cu Dexie
class AppDatabase extends Dexie {
  constructor() {
    super('AppDB');
    
    // Current database version - Clean schema with only essential stores
    this.version(1).stores({
      // Keep core business stores
      appointment: 'resourceId, date, doctor, patient, status',
      patient: 'resourceId, patientName, email, phone, status, city, county',
      product: 'resourceId, name, category, price, stock, reorderLevel',
      user: 'resourceId, email, licenseNumber, specialization, status, role, medicName',
      sale: 'resourceId, date, amount, status, customerId',
      role: 'resourceId, name, description, status',
      permission: 'resourceId, resource, action, description',
      treatment: 'resourceId, treatmentType, category, duration, price',
      statistics: 'id, timestamp',
      report: 'resourceId, date, status',
      setting: 'resourceId, settingType, value, status',
      
      // Invoice stores
      invoice: 'resourceId, invoiceNumber, clientName, issueDate, dueDate, status, total',
      'invoice-clients': 'resourceId, clientName, clientCUI, clientCNP, clientEmail, clientType',

      // Keep technical stores
      appointmentCounts: 'date, count',
      productCounts: 'category, count',
      outbox: '++id, tempId, resourceType, operation, createdAt, status',
      idMap: 'tempId, permId, resourceType',
      queue: '++seq, createdAt, status, resourceType, action, tempId',
      meta: 'key',

      // Keep only drafts, remove all other deprecated collections
      drafts: '++id, sessionId, resourceType, data, timestamp, status, parentId'
      
      // REMOVED COLLECTIONS:
      // - sessions (removed)
      // - sessionOperations (removed)
      // - agentSessions (removed)
      // - agentCommands (removed)
      // - agentQueryModifications (removed)
      // - remoteVersions (removed)
      // - pendingApprovals (removed)
      // - managementLog (removed)
      // - auditTrail (removed)
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
  
  // Outbox helpers
  async outboxAdd(entry) {
    return db.table('outbox').add(entry)
  },
  async outboxUpdate(id, updates) {
    return db.table('outbox').update(id, updates)
  },
  async outboxDelete(id) {
    return db.table('outbox').delete(id)
  },
  async outboxGetPending(limit = 50) {
    return db.table('outbox')
      .where('status')
      .anyOf('pending', 'retry')
      .limit(limit)
      .toArray()
  },
  async outboxFindByTempId(tempId) {
    return db.table('outbox').where('tempId').equals(tempId).first()
  },
  async outboxFindByResourceId(resourceId, resourceType) {
    // Caută în idMap pentru a găsi tempId-ul corespunzător ID-ului real
    const idMapping = await db.table('idMap')
      .where('permId')
      .equals(resourceId)
      .and(entry => entry.resourceType === resourceType)
      .first()
    
    if (idMapping && idMapping.tempId) {
      // Dacă găsim maparea, caută în outbox după tempId
      return await db.table('outbox')
        .where('tempId')
        .equals(idMapping.tempId)
        .first()
    }
    
    // Fallback: caută prima intrare pending pentru operația 'create' pe acest tip de resursă
    // Sortăm după timestamp pentru a lua cea mai veche (FIFO)
    const entries = await db.table('outbox')
      .where('resourceType')
      .equals(resourceType)
      .and(entry => 
        (entry.status === 'pending' || entry.status === 'retry') && 
        entry.operation === 'create'
      )
      .sortBy('createdAt')
    
    return entries.length > 0 ? entries[0] : null
  },
  
  // Metode specifice pentru programări
  async getAppointmentsByDate(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return db.appointment
      .where('date')
      .between(startOfDay.toISOString(), endOfDay.toISOString())
      .toArray();
  },
  
  async getAppointmentsByDateRange(startDate, endDate) {
    return db.appointment
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
    return db.patient
      .where('status')
      .equals(status)
      .toArray();
  },
  
  async searchPatients(searchTerm) {
    const term = searchTerm.toLowerCase();
    return db.patient
      .filter(patient => 
        (patient.name && patient.name.toLowerCase().includes(term)) ||
        (patient.patientName && patient.patientName.toLowerCase().includes(term)) ||
        patient.email.toLowerCase().includes(term) ||
        (patient.phone && patient.phone.includes(term)) ||
        (patient.cnp && patient.cnp.includes(term))
      )
      .toArray();
  },
  
  async getPatientsByCity(city) {
    return db.patient
      .where('city')
      .equals(city)
      .toArray();
  },
  
  async count(storeName) {
    return db.table(storeName).count();
  },
  
  // Metode specifice pentru produse
  async getProductsByCategory(category) {
    return db.product
      .where('category')
      .equals(category)
      .toArray();
  },
  
  async getLowStockProducts() {
    return db.product
      .filter(product => product.stock <= product.reorderLevel)
      .toArray();
  },
  
  async searchProducts(searchTerm) {
    const term = searchTerm.toLowerCase();
    return db.product
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
    return db.user
      .where('status')
      .equals(status)
      .toArray();
  },
  
  async getUsersBySpecialization(specialization) {
    return db.user
      .where('specialization')
      .equals(specialization)
      .toArray();
  },
  
  async searchUsers(searchTerm) {
    const term = searchTerm.toLowerCase();
    return db.user
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
    return db.user
      .where('email')
      .equals(email.toLowerCase())
      .first();
  },
  

  
  async getUsersByRole(role) {
    return db.user
      .where('role')
      .equals(role)
      .toArray();
  },
  
  // Metode specifice pentru roluri
  async getRolesByStatus(status) {
    return db.role
      .where('status')
      .equals(status)
      .toArray();
  },
  
  async searchRoles(searchTerm) {
    const term = searchTerm.toLowerCase();
    return db.role
      .filter(role => 
        role.name.toLowerCase().includes(term) ||
        role.description.toLowerCase().includes(term)
      )
      .toArray();
  },
  
  async getRoleByName(name) {
    return db.role
      .where('name')
      .equals(name)
      .first();
  },
  
  // Metode specifice pentru permisiuni
  async getPermissionsByResource(resource) {
    return db.permission
      .where('resource')
      .equals(resource)
      .toArray();
  },
  
  async getPermissionsByAction(action) {
    return db.permission
      .where('action')
      .equals(action)
      .toArray();
  },
  
  async searchPermissions(searchTerm) {
    const term = searchTerm.toLowerCase();
    return db.permission
      .filter(permission => 
        permission.resource.toLowerCase().includes(term) ||
        permission.action.toLowerCase().includes(term) ||
        permission.description.toLowerCase().includes(term)
      )
      .toArray();
  },
  
  async getPermissionByResourceAndAction(resource, action) {
    return db.permission
      .filter(permission => 
        permission.resource === resource && permission.action === action
      )
      .first();
  },
  
  // Metode specifice pentru tratamente
  async getTreatmentsByCategory(category) {
    return db.treatment
      .where('category')
      .equals(category)
      .toArray();
  },
  
  async getTreatmentsByType(treatmentType) {
    return db.treatment
      .where('treatmentType')
      .equals(treatmentType)
      .toArray();
  },
  
  async searchTreatments(searchTerm) {
    const term = searchTerm.toLowerCase();
    return db.treatment
      .filter(treatment => 
        treatment.treatmentType.toLowerCase().includes(term) ||
        treatment.category.toLowerCase().includes(term) ||
        (treatment.description && treatment.description.toLowerCase().includes(term))
      )
      .toArray();
  },
  
  async getTreatmentsByDurationRange(minDuration, maxDuration) {
    return db.treatment
      .filter(treatment => 
        treatment.duration >= minDuration && treatment.duration <= maxDuration
      )
      .toArray();
  },
  
  async getTreatmentsByPriceRange(minPrice, maxPrice) {
    return db.treatment
      .filter(treatment => 
        treatment.price >= minPrice && treatment.price <= maxPrice
      )
      .toArray();
  },
  
  // Metode specifice pentru vânzări
  async getSalesByDate(date) {
    return db.sale
      .where('date')
      .equals(date)
      .toArray();
  },
  
  async getSalesByDateRange(startDate, endDate) {
    return db.sale
      .where('date')
      .between(startDate, endDate)
      .toArray();
  },
  
  async getSalesByStatus(status) {
    return db.sale
      .where('status')
      .equals(status)
      .toArray();
  },
  
  async searchSales(searchTerm) {
    const term = searchTerm.toLowerCase();
    return db.sale
      .filter(sale => 
        sale.saleId?.toLowerCase().includes(term) ||
        sale.cashierName?.toLowerCase().includes(term)
      )
      .toArray();
  },
  
  async bulkAdd(storeName, values) {
    try {
      if (!db.table(storeName)) {
        console.warn(`Store ${storeName} does not exist`);
        return;
      }
      return db.table(storeName).bulkAdd(values);
    } catch (error) {
      console.warn(`Failed to bulkAdd to ${storeName}:`, error);
    }
  },
  
  // Metode specifice pentru facturi
  async getInvoicesByStatus(status) {
    return db.invoice
      .where('status')
      .equals(status)
      .toArray();
  },
  
  async getInvoicesByDate(date) {
    return db.invoice
      .where('issueDate')
      .equals(date)
      .toArray();
  },
  
  async getInvoicesByDateRange(startDate, endDate) {
    return db.invoice
      .where('issueDate')
      .between(startDate, endDate)
      .toArray();
  },
  
  async searchInvoices(searchTerm) {
    const term = searchTerm.toLowerCase();
    return db.invoice
      .filter(invoice => 
        invoice.invoiceNumber?.toLowerCase().includes(term) ||
        invoice.clientName?.toLowerCase().includes(term)
      )
      .toArray();
  },
  
  // Metode specifice pentru clienți de factură
  async searchInvoiceClients(searchTerm) {
    const term = searchTerm.toLowerCase();
    return db['invoice-clients']
      .filter(client => 
        client.clientName?.toLowerCase().includes(term) ||
        client.clientCUI?.toLowerCase().includes(term) ||
        client.clientCNP?.toLowerCase().includes(term) ||
        client.clientEmail?.toLowerCase().includes(term)
      )
      .toArray();
  },
  
  async getInvoiceClientsByType(clientType) {
    return db['invoice-clients']
      .where('clientType')
      .equals(clientType)
      .toArray();
  },

  // Clear all data from IndexedDB
  async clearAllData() {
    try {
      console.log('🧹 Clearing all IndexedDB data...')
      
      // Get all table names
      const tables = [
        'appointment', 'patient', 'product', 'user', 'sale', 'role', 
        'permission', 'treatment', 'statistics', 'report', 'setting',
        'invoice', 'invoice-clients', 'appointmentCounts', 'productCounts',
        'outbox', 'idMap', 'queue', 'meta', 'drafts'
      ]
      
      // Clear each table
      for (const tableName of tables) {
        try {
          await db.table(tableName).clear()
          console.log(`  ✅ Cleared ${tableName}`)
        } catch (error) {
          console.warn(`  ⚠️  Could not clear ${tableName}:`, error.message)
        }
      }
      
      console.log('✅ IndexedDB cleared successfully')
      return true
    } catch (error) {
      console.error('❌ Error clearing IndexedDB:', error)
      return false
    }
  },

  // Delete entire database (nuclear option)
  async deleteDatabase() {
    try {
      console.log('💣 Deleting entire IndexedDB database...')
      await db.delete()
      console.log('✅ IndexedDB database deleted')
      return true
    } catch (error) {
      console.error('❌ Error deleting IndexedDB database:', error)
      return false
    }
  }
};


