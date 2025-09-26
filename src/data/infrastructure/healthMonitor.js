/**
 * Health Monitor - Monitorizarea stării sistemului
 * 
 * Acest modul gestionează:
 * - Monitorizarea periodică a stării serverului
 * - Gestionarea listener-ilor pentru schimbări de stare
 * - Cache-ul stării curente
 * - Logica de decizie pentru cereri
 */

import { healthClient } from './healthClient.js';

class HealthMonitor {
  constructor() {
    this.isMonitoring = false;
    this.intervalId = null;
    this.listeners = new Set();
    this.currentStatus = {
      isHealthy: false,
      lastCheck: null,
      consecutiveFailures: 0,
      canMakeRequests: false
    };
    this.checkInterval = 30000; // 30 secunde
    this.maxConsecutiveFailures = 3;
  }

  /**
   * Pornește monitorizarea periodică
   */
  startMonitoring() {
    if (this.isMonitoring) {
      console.warn('Health monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    console.log('Starting health monitoring...');
    
    // Face primul check imediat
    this.performHealthCheck();
    
    // Programează verificările periodice
    this.intervalId = setInterval(() => {
      this.performHealthCheck();
    }, this.checkInterval);
  }

  /**
   * Oprește monitorizarea periodică
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      console.warn('Health monitoring is not running');
      return;
    }

    this.isMonitoring = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    console.log('Health monitoring stopped');
  }

  /**
   * Adaugă un listener pentru schimbările de stare
   * @param {Function} callback - Callback pentru schimbările de stare
   * @returns {Function} Funcție pentru dezabonare
   */
  addListener(callback) {
    this.listeners.add(callback);
    
    // Returnează funcția de dezabonare
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Obține starea curentă a sistemului
   * @returns {Object} Starea curentă
   */
  getStatus() {
    return { ...this.currentStatus };
  }

  /**
   * Verifică dacă sistemul poate face cereri către server
   * @returns {boolean} True dacă poate face cereri
   */
  canMakeRequests() {
    return this.currentStatus.canMakeRequests;
  }

  /**
   * Execută un health check manual
   * @returns {Promise<boolean>} True dacă serverul este healthy
   */
  async checkServerHealth() {
    const result = await healthClient.checkHealth();
    this.updateStatus(result);
    return result.isHealthy;
  }

  /**
   * Execută verificarea stării sistemului
   * @private
   */
  async performHealthCheck() {
    try {
      const result = await healthClient.checkHealth();
      this.updateStatus(result);
    } catch (error) {
      console.error('Health check failed:', error);
      this.updateStatus({
        success: false,
        isHealthy: false,
        message: `Health check error: ${error.message}`,
        timestamp: new Date()
      });
    }
  }

  /**
   * Actualizează starea curentă și notifică listener-ii
   * @param {Object} healthResult - Rezultatul health check-ului
   * @private
   */
  updateStatus(healthResult) {
    const previousStatus = { ...this.currentStatus };
    
    // Actualizează starea curentă
    this.currentStatus = {
      isHealthy: healthResult.isHealthy,
      lastCheck: healthResult.timestamp || new Date(),
      consecutiveFailures: healthResult.isHealthy ? 0 : this.currentStatus.consecutiveFailures + 1,
      canMakeRequests: this.calculateCanMakeRequests(healthResult),
      message: healthResult.message,
      errorType: healthResult.errorType
    };

    // Verifică dacă starea s-a schimbat
    const statusChanged = this.hasStatusChanged(previousStatus, this.currentStatus);
    
    if (statusChanged) {
      console.log('Health status changed:', this.currentStatus);
      this.notifyListeners(this.currentStatus, previousStatus);
    }
  }

  /**
   * Calculează dacă sistemul poate face cereri
   * @param {Object} healthResult - Rezultatul health check-ului
   * @returns {boolean} True dacă poate face cereri
   * @private
   */
  calculateCanMakeRequests(healthResult) {
    // Nu poate face cereri dacă:
    // 1. Serverul nu este healthy
    // 2. Au fost prea multe eșecuri consecutive
    // 3. Nu există conexiune la internet
    
    const networkStatus = healthClient.checkNetworkStatus();
    
    if (!networkStatus.isOnline) {
      return false;
    }
    
    if (!healthResult.isHealthy) {
      return this.currentStatus.consecutiveFailures < this.maxConsecutiveFailures;
    }
    
    return true;
  }

  /**
   * Verifică dacă starea s-a schimbat
   * @param {Object} previousStatus - Starea anterioară
   * @param {Object} currentStatus - Starea curentă
   * @returns {boolean} True dacă starea s-a schimbat
   * @private
   */
  hasStatusChanged(previousStatus, currentStatus) {
    return (
      previousStatus.isHealthy !== currentStatus.isHealthy ||
      previousStatus.canMakeRequests !== currentStatus.canMakeRequests ||
      previousStatus.consecutiveFailures !== currentStatus.consecutiveFailures
    );
  }

  /**
   * Notifică toți listener-ii despre schimbarea stării
   * @param {Object} currentStatus - Starea curentă
   * @param {Object} previousStatus - Starea anterioară
   * @private
   */
  notifyListeners(currentStatus, previousStatus) {
    this.listeners.forEach(callback => {
      try {
        callback(currentStatus, previousStatus);
      } catch (error) {
        console.error('Error in health status listener:', error);
      }
    });
  }

  /**
   * Configurează intervalul de verificare
   * @param {number} intervalMs - Intervalul în milisecunde
   */
  setCheckInterval(intervalMs) {
    this.checkInterval = intervalMs;
    
    // Restart monitoring dacă este activ
    if (this.isMonitoring) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  /**
   * Configurează numărul maxim de eșecuri consecutive
   * @param {number} maxFailures - Numărul maxim de eșecuri
   */
  setMaxConsecutiveFailures(maxFailures) {
    this.maxConsecutiveFailures = maxFailures;
  }

  /**
   * Obține statistici despre monitorizare
   * @returns {Object} Statisticile monitorizării
   */
  getStatistics() {
    return {
      isMonitoring: this.isMonitoring,
      checkInterval: this.checkInterval,
      maxConsecutiveFailures: this.maxConsecutiveFailures,
      listenerCount: this.listeners.size,
      currentStatus: this.getStatus()
    };
  }
}

// Export singleton instance
export const healthMonitor = new HealthMonitor();

// Export class pentru instanțe custom
export default HealthMonitor;
