import { GetCommand } from '../data/commands/GetCommand.js';
import { AddCommand } from '../data/commands/AddCommand.js';
import { UpdateCommand } from '../data/commands/UpdateCommand.js';
import { DeleteCommand } from '../data/commands/DeleteCommand.js';
import { productManager } from '../business/productManager.js';
import { ResourceInvoker } from '../data/invoker/ResourceInvoker.js';
import { ResourceRepository } from '../data/repositories/ResourceRepository.js';


// Serviciu pentru produse
class ProductService {
  constructor() {
    this.repository = new ResourceRepository('product', 'products');
    this.invoker = new ResourceInvoker()
  }

  // Încarcă toate produsele
  async loadProducts(filters = {}) {
    try {
      const command = new GetCommand(this.repository, filters);
      const products = await this.invoker.run(command);
      
      // Asigură-te că rezultatul este întotdeauna un array
      const productsArray = Array.isArray(products) ? products : [];
      
      // Transformă datele pentru UI
      return productsArray.map(product => productManager.transformForUI(product));
    } catch (error) {
      console.error('Error loading products from API, trying IndexedDB:', error);
      
      // Fallback la IndexedDB
      try {
        const { indexedDb } = await import('../data/infrastructure/db.js');
        const cachedProducts = await indexedDb.getAll('products');
        console.log(`Loaded ${cachedProducts.length} products from IndexedDB cache`);
        
        // Transformă datele pentru UI
        return cachedProducts.map(product => productManager.transformForUI(product));
      } catch (cacheError) {
        console.error('Error loading products from IndexedDB:', cacheError);
        return [];
      }
    }
  }

  // Încarcă produsele după categorie
  async loadProductsByCategory(category) {
    try {
      const command = new GetCommand(this.repository, { category });
      const products = await command.execute();
      
      // Asigură-te că rezultatul este întotdeauna un array
      const productsArray = Array.isArray(products) ? products : [];
      
      return productsArray.map(product => productManager.transformForUI(product));
    } catch (error) {
      console.error('Error loading products by category from API, trying IndexedDB:', error);
      
      // Fallback la IndexedDB
      try {
        const { indexedDb } = await import('../data/infrastructure/db.js');
        const cachedProducts = await indexedDb.getProductsByCategory(category);
        console.log(`Loaded ${cachedProducts.length} products for category "${category}" from IndexedDB cache`);
        
        return cachedProducts.map(product => productManager.transformForUI(product));
      } catch (cacheError) {
        console.error('Error loading products by category from IndexedDB:', cacheError);
        return [];
      }
    }
  }

  // Încarcă produsele cu stoc scăzut
  async loadLowStockProducts() {
    try {
      const command = new GetCommand(this.repository, { lowStock: true });
      const products = await command.execute();
      
      // Asigură-te că rezultatul este întotdeauna un array
      const productsArray = Array.isArray(products) ? products : [];
      
      return productsArray.map(product => productManager.transformForUI(product));
    } catch (error) {
      console.error('Error loading low stock products from API, trying IndexedDB:', error);
      
      // Fallback la IndexedDB
      try {
        const { indexedDb } = await import('../data/infrastructure/db.js');
        const cachedProducts = await indexedDb.getLowStockProducts();
        console.log(`Loaded ${cachedProducts.length} low stock products from IndexedDB cache`);
        
        return cachedProducts.map(product => productManager.transformForUI(product));
      } catch (cacheError) {
        console.error('Error loading low stock products from IndexedDB:', cacheError);
        return [];
      }
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
      console.error('Error searching products by name:', error);
      // Fallback to old method if resource query fails
      try {
        const command = new GetCommand(this.repository, { search: searchTerm });
        const products = await command.execute();
        
        // Asigură-te că rezultatul este întotdeauna un array
        const productsArray = Array.isArray(products) ? products : [];
        
        return productsArray.map(product => productManager.transformForUI(product));
      } catch (fallbackError) {
        console.error('Fallback search also failed:', fallbackError);
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
      
      const command = new AddCommand(this.repository, transformedData);
      const result = await command.execute();
      
      return productManager.transformForUI(result);
    } catch (error) {
      console.error('Error adding product:', error);
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
      
      const command = new UpdateCommand(this.repository, id, transformedData);
      const result = await command.execute();
      
      return productManager.transformForUI(result);
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  // Șterge un produs
  async deleteProduct(id) {
    try {
      const command = new DeleteCommand(this.repository, id);
      await command.execute();
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  // Obține statistici pentru produse
  async getProductStats() {
    try {
      const products = await this.loadProducts();
      return productManager.calculateStats(products);
    } catch (error) {
      console.error('Error getting product stats:', error);
      throw error;
    }
  }

  // Exportă produsele
  async exportProducts(format = 'json') {
    try {
      const products = await this.loadProducts();
      return productManager.exportData(products, format);
    } catch (error) {
      console.error('Error exporting products:', error);
      throw error;
    }
  }
}

export const productService = new ProductService();
