/**
 * Hook pentru health monitoring folosind HealthRepository
 * 
 * Acest hook oferă:
 * - Starea curentă a conexiunii și serverului
 * - Funcții pentru verificarea stării
 * - Auto-update când se schimbă starea
 * - Gestionare automată a evenimentelor de rețea
 */

import { useState, useEffect, useCallback } from 'react';
import { healthRepository } from '../data/repositories/HealthRepository.js';

export function useHealthRepository() {
  const [healthStatus, setHealthStatus] = useState(healthRepository.getCurrentStatus());
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Actualizează starea health status-ului
   */
  const updateHealthStatus = useCallback(() => {
    const newStatus = healthRepository.getCurrentStatus();
    setHealthStatus(newStatus);
  }, []);

  /**
   * Execută un health check manual
   */
  const performHealthCheck = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await healthRepository.checkServerHealth();
      updateHealthStatus();
      return result;
    } catch (error) {
      console.error('Health check failed:', error);
      updateHealthStatus();
      return {
        success: false,
        error: error.message
      };
    } finally {
      setIsLoading(false);
    }
  }, [updateHealthStatus]);

  /**
   * Verifică starea conexiunii la internet
   */
  const checkNetworkStatus = useCallback(() => {
    const networkStatus = healthRepository.checkNetworkStatus();
    updateHealthStatus();
    return networkStatus;
  }, [updateHealthStatus]);

  /**
   * Gestionează evenimentul de online
   */
  const handleOnline = useCallback(async () => {
    healthRepository.setNetworkStatus(true);
    updateHealthStatus();
    
    // Verifică imediat serverul când revenim online
    await performHealthCheck();
  }, [performHealthCheck, updateHealthStatus]);

  /**
   * Gestionează evenimentul de offline
   */
  const handleOffline = useCallback(() => {
    healthRepository.setNetworkStatus(false);
    updateHealthStatus();
  }, [updateHealthStatus]);

  /**
   * Setează up monitoring-ul automat
   */
  useEffect(() => {
    // Verifică starea inițială
    updateHealthStatus();

    // Setează event listeners pentru online/offline
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verifică periodic starea serverului (la 30 secunde)
    const healthCheckInterval = setInterval(async () => {
      if (navigator.onLine) {
        await performHealthCheck();
      }
    }, 30000);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(healthCheckInterval);
    };
  }, [handleOnline, handleOffline, performHealthCheck, updateHealthStatus]);

  return {
    // Starea curentă
    healthStatus,
    isLoading,
    
    // Funcții pentru verificare
    performHealthCheck,
    checkNetworkStatus,
    
    // Valori calculate
    isHealthy: healthStatus.isHealthy,
    isOffline: healthStatus.isOffline,
    isServerDown: healthStatus.isServerDown,
    canMakeRequests: healthStatus.canMakeRequests,
    
    // Valori individuale
    isOnline: healthStatus.isOnline,
    serverHealth: healthStatus.serverHealth,
    lastCheck: healthStatus.lastCheck
  };
}
