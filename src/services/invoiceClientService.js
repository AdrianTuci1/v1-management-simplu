import { dataFacade } from '../data/DataFacade.js';
import { ResourceRepository } from '../data/repositories/ResourceRepository.js';
import { invoiceClientManager } from '../business/invoiceClientManager.js';

// Serviciu pentru clienții de factură
class InvoiceClientService {
  constructor() {
    this.repository = new ResourceRepository('invoice-client', 'invoice-clients');
    this.dataFacade = dataFacade;
  }

  // Încarcă toți clienții
  async loadClients(filters = {}) {
    try {
      const clients = await this.dataFacade.getAll('invoice-client', filters);
      
      // Transformă datele pentru UI
      return clients.map(client => invoiceClientManager.transformForUI(client));
    } catch (error) {
      return [];
    }
  }

  // Caută clienți după nume, CUI sau CNP
  async searchClients(searchTerm) {
    try {
      const clients = await this.dataFacade.getAll('invoice-client', { 
        search: searchTerm 
      });
      
      return clients.map(client => invoiceClientManager.transformForUI(client));
    } catch (error) {
      return [];
    }
  }

  // Creează un client nou
  async createClient(clientData) {
    try {
      // Validează datele
      const validationResult = invoiceClientManager.validateClient(clientData);
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors.join(', '));
      }

      // Transformă datele pentru API
      const transformedData = invoiceClientManager.transformForAPI(clientData);
      
      // Creează clientul
      const result = await this.dataFacade.create('invoice-client', transformedData);
      
      return invoiceClientManager.transformForUI(result);
    } catch (error) {
      throw error;
    }
  }

  // Actualizează un client
  async updateClient(id, clientData) {
    try {
      // Validează datele
      const validationResult = invoiceClientManager.validateClient(clientData);
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors.join(', '));
      }

      // Transformă datele pentru API
      const transformedData = invoiceClientManager.transformForAPI(clientData);
      
      const result = await this.dataFacade.update('invoice-client', id, transformedData);
      
      return invoiceClientManager.transformForUI(result);
    } catch (error) {
      throw error;
    }
  }

  // Șterge un client
  async deleteClient(id) {
    try {
      await this.dataFacade.delete('invoice-client', id);
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // Obține un client după ID
  async getClient(id) {
    try {
      const client = await this.dataFacade.get('invoice-client', id);
      return invoiceClientManager.transformForUI(client);
    } catch (error) {
      throw error;
    }
  }

  // Verifică dacă există deja un client cu același CUI/CNP
  async checkDuplicateClient(cui, cnp) {
    try {
      const clients = await this.dataFacade.getAll('invoice-client', {});
      
      return clients.some(client => 
        (cui && client.clientCUI === cui) || 
        (cnp && client.clientCNP === cnp)
      );
    } catch (error) {
      return false;
    }
  }
}

export const invoiceClientService = new InvoiceClientService();
