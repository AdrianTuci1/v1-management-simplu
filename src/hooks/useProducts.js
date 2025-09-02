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

// Generare ID temporar pentru optimistic updates
const generateTempId = () => {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const useProducts = () => {
  const [products, setProducts] = useState(sharedProducts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(sharedStats);

  // Debug logging pentru a vedea când se schimbă starea
  console.log('useProducts render - products count:', products.length, 'loading:', loading, 'error:', error)

  // Abonare la schimbările de stare partajată
  useEffect(() => {
    const handleStateChange = (newProducts, newStats) => {
      console.log('State change received, products count:', newProducts.length, 'newProducts:', newProducts)
      setProducts([...newProducts]) // Forțează o nouă referință
      setStats(newStats)
    }
    
    subscribers.add(handleStateChange)
    console.log('Subscriber added, total subscribers:', subscribers.size)
    return () => {
      subscribers.delete(handleStateChange)
      console.log('Subscriber removed, total subscribers:', subscribers.size)
    }
  }, [])

  // WebSocket handling pentru produse
  useEffect(() => {
    const handler = async (message) => {
      const { type, data, resourceType } = message
      
      console.log('WebSocket message received:', { type, resourceType, data })
      
      // Verifică dacă este pentru produse
      if (resourceType !== 'products' && resourceType !== 'product') return
      
      // Extrage operația din tipul mesajului
      const operation = type?.replace('resource_', '') || 'unknown'
      const productId = data?.id || data?.resourceId
      
      console.log('Processing product operation:', { operation, productId })
      
      if (!productId) return
      
      // Procesează operația
      if (operation === 'created') {
        console.log('Before transformForUI - data:', { ...data, id: productId, resourceId: productId })
        const ui = productManager.transformForUI ? 
          productManager.transformForUI({ ...data, id: productId, resourceId: productId }) :
          { ...data, id: productId, resourceId: productId }
        console.log('After transformForUI - ui:', ui)
        
        // Actualizează IndexedDB cu datele reale - asigură-te că resourceId este setat
        const dataForIndexedDB = { 
          ...data, 
          id: productId, 
          resourceId: productId, 
          _isOptimistic: false 
        }
        await indexedDb.put('products', dataForIndexedDB)
        
        // Caută în outbox pentru a găsi operația optimistă
        const outboxEntry = await indexedDb.outboxFindByResourceId?.(productId, 'products')
        
        if (outboxEntry) {
          console.log('Found outbox entry:', outboxEntry)
          // Găsește produsul optimist în shared state prin tempId
          const optimisticIndex = sharedProducts.findIndex(p => p._tempId === outboxEntry.tempId)
          console.log('Looking for tempId:', outboxEntry.tempId, 'Found at index:', optimisticIndex)
          
          if (optimisticIndex >= 0) {
            console.log('Before replacement - product:', sharedProducts[optimisticIndex])
            // Înlocuiește produsul optimist cu datele reale
            sharedProducts[optimisticIndex] = { ...ui, _isOptimistic: false }
            console.log('After replacement - product:', sharedProducts[optimisticIndex])
            console.log('Replaced optimistic product with real data from outbox')
          }
          
          // Șterge din outbox
          await indexedDb.outboxDelete?.(outboxEntry.id)
        } else {
          // Dacă nu găsește în outbox, caută produsul optimist după proprietăți
          const optimisticIndex = sharedProducts.findIndex(p => 
            p._isOptimistic && !p._isDeleting && (
              p.name === data.name ||
              p.code === data.code ||
              p.sku === data.sku ||
              p._tempId // Verifică și după tempId
            )
          )
          
          if (optimisticIndex >= 0) {
            console.log('Found optimistic product by properties at index:', optimisticIndex)
            // Înlocuiește produsul optimist cu datele reale
            sharedProducts[optimisticIndex] = { ...ui, _isOptimistic: false }
            console.log('Replaced optimistic product with real data by properties')
          } else {
            // Dacă nu găsește nici optimist, caută prin ID normal
            const existingIndex = sharedProducts.findIndex(p => p.id === productId || p.resourceId === productId)
            
            if (existingIndex >= 0) {
              // Actualizează produsul existent
              sharedProducts[existingIndex] = { ...ui, _isOptimistic: false }
              console.log('Updated existing product with real data')
            } else {
              // Verifică dacă produsul nu există deja în listă (pentru a evita duplicatele)
              const alreadyExists = sharedProducts.some(p => 
                p.id === productId || 
                p.resourceId === productId ||
                (p.name === data.name && p.code === data.code && p.sku === data.sku)
              )
              
              if (!alreadyExists) {
                // Adaugă produsul nou doar dacă nu există deja
                console.log('Adding new product as it was not found in existing list')
                sharedProducts = [{ ...ui, _isOptimistic: false }, ...sharedProducts]
              } else {
                console.log('Product already exists in list, skipping addition')
              }
            }
          }
        }
        
        // Actualizează starea locală și notifică toți subscriberii
        console.log('Updating products state after CREATED operation. Current count:', sharedProducts.length)
        notifySubscribers()
        
      } else if (operation === 'updated') {
        console.log('Before transformForUI (updated) - data:', { ...data, id: productId, resourceId: productId })
        const ui = productManager.transformForUI ? 
          productManager.transformForUI({ ...data, id: productId, resourceId: productId }) :
          { ...data, id: productId, resourceId: productId }
        console.log('After transformForUI (updated) - ui:', ui)
        
        // Actualizează IndexedDB cu datele reale - asigură-te că resourceId este setat
        const dataForIndexedDB = { 
          ...data, 
          id: productId, 
          resourceId: productId, 
          _isOptimistic: false 
        }
        await indexedDb.put('products', dataForIndexedDB)
        
        // Caută produsul în shared state și dezactivează _isOptimistic
        const existingIndex = sharedProducts.findIndex(p => p.id === productId || p.resourceId === productId)
        console.log('Looking for product with id/resourceId:', productId, 'Found at index:', existingIndex)
        
        if (existingIndex >= 0) {
          console.log('Before update - product:', sharedProducts[existingIndex])
          // Actualizează produsul existent și dezactivează optimistic flag
          sharedProducts[existingIndex] = { ...ui, _isOptimistic: false }
          console.log('After update - product:', sharedProducts[existingIndex])
          console.log('Updated product and disabled optimistic flag')
        } else {
          // Adaugă produsul nou dacă nu există
          sharedProducts = [{ ...ui, _isOptimistic: false }, ...sharedProducts]
        }
        
        // Actualizează starea locală și notifică toți subscriberii
        console.log('Updating products state after UPDATED operation. Current count:', sharedProducts.length)
        notifySubscribers()
        
      } else if (operation === 'deleted') {
        console.log('Processing DELETE operation for productId:', productId)
        
        // Șterge din IndexedDB
        await indexedDb.delete('products', productId)
        
        // Șterge din shared state și dezactivează _isOptimistic
        const beforeCount = sharedProducts.length
        sharedProducts = sharedProducts.filter(p => {
          const matches = p.id === productId || p.resourceId === productId
          if (matches) {
            console.log('Removing product from shared state:', p.name || p.id, 'isOptimistic:', p._isOptimistic, 'isDeleting:', p._isDeleting)
          }
          return !matches
        })
        
        // Actualizează starea locală și notifică toți subscriberii
        console.log('Updating products state after DELETED operation. Before count:', beforeCount, 'After count:', sharedProducts.length)
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
  }, [])

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
      
      // Actualizează starea partajată, păstrând elementele optimiste (dar nu cele în ștergere) și evitând duplicatele
      const optimisticProducts = sharedProducts.filter(p => p._isOptimistic && !p._isDeleting)
      
      // Filtrează rezultatele pentru a evita duplicatele cu produsele optimiste
      const filteredResult = result.filter(newProduct => {
        // Verifică dacă produsul nou există deja în lista optimistă
        return !optimisticProducts.some(optProduct => 
          optProduct._tempId && (
            optProduct.name === newProduct.name ||
            optProduct.code === newProduct.code ||
            optProduct.sku === newProduct.sku
          )
        )
      })
      
      sharedProducts = [...optimisticProducts, ...filteredResult]
      console.log('LoadProducts - optimistic count:', optimisticProducts.length, 'filtered result count:', filteredResult.length, 'total:', sharedProducts.length)
      notifySubscribers()
      
      // Actualizează statisticile
      if (result.length > 0) {
        const productStats = await productService.getProductStats();
        sharedStats = productStats
        notifySubscribers()
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
      
      // Actualizează starea partajată, păstrând elementele optimiste (dar nu cele în ștergere) și evitând duplicatele
      const optimisticProducts = sharedProducts.filter(p => p._isOptimistic && !p._isDeleting)
      
      // Filtrează rezultatele pentru a evita duplicatele cu produsele optimiste
      const filteredResult = result.filter(newProduct => {
        // Verifică dacă produsul nou există deja în lista optimistă
        return !optimisticProducts.some(optProduct => 
          optProduct._tempId && (
            optProduct.name === newProduct.name ||
            optProduct.code === newProduct.code ||
            optProduct.sku === newProduct.sku
          )
        )
      })
      
      sharedProducts = [...optimisticProducts, ...filteredResult]
      console.log('LoadProductsByCategory - optimistic count:', optimisticProducts.length, 'filtered result count:', filteredResult.length, 'total:', sharedProducts.length)
      notifySubscribers()
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
      
      // Actualizează starea partajată, păstrând elementele optimiste (dar nu cele în ștergere) și evitând duplicatele
      const optimisticProducts = sharedProducts.filter(p => p._isOptimistic && !p._isDeleting)
      
      // Filtrează rezultatele pentru a evita duplicatele cu produsele optimiste
      const filteredResult = result.filter(newProduct => {
        // Verifică dacă produsul nou există deja în lista optimistă
        return !optimisticProducts.some(optProduct => 
          optProduct._tempId && (
            optProduct.name === newProduct.name ||
            optProduct.code === newProduct.code ||
            optProduct.sku === newProduct.sku
          )
        )
      })
      
      sharedProducts = [...optimisticProducts, ...filteredResult]
      console.log('LoadLowStockProducts - optimistic count:', optimisticProducts.length, 'filtered result count:', filteredResult.length, 'total:', sharedProducts.length)
      notifySubscribers()
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
        
        // Actualizează starea partajată, păstrând elementele optimiste (dar nu cele în ștergere) și evitând duplicatele
        const optimisticProducts = sharedProducts.filter(p => p._isOptimistic && !p._isDeleting)
        
        // Filtrează rezultatele pentru a evita duplicatele cu produsele optimiste
        const filteredResult = result.filter(newProduct => {
          // Verifică dacă produsul nou există deja în lista optimistă
          return !optimisticProducts.some(optProduct => 
            optProduct._tempId && (
              optProduct.name === newProduct.name ||
              optProduct.code === newProduct.code ||
              optProduct.sku === newProduct.sku
            )
          )
        })
        
        sharedProducts = [...optimisticProducts, ...filteredResult]
        console.log('SearchProducts (empty) - optimistic count:', optimisticProducts.length, 'filtered result count:', filteredResult.length, 'total:', sharedProducts.length)
        notifySubscribers()
      } catch (err) {
        setError(err.message);
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
      
      // Actualizează starea partajată, păstrând elementele optimiste (dar nu cele în ștergere) și evitând duplicatele
      const optimisticProducts = sharedProducts.filter(p => p._isOptimistic && !p._isDeleting)
      
      // Filtrează rezultatele pentru a evita duplicatele cu produsele optimiste
      const filteredResult = result.filter(newProduct => {
        // Verifică dacă produsul nou există deja în lista optimistă
        return !optimisticProducts.some(optProduct => 
          optProduct._tempId && (
            optProduct.name === newProduct.name ||
            optProduct.code === newProduct.code ||
            optProduct.sku === newProduct.sku
          )
        )
      })
      
      sharedProducts = [...optimisticProducts, ...filteredResult]
      console.log('SearchProducts (with term) - optimistic count:', optimisticProducts.length, 'filtered result count:', filteredResult.length, 'total:', sharedProducts.length)
      notifySubscribers()
    } catch (err) {
      setError(err.message);
      console.error('Error searching products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Adaugă un produs nou cu optimistic update
  const addProduct = useCallback(async (productData) => {
    setLoading(true);
    setError(null);
    
    const tempId = generateTempId()
    console.log('Adding optimistic product:', productData)
    
    const optimisticProduct = {
      ...(productManager.transformForUI ? productManager.transformForUI(productData) : productData),
      _tempId: tempId,
      _isOptimistic: true,
      id: tempId,
      resourceId: tempId
    }
    
    console.log('Optimistic product created:', optimisticProduct)
    
    // Adaugă optimist în starea partajată
    sharedProducts = [optimisticProduct, ...sharedProducts]
    console.log('Updated sharedProducts:', sharedProducts)
    notifySubscribers()
    
    // Salvează în outbox pentru sincronizare
    try {
      await indexedDb.outboxAdd({
        type: 'create',
        resourceType: 'products',
        tempId: tempId,
        data: productData,
        timestamp: Date.now()
      })
    } catch (outboxErr) {
      console.warn('Failed to save to outbox:', outboxErr)
    }
    
    try {
      const result = await productService.addProduct(productData);
      return result;
    } catch (err) {
      // Rollback în caz de eroare
      sharedProducts = sharedProducts.filter(product => product._tempId !== tempId)
      notifySubscribers()
      setError(err.message);
      console.error('Error adding product:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizează un produs cu optimistic update
  const updateProduct = useCallback(async (id, productData) => {
    setLoading(true);
    setError(null);
    
    // Găsește produsul existent
    const existingIndex = sharedProducts.findIndex(product => 
      product.id === id || product.resourceId === id
    )
    
    if (existingIndex >= 0) {
      // Marchează ca optimist
      sharedProducts[existingIndex] = {
        ...sharedProducts[existingIndex],
        ...(productManager.transformForUI ? productManager.transformForUI(productData) : productData),
        _isOptimistic: true
      }
      notifySubscribers()
      
      // Salvează în outbox pentru sincronizare
      try {
        await indexedDb.outboxAdd({
          type: 'update',
          resourceType: 'products',
          resourceId: id,
          data: productData,
          timestamp: Date.now()
        })
      } catch (outboxErr) {
        console.warn('Failed to save to outbox:', outboxErr)
      }
    }
    
    try {
      const result = await productService.updateProduct(id, productData);
      return result;
    } catch (err) {
      // Rollback în caz de eroare
      if (existingIndex >= 0) {
        // Restaurează starea anterioară
        sharedProducts[existingIndex] = {
          ...sharedProducts[existingIndex],
          _isOptimistic: false
        }
        notifySubscribers()
      }
      setError(err.message);
      console.error('Error updating product:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Șterge un produs cu optimistic update
  const deleteProduct = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    console.log('DeleteProduct called with id:', id)
    
    // Marchează pentru ștergere optimistă
    const existingIndex = sharedProducts.findIndex(product => 
      product.id === id || product.resourceId === id
    )
    
    console.log('Found product at index:', existingIndex, 'product:', existingIndex >= 0 ? sharedProducts[existingIndex] : null)
    
    if (existingIndex >= 0) {
      const originalProduct = sharedProducts[existingIndex]
      sharedProducts[existingIndex] = {
        ...originalProduct,
        _isOptimistic: true,
        _isDeleting: true
      }
      console.log('Marked product for deletion:', sharedProducts[existingIndex])
      notifySubscribers()
      
      // Salvează în outbox pentru sincronizare
      try {
        await indexedDb.outboxAdd({
          type: 'delete',
          resourceType: 'products',
          resourceId: id,
          timestamp: Date.now()
        })
      } catch (outboxErr) {
        console.warn('Failed to save to outbox:', outboxErr)
      }
    }
    
    try {
      await productService.deleteProduct(id);
      return { success: true };
    } catch (err) {
      // Rollback în caz de eroare
      if (existingIndex >= 0) {
        sharedProducts[existingIndex] = {
          ...sharedProducts[existingIndex],
          _isOptimistic: false,
          _isDeleting: false
        }
        notifySubscribers()
      }
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
