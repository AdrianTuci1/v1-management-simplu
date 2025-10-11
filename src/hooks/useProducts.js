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
      
      try {
        if (operation === 'created' || operation === 'create') {
          // Înlocuiește produsul optimistic cu datele reale
          const ui = productManager.transformForUI ? productManager.transformForUI({ ...data, id: productId, resourceId: productId }) : { ...data, id: productId, resourceId: productId }
          
          // Caută în outbox pentru a găsi operația optimistică folosind ID-ul real
          const outboxEntry = await indexedDb.outboxFindByResourceId(productId, 'product')
          
          if (outboxEntry) {
            const optimisticIndex = sharedProducts.findIndex(p => p._tempId === outboxEntry.tempId)
            if (optimisticIndex >= 0) {
              sharedProducts[optimisticIndex] = { ...ui, _isOptimistic: false }
            }
            await indexedDb.outboxDelete(outboxEntry.id)
          } else {
            // Dacă nu găsim în outbox, încercăm să găsim după euristică
            const optimisticIndex = sharedProducts.findIndex(p => 
              p._isOptimistic && 
              p.name === data.name &&
              p.sku === data.sku &&
              Math.abs((p.price || 0) - (data.price || 0)) < 0.01
            )
            if (optimisticIndex >= 0) {
              sharedProducts[optimisticIndex] = { ...ui, _isOptimistic: false }
            } else {
              // Verifică dacă nu există deja (evită dubluri)
              const existingIndex = sharedProducts.findIndex(p => p.id === productId || p.resourceId === productId)
              if (existingIndex >= 0) {
                sharedProducts[existingIndex] = { ...ui, _isOptimistic: false }
              } else {
                // Adaugă ca nou doar dacă nu există deloc
                sharedProducts = [{ ...ui, _isOptimistic: false }, ...sharedProducts]
              }
            }
          }
          
          notifySubscribers()
        } else if (operation === 'updated' || operation === 'update') {
          // Dezactivează flag-ul optimistic
          const ui = productManager.transformForUI ? productManager.transformForUI({ ...data, id: productId, resourceId: productId }) : { ...data, id: productId, resourceId: productId }
          const existingIndex = sharedProducts.findIndex(p => 
            p.id === productId || p.resourceId === productId
          )
          if (existingIndex >= 0) {
            sharedProducts[existingIndex] = { ...ui, _isOptimistic: false }
          }
          
          notifySubscribers()
        } else if (operation === 'deleted' || operation === 'delete') {
          // Elimină produsul din lista locală
          sharedProducts = sharedProducts.filter(p => {
            const matches = p.id === productId || p.resourceId === productId
            return !matches
          })
          notifySubscribers()
        }
      } catch (error) {
        console.error('Error handling product WebSocket message:', error)
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
        result = await indexedDb.getAll('product');
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
          result = await indexedDb.getAll('product');
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
    setError(null)
    try {
      const result = await productService.addProduct(productData);
      const ui = productManager.transformForUI ? productManager.transformForUI(result) : result
      
      // Doar resursele optimistice sunt adăugate imediat în shared state
      // Resursele cu ID real vor fi adăugate de WebSocket
      if (ui._isOptimistic || ui._tempId) {
        const idx = sharedProducts.findIndex(p => p._tempId === ui._tempId)
        if (idx >= 0) {
          sharedProducts[idx] = ui
        } else {
          sharedProducts = [ui, ...sharedProducts]
        }
        notifySubscribers()
      }
      
      return ui
    } catch (err) {
      setError(err.message);
      console.error('Error adding product:', err);
      throw err;
    }
  }, []);

  // Actualizează un produs (optimism gestionat în Repository)
  const updateProduct = useCallback(async (id, productData) => {
    setError(null)
    if (!id) throw new Error('Product ID is required for update')
    try {
      const result = await productService.updateProduct(id, productData);
      const ui = productManager.transformForUI ? productManager.transformForUI(result) : result
      const idx = sharedProducts.findIndex(p => p.id === id || p.resourceId === id)
      if (idx >= 0) sharedProducts[idx] = { ...ui, _isOptimistic: false }
      notifySubscribers()
      return ui;
    } catch (err) {
      setError(err.message);
      console.error('Error updating product:', err);
      throw err;
    }
  }, []);

  // Șterge un produs (optimism gestionat în Repository)
  const deleteProduct = useCallback(async (id) => {
    setError(null)
    if (!id) throw new Error('Product ID is required for deletion')
    try {
      await productService.deleteProduct(id);
      sharedProducts = sharedProducts.filter(p => (p.id !== id && p.resourceId !== id))
      notifySubscribers()
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error deleting product:', err);
      throw err;
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

  // Funcție pentru sortarea produselor cu prioritizare pentru optimistic updates
  const getSortedProducts = useCallback((sortBy = 'name', sortOrder = 'asc') => {
    const baseSorted = productManager.sortProducts ? productManager.sortProducts(sharedProducts, sortBy, sortOrder) : [...sharedProducts]
    return [...baseSorted].sort((a, b) => {
      const aOpt = !!a._isOptimistic && !a._isDeleting
      const bOpt = !!b._isOptimistic && !b._isDeleting
      const aDel = !!a._isDeleting
      const bDel = !!b._isDeleting
      
      // Prioritizează optimistic updates
      if (aOpt && !bOpt) return -1
      if (!aOpt && bOpt) return 1
      
      // Pune elementele în ștergere la sfârșit
      if (aDel && !bDel) return 1
      if (!aDel && bDel) return -1
      
      return 0
    })
  }, []);

  // Încarcă datele la montarea componentei și abonare la actualizări
  useEffect(() => {
    // Initialize from shared state
    setProducts([...sharedProducts])
    
    // Adaugă subscriber pentru actualizări
    const subscriber = (newProducts) => {
      console.log('Product subscriber called with products count:', newProducts.length)
      setProducts(newProducts)
    }
    subscribers.add(subscriber)
    
    // Încarcă produsele dacă nu avem deja
    if (sharedProducts.length === 0) {
      loadProducts();
    }
    
    return () => {
      subscribers.delete(subscriber)
    }
  }, [])

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
    getSortedProducts,
    clearError: () => setError(null)
  };
};
