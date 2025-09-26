/**
 * Health Client - Client dedicat pentru health check-uri
 * 
 * Acest client gestionează:
 * - Health check-uri către server
 * - Gestionarea timeout-urilor
 * - Gestionarea erorilor de rețea
 * - Configurare endpoint-uri și timeout-uri
 */

export class HealthClient {
  constructor() {
    this.timeout = 3000; // 3 secunde timeout
    this.baseUrl = import.meta.env.VITE_API_URL || '';
  }

  /**
   * Verifică starea serverului
   * @param {Object} options - Opțiuni pentru health check
   * @returns {Promise<Object>} Rezultatul health check-ului
   */
  async checkHealth(options = {}) {
    const {
      endpoint = null,
      timeout = this.timeout,
      headers = {}
    } = options;

    try {
      // Construiește endpoint-ul
      const healthEndpoint = endpoint || this.buildHealthEndpoint();
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(healthEndpoint, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);

      // Verifică dacă răspunsul este valid
      if (response.ok && response.status >= 200 && response.status < 300) {
        return {
          success: true,
          status: response.status,
          isHealthy: true,
          message: 'Server is healthy',
          timestamp: new Date()
        };
      } else {
        return {
          success: false,
          status: response.status,
          isHealthy: false,
          message: `Server responded with status: ${response.status}`,
          timestamp: new Date()
        };
      }
    } catch (error) {
      // Gestionare erori
      let errorMessage = 'Health check failed';
      let errorType = 'unknown';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Health check timeout - server may be down';
        errorType = 'timeout';
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Network error - server may be down';
        errorType = 'network';
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        errorMessage = 'Server not responding - backend may be down';
        errorType = 'server_down';
      } else {
        errorMessage = `Health check failed: ${error.message}`;
        errorType = 'error';
      }
      
      return {
        success: false,
        status: 0,
        isHealthy: false,
        message: errorMessage,
        errorType,
        timestamp: new Date()
      };
    }
  }

  /**
   * Construiește endpoint-ul pentru health check
   * @returns {string} Endpoint-ul pentru health check
   */
  buildHealthEndpoint() {
    return `${this.baseUrl}/api/health`;
  }

  /**
   * Verifică starea conexiunii la internet
   * @returns {Object} Starea conexiunii
   */
  checkNetworkStatus() {
    return {
      isOnline: navigator.onLine,
      timestamp: new Date()
    };
  }

  /**
   * Configurează timeout-ul pentru health check
   * @param {number} timeoutMs - Timeout-ul în milisecunde
   */
  setTimeout(timeoutMs) {
    this.timeout = timeoutMs;
  }

  /**
   * Configurează URL-ul de bază
   * @param {string} baseUrl - URL-ul de bază
   */
  setBaseUrl(baseUrl) {
    this.baseUrl = baseUrl;
  }

  /**
   * Obține configurația curentă
   * @returns {Object} Configurația curentă
   */
  getConfig() {
    return {
      timeout: this.timeout,
      baseUrl: this.baseUrl
    };
  }
}

// Export singleton instance
export const healthClient = new HealthClient();

// Export class pentru instanțe custom
export default HealthClient;
