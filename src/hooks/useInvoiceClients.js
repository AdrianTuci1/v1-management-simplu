import { useState, useEffect, useCallback } from 'react';
import { invoiceClientService } from '../services/invoiceClientService.js';
import { invoiceClientManager } from '../business/invoiceClientManager.js';
import { indexedDb } from '../data/infrastructure/db.js';
import { onResourceMessage } from '../data/infrastructure/websocketClient.js';

// Stare partajată la nivel de modul pentru sincronizare între instanțe
let sharedClients = []
let sharedStats = null
const subscribers = new Set()

// Funcție pentru notificarea abonaților
const notifySubscribers = () => {
  subscribers.forEach((callback, index) => {
    callback(sharedClients, sharedStats)
  })
}

export const useInvoiceClients = () => {
  const [clients, setClients] = useState(sharedClients);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(sharedStats);

  // Check if we're in demo mode
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  // Debug logging pentru a vedea când se schimbă starea (only in non-demo mode)
  if (!isDemoMode) {
    console.log('useInvoiceClients render - clients count:', clients.length, 'loading:', loading, 'error:', error)
  }

  // Abonare la schimbările de stare partajată
  useEffect(() => {
    const handleStateChange = (newClients, newStats) => {
      if (!isDemoMode) {
        console.log('State change received, clients count:', newClients.length, 'newClients:', newClients)
      }
      setClients([...newClients]) // Forțează o nouă referință
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

  // WebSocket handling pentru clienți (reflectă starea finală) - only in non-demo mode
  useEffect(() => {
    if (isDemoMode) return;

    const handler = async (message) => {
      const { type, data, resourceType } = message
      if (resourceType !== 'invoice-clients' && resourceType !== 'invoice-client') return
      const operation = type?.replace('resource_', '') || type
      const clientId = data?.id || data?.resourceId
      if (!clientId) return
      const ui = invoiceClientManager.transformForUI ? invoiceClientManager.transformForUI({ ...data, id: clientId, resourceId: clientId }) : { ...data, id: clientId, resourceId: clientId }
      if (operation === 'created' || operation === 'create') {
        const idx = sharedClients.findIndex(c => c.id === clientId || c.resourceId === clientId)
        if (idx >= 0) sharedClients[idx] = { ...ui, _isOptimistic: false }
        else sharedClients = [{ ...ui, _isOptimistic: false }, ...sharedClients]
        notifySubscribers()
      } else if (operation === 'updated' || operation === 'update') {
        const idx = sharedClients.findIndex(c => c.id === clientId || c.resourceId === clientId)
        if (idx >= 0) sharedClients[idx] = { ...ui, _isOptimistic: false }
        else sharedClients = [{ ...ui, _isOptimistic: false }, ...sharedClients]
        notifySubscribers()
      } else if (operation === 'deleted' || operation === 'delete') {
        sharedClients = sharedClients.filter(c => (c.id !== clientId && c.resourceId !== clientId))
        notifySubscribers()
      }
    }

    // Abonează-te la mesajele WebSocket pentru clienți
    const unsubPlural = onResourceMessage('invoice-clients', handler)
    const unsubSingular = onResourceMessage('invoice-client', handler)

    return () => {
      unsubPlural()
      unsubSingular()
    }
  }, [isDemoMode])

  // Încarcă toți clienții
  const loadClients = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      try {
        result = await invoiceClientService.loadClients(filters);
      } catch (apiError) {
        console.warn('API not available, loading from cache:', apiError);
        result = await indexedDb.getAll('invoice-client');
      }
      sharedClients = result;
      notifySubscribers();
      
      // Actualizează statisticile
      if (result.length > 0) {
        const clientStats = invoiceClientManager.calculateStats(result);
        sharedStats = clientStats
        notifySubscribers()
      }
      
    } catch (err) {
      // Doar setează eroarea dacă nu avem clienți în cache
      if (sharedClients.length === 0) {
        setError('Nu s-au putut încărca datele. Verifică conexiunea la internet.');
      } else {
        setError(null); // Nu afișa eroarea dacă avem date în cache
      }
      console.error('Error loading clients:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Caută clienți
  const searchClients = useCallback(async (searchTerm) => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      try {
        result = await invoiceClientService.searchClients(searchTerm);
      } catch (apiError) {
        console.warn('API not available, searching in cache:', apiError);
        const allClients = await indexedDb.getAll('invoice-client');
        result = invoiceClientManager.searchClients(allClients, searchTerm);
      }
      sharedClients = result;
      notifySubscribers();
    } catch (err) {
      setError('Nu s-au putut căuta clienții. Verifică conexiunea la internet.');
      console.error('Error searching clients:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Creează un client nou (optimism gestionat în Repository)
  const createClient = useCallback(async (clientData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await invoiceClientService.createClient(clientData);
      const ui = invoiceClientManager.transformForUI ? invoiceClientManager.transformForUI(result) : result
      const idx = sharedClients.findIndex(c => c.id === ui.id || c.resourceId === ui.resourceId)
      if (idx >= 0) sharedClients[idx] = { ...ui, _isOptimistic: false }
      else sharedClients = [ui, ...sharedClients]
      notifySubscribers()
      
      // Actualizează statisticile
      const clientStats = invoiceClientManager.calculateStats(sharedClients);
      sharedStats = clientStats
      notifySubscribers()
      
      return ui
    } catch (err) {
      setError(err.message);
      console.error('Error creating client:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizează un client (optimism gestionat în Repository)
  const updateClient = useCallback(async (id, clientData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await invoiceClientService.updateClient(id, clientData);
      const ui = invoiceClientManager.transformForUI ? invoiceClientManager.transformForUI(result) : result
      const existingIndex = sharedClients.findIndex(c => c.id === id || c.resourceId === id)
      if (existingIndex >= 0) sharedClients[existingIndex] = { ...ui, _isOptimistic: false }
      notifySubscribers()
      return ui;
    } catch (err) {
      setError(err.message);
      console.error('Error updating client:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Șterge un client (optimism gestionat în Repository)
  const deleteClient = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      await invoiceClientService.deleteClient(id);
      sharedClients = sharedClients.filter(c => (c.id !== id && c.resourceId !== id))
      notifySubscribers()
      return { success: true };
    } catch (err) {
      setError(err.message);
      console.error('Error deleting client:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obține un client după ID
  const getClient = useCallback(async (id) => {
    try {
      const result = await invoiceClientService.getClient(id);
      return result;
    } catch (err) {
      console.error('Error getting client:', err);
      throw err;
    }
  }, []);

  // Verifică dacă există duplicat
  const checkDuplicateClient = useCallback(async (cui, cnp) => {
    try {
      const result = await invoiceClientService.checkDuplicateClient(cui, cnp);
      return result;
    } catch (err) {
      console.error('Error checking duplicate client:', err);
      return false;
    }
  }, []);

  // Obține statisticile
  const getStats = useCallback(async (filters = {}) => {
    try {
      const result = invoiceClientManager.calculateStats(clients);
      sharedStats = result
      notifySubscribers()
      return result;
    } catch (err) {
      console.error('Error getting client stats:', err);
      throw err;
    }
  }, [clients]);

  // Exportă clienții
  const exportClients = useCallback(async (format = 'json', filters = {}) => {
    try {
      return invoiceClientManager.exportData(clients, format);
    } catch (err) {
      console.error('Error exporting clients:', err);
      throw err;
    }
  }, [clients]);

  // Filtrează clienții
  const filterClients = useCallback((filters = {}) => {
    return invoiceClientManager.searchClients(clients, filters.search || '');
  }, [clients]);

  // Sortează clienții
  const sortClients = useCallback((sortBy = 'clientName', sortOrder = 'asc') => {
    return invoiceClientManager.sortClients(clients, sortBy, sortOrder);
  }, [clients]);

  // Încarcă clienții la prima renderizare
  useEffect(() => {
    // Verifică dacă avem deja clienți încărcați pentru a evita încărcări multiple
    if (sharedClients.length === 0) {
      loadClients();
    }
  }, []); // Nu mai avem dependențe pentru a evita re-renderizările infinite

  return {
    // State
    clients,
    loading,
    error,
    stats,
    
    // Actions
    loadClients,
    searchClients,
    createClient,
    updateClient,
    deleteClient,
    getClient,
    checkDuplicateClient,
    getStats,
    exportClients,
    
    // Utilitare
    filterClients,
    sortClients,
    clearError: () => setError(null),
    
    // Manager utilities
    invoiceClientManager
  };
};
