import { useState, useEffect, useCallback } from 'react';
import { invoiceService } from '../services/invoiceService.js';
import { invoiceManager } from '../business/invoiceManager.js';
import { indexedDb } from '../data/infrastructure/db.js';
import { onResourceMessage } from '../data/infrastructure/websocketClient.js';

// Stare partajată la nivel de modul pentru sincronizare între instanțe
let sharedInvoices = []
let sharedStats = null
const subscribers = new Set()

// Funcție pentru notificarea abonaților
const notifySubscribers = () => {
  subscribers.forEach((callback, index) => {
    callback(sharedInvoices, sharedStats)
  })
}

export const useInvoices = () => {
  const [invoices, setInvoices] = useState(sharedInvoices);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(sharedStats);

  // Check if we're in demo mode
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  // Debug logging pentru a vedea când se schimbă starea (only in non-demo mode)
  if (!isDemoMode) {
    console.log('useInvoices render - invoices count:', invoices.length, 'loading:', loading, 'error:', error)
  }

  // Inițializare și abonare la schimbările de stare partajată
  useEffect(() => {
    // Inițializează din starea partajată
    setInvoices([...sharedInvoices])
    setStats(sharedStats)
    
    const handleStateChange = (newInvoices, newStats) => {
      if (!isDemoMode) {
        console.log('State change received, invoices count:', newInvoices.length, 'newInvoices:', newInvoices)
      }
      setInvoices([...newInvoices]) // Forțează o nouă referință
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

  // WebSocket handling pentru facturi (reflectă starea finală) - only in non-demo mode
  useEffect(() => {
    if (isDemoMode) return;

    const handler = async (message) => {
      const { type, data, resourceType } = message
      if (resourceType !== 'invoice') return
      const operation = type?.replace('resource_', '') || type
      const invoiceId = data?.id || data?.resourceId
      if (!invoiceId) return
      
      try {
        if (operation === 'created' || operation === 'create') {
          // Înlocuiește factura optimistă cu datele reale
          const ui = invoiceManager.transformForUI ? invoiceManager.transformForUI({ ...data, id: invoiceId, resourceId: invoiceId }) : { ...data, id: invoiceId, resourceId: invoiceId }
          
          // Caută în outbox pentru a găsi operația optimistică folosind ID-ul real
          const outboxEntry = await indexedDb.outboxFindByResourceId(invoiceId, 'invoice')
          
          if (outboxEntry) {
            const optimisticIndex = sharedInvoices.findIndex(i => i._tempId === outboxEntry.tempId)
            if (optimisticIndex >= 0) {
              sharedInvoices[optimisticIndex] = { ...ui, _isOptimistic: false }
            }
            await indexedDb.outboxDelete(outboxEntry.id)
          } else {
            // Dacă nu găsim în outbox, încercăm să găsim după euristică
            const optimisticIndex = sharedInvoices.findIndex(i => 
              i._isOptimistic && 
              i.clientId === data.clientId &&
              i.issueDate === data.issueDate &&
              Math.abs((i.total || 0) - (data.total || 0)) < 0.01
            )
            if (optimisticIndex >= 0) {
              sharedInvoices[optimisticIndex] = { ...ui, _isOptimistic: false }
            } else {
              // Verifică dacă nu există deja (evită dubluri)
              const existingIndex = sharedInvoices.findIndex(i => i.id === invoiceId || i.resourceId === invoiceId)
              if (existingIndex >= 0) {
                sharedInvoices[existingIndex] = { ...ui, _isOptimistic: false }
              } else {
                // Adaugă ca nou doar dacă nu există deloc
                sharedInvoices = [{ ...ui, _isOptimistic: false }, ...sharedInvoices]
              }
            }
          }
          
          notifySubscribers()
        } else if (operation === 'updated' || operation === 'update') {
          // Dezactivează flag-ul optimistic
          const ui = invoiceManager.transformForUI ? invoiceManager.transformForUI({ ...data, id: invoiceId, resourceId: invoiceId }) : { ...data, id: invoiceId, resourceId: invoiceId }
          const existingIndex = sharedInvoices.findIndex(i => 
            i.id === invoiceId || i.resourceId === invoiceId
          )
          if (existingIndex >= 0) {
            sharedInvoices[existingIndex] = { ...ui, _isOptimistic: false }
          }
          
          notifySubscribers()
        } else if (operation === 'deleted' || operation === 'delete') {
          // Elimină factura din lista locală
          sharedInvoices = sharedInvoices.filter(i => {
            const matches = i.id === invoiceId || i.resourceId === invoiceId
            return !matches
          })
          notifySubscribers()
        }
      } catch (error) {
        console.error('Error handling invoice WebSocket message:', error)
      }
    }

    // Abonează-te la mesajele WebSocket pentru facturi
    const unsub = onResourceMessage('invoice', handler)

    return () => {
      unsub()
    }
  }, [isDemoMode])

  // Încarcă toate facturile
  const loadInvoices = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      try {
        result = await invoiceService.loadInvoices(filters);
      } catch (apiError) {
        console.warn('API not available, loading from cache:', apiError);
        result = await indexedDb.getAll('invoice');
      }
      sharedInvoices = result;
      notifySubscribers();
      
      // Actualizează statisticile
      if (result.length > 0) {
        const invoiceStats = await invoiceService.getInvoiceStats(filters);
        sharedStats = invoiceStats
        notifySubscribers()
      }
      
    } catch (err) {
      // Doar setează eroarea dacă nu avem facturi în cache
      if (sharedInvoices.length === 0) {
        setError('Nu s-au putut încărca datele. Verifică conexiunea la internet.');
      } else {
        setError(null); // Nu afișa eroarea dacă avem date în cache
      }
      console.error('Error loading invoices:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Încarcă facturile după dată
  const loadInvoicesByDate = useCallback(async (date) => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      try {
        result = await invoiceService.loadInvoicesByDate(date);
      } catch (apiError) {
        console.warn('API not available, loading from cache:', apiError);
        result = await indexedDb.getInvoicesByDate(date);
      }
      sharedInvoices = result;
      notifySubscribers();
    } catch (err) {
      // Doar setează eroarea dacă nu avem facturi în cache
      if (sharedInvoices.length === 0) {
        setError('Nu s-au putut încărca datele. Verifică conexiunea la internet.');
      } else {
        setError(null); // Nu afișa eroarea dacă avem date în cache
      }
      console.error('Error loading invoices by date:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Încarcă facturile pentru o perioadă
  const loadInvoicesByDateRange = useCallback(async (startDate, endDate) => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      try {
        result = await invoiceService.loadInvoicesByDateRange(startDate, endDate);
      } catch (apiError) {
        console.warn('API not available, loading from cache:', apiError);
        result = await indexedDb.getInvoicesByDateRange(startDate, endDate);
      }
      sharedInvoices = result;
      notifySubscribers();
    } catch (err) {
      // Doar setează eroarea dacă nu avem facturi în cache
      if (sharedInvoices.length === 0) {
        setError('Nu s-au putut încărca datele. Verifică conexiunea la internet.');
      } else {
        setError(null); // Nu afișa eroarea dacă avem date în cache
      }
      console.error('Error loading invoices by date range:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Creează o factură nouă (optimism gestionat în Repository)
  const createInvoice = useCallback(async (invoiceData) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔵 useInvoices.createInvoice - Starting with data:', invoiceData);
      const result = await invoiceService.createInvoice(invoiceData);
      console.log('🔵 useInvoices.createInvoice - Result from service:', result);
      
      const ui = invoiceManager.transformForUI ? invoiceManager.transformForUI(result) : result
      console.log('🔵 useInvoices.createInvoice - UI transformed:', ui);
      console.log('🔵 useInvoices.createInvoice - Current sharedInvoices count:', sharedInvoices.length);
      
      const idx = sharedInvoices.findIndex(i => i.id === ui.id || i.resourceId === ui.resourceId)
      console.log('🔵 useInvoices.createInvoice - Found at index:', idx);
      
      if (idx >= 0) {
        sharedInvoices[idx] = { ...ui, _isOptimistic: false }
        console.log('🔵 useInvoices.createInvoice - Updated existing invoice at index', idx);
      } else {
        sharedInvoices = [ui, ...sharedInvoices]
        console.log('🔵 useInvoices.createInvoice - Added new invoice, new count:', sharedInvoices.length);
      }
      
      notifySubscribers()
      console.log('🔵 useInvoices.createInvoice - Notified subscribers');
      
      // Actualizează statisticile
      const invoiceStats = await invoiceService.getInvoiceStats();
      sharedStats = invoiceStats
      notifySubscribers()
      
      return ui
    } catch (err) {
      setError(err.message);
      console.error('❌ Error creating invoice in hook:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizează o factură (optimism gestionat în Repository)
  const updateInvoice = useCallback(async (id, invoiceData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await invoiceService.updateInvoice(id, invoiceData);
      const ui = invoiceManager.transformForUI ? invoiceManager.transformForUI(result) : result
      const existingIndex = sharedInvoices.findIndex(i => i.id === id || i.resourceId === id)
      if (existingIndex >= 0) sharedInvoices[existingIndex] = { ...ui, _isOptimistic: false }
      notifySubscribers()
      return ui;
    } catch (err) {
      setError(err.message);
      console.error('Error updating invoice:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Șterge o factură (optimism gestionat în Repository)
  const deleteInvoice = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      await invoiceService.deleteInvoice(id);
      sharedInvoices = sharedInvoices.filter(i => (i.id !== id && i.resourceId !== id))
      notifySubscribers()
      return { success: true };
    } catch (err) {
      setError(err.message);
      console.error('Error deleting invoice:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Trimite factura la eFactura
  const sendToEFactura = useCallback(async (invoiceId) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await invoiceService.sendToEFactura(invoiceId);
      const ui = invoiceManager.transformForUI ? invoiceManager.transformForUI(result) : result
      const existingIndex = sharedInvoices.findIndex(i => i.id === invoiceId || i.resourceId === invoiceId)
      if (existingIndex >= 0) sharedInvoices[existingIndex] = { ...ui, _isOptimistic: false }
      notifySubscribers()
      return ui;
    } catch (err) {
      setError(err.message);
      console.error('Error sending to eFactura:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obține statisticile
  const getStats = useCallback(async (filters = {}) => {
    try {
      const result = await invoiceService.getInvoiceStats(filters);
      sharedStats = result
      notifySubscribers()
      return result;
    } catch (err) {
      console.error('Error getting invoice stats:', err);
      throw err;
    }
  }, []);

  // Exportă facturile
  const exportInvoices = useCallback(async (format = 'json', filters = {}) => {
    try {
      return await invoiceService.exportInvoices(format, filters);
    } catch (err) {
      console.error('Error exporting invoices:', err);
      throw err;
    }
  }, []);

  // Filtrează facturile
  const filterInvoices = useCallback((filters = {}) => {
    return invoiceManager.filterInvoices(invoices, filters);
  }, [invoices]);

  // Sortează facturile
  const sortInvoices = useCallback((sortBy = 'issueDate', sortOrder = 'desc') => {
    return invoiceManager.sortInvoices(invoices, sortBy, sortOrder);
  }, [invoices]);

  // Funcție pentru sortarea facturilor cu prioritizare pentru optimistic updates
  const getSortedInvoices = useCallback((sortBy = 'issueDate', sortOrder = 'desc') => {
    const baseSorted = invoiceManager.sortInvoices ? invoiceManager.sortInvoices(sharedInvoices, sortBy, sortOrder) : [...sharedInvoices]
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

  // Încarcă facturile la prima montare dacă cache-ul este gol
  useEffect(() => {
    if (sharedInvoices.length === 0) {
      loadInvoices();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // State
    invoices,
    loading,
    error,
    stats,
    
    // Actions
    loadInvoices,
    loadInvoicesByDate,
    loadInvoicesByDateRange,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    sendToEFactura,
    getStats,
    exportInvoices,
    
    // Utilitare
    filterInvoices,
    sortInvoices,
    getSortedInvoices,
    clearError: () => setError(null),
    
    // Manager utilities
    invoiceManager
  };
};
