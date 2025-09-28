/**
 * ResourceSearchRepository - Repository pentru căutări eficiente în resurse
 * 
 * Acest repository oferă funcționalități de căutare optimizate pentru:
 * - Căutări în câmpuri custom folosind resource queries
 * - Fallback la metode tradiționale de căutare
 * - Suport pentru multiple tipuri de resurse
 * - Cache și optimizări de performanță
 */

export class ResourceSearchRepository {
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || '';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minute cache
  }

  /**
   * Caută resurse folosind resource queries API
   * @param {string} resourceType - Tipul resursei (patient, treatment, user, etc.)
   * @param {string} searchField - Câmpul în care să caute (ex: patientName, treatmentName, userName)
   * @param {string} searchTerm - Termenul de căutare
   * @param {number} limit - Limita de rezultate
   * @param {Object} additionalFilters - Filtre suplimentare
   * @returns {Promise<Array>} Rezultatele căutării
   */
  async searchByCustomField(resourceType, searchField, searchTerm, limit = 5, additionalFilters = {}) {
    try {
      const businessId = localStorage.getItem("businessId") || 'B0100001';
      const locationId = localStorage.getItem("locationId") || 'L0100001';
      
      // Construiește query parameters
      const queryParams = new URLSearchParams({
        [`data.${searchField}`]: searchTerm,
        page: '1',
        limit: limit.toString(),
        ...additionalFilters
      });
      
      const endpoint = `${this.baseUrl}/resources/${businessId}-${locationId}?${queryParams.toString()}`;
      
      console.log(`${resourceType} search endpoint:`, endpoint);
      
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Resource-Type": resourceType,
          ...(localStorage.getItem('cognito-data') && {
            "Authorization": `Bearer ${JSON.parse(localStorage.getItem('cognito-data')).id_token || JSON.parse(localStorage.getItem('cognito-data')).access_token}`
          })
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract data from API response structure
      let results = [];
      if (data && data.data) {
        results = Array.isArray(data.data) ? data.data : [];
      } else if (Array.isArray(data)) {
        results = data;
      }
      
      // Cache results
      this.cacheResults(resourceType, searchField, searchTerm, results);
      
      return results;
    } catch (error) {
      console.error(`Error searching ${resourceType} by ${searchField}:`, error);
      throw error;
    }
  }

  /**
   * Caută resurse cu multiple câmpuri
   * @param {string} resourceType - Tipul resursei
   * @param {Object} searchFields - Obiect cu câmpuri și termeni de căutare
   * @param {number} limit - Limita de rezultate
   * @param {Object} additionalFilters - Filtre suplimentare
   * @returns {Promise<Array>} Rezultatele căutării
   */
  async searchByMultipleFields(resourceType, searchFields, limit = 50, additionalFilters = {}) {
    try {
      const businessId = localStorage.getItem("businessId") || 'B0100001';
      const locationId = localStorage.getItem("locationId") || 'L0100001';
      
      // Construiește query parameters pentru multiple câmpuri
      const queryParams = new URLSearchParams({
        page: '1',
        limit: limit.toString(),
        ...additionalFilters
      });
      
      // Adaugă fiecare câmp de căutare
      Object.entries(searchFields).forEach(([field, value]) => {
        if (value && value.trim()) {
          queryParams.append(`data.${field}`, value);
        }
      });
      
      const endpoint = `${this.baseUrl}/resources/${businessId}-${locationId}?${queryParams.toString()}`;
      
      console.log(`${resourceType} multi-field search endpoint:`, endpoint);
      
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Resource-Type": resourceType,
          ...(localStorage.getItem('cognito-data') && {
            "Authorization": `Bearer ${JSON.parse(localStorage.getItem('cognito-data')).id_token}`
          })
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract data from API response structure
      let results = [];
      if (data && data.data) {
        results = Array.isArray(data.data) ? data.data : [];
      } else if (Array.isArray(data)) {
        results = data;
      }
      
      return results;
    } catch (error) {
      console.error(`Error searching ${resourceType} by multiple fields:`, error);
      throw error;
    }
  }

  /**
   * Caută resurse cu fuzzy matching
   * @param {string} resourceType - Tipul resursei
   * @param {string} searchField - Câmpul în care să caute
   * @param {string} searchTerm - Termenul de căutare
   * @param {number} limit - Limita de rezultate
   * @param {Object} additionalFilters - Filtre suplimentare
   * @returns {Promise<Array>} Rezultatele căutării
   */
  async fuzzySearch(resourceType, searchField, searchTerm, limit = 50, additionalFilters = {}) {
    try {
      const businessId = localStorage.getItem("businessId") || 'B0100001';
      const locationId = localStorage.getItem("locationId") || 'L0100001';
      
      // Construiește query parameters pentru fuzzy search
      const queryParams = new URLSearchParams({
        [`data.${searchField}__icontains`]: searchTerm, // Case insensitive contains
        page: '1',
        limit: limit.toString(),
        ...additionalFilters
      });
      
      const endpoint = `${this.baseUrl}/api/resources/${businessId}-${locationId}?${queryParams.toString()}`;
      
      console.log(`${resourceType} fuzzy search endpoint:`, endpoint);
      
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Resource-Type": resourceType,
          ...(localStorage.getItem('cognito-data') && {
            "Authorization": `Bearer ${JSON.parse(localStorage.getItem('cognito-data')).id_token || JSON.parse(localStorage.getItem('cognito-data')).access_token}`
          })
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract data from API response structure
      let results = [];
      if (data && data.data) {
        results = Array.isArray(data.data) ? data.data : [];
      } else if (Array.isArray(data)) {
        results = data;
      }
      
      return results;
    } catch (error) {
      console.error(`Error fuzzy searching ${resourceType} by ${searchField}:`, error);
      throw error;
    }
  }

  /**
   * Caută resurse cu suport pentru fallback
   * @param {string} resourceType - Tipul resursei
   * @param {string} searchField - Câmpul în care să caute
   * @param {string} searchTerm - Termenul de căutare
   * @param {number} limit - Limita de rezultate
   * @param {Function} fallbackMethod - Metoda de fallback
   * @param {Object} additionalFilters - Filtre suplimentare
   * @returns {Promise<Array>} Rezultatele căutării
   */
  async searchWithFallback(resourceType, searchField, searchTerm, limit = 50, fallbackMethod = null, additionalFilters = {}) {
    try {
      // Încearcă mai întâi resource query
      return await this.searchByCustomField(resourceType, searchField, searchTerm, limit, additionalFilters);
    } catch (error) {
      console.error(`Resource query failed for ${resourceType}, trying fallback:`, error);
      
      if (fallbackMethod && typeof fallbackMethod === 'function') {
        try {
          return await fallbackMethod(searchTerm, { limit, ...additionalFilters });
        } catch (fallbackError) {
          console.error('Fallback method also failed:', fallbackError);
          return [];
        }
      }
      
      return [];
    }
  }

  /**
   * Cache results pentru performanță
   * @param {string} resourceType - Tipul resursei
   * @param {string} searchField - Câmpul de căutare
   * @param {string} searchTerm - Termenul de căutare
   * @param {Array} results - Rezultatele de cache
   */
  cacheResults(resourceType, searchField, searchTerm, results) {
    const cacheKey = `${resourceType}_${searchField}_${searchTerm}`;
    this.cache.set(cacheKey, {
      results,
      timestamp: Date.now()
    });
  }

  /**
   * Obține rezultate din cache
   * @param {string} resourceType - Tipul resursei
   * @param {string} searchField - Câmpul de căutare
   * @param {string} searchTerm - Termenul de căutare
   * @returns {Array|null} Rezultatele din cache sau null
   */
  getCachedResults(resourceType, searchField, searchTerm) {
    const cacheKey = `${resourceType}_${searchField}_${searchTerm}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.results;
    }
    
    // Remove expired cache
    if (cached) {
      this.cache.delete(cacheKey);
    }
    
    return null;
  }

  /**
   * Curăță cache-ul expirat
   */
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Curăță tot cache-ul
   */
  clearAllCache() {
    this.cache.clear();
  }

  /**
   * Obține statistici despre cache
   * @returns {Object} Statisticile cache-ului
   */
  getCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp < this.cacheTimeout) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }
    
    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      cacheTimeout: this.cacheTimeout
    };
  }
}

// Export singleton instance
export const resourceSearchRepository = new ResourceSearchRepository();
export default resourceSearchRepository;
