import { dataFacade } from '../data/DataFacade.js';
import { ResourceRepository } from '../data/repositories/ResourceRepository.js';
import { salesManager } from '../business/salesManager.js';
import { productService } from './productService.js';

// Serviciu pentru vânzări
class SalesService {
  constructor() {
    this.repository = new ResourceRepository('sale', 'sale');
    this.dataFacade = dataFacade;
  }

  // Încarcă toate vânzările
  async loadSales(filters = {}) {
    try {
      const sales = await this.repository.query(filters);
      
      // Transformă datele pentru UI
      return sales.map(sale => salesManager.transformForUI(sale));
    } catch (error) {
      return [];
    }
  }

  // Încarcă vânzările după dată
  async loadSalesByDate(date) {
    try {
      const sales = await this.repository.query({ date });
      
      return sales.map(sale => salesManager.transformForUI(sale));
    } catch (error) {
      return [];
    }
  }

  // Încarcă vânzările pentru o perioadă
  async loadSalesByDateRange(startDate, endDate) {
    try {
      const sales = await this.repository.query({ 
        startDate, 
        endDate 
      });
      
      return sales.map(sale => salesManager.transformForUI(sale));
    } catch (error) {
      return [];
    }
  }


  // Creează o vânzare nouă
  async createSale(saleData) {
    try {
      // Validează datele
      const validationResult = salesManager.validateSale(saleData);
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors.join(', '));
      }

      // Transformă datele pentru API
      const transformedData = salesManager.transformForAPI(saleData);
      
      // Procesează vânzarea și actualizează stocurile
      const result = await this.processSaleWithInventory(transformedData);
      
      return salesManager.transformForUI(result);
    } catch (error) {
      throw error;
    }
  }

  // Procesează vânzarea și actualizează stocurile produselor
  async processSaleWithInventory(saleData) {
    try {
      // Creează vânzarea folosind repository
      const sale = await this.repository.add(saleData);
      
      // Actualizează stocurile produselor
      if (saleData.items && Array.isArray(saleData.items)) {
        for (const item of saleData.items) {
          if (item.productId && item.quantity) {
            try {
              // Obține produsul curent
              const currentProduct = await productService.loadProducts();
              const product = currentProduct.find(p => p.id === item.productId || p.resourceId === item.productId);
              
              if (product) {
                // Calculează noul stoc
                const newStock = parseInt(product.stock) - parseInt(item.quantity);
                
                // Actualizează stocul produsului
                await productService.updateProduct(product.id, {
                  ...product,
                  stock: Math.max(0, newStock) // Nu permite stoc negativ
                });
              }
            } catch (inventoryError) {
              console.warn(`Failed to update inventory for product ${item.productId}:`, inventoryError);
              // Nu oprește procesarea vânzării dacă actualizarea stocului eșuează
            }
          }
        }
      }
      
      return sale;
    } catch (error) {
      throw error;
    }
  }

  // Actualizează o vânzare
  async updateSale(id, saleData) {
    try {
      // Validează datele
      const validationResult = salesManager.validateSale(saleData);
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors.join(', '));
      }

      // Transformă datele pentru API
      const transformedData = salesManager.transformForAPI(saleData);
      
      const result = await this.repository.update(id, transformedData);
      
      return salesManager.transformForUI(result);
    } catch (error) {
      throw error;
    }
  }

  // Șterge o vânzare
  async deleteSale(id) {
    try {
      await this.repository.remove(id);
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // Obține statistici pentru vânzări
  async getSalesStats(filters = {}) {
    try {
      const sales = await this.loadSales(filters);
      return salesManager.calculateStats(sales);
    } catch (error) {
      throw error;
    }
  }

  // Exportă vânzările
  async exportSales(format = 'json', filters = {}) {
    try {
      const sales = await this.loadSales(filters);
      return salesManager.exportData(sales, format);
    } catch (error) {
      throw error;
    }
  }

}

export const salesService = new SalesService();
