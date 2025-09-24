import { useState, useEffect, useCallback } from 'react';
import { productService } from '../services/productService.js';
import { productManager } from '../business/productManager.js';
import { indexedDb } from '../data/infrastructure/db.js';
import { onResourceMessage } from '../data/infrastructure/websocketClient.js';

// Fix for transformForUI function name - v1.1

// Stare partajată la nivel de modul pentru sincronizare între instanțe
let sharedProducts = []
let sharedStats = null
const subscribers = new Set()

// Funcție pentru notificarea abonaților
const notifySubscribers = () => {
  subscribers.forEach((callback, index) => {
    callback(sharedProducts, sharedStats)
  })
}

// Optimismul e gestionat în Repository; aici doar reflectăm starea

export const useProducts = () => {
  const [products, setProducts] = useState(sharedProducts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(sharedStats);

  // Check if we're in demo mode
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  // Debug logging pentru a vedea când se schimbă starea (only in non-demo mode)
  if (!isDemoMode) {
    console.log('useProducts render - products count:', products.length, 'loading:', loading, 'error:', error)
  }

  // Abonare la schimbările de stare partajată
  useEffect(() => {
    const handleStateChange = (newProducts, newStats) => {
      if (!isDemoMode) {
        console.log('State change received, products count:', newProducts.length, 'newProducts:', newProducts)
      }
      setProducts([...newProducts]) // Forțează o nouă referință
      setStats(newStats)
    }
    
    subscribers.add(handleStateChange)
    if (!isDemoMode) {
      console.log('Subscriber added, total subscribers:', subscribers.size)
    }
    return () => {
      subscribers.delete(handleStateChange)
      if (!isDemoMode) {
        console.log('Subscriber removed, total subscribers:', subscribers.size)
      }
    }
  }, [isDemoMode])

  // WebSocket handling pentru produse (reflectă starea finală) - only in non-demo mode
  useEffect(() => {
    if (isDemoMode) return;

    const handler = async (message) => {
      const { type, data, resourceType } = message
      if (resourceType !== 'products' && resourceType !== 'product') return
      const operation = type?.replace('resource_', '') || type
      const productId = data?.id || data?.resourceId
      if (!productId) return
      const ui = productManager.transformForUI ? productManager.transformForUI({ ...data, id: productId, resourceId: productId }) : { ...data, id: productId, resourceId: productId }
      if (operation === 'created' || operation === 'create') {
        const idx = sharedProducts.findIndex(p => p.id === productId || p.resourceId === productId)
        if (idx >= 0) sharedProducts[idx] = { ...ui, _isOptimistic: false }
        else sharedProducts = [{ ...ui, _isOptimistic: false }, ...sharedProducts]
        notifySubscribers()
      } else if (operation === 'updated' || operation === 'update') {
        const idx = sharedProducts.findIndex(p => p.id === productId || p.resourceId === productId)
        if (idx >= 0) sharedProducts[idx] = { ...ui, _isOptimistic: false }
        else sharedProducts = [{ ...ui, _isOptimistic: false }, ...sharedProducts]
        notifySubscribers()
      } else if (operation === 'deleted' || operation === 'delete') {
        sharedProducts = sharedProducts.filter(p => (p.id !== productId && p.resourceId !== productId))
        notifySubscribers()
      }
    }

    // Abonează-te la mesajele WebSocket pentru produse
    const unsubPlural = onResourceMessage('products', handler)
    const unsubSingular = onResourceMessage('product', handler)

    return () => {
      unsubPlural()
      unsubSingular()
    }
  }, [isDemoMode])

  // Încarcă toate produsele
  const loadProducts = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      try {
        result = await productService.loadProducts(filters);
      } catch (apiError) {
        console.warn('API not available, loading from cache:', apiError);
        result = await indexedDb.getAll('products');
      }
      sharedProducts = result;
      notifySubscribers();
      
      // Actualizează statisticile
      if (result.length > 0) {
        const productStats = await productService.getProductStats();
        sharedStats = productStats
        notifySubscribers()
      }
      
    } catch (err) {
      // Doar setează eroarea dacă nu avem produse în cache
      if (sharedProducts.length === 0) {
        setError('Nu s-au putut încărca datele. Verifică conexiunea la internet.');
      } else {
        setError(null); // Nu afișa eroarea dacă avem date în cache
      }
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
      sharedProducts = result;
      notifySubscribers();
    } catch (err) {
      // Doar setează eroarea dacă nu avem produse în cache
      if (sharedProducts.length === 0) {
        setError('Nu s-au putut încărca datele. Verifică conexiunea la internet.');
      } else {
        setError(null); // Nu afișa eroarea dacă avem date în cache
      }
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
      sharedProducts = result;
      notifySubscribers();
    } catch (err) {
      // Doar setează eroarea dacă nu avem produse în cache
      if (sharedProducts.length === 0) {
        setError('Nu s-au putut încărca datele. Verifică conexiunea la internet.');
      } else {
        setError(null); // Nu afișa eroarea dacă avem date în cache
      }
      console.error('Error loading low stock products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Caută produse
  const searchProducts = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length === 0) {
      // Încarcă toate produsele din cache local sau API
      setLoading(true);
      setError(null);
      
      try {
        let result;
        try {
          result = await productService.loadProducts();
        } catch (apiError) {
          console.warn('API not available, loading from cache:', apiError);
          result = await indexedDb.getAll('products');
        }
        sharedProducts = result
        notifySubscribers()
      } catch (err) {
        // Doar setează eroarea dacă nu avem produse în cache
        if (sharedProducts.length === 0) {
          setError('Nu s-au putut încărca datele. Verifică conexiunea la internet.');
        } else {
          setError(null); // Nu afișa eroarea dacă avem date în cache
        }
        console.error('Error loading products:', err);
      } finally {
        setLoading(false);
      }
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
      sharedProducts = result
      notifySubscribers()
    } catch (err) {
      // Doar setează eroarea dacă nu avem produse în cache
      if (sharedProducts.length === 0) {
        setError('Nu s-au putut căuta datele. Verifică conexiunea la internet.');
      } else {
        setError(null); // Nu afișa eroarea dacă avem date în cache
      }
      console.error('Error searching products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Adaugă un produs nou (optimism gestionat în Repository)
  const addProduct = useCallback(async (productData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await productService.addProduct(productData);
      const ui = productManager.transformForUI ? productManager.transformForUI(result) : result
      const idx = sharedProducts.findIndex(p => p.id === ui.id || p.resourceId === ui.resourceId)
      if (idx >= 0) sharedProducts[idx] = { ...ui, _isOptimistic: false }
      else sharedProducts = [ui, ...sharedProducts]
      notifySubscribers()
      return ui
    } catch (err) {
      setError(err.message);
      console.error('Error adding product:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizează un produs (optimism gestionat în Repository)
  const updateProduct = useCallback(async (id, productData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await productService.updateProduct(id, productData);
      const ui = productManager.transformForUI ? productManager.transformForUI(result) : result
      const existingIndex = sharedProducts.findIndex(p => p.id === id || p.resourceId === id)
      if (existingIndex >= 0) sharedProducts[existingIndex] = { ...ui, _isOptimistic: false }
      notifySubscribers()
      return ui;
    } catch (err) {
      setError(err.message);
      console.error('Error updating product:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Șterge un produs (optimism gestionat în Repository)
  const deleteProduct = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      await productService.deleteProduct(id);
      sharedProducts = sharedProducts.filter(p => (p.id !== id && p.resourceId !== id))
      notifySubscribers()
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
      sharedStats = result
      notifySubscribers()
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

  // Actualizează stocul unui produs cu optimistic update
  const updateStock = useCallback(async (id, newStock) => {
    const product = sharedProducts.find(p => p.id === id || p.resourceId === id);
    if (!product) {
      throw new Error('Produsul nu a fost găsit');
    }
    
    return await updateProduct(id, { ...product, stock: newStock });
  }, [updateProduct]);

  // Încarcă produsele la prima renderizare
  useEffect(() => {
    // Verifică dacă avem deja produse încărcate pentru a evita încărcări multiple
    if (sharedProducts.length === 0) {
      loadProducts();
    }
  }, []); // Nu mai avem dependențe pentru a evita re-renderizările infinite

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
