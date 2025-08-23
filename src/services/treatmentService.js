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
    return Array.isArray(result) ? result : []
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

  // Căutare tratamente
  async searchTreatments(query, limit = 50) {
    try {
      const searchFilters = {
        search: query,
        limit
      }
      const command = new GetCommand(this.repository, searchFilters)
      const treatments = await this.invoker.run(command)
      return Array.isArray(treatments) ? treatments : []
    } catch (error) {
      console.error('Error searching treatments:', error)
      return []
    }
  }
}

export default new TreatmentService()
