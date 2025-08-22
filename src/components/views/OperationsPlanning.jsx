import { Calendar, Plus, Edit, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

import { useState, useMemo, useEffect } from 'react'
import { useAppointments } from '../../hooks/useAppointments.js'
import { useDrawer } from '../../contexts/DrawerContext'

const OperationsPlanning = () => {
  const openDrawer = useDrawer()
  
  // State management
  const [viewType, setViewType] = useState('week') // 'day', 'week', 'month'
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentViewDate, setCurrentViewDate] = useState(new Date())
  const [appointmentsLimit, setAppointmentsLimit] = useState(100)

  // Hook pentru gestionarea programărilor
  const {
    appointments,
    loading,
    error,
    appointmentsCount,
    loadAppointmentsByDate,
    loadAppointmentsByWeek,
    loadAppointmentsByMonth,
    loadAppointmentsCount,
    populateWithTestData
  } = useAppointments()

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

  // Calendar navigation functions
  const goToPrevious = () => {
    const newDate = new Date(currentViewDate)
    switch (viewType) {
      case 'day':
        newDate.setDate(newDate.getDate() - 1)
        break
      case 'week':
        newDate.setDate(newDate.getDate() - 7)
        break
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1)
        break
    }
    setCurrentViewDate(newDate)
  }

  const goToNext = () => {
    const newDate = new Date(currentViewDate)
    switch (viewType) {
      case 'day':
        newDate.setDate(newDate.getDate() + 1)
        break
      case 'week':
        newDate.setDate(newDate.getDate() + 7)
        break
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1)
        break
    }
    setCurrentViewDate(newDate)
  }

  const goToCurrent = () => {
    const today = new Date()
    setCurrentViewDate(today)
    setSelectedDate(today)
  }

  // Get calendar dates based on view type
  const getCalendarDates = () => {
    const dates = []
    const startDate = new Date(currentViewDate)
    
    switch (viewType) {
      case 'day':
        dates.push(new Date(startDate))
        break
      case 'week':
        // Get start of week (Monday)
        const dayOfWeek = startDate.getDay()
        const diff = startDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
        const monday = new Date(startDate.setDate(diff))
        
        for (let i = 0; i < 7; i++) {
          const date = new Date(monday)
          date.setDate(monday.getDate() + i)
          dates.push(date)
        }
        break
      case 'month':
        // Get start of month
        const firstDay = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
        const lastDay = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)
        
        // Get start of week for first day
        const firstDayOfWeek = firstDay.getDay()
        const startOfCalendar = new Date(firstDay)
        startOfCalendar.setDate(firstDay.getDate() - (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1))
        
        // Generate all dates for the month view
        for (let i = 0; i < 42; i++) {
          const date = new Date(startOfCalendar)
          date.setDate(startOfCalendar.getDate() + i)
          dates.push(date)
        }
        break
    }
    
    return dates
  }

  // Get view title
  const getViewTitle = () => {
    const options = { 
      year: 'numeric', 
      month: 'long',
      ...(viewType === 'day' && { day: 'numeric' })
    }
    return currentViewDate.toLocaleDateString('ro-RO', options)
  }

  // Încarcă programările în funcție de tipul de vizualizare
  useEffect(() => {
    const loadAppointments = async () => {
      switch (viewType) {
        case 'day':
          await loadAppointmentsByDate(selectedDate)
          break
        case 'week':
          await loadAppointmentsByWeek(selectedDate)
          break
        case 'month':
          await loadAppointmentsByMonth(selectedDate.getFullYear(), selectedDate.getMonth())
          break
      }
    }

    loadAppointments()
  }, [viewType, selectedDate, loadAppointmentsByDate, loadAppointmentsByWeek, loadAppointmentsByMonth])

  // Încarcă numărul de programări pentru calendar
  useEffect(() => {
    const loadCounts = async () => {
      const calendarDates = getCalendarDates()
      await loadAppointmentsCount(calendarDates)
    }

    loadCounts()
  }, [currentViewDate, viewType, loadAppointmentsCount])

  // Filtrează programările pentru afișare
  const filteredAppointments = useMemo(() => {
    return appointments.slice(0, appointmentsLimit)
  }, [appointments, appointmentsLimit])

  // Check if date is current date
  const isCurrentDate = (date) => {
    const today = new Date()
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear()
  }

  // Check if date is selected date
  const isSelectedDate = (date) => {
    return date.getDate() === selectedDate.getDate() && 
           date.getMonth() === selectedDate.getMonth() && 
           date.getFullYear() === selectedDate.getFullYear()
  }

  // Obține numărul de programări pentru o dată specifică din cache
  const getAppointmentsCount = (date) => {
    const dateKey = date.toISOString().split('T')[0]
    return appointmentsCount[dateKey] || 0
  }

  const loadMoreAppointments = () => {
    setAppointmentsLimit(prev => prev + 50)
  }

  const calendarDates = getCalendarDates()

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
          onClick={() => openDrawer({ type: 'appointment', isNew: true })}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Programare nouă
        </button>
      </div>

      {/* Calendar View */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <h3 className="card-title">Calendar - {getViewTitle()}</h3>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setViewType('day')}
                className={`btn btn-sm ${viewType === 'day' ? 'btn-primary' : 'btn-outline'}`}
              >
                Zi
              </button>
              <button 
                onClick={() => setViewType('week')}
                className={`btn btn-sm ${viewType === 'week' ? 'btn-primary' : 'btn-outline'}`}
              >
                Săptămână
              </button>
              <button 
                onClick={() => setViewType('month')}
                className={`btn btn-sm ${viewType === 'month' ? 'btn-primary' : 'btn-outline'}`}
              >
                Lună
              </button>
              <button 
                onClick={goToCurrent}
                className="btn btn-outline btn-sm"
              >
                Astăzi
              </button>
            </div>
          </div>
        </div>
        <div className="card-content">
          {/* Navigation arrows */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={goToPrevious} className="btn btn-ghost btn-sm">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-sm font-medium">
              {viewType === 'day' && 'Navigare zilnică'}
              {viewType === 'week' && 'Navigare săptămânală'}
              {viewType === 'month' && 'Navigare lunară'}
            </div>
            <button onClick={goToNext} className="btn btn-ghost btn-sm">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Calendar grid */}
          {viewType === 'month' && (
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['L', 'M', 'Mi', 'J', 'V', 'S', 'D'].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
          )}
          
          <div className={`grid gap-1 ${
            viewType === 'day' ? 'grid-cols-1' : 
            viewType === 'week' ? 'grid-cols-7' : 
            'grid-cols-7'
          }`}>
            {calendarDates.map((date, index) => {
              const isCurrent = isCurrentDate(date)
              const isSelected = isSelectedDate(date)
              const appointmentsCount = getAppointmentsCount(date)
              const isCurrentMonth = date.getMonth() === currentViewDate.getMonth()
              
              return (
                <div 
                  key={index}
                  onClick={() => setSelectedDate(date)}
                  className={`
                    p-2 text-center text-sm border rounded-md cursor-pointer relative
                    ${isCurrent ? 'bg-blue-500 text-white' : ''}
                    ${isSelected && !isCurrent ? 'bg-gray-200' : ''}
                    ${!isCurrentMonth && viewType === 'month' ? 'text-gray-400' : ''}
                    ${!isCurrent && !isSelected ? 'hover:bg-muted' : ''}
                  `}
                >
                  <div className="font-medium">{date.getDate()}</div>
                  {appointmentsCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {appointmentsCount}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Appointments */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <h3 className="card-title">
              Programări {viewType === 'day' ? 'Astăzi' : viewType === 'week' ? 'Săptămâna Aceasta' : 'Luna Aceasta'}
            </h3>
            <span className="badge badge-default">{filteredAppointments.length}</span>
          </div>
        </div>
        <div className="card-content">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Se încarcă programările...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">Eroare la încărcarea programărilor: {error}</p>
                          {error.includes('Conectare la server eșuată') && (
              <button
                onClick={populateWithTestData}
                className="btn btn-primary btn-sm"
              >
                Încarcă date de test
              </button>
            )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((appointment, index) => (
                  <div key={appointment.id || index} className="flex items-center justify-between p-3 border rounded-lg">
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
                        onClick={() => openDrawer({ type: 'appointment', data: appointment })}
                        className="btn btn-ghost btn-sm"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nu există programări pentru perioada selectată
                </div>
              )}
            </div>
          )}
        </div>
        {filteredAppointments.length >= appointmentsLimit && (
          <div className="card-footer">
            <button 
              onClick={loadMoreAppointments}
              className="btn btn-outline btn-sm"
            >
              Încarcă mai multe
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default OperationsPlanning
