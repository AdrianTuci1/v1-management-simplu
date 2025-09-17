import { ResourceRepository } from '../data/repositories/ResourceRepository.js'
import { ResourceInvoker } from '../data/invoker/ResourceInvoker.js'
import { GetCommand } from '../data/commands/GetCommand.js'
import { AddCommand } from '../data/commands/AddCommand.js'
import { UpdateCommand } from '../data/commands/UpdateCommand.js'
import { DeleteCommand } from '../data/commands/DeleteCommand.js'
import patientManager from '../business/patientManager.js'


class PatientService {
  constructor() {
    this.repository = new ResourceRepository('patient', 'patients')
    this.invoker = new ResourceInvoker()
  }

  // Obține pacienții cu parametri de filtrare
  async getPatients(params = {}) {
    const command = new GetCommand(this.repository, params)

    const result = await this.invoker.run(command)
    
    // Extragem datele din răspunsul API
    let patients = []
    if (result && result.data) {
      patients = Array.isArray(result.data) ? result.data : []
    } else if (Array.isArray(result)) {
      patients = result
    }
    
    // Transformăm fiecare pacient pentru UI
    return patients.map(patient => 
      patientManager.transformPatientForUI(patient)
    )
  }

  // Obține pacienții pentru o pagină specifică
  async getPatientsByPage(page = 1, limit = 20, filters = {}) {
    const params = {
      ...filters,
      limit,
      offset: (page - 1) * limit,
    }

    const result = await this.getPatients(params)
    return Array.isArray(result) ? result : []
  }

  // Obține pacienții după nume (căutare) folosind resource queries
  async searchPatients(searchTerm, limit = 50) {
    try {
      const businessId = localStorage.getItem("businessId") || 'B0100001';
      const locationId = localStorage.getItem("locationId") || 'L0100001';
      
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const endpoint = `${baseUrl}/api/resources/${businessId}-${locationId}?data.patientName=${encodeURIComponent(searchTerm)}&page=1&limit=${limit}`;
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Resource-Type": "patient",
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
      let patients = [];
      if (data && data.data) {
        patients = Array.isArray(data.data) ? data.data : [];
      } else if (Array.isArray(data)) {
        patients = data;
      }
      
      // Transformăm fiecare pacient pentru UI
      return patients.map(patient => 
        patientManager.transformPatientForUI(patient)
      );
    } catch (error) {
      console.error('Error searching patients by name:', error);
      // Fallback to old method if resource query fails
      const params = {
        search: searchTerm,
        limit,
        sortBy: 'name',
        sortOrder: 'asc'
      }
      const result = await this.getPatients(params)
      return Array.isArray(result) ? result : []
    }
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
