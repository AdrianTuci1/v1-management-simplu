import { useState, useEffect, useCallback } from 'react';
import { salesService } from '../services/salesService.js';
import { salesManager } from '../business/salesManager.js';
import { indexedDb } from '../data/infrastructure/db.js';
import { onResourceMessage } from '../data/infrastructure/websocketClient.js';
import useSettingsStore from '../stores/settingsStore.js';

// Stare partajată la nivel de modul pentru sincronizare între instanțe
let sharedSales = []
let sharedStats = null
const subscribers = new Set()

// Funcție pentru notificarea abonaților
const notifySubscribers = () => {
  subscribers.forEach((callback, index) => {
    callback(sharedSales, sharedStats)
  })
}

export const useSales = () => {
  const [sales, setSales] = useState(sharedSales);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(sharedStats);
  const { taxSettings } = useSettingsStore();

  // Check if we're in demo mode
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  // Debug logging pentru a vedea când se schimbă starea (only in non-demo mode)
  if (!isDemoMode) {
    console.log('useSales render - sales count:', sales.length, 'loading:', loading, 'error:', error)
  }

  // Abonare la schimbările de stare partajată
  useEffect(() => {
    const handleStateChange = (newSales, newStats) => {
      if (!isDemoMode) {
        console.log('State change received, sales count:', newSales.length, 'newSales:', newSales)
      }
      setSales([...newSales]) // Forțează o nouă referință
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

  // WebSocket handling pentru vânzări (reflectă starea finală) - only in non-demo mode
  useEffect(() => {
    if (isDemoMode) return;

    const handler = async (message) => {
      const { type, data, resourceType } = message
      if (resourceType !== 'sales' && resourceType !== 'sale') return
      const operation = type?.replace('resource_', '') || type
      const saleId = data?.id || data?.resourceId
      if (!saleId) return
      const ui = salesManager.transformForUI ? salesManager.transformForUI({ ...data, id: saleId, resourceId: saleId }) : { ...data, id: saleId, resourceId: saleId }
      if (operation === 'created' || operation === 'create') {
        const idx = sharedSales.findIndex(s => s.id === saleId || s.resourceId === saleId)
        if (idx >= 0) sharedSales[idx] = { ...ui, _isOptimistic: false }
        else sharedSales = [{ ...ui, _isOptimistic: false }, ...sharedSales]
        notifySubscribers()
      } else if (operation === 'updated' || operation === 'update') {
        const idx = sharedSales.findIndex(s => s.id === saleId || s.resourceId === saleId)
        if (idx >= 0) sharedSales[idx] = { ...ui, _isOptimistic: false }
        else sharedSales = [{ ...ui, _isOptimistic: false }, ...sharedSales]
        notifySubscribers()
      } else if (operation === 'deleted' || operation === 'delete') {
        sharedSales = sharedSales.filter(s => (s.id !== saleId && s.resourceId !== saleId))
        notifySubscribers()
      }
    }

    // Abonează-te la mesajele WebSocket pentru vânzări
    const unsubPlural = onResourceMessage('sales', handler)
    const unsubSingular = onResourceMessage('sale', handler)

    return () => {
      unsubPlural()
      unsubSingular()
    }
  }, [isDemoMode])

  // Încarcă toate vânzările
  const loadSales = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      try {
        result = await salesService.loadSales(filters);
      } catch (apiError) {
        console.warn('API not available, loading from cache:', apiError);
        result = await indexedDb.getAll('sale');
      }
      sharedSales = result;
      notifySubscribers();
      
      // Actualizează statisticile
      if (result.length > 0) {
        const salesStats = await salesService.getSalesStats(filters);
        sharedStats = salesStats
        notifySubscribers()
      }
      
    } catch (err) {
      // Doar setează eroarea dacă nu avem vânzări în cache
      if (sharedSales.length === 0) {
        setError('Nu s-au putut încărca datele. Verifică conexiunea la internet.');
      } else {
        setError(null); // Nu afișa eroarea dacă avem date în cache
      }
      console.error('Error loading sales:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Încarcă vânzările după dată
  const loadSalesByDate = useCallback(async (date) => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      try {
        result = await salesService.loadSalesByDate(date);
      } catch (apiError) {
        console.warn('API not available, loading from cache:', apiError);
        result = await indexedDb.getSalesByDate(date);
      }
      sharedSales = result;
      notifySubscribers();
    } catch (err) {
      // Doar setează eroarea dacă nu avem vânzări în cache
      if (sharedSales.length === 0) {
        setError('Nu s-au putut încărca datele. Verifică conexiunea la internet.');
      } else {
        setError(null); // Nu afișa eroarea dacă avem date în cache
      }
      console.error('Error loading sales by date:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Încarcă vânzările pentru o perioadă
  const loadSalesByDateRange = useCallback(async (startDate, endDate) => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      try {
        result = await salesService.loadSalesByDateRange(startDate, endDate);
      } catch (apiError) {
        console.warn('API not available, loading from cache:', apiError);
        result = await indexedDb.getSalesByDateRange(startDate, endDate);
      }
      sharedSales = result;
      notifySubscribers();
    } catch (err) {
      // Doar setează eroarea dacă nu avem vânzări în cache
      if (sharedSales.length === 0) {
        setError('Nu s-au putut încărca datele. Verifică conexiunea la internet.');
      } else {
        setError(null); // Nu afișa eroarea dacă avem date în cache
      }
      console.error('Error loading sales by date range:', err);
    } finally {
      setLoading(false);
    }
  }, []);


  // Creează o vânzare nouă (optimism gestionat în Repository)
  const createSale = useCallback(async (saleData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await salesService.createSale(saleData);
      const ui = salesManager.transformForUI ? salesManager.transformForUI(result) : result
      const idx = sharedSales.findIndex(s => s.id === ui.id || s.resourceId === ui.resourceId)
      if (idx >= 0) sharedSales[idx] = { ...ui, _isOptimistic: false }
      else sharedSales = [ui, ...sharedSales]
      notifySubscribers()
      
      // Actualizează statisticile
      const salesStats = await salesService.getSalesStats();
      sharedStats = salesStats
      notifySubscribers()
      
      return ui
    } catch (err) {
      setError(err.message);
      console.error('Error creating sale:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizează o vânzare (optimism gestionat în Repository)
  const updateSale = useCallback(async (id, saleData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await salesService.updateSale(id, saleData);
      const ui = salesManager.transformForUI ? salesManager.transformForUI(result) : result
      const existingIndex = sharedSales.findIndex(s => s.id === id || s.resourceId === id)
      if (existingIndex >= 0) sharedSales[existingIndex] = { ...ui, _isOptimistic: false }
      notifySubscribers()
      return ui;
    } catch (err) {
      setError(err.message);
      console.error('Error updating sale:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Șterge o vânzare (optimism gestionat în Repository)
  const deleteSale = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      await salesService.deleteSale(id);
      sharedSales = sharedSales.filter(s => (s.id !== id && s.resourceId !== id))
      notifySubscribers()
      return { success: true };
    } catch (err) {
      setError(err.message);
      console.error('Error deleting sale:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obține statisticile
  const getStats = useCallback(async (filters = {}) => {
    try {
      const result = await salesService.getSalesStats(filters);
      sharedStats = result
      notifySubscribers()
      return result;
    } catch (err) {
      console.error('Error getting sales stats:', err);
      throw err;
    }
  }, []);

  // Exportă vânzările
  const exportSales = useCallback(async (format = 'json', filters = {}) => {
    try {
      return await salesService.exportSales(format, filters);
    } catch (err) {
      console.error('Error exporting sales:', err);
      throw err;
    }
  }, []);

  // Filtrează vânzările
  const filterSales = useCallback((filters = {}) => {
    return salesManager.filterSales(sales, filters);
  }, [sales]);

  // Sortează vânzările
  const sortSales = useCallback((sortBy = 'date', sortOrder = 'desc') => {
    return salesManager.sortSales(sales, sortBy, sortOrder);
  }, [sales]);

  // Calculează totalul unei vânzări cu TVA-ul din setări
  const calculateSaleTotal = useCallback((items, taxRate) => {
    // Folosește TVA-ul din setări dacă nu este specificat altul
    const effectiveTaxRate = taxRate !== undefined ? taxRate : (taxSettings?.defaultVAT ? taxSettings.defaultVAT / 100 : 0.19);
    return salesManager.calculateSaleTotal(items, effectiveTaxRate);
  }, [taxSettings]);

  // Încarcă vânzările la prima renderizare
  useEffect(() => {
    // Verifică dacă avem deja vânzări încărcate pentru a evita încărcări multiple
    if (sharedSales.length === 0) {
      loadSales();
    }
  }, []); // Nu mai avem dependențe pentru a evita re-renderizările infinite

  return {
    // State
    sales,
    loading,
    error,
    stats,
    
    // Actions
    loadSales,
    loadSalesByDate,
    loadSalesByDateRange,
    createSale,
    updateSale,
    deleteSale,
    getStats,
    exportSales,
    
    // Utilitare
    filterSales,
    sortSales,
    calculateSaleTotal,
    clearError: () => setError(null),
    
    // Manager utilities
    salesManager
  };
};