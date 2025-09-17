import { ResourceRepository } from '../data/repositories/ResourceRepository.js'
import { ResourceInvoker } from '../data/invoker/ResourceInvoker.js'
import { GetCommand } from '../data/commands/GetCommand.js'
import { AddCommand } from '../data/commands/AddCommand.js'
import { UpdateCommand } from '../data/commands/UpdateCommand.js'
import { DeleteCommand } from '../data/commands/DeleteCommand.js'
import treatmentManager from '../business/treatmentManager.js'

class TreatmentService {
  constructor() {
    this.repository = new ResourceRepository('treatment', 'treatments')
    this.invoker = new ResourceInvoker()
  }

  // Obține toate tratamentele
  async getTreatments(params = {}) {
    const command = new GetCommand(this.repository, params)
    const result = await this.invoker.run(command)
    
    // Extragem datele din răspunsul API
    let treatments = []
    if (result && result.data) {
      treatments = Array.isArray(result.data) ? result.data : []
    } else if (Array.isArray(result)) {
      treatments = result
    }
    
    // Transformăm fiecare tratament pentru UI
    return treatments.map(treatment => 
      treatmentManager.transformTreatmentForUI(treatment)
    )
  }

  // Obține tratamentele după categorie
  async getTreatmentsByCategory(category) {
    const params = { category }
    const result = await this.getTreatments(params)
    return Array.isArray(result) ? result : []
  }

  // Obține tratamentele după tip
  async getTreatmentsByType(treatmentType) {
    const params = { treatmentType }
    const result = await this.getTreatments(params)
    return Array.isArray(result) ? result : []
  }

  // Adaugă un tratament nou
  async addTreatment(treatmentData) {
    // Validare
    treatmentManager.validateTreatment(treatmentData)
    
    // Transformare pentru API
    const transformedData = treatmentManager.transformTreatmentForAPI(treatmentData)
    
    const command = new AddCommand(this.repository, transformedData)
    return this.invoker.run(command)
  }

  // Actualizează un tratament existent
  async updateTreatment(id, treatmentData) {
    // Validare
    treatmentManager.validateTreatment(treatmentData)
    
    // Transformare pentru API
    const transformedData = treatmentManager.transformTreatmentForAPI(treatmentData)
    
    const command = new UpdateCommand(this.repository, id, transformedData)
    return this.invoker.run(command)
  }

  // Șterge un tratament
  async deleteTreatment(id) {
    const command = new DeleteCommand(this.repository, id)
    return this.invoker.run(command)
  }

  // Obține un tratament după ID
  async getTreatmentById(id) {
    return this.repository.getById(id)
  }

  // Obține tratamentele cu limitare pentru paginare
  async getTreatmentsWithLimit(params = {}, limit = 50, offset = 0) {
    const allParams = {
      ...params,
      limit,
      offset
    }
    const result = await this.getTreatments(allParams)
    return Array.isArray(result) ? result : []
  }

  // Obține statistici pentru tratamente
  async getStatistics() {
    return treatmentManager.getStatistics()
  }

  // Filtrează tratamentele
  async filterTreatments(treatments, filters = {}) {
    return treatmentManager.filterTreatments(treatments, filters)
  }

  // Sortează tratamentele
  async sortTreatments(treatments, sortBy = 'treatmentType', sortOrder = 'asc') {
    return treatmentManager.sortTreatments(treatments, sortBy, sortOrder)
  }

  // Exportă tratamentele
  async exportTreatments(treatments, format = 'json') {
    return treatmentManager.exportTreatments(treatments, format)
  }

  // Căutare tratamente folosind resource queries
  async searchTreatments(query, limit = 50) {
    try {
      const businessId = localStorage.getItem("businessId") || 'B0100001';
      const locationId = localStorage.getItem("locationId") || 'L0100001';
      
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const endpoint = `${baseUrl}/api/resources/${businessId}-${locationId}?data.treatmentName=${encodeURIComponent(query)}&page=1&limit=${limit}`;
      console.log('Treatment search endpoint:', endpoint);
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Resource-Type": "treatment",
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
      let treatments = [];
      if (data && data.data) {
        treatments = Array.isArray(data.data) ? data.data : [];
      } else if (Array.isArray(data)) {
        treatments = data;
      }
      
      // Transformăm fiecare tratament pentru UI
      return treatments.map(treatment => 
        treatmentManager.transformTreatmentForUI(treatment)
      );
    } catch (error) {
      console.error('Error searching treatments by name:', error);
      // Fallback to old method if resource query fails
      try {
        const searchFilters = {
          search: query,
          limit
        }
        const command = new GetCommand(this.repository, searchFilters)
        const treatments = await this.invoker.run(command)
        return Array.isArray(treatments) ? treatments : []
      } catch (fallbackError) {
        console.error('Fallback search also failed:', fallbackError)
        return []
      }
    }
  }
}

export default new TreatmentService()
