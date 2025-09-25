// Type definitions for useAppointments hook
export interface Appointment {
  id?: string
  resourceId?: string
  date?: string
  startDate?: string
  endDate?: string
  status?: string
  patient?: {
    id?: string
    name?: string
    firstName?: string
    lastName?: string
    gender?: string
    email?: string
    phone?: string
  }
  doctor?: {
    id?: string
    name?: string
    fullName?: string
    firstName?: string
    lastName?: string
  }
  medic?: {
    id?: string
    name?: string
    fullName?: string
    firstName?: string
    lastName?: string
  }
  treatment?: {
    id?: string
    name?: string
    description?: string
  }
  source?: string
  type?: string
  assistant?: string
  bookingMethod?: string
  _isOptimistic?: boolean
  _isDeleting?: boolean
}

export interface UseAppointmentsReturn {
  appointments: Appointment[]
  loading: boolean
  error: string | null
  appointmentsCount: Record<string, number>
  loadAppointments: (params?: any) => Promise<Appointment[]>
  loadAppointmentsByDate: (date: Date) => Promise<Appointment[]>
  loadAppointmentsByWeek: (startDate: Date) => Promise<Appointment[]>
  loadAppointmentsByMonth: (year: number, month: number) => Promise<Appointment[]>
  addAppointment: (appointmentData: any) => Promise<Appointment>
  updateAppointment: (id: string, appointmentData: any) => Promise<Appointment>
  deleteAppointment: (id: string) => Promise<boolean>
  loadAppointmentsCount: (dates: Date[], existingAppointments?: Appointment[]) => Promise<Record<string, number>>
  reset: () => void
  populateWithTestData: () => Promise<Appointment[]>
  updateLookupData: (patients?: any[], users?: any[], treatments?: any[]) => Promise<void>
  getSortedAppointments: (sortBy?: string, sortOrder?: string) => Appointment[]
}

export declare const useAppointments: () => UseAppointmentsReturn
