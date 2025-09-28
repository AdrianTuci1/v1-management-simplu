/**
 * Health Repository - Repository dedicat pentru health check
 * 
 * Acest repository gestionează:
 * - Health check-uri către server prin health client
 * - Detectarea stării conexiunii
 * - Gestionarea stării sistemului
 */

import { healthClient } from '../infrastructure/healthClient.js';

export class HealthRepository {
  constructor() {
    this.isOnline = navigator.onLine;
    this.serverHealth = 'unknown'; // 'healthy', 'unhealthy', 'unknown'
    this.lastHealthCheck = null;
    this.timeout = 3000; // 3 secunde timeout
  }

  /**
   * Verifică starea serverului folosind health client
   * @returns {Promise<Object>} Rezultatul health check-ului
   */
  async checkServerHealth() {
    try {
      // Folosește health client pentru verificare
      const result = await healthClient.checkHealth({
        timeout: this.timeout
      });

      // Actualizează starea bazată pe rezultat
      if (result.success && result.isHealthy) {
        this.serverHealth = 'healthy';
        this.lastHealthCheck = new Date();
        return {
          success: true,
          isOnline: this.isOnline,
          serverHealth: 'healthy',
          lastCheck: this.lastHealthCheck,
          canMakeRequests: true,
          message: result.message
        };
      } else {
        console.warn(result.message);
        this.serverHealth = 'unhealthy';
        this.lastHealthCheck = new Date();
        return {
          success: false,
          isOnline: this.isOnline,
          serverHealth: 'unhealthy',
          lastCheck: this.lastHealthCheck,
          canMakeRequests: false,
          error: result.message,
          errorType: result.errorType
        };
      }
    } catch (error) {
      console.error('Health check failed:', error);
      this.serverHealth = 'unhealthy';
      this.lastHealthCheck = new Date();
      
      return {
        success: false,
        isOnline: this.isOnline,
        serverHealth: 'unhealthy',
        lastCheck: this.lastHealthCheck,
        canMakeRequests: false,
        error: error.message
      };
    }
  }

  /**
   * Verifică starea conexiunii la internet folosind health client
   * @returns {Object} Starea conexiunii
   */
  checkNetworkStatus() {
    // Folosește health client pentru verificarea rețelei
    const networkStatus = healthClient.checkNetworkStatus();
    this.isOnline = networkStatus.isOnline;
    
    return {
      isOnline: this.isOnline,
      serverHealth: this.serverHealth,
      lastCheck: this.lastHealthCheck,
      canMakeRequests: this.isOnline && this.serverHealth === 'healthy'
    };
  }

  /**
   * Obține starea curentă a sistemului
   * @returns {Object} Starea curentă
   */
  getCurrentStatus() {
    // Permite cererile dacă:
    // 1. Este online
    // 2. Și (serverul este healthy SAU nu s-a făcut încă primul health check)
    // 3. Dar NU dacă serverul este confirmat unhealthy
    const canMakeRequests = this.isOnline && 
      (this.serverHealth === 'healthy' || 
       (this.serverHealth === 'unknown' && !this.lastHealthCheck));
    
    return {
      isOnline: this.isOnline,
      serverHealth: this.serverHealth,
      lastCheck: this.lastHealthCheck,
      canMakeRequests: canMakeRequests,
      isHealthy: this.isOnline && this.serverHealth === 'healthy',
      isOffline: !this.isOnline,
      isServerDown: this.isOnline && this.serverHealth === 'unhealthy'
    };
  }

  /**
   * Setează starea conexiunii
   * @param {boolean} isOnline - Starea conexiunii
   */
  setNetworkStatus(isOnline) {
    this.isOnline = isOnline;
    if (!isOnline) {
      this.serverHealth = 'unhealthy';
    }
  }

  /**
   * Setează starea serverului
   * @param {string} serverHealth - Starea serverului
   */
  setServerHealth(serverHealth) {
    this.serverHealth = serverHealth;
    this.lastHealthCheck = new Date();
  }

  /**
   * Configurează timeout-ul pentru health check
   * @param {number} timeoutMs - Timeout-ul în milisecunde
   */
  setTimeout(timeoutMs) {
    this.timeout = timeoutMs;
    // Configurează și health client-ul
    healthClient.setTimeout(timeoutMs);
  }

  /**
   * Configurează URL-ul de bază pentru health client
   * @param {string} baseUrl - URL-ul de bază
   */
  setBaseUrl(baseUrl) {
    healthClient.setBaseUrl(baseUrl);
  }

  /**
   * Obține configurația curentă
   * @returns {Object} Configurația curentă
   */
  getConfig() {
    return {
      timeout: this.timeout,
      ...healthClient.getConfig()
    };
  }

  /**
   * Marchează serverul ca fiind healthy (când o cerere API reușește)
   */
  markServerHealthy() {
    if (this.serverHealth !== 'healthy') {
      console.log('Server marked as healthy via API request');
      this.serverHealth = 'healthy';
      this.lastHealthCheck = new Date();
    }
  }

  /**
   * Marchează serverul ca fiind unhealthy (când o cerere API eșuează)
   * @param {string} errorMessage - Mesajul de eroare
   */
  markServerUnhealthy(errorMessage) {
    if (this.serverHealth !== 'unhealthy') {
      console.warn('Server marked as unhealthy via API request failure:', errorMessage);
      this.serverHealth = 'unhealthy';
      this.lastHealthCheck = new Date();
    }
  }
}

// Export singleton instance
export const healthRepository = new HealthRepository();

// Export class pentru instanțe custom
export default HealthRepository;
