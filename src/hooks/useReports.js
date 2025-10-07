import { useState, useEffect, useCallback } from 'react';
import { reportService } from '../services/reportService.js';
import { indexedDb } from '../data/infrastructure/db.js';
import { onResourceMessage } from '../data/infrastructure/websocketClient.js';

// Stare partajată la nivel de modul pentru sincronizare între instanțe
let sharedReports = []
let sharedStats = null
const subscribers = new Set()

// Funcție pentru notificarea abonaților
const notifySubscribers = () => {
  subscribers.forEach((callback, index) => {
    callback(sharedReports, sharedStats)
  })
}

export const useReports = () => {
  const [reports, setReports] = useState(sharedReports);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(sharedStats);

  // Check if we're in demo mode
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  // Debug logging pentru a vedea când se schimbă starea (only in non-demo mode)
  if (!isDemoMode) {
    console.log('useReports render - reports count:', reports.length, 'loading:', loading, 'error:', error)
  }

  // Abonare la schimbările de stare partajată
  useEffect(() => {
    const handleStateChange = (newReports, newStats) => {
      if (!isDemoMode) {
        console.log('State change received, reports count:', newReports.length, 'newReports:', newReports)
      }
      setReports([...newReports]) // Forțează o nouă referință
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

  // WebSocket handling pentru rapoarte (reflectă starea finală) - only in non-demo mode
  useEffect(() => {
    if (isDemoMode) return;

    const handler = async (message) => {
      const { type, data, resourceType } = message
      if (resourceType !== 'reports' && resourceType !== 'report') return
      const operation = type?.replace('resource_', '') || type
      const reportId = data?.id || data?.resourceId
      if (!reportId) return
      const ui = reportService.transformForUI ? reportService.transformForUI({ ...data, id: reportId, resourceId: reportId }) : { ...data, id: reportId, resourceId: reportId }
      if (operation === 'created' || operation === 'create') {
        const idx = sharedReports.findIndex(r => r.id === reportId || r.resourceId === reportId)
        if (idx >= 0) sharedReports[idx] = { ...ui, _isOptimistic: false }
        else sharedReports = [{ ...ui, _isOptimistic: false }, ...sharedReports]
        notifySubscribers()
      } else if (operation === 'updated' || operation === 'update') {
        const idx = sharedReports.findIndex(r => r.id === reportId || r.resourceId === reportId)
        if (idx >= 0) sharedReports[idx] = { ...ui, _isOptimistic: false }
        else sharedReports = [{ ...ui, _isOptimistic: false }, ...sharedReports]
        notifySubscribers()
      } else if (operation === 'deleted' || operation === 'delete') {
        sharedReports = sharedReports.filter(r => (r.id !== reportId && r.resourceId !== reportId))
        notifySubscribers()
      }
    }

    // Abonează-te la mesajele WebSocket pentru rapoarte
    const unsubPlural = onResourceMessage('reports', handler)
    const unsubSingular = onResourceMessage('report', handler)

    return () => {
      unsubPlural()
      unsubSingular()
    }
  }, [isDemoMode])

  // Încarcă toate rapoartele
  const loadReports = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      try {
        result = await reportService.loadReports(filters);
      } catch (apiError) {
        console.warn('API not available, loading from cache:', apiError);
        result = await indexedDb.getAll('report');
      }
      sharedReports = result;
      notifySubscribers();
      
    } catch (err) {
      // Doar setează eroarea dacă nu avem rapoarte în cache
      if (sharedReports.length === 0) {
        setError('Nu s-au putut încărca datele. Verifică conexiunea la internet.');
      } else {
        setError(null); // Nu afișa eroarea dacă avem date în cache
      }
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Încarcă rapoartele după dată
  const loadReportsByDate = useCallback(async (date) => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      try {
        result = await reportService.loadReportsByDate(date);
      } catch (apiError) {
        console.warn('API not available, loading from cache:', apiError);
        result = await indexedDb.getReportsByDate(date);
      }
      sharedReports = result;
      notifySubscribers();
    } catch (err) {
      // Doar setează eroarea dacă nu avem rapoarte în cache
      if (sharedReports.length === 0) {
        setError('Nu s-au putut încărca datele. Verifică conexiunea la internet.');
      } else {
        setError(null); // Nu afișa eroarea dacă avem date în cache
      }
      console.error('Error loading reports by date:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Încarcă rapoartele pentru o perioadă
  const loadReportsByDateRange = useCallback(async (startDate, endDate) => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      try {
        result = await reportService.loadReportsByDateRange(startDate, endDate);
      } catch (apiError) {
        console.warn('API not available, loading from cache:', apiError);
        result = await indexedDb.getReportsByDateRange(startDate, endDate);
      }
      sharedReports = result;
      notifySubscribers();
    } catch (err) {
      // Doar setează eroarea dacă nu avem rapoarte în cache
      if (sharedReports.length === 0) {
        setError('Nu s-au putut încărca datele. Verifică conexiunea la internet.');
      } else {
        setError(null); // Nu afișa eroarea dacă avem date în cache
      }
      console.error('Error loading reports by date range:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Generează un raport nou
  const generateReport = useCallback(async (sales, products, treatments, date) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await reportService.generateDailyReport(sales, products, treatments, date);
      const ui = reportService.transformForUI ? reportService.transformForUI(result) : result
      const idx = sharedReports.findIndex(r => r.id === ui.id || r.resourceId === ui.resourceId)
      if (idx >= 0) sharedReports[idx] = { ...ui, _isOptimistic: false }
      else sharedReports = [ui, ...sharedReports]
      notifySubscribers()
      
      return ui
    } catch (err) {
      setError(err.message);
      console.error('Error generating report:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizează un raport
  const updateReport = useCallback(async (id, reportData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await reportService.updateReport(id, reportData);
      const ui = reportService.transformForUI ? reportService.transformForUI(result) : result
      const existingIndex = sharedReports.findIndex(r => r.id === id || r.resourceId === id)
      if (existingIndex >= 0) sharedReports[existingIndex] = { ...ui, _isOptimistic: false }
      notifySubscribers()
      return ui;
    } catch (err) {
      setError(err.message);
      console.error('Error updating report:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Șterge un raport
  const deleteReport = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      await reportService.deleteReport(id);
      sharedReports = sharedReports.filter(r => (r.id !== id && r.resourceId !== id))
      notifySubscribers()
      return { success: true };
    } catch (err) {
      setError(err.message);
      console.error('Error deleting report:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obține un raport după ID
  const getReportById = useCallback(async (id) => {
    try {
      const result = await reportService.getReportById(id);
      return result;
    } catch (err) {
      console.error('Error getting report by ID:', err);
      throw err;
    }
  }, []);

  // Exportă rapoartele
  const exportReports = useCallback(async (format = 'json', filters = {}) => {
    try {
      return await reportService.exportReports(format, filters);
    } catch (err) {
      console.error('Error exporting reports:', err);
      throw err;
    }
  }, []);

  // Filtrează rapoartele
  const filterReports = useCallback((filters = {}) => {
    let filtered = [...reports];

    // Filtrare după dată
    if (filters.date) {
      filtered = filtered.filter(report => report.date === filters.date);
    }

    // Filtrare după perioada de timp
    if (filters.startDate && filters.endDate) {
      filtered = filtered.filter(report => {
        const reportDate = new Date(report.date);
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);
        return reportDate >= startDate && reportDate <= endDate;
      });
    }

    // Filtrare după status
    if (filters.status) {
      filtered = filtered.filter(report => report.status === filters.status);
    }

    // Filtrare după tip
    if (filters.type) {
      filtered = filtered.filter(report => report.type === filters.type);
    }

    // Filtrare după căutare
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(report =>
        report.title.toLowerCase().includes(searchTerm) ||
        report.description.toLowerCase().includes(searchTerm) ||
        report.reportId.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  }, [reports]);

  // Sortează rapoartele
  const sortReports = useCallback((sortBy = 'date', sortOrder = 'desc') => {
    const sorted = [...reports];

    sorted.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'generatedAt':
          aValue = new Date(a.generatedAt);
          bValue = new Date(b.generatedAt);
          break;
        case 'fileSize':
          aValue = a.fileSize || 0;
          bValue = b.fileSize || 0;
          break;
        default:
          aValue = new Date(a.date);
          bValue = new Date(b.date);
      }

      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });

    return sorted;
  }, [reports]);

  // Încarcă rapoartele la prima renderizare
  useEffect(() => {
    // Verifică dacă avem deja rapoarte încărcate pentru a evita încărcări multiple
    if (sharedReports.length === 0) {
      loadReports();
    }
  }, []); // Nu mai avem dependențe pentru a evita re-renderizările infinite

  return {
    // State
    reports,
    loading,
    error,
    stats,
    
    // Actions
    loadReports,
    loadReportsByDate,
    loadReportsByDateRange,
    generateReport,
    updateReport,
    deleteReport,
    getReportById,
    exportReports,
    
    // Utilitare
    filterReports,
    sortReports,
    clearError: () => setError(null),
    
    // Service utilities
    reportService
  };
};
