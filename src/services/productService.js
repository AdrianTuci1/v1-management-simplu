import { GetCommand } from '../data/commands/GetCommand.js';
import { AddCommand } from '../data/commands/AddCommand.js';
import { UpdateCommand } from '../data/commands/UpdateCommand.js';
import { DeleteCommand } from '../data/commands/DeleteCommand.js';
import { ResourceRepository } from '../data/repositories/ResourceRepository.js';
import { productManager } from '../business/productManager.js';

// Repository pentru produse
const productRepository = new ResourceRepository('product');

// Serviciu pentru produse
class ProductService {
  constructor() {
    this.repository = productRepository;
  }

  // Încarcă toate produsele
  async loadProducts(filters = {}) {
    try {
      const command = new GetCommand(this.repository, filters);
      const products = await command.execute();
      
      // Asigură-te că rezultatul este întotdeauna un array
      const productsArray = Array.isArray(products) ? products : [];
      
      // Transformă datele pentru UI
      return productsArray.map(product => productManager.transformForUI(product));
    } catch (error) {
      console.error('Error loading products:', error);
      return [];
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
      console.error('Error loading products by category:', error);
      return [];
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
      console.error('Error loading low stock products:', error);
      return [];
    }
  }

  // Caută produse
  async searchProducts(searchTerm) {
    try {
      const command = new GetCommand(this.repository, { search: searchTerm });
      const products = await command.execute();
      
      // Asigură-te că rezultatul este întotdeauna un array
      const productsArray = Array.isArray(products) ? products : [];
      
      return productsArray.map(product => productManager.transformForUI(product));
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
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
