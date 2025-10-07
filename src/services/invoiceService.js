import { dataFacade } from '../data/DataFacade.js';
import { ResourceRepository } from '../data/repositories/ResourceRepository.js';
import { invoiceManager } from '../business/invoiceManager.js';

// Serviciu pentru facturi
class InvoiceService {
  constructor() {
    this.repository = new ResourceRepository('invoice', 'invoices');
    this.dataFacade = dataFacade;
  }

  // Încarcă toate facturile
  async loadInvoices(filters = {}) {
    try {
      const invoices = await this.dataFacade.getAll('invoice', filters);
      
      // Transformă datele pentru UI
      return invoices.map(invoice => invoiceManager.transformForUI(invoice));
    } catch (error) {
      return [];
    }
  }

  // Încarcă facturile după dată
  async loadInvoicesByDate(date) {
    try {
      const invoices = await this.dataFacade.getAll('invoice', { date });
      
      return invoices.map(invoice => invoiceManager.transformForUI(invoice));
    } catch (error) {
      return [];
    }
  }

  // Încarcă facturile pentru o perioadă
  async loadInvoicesByDateRange(startDate, endDate) {
    try {
      const invoices = await this.dataFacade.getAll('invoice', { 
        startDate, 
        endDate 
      });
      
      return invoices.map(invoice => invoiceManager.transformForUI(invoice));
    } catch (error) {
      return [];
    }
  }

  // Creează o factură nouă
  async createInvoice(invoiceData) {
    try {
      // Validează datele
      const validationResult = invoiceManager.validateInvoice(invoiceData);
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors.join(', '));
      }

      // Transformă datele pentru API
      const transformedData = invoiceManager.transformForAPI(invoiceData);
      
      // Creează factura
      const result = await this.dataFacade.create('invoice', transformedData);
      
      return invoiceManager.transformForUI(result);
    } catch (error) {
      throw error;
    }
  }

  // Actualizează o factură
  async updateInvoice(id, invoiceData) {
    try {
      // Validează datele
      const validationResult = invoiceManager.validateInvoice(invoiceData);
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors.join(', '));
      }

      // Transformă datele pentru API
      const transformedData = invoiceManager.transformForAPI(invoiceData);
      
      const result = await this.dataFacade.update('invoice', id, transformedData);
      
      return invoiceManager.transformForUI(result);
    } catch (error) {
      throw error;
    }
  }

  // Șterge o factură
  async deleteInvoice(id) {
    try {
      await this.dataFacade.delete('invoice', id);
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // Obține statistici pentru facturi
  async getInvoiceStats(filters = {}) {
    try {
      const invoices = await this.loadInvoices(filters);
      return invoiceManager.calculateStats(invoices);
    } catch (error) {
      throw error;
    }
  }

  // Exportă facturile
  async exportInvoices(format = 'json', filters = {}) {
    try {
      const invoices = await this.loadInvoices(filters);
      return invoiceManager.exportData(invoices, format);
    } catch (error) {
      throw error;
    }
  }

  // Trimite factura la eFactura
  async sendToEFactura(invoiceId) {
    try {
      const invoice = await this.dataFacade.get('invoice', invoiceId);
      if (!invoice) {
        throw new Error('Factura nu a fost găsită');
      }

      // Aici se va implementa integrarea cu eFactura
      // Pentru moment, doar marcăm factura ca trimisă
      const updatedInvoice = await this.updateInvoice(invoiceId, {
        ...invoice,
        eFacturaStatus: 'sent',
        eFacturaSentAt: new Date().toISOString()
      });

      return updatedInvoice;
    } catch (error) {
      throw error;
    }
  }
}

export const invoiceService = new InvoiceService();
