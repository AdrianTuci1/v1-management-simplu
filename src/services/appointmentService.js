import { ResourceRepository } from '../data/repositories/ResourceRepository.js'
import { ResourceInvoker } from '../data/invoker/ResourceInvoker.js'
import { GetCommand } from '../data/commands/GetCommand.js'
import { AddCommand } from '../data/commands/AddCommand.js'
import { UpdateCommand } from '../data/commands/UpdateCommand.js'
import { DeleteCommand } from '../data/commands/DeleteCommand.js'
import appointmentManager from '../business/appointmentManager.js'


class AppointmentService {
  constructor() {
    this.repository = new ResourceRepository('appointment', 'appointments')
    this.invoker = new ResourceInvoker()
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
    const command = new GetCommand(this.repository, params)
    const result = await this.invoker.run(command)
    
    // Extragem datele din răspunsul API
    let appointments = []
    if (result && result.data) {
      appointments = Array.isArray(result.data) ? result.data : []
    } else if (Array.isArray(result)) {
      appointments = result
    }
    
    // Transformăm fiecare programare pentru UI
    return appointments.map(appointment => 
      appointmentManager.transformAppointmentForUI(appointment)
    )
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
    
    const command = new AddCommand(this.repository, transformedData)
    const result = await this.invoker.run(command)
    
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
    
    const command = new UpdateCommand(this.repository, id, transformedData)
    const result = await this.invoker.run(command)
    
    // Transformăm rezultatul pentru UI înainte de returnare
    return appointmentManager.transformAppointmentForUI(result)
  }

  // Șterge o programare
  async deleteAppointment(id) {
    const command = new DeleteCommand(this.repository, id)
    return this.invoker.run(command)
  }

  // Obține o programare după ID
  async getAppointmentById(id) {
    const appointment = await this.repository.getById(id)
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
}

export default new AppointmentService()
