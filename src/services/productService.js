import { dataFacade } from '../data/DataFacade.js';
import { DraftAwareResourceRepository } from '../data/repositories/DraftAwareResourceRepository.js';
import { productManager } from '../business/productManager.js';


// Serviciu pentru produse
class ProductService {
  constructor() {
    this.repository = new DraftAwareResourceRepository('products', 'product');
    this.dataFacade = dataFacade;
  }

  // Încarcă toate produsele
  async loadProducts(filters = {}) {
    try {
      const products = await this.dataFacade.getAll('product', filters);
      
      // Transformă datele pentru UI
      return products.map(product => productManager.transformForUI(product));
    } catch (error) {
      return [];
    }
  }

  // Încarcă produsele după categorie
  async loadProductsByCategory(category) {
    try {
      const products = await this.dataFacade.getAll('product', { category });
      
      return products.map(product => productManager.transformForUI(product));
    } catch (error) {
      return [];
    }
  }

  // Încarcă produsele cu stoc scăzut
  async loadLowStockProducts() {
    try {
      const products = await this.dataFacade.getAll('product', { lowStock: true });
      
      return products.map(product => productManager.transformForUI(product));
    } catch (error) {
      return [];
    }
  }

  // Caută produse folosind resource queries
  async searchProducts(searchTerm) {
    try {
      const businessId = localStorage.getItem("businessId") || 'B0100001';
      const locationId = localStorage.getItem("locationId") || 'L0100001';
      
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const endpoint = `${baseUrl}/api/resources/${businessId}-${locationId}?data.name=${encodeURIComponent(searchTerm)}&page=1&limit=50`;
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Resource-Type": "product",
          ...(localStorage.getItem('cognito-data') && {
            "Authorization": `Bearer ${JSON.parse(localStorage.getItem('cognito-data')).id_token || JSON.parse(localStorage.getItem('cognito-data')).access_token}`
          })
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract data from API response structure
      let products = [];
      if (data && data.data) {
        products = Array.isArray(data.data) ? data.data : [];
      } else if (Array.isArray(data)) {
        products = data;
      }
      
      // Transformăm fiecare produs pentru UI
      return products.map(product => 
        productManager.transformForUI(product)
      );
    } catch (error) {
      // Fallback to old method if resource query fails
      try {
        const command = new GetCommand(this.repository, { search: searchTerm });
        const products = await command.execute();
        
        // Asigură-te că rezultatul este întotdeauna un array
        const productsArray = Array.isArray(products) ? products : [];
        
        return productsArray.map(product => productManager.transformForUI(product));
      } catch (fallbackError) {
        return [];
      }
    }
  }

  // Adaugă un produs nou
  async addProduct(productData) {
    try {
      // Validează datele
      const validationResult = productManager.validateProduct(productData);
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors.join(', '));
      }

      // Transformă datele pentru API
      const transformedData = productManager.transformForAPI(productData);
      
      const result = await this.dataFacade.create('product', transformedData);
      
      return productManager.transformForUI(result);
    } catch (error) {
      throw error;
    }
  }

  // Actualizează un produs
  async updateProduct(id, productData) {
    try {
      // Validează datele
      const validationResult = productManager.validateProduct(productData);
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors.join(', '));
      }

      // Transformă datele pentru API
      const transformedData = productManager.transformForAPI(productData);
      
      const result = await this.dataFacade.update('product', id, transformedData);
      
      return productManager.transformForUI(result);
    } catch (error) {
      throw error;
    }
  }

  // Șterge un produs
  async deleteProduct(id) {
    try {
      await this.dataFacade.delete('product', id);
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // Obține statistici pentru produse
  async getProductStats() {
    try {
      const products = await this.loadProducts();
      return productManager.calculateStats(products);
    } catch (error) {
      throw error;
    }
  }

  // Exportă produsele
  async exportProducts(format = 'json') {
    try {
      const products = await this.loadProducts();
      return productManager.exportData(products, format);
    } catch (error) {
      throw error;
    }
  }

  // ========================================
  // DRAFT MANAGEMENT
  // ========================================

  /**
   * Creează un draft pentru un produs
   * @param {Object} productData - Datele produsului
   * @param {string} sessionId - ID-ul sesiunii (opțional)
   * @returns {Promise<Object>} Draft-ul creat
   */
  async createProductDraft(productData, sessionId = null) {
    // Validează datele
    const validationResult = productManager.validateProduct(productData);
    if (!validationResult.isValid) {
      throw new Error(validationResult.errors.join(', '));
    }

    // Transformă datele pentru API
    const transformedData = productManager.transformForAPI(productData);
    
    return await this.dataFacade.createDraft('product', transformedData, sessionId);
  }

  /**
   * Actualizează un draft de produs
   * @param {string} draftId - ID-ul draft-ului
   * @param {Object} productData - Datele actualizate
   * @returns {Promise<Object>} Draft-ul actualizat
   */
  async updateProductDraft(draftId, productData) {
    // Validează datele
    const validationResult = productManager.validateProduct(productData);
    if (!validationResult.isValid) {
      throw new Error(validationResult.errors.join(', '));
    }

    // Transformă datele pentru API
    const transformedData = productManager.transformForAPI(productData);
    
    return await this.dataFacade.updateDraft(draftId, transformedData);
  }

  /**
   * Confirmă un draft de produs
   * @param {string} draftId - ID-ul draft-ului
   * @returns {Promise<Object>} Rezultatul confirmării
   */
  async commitProductDraft(draftId) {
    return await this.dataFacade.commitDraft(draftId);
  }

  /**
   * Anulează un draft de produs
   * @param {string} draftId - ID-ul draft-ului
   * @returns {Promise<Object>} Rezultatul anulării
   */
  async cancelProductDraft(draftId) {
    return await this.dataFacade.cancelDraft(draftId);
  }

  /**
   * Obține draft-urile pentru produse
   * @param {string} sessionId - ID-ul sesiunii (opțional)
   * @returns {Promise<Array>} Lista de draft-uri
   */
  async getProductDrafts(sessionId = null) {
    if (sessionId) {
      return await this.dataFacade.getDraftsBySession(sessionId);
    }
    return await this.dataFacade.getDraftsByResourceType('product');
  }

  /**
   * Obține produsele cu draft-uri incluse
   * @param {Object} params - Parametrii de query
   * @returns {Promise<Array>} Lista de produse cu draft-uri
   */
  async getProductsWithDrafts(params = {}) {
    try {
      const products = await this.repository.queryWithDrafts(params);
      
      return products.map(product => productManager.transformForUI(product));
    } catch (error) {
      return [];
    }
  }

  // ========================================
  // SESSION MANAGEMENT
  // ========================================

  /**
   * Creează o sesiune pentru produse
   * @param {string} type - Tipul sesiunii
   * @param {Object} data - Datele sesiunii
   * @returns {Promise<Object>} Sesiunea creată
   */
  async createProductSession(type, data = {}) {
    return await this.dataFacade.createSession(type, data);
  }

  /**
   * Salvează o sesiune de produse
   * @param {string} sessionId - ID-ul sesiunii
   * @param {Object} sessionData - Datele sesiunii
   * @returns {Promise<Object>} Sesiunea salvată
   */
  async saveProductSession(sessionId, sessionData) {
    return await this.dataFacade.saveSession(sessionId, sessionData);
  }

  /**
   * Obține produsele pentru o sesiune
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {Promise<Array>} Lista de produse pentru sesiune
   */
  async getProductsForSession(sessionId) {
    try {
      const products = await this.repository.getResourcesForSession(sessionId);
      
      return products.map(product => productManager.transformForUI(product));
    } catch (error) {
      return [];
    }
  }

  /**
   * Confirmă toate draft-urile pentru o sesiune
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {Promise<Object>} Rezultatul confirmării
   */
  async commitAllProductDraftsForSession(sessionId) {
    return await this.repository.commitAllDraftsForSession(sessionId);
  }

  /**
   * Anulează toate draft-urile pentru o sesiune
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {Promise<Object>} Rezultatul anulării
   */
  async cancelAllProductDraftsForSession(sessionId) {
    return await this.repository.cancelAllDraftsForSession(sessionId);
  }
}

export const productService = new ProductService();
