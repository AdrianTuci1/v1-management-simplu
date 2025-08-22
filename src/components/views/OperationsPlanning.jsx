import { Calendar, Plus, Search, Filter, Edit } from 'lucide-react'
import { useDrawer } from '../../contexts/DrawerContext'

const OperationsPlanning = () => {
  const { openDrawer } = useDrawer()
  const appointments = [
    {
      time: '09:00',
      patient: 'Ion Marinescu',
      service: 'Control de rutină',
      doctor: 'Dr. Popescu',
      status: 'completed'
    },
    {
      time: '11:30',
      patient: 'Maria Gheorghiu',
      service: 'Obturație',
      doctor: 'Dr. Ionescu',
      status: 'in-progress'
    },
    {
      time: '14:00',
      patient: 'Andrei Stoica',
      service: 'Detartraj',
      doctor: 'Dr. Popescu',
      status: 'scheduled'
    },
    {
      time: '15:30',
      patient: 'Elena Radu',
      service: 'Extracție molar',
      doctor: 'Dr. Ionescu',
      status: 'urgent'
    }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800'
      case 'scheduled':
        return 'bg-gray-100 text-gray-800'
      case 'urgent':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completat'
      case 'in-progress':
        return 'În curs'
      case 'scheduled':
        return 'Programat'
      case 'urgent':
        return 'Urgent'
      default:
        return 'Programat'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Planificare</h1>
          <p className="text-muted-foreground">
            Gestionează programările și calendarul
          </p>
        </div>
        <button
          onClick={() => openDrawer({ type: 'new-appointment' })}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Programare nouă
        </button>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="card-content">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Caută programări..."
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <button className="btn btn-outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtrează
            </button>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <h3 className="card-title">Calendar - Ianuarie 2024</h3>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-outline btn-sm">Zi</button>
              <button className="btn btn-primary btn-sm">Săptămână</button>
              <button className="btn btn-outline btn-sm">Lună</button>
            </div>
          </div>
        </div>
        <div className="card-content">
          {/* Simple calendar grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['L', 'M', 'Mi', 'J', 'V', 'S', 'D'].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <div key={day} className="p-2 text-center text-sm border rounded-md hover:bg-muted cursor-pointer">
                {day}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's Appointments */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <h3 className="card-title">Programări Astăzi</h3>
            <span className="badge badge-default">{appointments.length}</span>
          </div>
        </div>
        <div className="card-content">
          <div className="space-y-3">
            {appointments.map((appointment, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium w-16">{appointment.time}</div>
                  <div>
                    <div className="font-medium">{appointment.patient}</div>
                    <div className="text-sm text-muted-foreground">{appointment.service}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-muted-foreground">{appointment.doctor}</div>
                  <span className={`badge ${getStatusColor(appointment.status)}`}>
                    {getStatusText(appointment.status)}
                  </span>
                  <button 
                    onClick={() => openAppointmentDrawer(appointment)}
                    className="btn btn-ghost btn-sm"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card-footer">
          <button className="btn btn-outline btn-sm">
            Vezi toate programările
          </button>
        </div>
      </div>
    </div>
  )
}

export default OperationsPlanning
