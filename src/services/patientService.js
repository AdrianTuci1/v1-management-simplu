import { ResourceRepository } from '../data/repositories/ResourceRepository.js'
import { ResourceInvoker } from '../data/invoker/ResourceInvoker.js'
import { GetCommand } from '../data/commands/GetCommand.js'
import { AddCommand } from '../data/commands/AddCommand.js'
import { UpdateCommand } from '../data/commands/UpdateCommand.js'
import { DeleteCommand } from '../data/commands/DeleteCommand.js'
import patientManager from '../business/patientManager.js'
import { indexedDb } from '../data/infrastructure/db.js'

class PatientService {
  constructor() {
    this.repository = new ResourceRepository('patient', 'patients')
    this.invoker = new ResourceInvoker()
  }

  // Obține pacienții cu parametri de filtrare
  async getPatients(params = {}) {
    const command = new GetCommand(this.repository, params)
    return this.invoker.run(command)
  }

  // Obține pacienții pentru o pagină specifică
  async getPatientsByPage(page = 1, limit = 20, filters = {}) {
    const params = {
      ...filters,
      limit,
      offset: (page - 1) * limit,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }
    return this.getPatients(params)
  }

  // Obține pacienții după nume (căutare)
  async searchPatients(searchTerm, limit = 50) {
    const params = {
      search: searchTerm,
      limit,
      sortBy: 'name',
      sortOrder: 'asc'
    }
    return this.getPatients(params)
  }

  // Obține un pacient după ID
  async getPatientById(id) {
    const params = { id }
    const patients = await this.getPatients(params)
    return patients.length > 0 ? patients[0] : null
  }

  // Adaugă un pacient nou
  async addPatient(patientData) {
    // Validare
    patientManager.validatePatient(patientData)
    
    // Transformare pentru API
    const transformedData = patientManager.transformPatientForAPI(patientData)
    
    const command = new AddCommand(this.repository, transformedData)
    return this.invoker.run(command)
  }

  // Actualizează un pacient existent
  async updatePatient(id, patientData) {
    // Validare
    patientManager.validatePatient(patientData)
    
    // Transformare pentru API
    const transformedData = patientManager.transformPatientForAPI(patientData)
    
    const command = new UpdateCommand(this.repository, id, transformedData)
    return this.invoker.run(command)
  }

  // Șterge un pacient
  async deletePatient(id) {
    const command = new DeleteCommand(this.repository, id)
    return this.invoker.run(command)
  }

  // Obține statistici despre pacienți
  async getPatientStats() {
    try {
      const allPatients = await this.getPatients({ limit: 1000 })
      
      const stats = {
        total: allPatients.length,
        active: allPatients.filter(p => p.status === 'active').length,
        inactive: allPatients.filter(p => p.status === 'inactive').length,
        newThisMonth: allPatients.filter(p => {
          const createdAt = new Date(p.createdAt)
          const now = new Date()
          return createdAt.getMonth() === now.getMonth() && 
                 createdAt.getFullYear() === now.getFullYear()
        }).length
      }
      
      return stats
    } catch (error) {
      console.error('Error getting patient stats:', error)
      return {
        total: 0,
        active: 0,
        inactive: 0,
        newThisMonth: 0
      }
    }
  }

  // Exportă pacienții în format CSV
  async exportPatients(format = 'csv') {
    try {
      const patients = await this.getPatients({ limit: 10000 })
      return patientManager.exportPatients(patients, format)
    } catch (error) {
      console.error('Error exporting patients:', error)
      throw new Error('Eroare la exportul pacienților')
    }
  }
}

export default new PatientService()
