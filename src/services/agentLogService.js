/**
 * Agent Log Service
 * Gestionează operațiunile cu log-urile agentului
 * Nu folosește IndexedDB - doar date în timp real
 */

class AgentLogService {
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || ''
  }

  /**
   * Construiește URL-ul pentru resurse
   */
  getResourceUrl() {
    const businessId = localStorage.getItem("businessId") || 'B0100001'
    const locationId = localStorage.getItem("locationId") || 'L0100001'
    return `${this.baseUrl}/resources/${businessId}-${locationId}`
  }

  /**
   * Obține header-ele pentru request-uri
   */
  getHeaders() {
    const headers = {
      "Content-Type": "application/json",
      "X-Resource-Type": "agent-logs"
    }

    const cognitoData = localStorage.getItem('cognito-data')
    if (cognitoData) {
      const parsed = JSON.parse(cognitoData)
      headers["Authorization"] = `Bearer ${parsed.id_token || parsed.access_token}`
    }

    return headers
  }

  /**
   * Obține log-urile agentului cu filtre și paginare
   * @param {Object} options - Opțiuni de filtrare și paginare
   * @returns {Promise<Array>} Lista de log-uri
   */
  async getAgentLogs(options = {}) {
    const {
      page = 1,
      limit = 50,
      date = null,
      service = null,
      status = null,
      category = null,
      sort = '-timestamp' // Sortare descendentă după timestamp
    } = options

    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort
      })

      // Adaugă filtre opționale
      if (date) {
        const dateStr = date instanceof Date 
          ? date.toISOString().split('T')[0] 
          : date
        queryParams.append('data.date', dateStr)
      }

      if (service) {
        queryParams.append('data.service', service)
      }

      if (status) {
        queryParams.append('data.status', status)
      }

      if (category) {
        queryParams.append('data.category', category)
      }

      const url = `${this.getResourceUrl()}?${queryParams.toString()}`
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`API error ${response.status}`)
      }

      const result = await response.json()
      
      // Normalizează răspunsul
      let data = []
      if (result && result.data) {
        data = Array.isArray(result.data) ? result.data : []
      } else if (Array.isArray(result)) {
        data = result
      }

      return data
    } catch (error) {
      console.error('Error loading agent logs:', error)
      throw error
    }
  }

  /**
   * Obține un log specific după ID
   * @param {string} id - ID-ul log-ului
   * @returns {Promise<Object>} Log-ul cerut
   */
  async getAgentLogById(id) {
    try {
      const url = `${this.getResourceUrl()}/${id}`
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`API error ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error getting agent log by ID:', error)
      throw error
    }
  }

  /**
   * Obține statistici despre log-urile agentului
   * @param {Object} options - Opțiuni de filtrare (date, service, etc.)
   * @returns {Promise<Object>} Statistici
   */
  async getAgentLogStats(options = {}) {
    try {
      // Încarcă toate log-urile pentru perioada specificată
      const logs = await this.getAgentLogs({ 
        ...options, 
        limit: 1000 // Limită mare pentru statistici
      })

      // Calculează statistici locale
      const stats = {
        total: logs.length,
        byStatus: {},
        byService: {},
        byCategory: {},
        byPriority: {}
      }

      logs.forEach(log => {
        // Statistici după status
        stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1
        
        // Statistici după service
        stats.byService[log.service] = (stats.byService[log.service] || 0) + 1
        
        // Statistici după category
        stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1
        
        // Statistici după priority
        stats.byPriority[log.priority] = (stats.byPriority[log.priority] || 0) + 1
      })

      return stats
    } catch (error) {
      console.error('Error getting agent log stats:', error)
      throw error
    }
  }

  /**
   * Obține log-urile recente (ultimele N log-uri)
   * @param {number} limit - Numărul de log-uri de returnat
   * @returns {Promise<Array>} Lista de log-uri recente
   */
  async getRecentAgentLogs(limit = 10) {
    return this.getAgentLogs({ 
      page: 1, 
      limit, 
      sort: '-timestamp' 
    })
  }

  /**
   * Caută în log-uri după descriere sau detalii
   * @param {string} query - Termenul de căutare
   * @param {number} limit - Limita de rezultate
   * @returns {Promise<Array>} Lista de log-uri găsite
   */
  async searchAgentLogs(query, limit = 50) {
    try {
      const queryParams = new URLSearchParams({
        page: '1',
        limit: limit.toString(),
        sort: '-timestamp',
        'data.description': query // Căutare în descriere
      })

      const url = `${this.getResourceUrl()}?${queryParams.toString()}`
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`API error ${response.status}`)
      }

      const result = await response.json()
      
      let data = []
      if (result && result.data) {
        data = Array.isArray(result.data) ? result.data : []
      } else if (Array.isArray(result)) {
        data = result
      }

      return data
    } catch (error) {
      console.error('Error searching agent logs:', error)
      throw error
    }
  }
}

// Export singleton instance
export const agentLogService = new AgentLogService()

// Export class pentru teste sau instanțe custom
export default AgentLogService

