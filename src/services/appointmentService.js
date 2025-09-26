import { dataFacade } from '../data/DataFacade.js'
import { DraftAwareResourceRepository } from '../data/repositories/DraftAwareResourceRepository.js'
import appointmentManager from '../business/appointmentManager.js'


class AppointmentService {
  constructor() {
    this.repository = new DraftAwareResourceRepository('appointments', 'appointments')
    this.dataFacade = dataFacade
  }

  // Funcție utilitară pentru formatarea datelor în format yyyy-mm-dd
  formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Obține programările pentru o perioadă specifică
  async getAppointments(params = {}) {
    try {
      const appointments = await this.dataFacade.getAll('appointments', params)
      
      // Transformăm fiecare programare pentru UI
      return appointments.map(appointment => 
        appointmentManager.transformAppointmentForUI(appointment)
      )
    } catch (error) {
      console.error('Error getting appointments:', error)
      return []
    }
  }

  // Obține programările pentru o zi specifică
  async getAppointmentsByDate(date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const params = {
      startDate: this.formatDate(startOfDay),
      endDate: this.formatDate(endOfDay),
    }

    const result = await this.getAppointments(params)
    return Array.isArray(result) ? result : []
  }

  // Obține programările pentru o săptămână
  async getAppointmentsByWeek(startDate) {
    const startOfWeek = new Date(startDate)
    const dayOfWeek = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    const monday = new Date(startOfWeek.setDate(diff))
    monday.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(monday)
    endOfWeek.setDate(monday.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    const params = {
      startDate: this.formatDate(monday),
      endDate: this.formatDate(endOfWeek),
      sortBy: 'date',
      sortOrder: 'asc'
    }

    const result = await this.getAppointments(params)
    return Array.isArray(result) ? result : []
  }

  // Obține programările pentru o lună
  async getAppointmentsByMonth(year, month) {
    const startOfMonth = new Date(year, month, 1)
    const endOfMonth = new Date(year, month + 1, 0)
    endOfMonth.setHours(23, 59, 59, 999)

    const params = {
      startDate: this.formatDate(startOfMonth),
      endDate: this.formatDate(endOfMonth),
      sortBy: 'date',
      sortOrder: 'asc'
    }

    const result = await this.getAppointments(params)
    return Array.isArray(result) ? result : []
  }

  // Adaugă o programare nouă
  async addAppointment(appointmentData) {
    // Validare
    appointmentManager.validateAppointment(appointmentData)
    
    // Transformare pentru API
    const transformedData = appointmentManager.transformAppointmentForAPI(appointmentData)
    
    // Verificare conflicte
    const hasConflicts = await appointmentManager.checkConflicts(transformedData)
    if (hasConflicts) {
      throw new Error('Există o programare conflictuală pentru această dată și oră')
    }
    
    const result = await this.dataFacade.create('appointments', transformedData)
    
    // Transformăm rezultatul pentru UI înainte de returnare
    return appointmentManager.transformAppointmentForUI(result)
  }

  // Actualizează o programare existentă
  async updateAppointment(id, appointmentData) {
    // Validare
    appointmentManager.validateAppointment(appointmentData)
    
    // Transformare pentru API
    const transformedData = appointmentManager.transformAppointmentForAPI(appointmentData)
    
    // Verificare conflicte (exclude programarea curentă)
    const hasConflicts = await appointmentManager.checkConflicts(transformedData, id)
    if (hasConflicts) {
      throw new Error('Există o programare conflictuală pentru această dată și oră')
    }
    
    const result = await this.dataFacade.update('appointments', id, transformedData)
    
    // Transformăm rezultatul pentru UI înainte de returnare
    return appointmentManager.transformAppointmentForUI(result)
  }

  // Șterge o programare
  async deleteAppointment(id) {
    return await this.dataFacade.delete('appointments', id)
  }

  // Obține o programare după ID
  async getAppointmentById(id) {
    const appointment = await this.dataFacade.getById('appointments', id)
    return appointment ? appointmentManager.transformAppointmentForUI(appointment) : null
  }

  // Obține numărul de programări pentru o dată
  async getAppointmentsCount(date) {
    const appointments = await this.getAppointmentsByDate(date)
    return appointments.length
  }

  // Obține programările cu limitare pentru paginare
  async getAppointmentsWithLimit(params = {}, limit = 50, offset = 0) {
    const allParams = {
      ...params,
      limit,
      offset
    }
    const result = await this.getAppointments(allParams)
    return Array.isArray(result) ? result : []
  }



  // Obține statistici pentru o perioadă
  async getStatistics(startDate, endDate) {
    return appointmentManager.getStatistics(startDate, endDate)
  }

  // Filtrează programările
  async filterAppointments(appointments, filters = {}) {
    return appointmentManager.filterAppointments(appointments, filters)
  }

  // Sortează programările
  async sortAppointments(appointments, sortBy = 'date', sortOrder = 'asc') {
    return appointmentManager.sortAppointments(appointments, sortBy, sortOrder)
  }

  // Exportă programările
  async exportAppointments(appointments, format = 'json') {
    return appointmentManager.exportAppointments(appointments, format)
  }

  // Obține programările unui pacient specific folosind resource queries
  async getAppointmentsByPatientId(patientId) {
    try {
      const businessId = localStorage.getItem("businessId") || 'B0100001';
      const locationId = localStorage.getItem("locationId") || 'L0100001';
      
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const endpoint = `${baseUrl}/api/resources/${businessId}-${locationId}?data.patient.id=${encodeURIComponent(patientId)}&page=1&limit=50`;
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Resource-Type": "appointment",
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
      let appointments = [];
      if (data && data.data) {
        appointments = Array.isArray(data.data) ? data.data : [];
      } else if (Array.isArray(data)) {
        appointments = data;
      }
      
      // Transformăm fiecare programare pentru UI
      return appointments.map(appointment => 
        appointmentManager.transformAppointmentForUI(appointment)
      );
    } catch (error) {
      console.error('Error fetching appointments by patient ID:', error);
      return [];
    }
  }

  // Obține programările unui medic specific folosind resource queries
  async getAppointmentsByMedicId(medicId) {
    try {
      const businessId = localStorage.getItem("businessId") || 'B0100001';
      const locationId = localStorage.getItem("locationId") || 'L0100001';
      
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const endpoint = `${baseUrl}/api/resources/${businessId}-${locationId}?data.doctor.id=${encodeURIComponent(medicId)}&page=1&limit=50`;
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Resource-Type": "appointment",
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
      let appointments = [];
      if (data && data.data) {
        appointments = Array.isArray(data.data) ? data.data : [];
      } else if (Array.isArray(data)) {
        appointments = data;
      }
      
      // Transformăm fiecare programare pentru UI
      return appointments.map(appointment => 
        appointmentManager.transformAppointmentForUI(appointment)
      );
    } catch (error) {
      console.error('Error fetching appointments by medic ID:', error);
      return [];
    }
  }

  // ========================================
  // DRAFT MANAGEMENT
  // ========================================

  /**
   * Creează un draft pentru o programare
   * @param {Object} appointmentData - Datele programării
   * @param {string} sessionId - ID-ul sesiunii (opțional)
   * @returns {Promise<Object>} Draft-ul creat
   */
  async createAppointmentDraft(appointmentData, sessionId = null) {
    // Validare
    appointmentManager.validateAppointment(appointmentData)
    
    // Transformare pentru API
    const transformedData = appointmentManager.transformAppointmentForAPI(appointmentData)
    
    return await this.dataFacade.createDraft('appointments', transformedData, sessionId)
  }

  /**
   * Actualizează un draft de programare
   * @param {string} draftId - ID-ul draft-ului
   * @param {Object} appointmentData - Datele actualizate
   * @returns {Promise<Object>} Draft-ul actualizat
   */
  async updateAppointmentDraft(draftId, appointmentData) {
    // Validare
    appointmentManager.validateAppointment(appointmentData)
    
    // Transformare pentru API
    const transformedData = appointmentManager.transformAppointmentForAPI(appointmentData)
    
    return await this.dataFacade.updateDraft(draftId, transformedData)
  }

  /**
   * Confirmă un draft de programare
   * @param {string} draftId - ID-ul draft-ului
   * @returns {Promise<Object>} Rezultatul confirmării
   */
  async commitAppointmentDraft(draftId) {
    return await this.dataFacade.commitDraft(draftId)
  }

  /**
   * Anulează un draft de programare
   * @param {string} draftId - ID-ul draft-ului
   * @returns {Promise<Object>} Rezultatul anulării
   */
  async cancelAppointmentDraft(draftId) {
    return await this.dataFacade.cancelDraft(draftId)
  }

  /**
   * Obține draft-urile pentru programări
   * @param {string} sessionId - ID-ul sesiunii (opțional)
   * @returns {Promise<Array>} Lista de draft-uri
   */
  async getAppointmentDrafts(sessionId = null) {
    if (sessionId) {
      return await this.dataFacade.getDraftsBySession(sessionId)
    }
    return await this.dataFacade.getDraftsByResourceType('appointments')
  }

  /**
   * Obține programările cu draft-uri incluse
   * @param {Object} params - Parametrii de query
   * @returns {Promise<Array>} Lista de programări cu draft-uri
   */
  async getAppointmentsWithDrafts(params = {}) {
    try {
      const appointments = await this.repository.queryWithDrafts(params)
      
      // Transformăm fiecare programare pentru UI
      return appointments.map(appointment => 
        appointmentManager.transformAppointmentForUI(appointment)
      )
    } catch (error) {
      console.error('Error getting appointments with drafts:', error)
      return []
    }
  }

  // ========================================
  // SESSION MANAGEMENT
  // ========================================

  /**
   * Creează o sesiune pentru programări
   * @param {string} type - Tipul sesiunii
   * @param {Object} data - Datele sesiunii
   * @returns {Promise<Object>} Sesiunea creată
   */
  async createAppointmentSession(type, data = {}) {
    return await this.dataFacade.createSession(type, data)
  }

  /**
   * Salvează o sesiune de programări
   * @param {string} sessionId - ID-ul sesiunii
   * @param {Object} sessionData - Datele sesiunii
   * @returns {Promise<Object>} Sesiunea salvată
   */
  async saveAppointmentSession(sessionId, sessionData) {
    return await this.dataFacade.saveSession(sessionId, sessionData)
  }

  /**
   * Obține programările pentru o sesiune
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {Promise<Array>} Lista de programări pentru sesiune
   */
  async getAppointmentsForSession(sessionId) {
    try {
      const appointments = await this.repository.getResourcesForSession(sessionId)
      
      // Transformăm fiecare programare pentru UI
      return appointments.map(appointment => 
        appointmentManager.transformAppointmentForUI(appointment)
      )
    } catch (error) {
      console.error('Error getting appointments for session:', error)
      return []
    }
  }

  /**
   * Confirmă toate draft-urile pentru o sesiune
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {Promise<Object>} Rezultatul confirmării
   */
  async commitAllAppointmentDraftsForSession(sessionId) {
    return await this.repository.commitAllDraftsForSession(sessionId)
  }

  /**
   * Anulează toate draft-urile pentru o sesiune
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {Promise<Object>} Rezultatul anulării
   */
  async cancelAllAppointmentDraftsForSession(sessionId) {
    return await this.repository.cancelAllDraftsForSession(sessionId)
  }
}

export default new AppointmentService()
