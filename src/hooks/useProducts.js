import { useState, useEffect, useCallback } from 'react';
import { productService } from '../services/productService.js';
import { indexedDb } from '../data/infrastructure/db.js';

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  // Încarcă toate produsele
  const loadProducts = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      
      // Încearcă să încarce din API
      try {
        result = await productService.loadProducts(filters);
      } catch (apiError) {
        console.warn('API not available, loading from cache:', apiError);
        // Fallback la cache local
        result = await indexedDb.getAll('products');
      }
      
      setProducts(result);
      
      // Actualizează statisticile
      if (result.length > 0) {
        const productStats = await productService.getProductStats();
        setStats(productStats);
      }
      
    } catch (err) {
      setError(err.message);
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Încarcă produsele după categorie
  const loadProductsByCategory = useCallback(async (category) => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      
      try {
        result = await productService.loadProductsByCategory(category);
      } catch (apiError) {
        console.warn('API not available, loading from cache:', apiError);
        result = await indexedDb.getProductsByCategory(category);
      }
      
      setProducts(result);
    } catch (err) {
      setError(err.message);
      console.error('Error loading products by category:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Încarcă produsele cu stoc scăzut
  const loadLowStockProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      
      try {
        result = await productService.loadLowStockProducts();
      } catch (apiError) {
        console.warn('API not available, loading from cache:', apiError);
        result = await indexedDb.getLowStockProducts();
      }
      
      setProducts(result);
    } catch (err) {
      setError(err.message);
      console.error('Error loading low stock products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Caută produse
  const searchProducts = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length === 0) {
      await loadProducts();
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      let result;
      
      try {
        result = await productService.searchProducts(searchTerm);
      } catch (apiError) {
        console.warn('API not available, searching in cache:', apiError);
        result = await indexedDb.searchProducts(searchTerm);
      }
      
      setProducts(result);
    } catch (err) {
      setError(err.message);
      console.error('Error searching products:', err);
    } finally {
      setLoading(false);
    }
  }, [loadProducts]);

  // Adaugă un produs nou
  const addProduct = useCallback(async (productData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await productService.addProduct(productData);
      
      // Actualizează lista locală
      setProducts(prev => [...prev, result]);
      
      // Actualizează statisticile
      const newStats = await productService.getProductStats();
      setStats(newStats);
      
      return result;
    } catch (err) {
      setError(err.message);
      console.error('Error adding product:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizează un produs
  const updateProduct = useCallback(async (id, productData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await productService.updateProduct(id, productData);
      
      // Actualizează lista locală
      setProducts(prev => prev.map(product => 
        product.id === id ? result : product
      ));
      
      // Actualizează statisticile
      const newStats = await productService.getProductStats();
      setStats(newStats);
      
      return result;
    } catch (err) {
      setError(err.message);
      console.error('Error updating product:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Șterge un produs
  const deleteProduct = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      await productService.deleteProduct(id);
      
      // Actualizează lista locală
      setProducts(prev => prev.filter(product => product.id !== id));
      
      // Actualizează statisticile
      const newStats = await productService.getProductStats();
      setStats(newStats);
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      console.error('Error deleting product:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obține statisticile
  const getStats = useCallback(async () => {
    try {
      const result = await productService.getProductStats();
      setStats(result);
      return result;
    } catch (err) {
      console.error('Error getting product stats:', err);
      throw err;
    }
  }, []);

  // Exportă produsele
  const exportProducts = useCallback(async (format = 'json') => {
    try {
      return await productService.exportProducts(format);
    } catch (err) {
      console.error('Error exporting products:', err);
      throw err;
    }
  }, []);

  // Actualizează stocul unui produs
  const updateStock = useCallback(async (id, newStock) => {
    const product = products.find(p => p.id === id);
    if (!product) {
      throw new Error('Produsul nu a fost găsit');
    }
    
    return await updateProduct(id, { ...product, stock: newStock });
  }, [products, updateProduct]);

  // Încarcă produsele la prima renderizare
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return {
    // State
    products,
    loading,
    error,
    stats,
    
    // Actions
    loadProducts,
    loadProductsByCategory,
    loadLowStockProducts,
    searchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    getStats,
    exportProducts,
    
    // Utilitare
    clearError: () => setError(null)
  };
};
