import { Calendar, Plus, Edit, ChevronLeft, ChevronRight, Loader2, RotateCw, Trash2, ChartNoAxesGantt, CalendarDays, RefreshCcw } from 'lucide-react'

import { useState, useMemo, useEffect } from 'react'
import { useAppointments } from '../../hooks/useAppointments.js'
import { useDrawer } from '../../contexts/DrawerContext'
import { useUsers } from '../../hooks/useUsers.js'
import Timeline from './Timeline.jsx'

const OperationsPlanning = () => {
  const { openDrawer } = useDrawer();

  // State management
  const [viewMode, setViewMode] = useState('list') // 'list' sau 'timeline'
  const [viewType, setViewType] = useState('week') // 'day', 'week', 'month'
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentViewDate, setCurrentViewDate] = useState(new Date())
  const [appointmentsLimit, setAppointmentsLimit] = useState(100)
  const [timelineDate, setTimelineDate] = useState(new Date().toISOString().slice(0, 10))

  // Hook pentru gestionarea programărilor
  const {
    appointments,
    loading,
    error,
    appointmentsCount,
    loadAppointmentsCount,
    populateWithTestData,
    loadAppointments,
    getSortedAppointments
  } = useAppointments()

  // Hook pentru gestionarea utilizatorilor (doctori)
  const { users } = useUsers()

  // Pregătește lista de doctori pentru Timeline
  const doctors = useMemo(() => {
    if (!users || users.length === 0) return []
    // Toți utilizatorii din sistem sunt considerați doctori pentru Timeline
    return users.map(user => ({
      id: user.id || user.resourceId,
      name: user.fullName || user.medicName || user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Doctor'
    }))
  }, [users])

  // Toggle între list și timeline view
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'list' ? 'timeline' : 'list')
  }

  // Handler pentru când se schimbă data în Timeline
  const handleTimelineeDateChange = (newDate) => {
    setTimelineDate(newDate)
  }

  // Handler pentru când se face click pe o programare în Timeline
  const handleTimelineAppointmentClick = (appointment) => {
    openDrawer({ type: 'appointment', data: appointment })
  }

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

  // Cycle through view types
  const cycleViewType = () => {
    const viewTypes = ['day', 'week', 'month']
    const currentIndex = viewTypes.indexOf(viewType)
    const nextIndex = (currentIndex + 1) % viewTypes.length
    setViewType(viewTypes[nextIndex])
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

  // Funcție pentru formatarea datelor în format yyyy-mm-dd
  const formatDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Încarcă programările și numărul de programări pentru perioada vizibilă
  useEffect(() => {
    const loadData = async () => {
      // Obținem toate datele din calendar pentru a calcula perioada totală
      const calendarDates = getCalendarDates()

      if (calendarDates.length === 0) return

      // Calculăm perioada totală (startDate și endDate)
      const sortedDates = [...calendarDates].sort((a, b) => a - b)
      const startDate = sortedDates[0]
      const endDate = sortedDates[sortedDates.length - 1]

      // Formatăm datele în format yyyy-mm-dd
      const formatDate = (date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }

      // Facem o singură cerere pentru întreaga perioadă vizibilă
      const loadedAppointments = await loadAppointments({
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        sortBy: 'date',
        sortOrder: 'asc'
      })

      // Calculăm numărul de programări pentru fiecare zi din rezultatul obținut
      await loadAppointmentsCount(calendarDates, loadedAppointments)
    }

    loadData()
  }, [viewType, currentViewDate, loadAppointments, loadAppointmentsCount])



  // Filtrează programările pentru afișare cu sortare optimistă
  const filteredAppointments = useMemo(() => {
    if (!appointments || appointments.length === 0) return []

    let filteredByDate = appointments

    // Filtrează după perioada selectată
    if (viewType === 'day') {
      const selectedDateStr = formatDate(selectedDate)
      filteredByDate = appointments.filter(apt => apt.date === selectedDateStr)
    } else if (viewType === 'week') {
      // Calculează începutul săptămânii (luni) folosind aceeași logică ca în getCalendarDates
      const startOfWeek = new Date(currentViewDate)
      const dayOfWeek = startOfWeek.getDay()
      const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      startOfWeek.setDate(diff)
      startOfWeek.setHours(0, 0, 0, 0)
      
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      endOfWeek.setHours(23, 59, 59, 999)
      
      // Convertim datele în format string pentru comparație
      const startDateStr = formatDate(startOfWeek)
      const endDateStr = formatDate(endOfWeek)
      
      filteredByDate = appointments.filter(apt => {
        return apt.date >= startDateStr && apt.date <= endDateStr
      })
    } else if (viewType === 'month') {
      const currentMonth = currentViewDate.getMonth()
      const currentYear = currentViewDate.getFullYear()
      
      filteredByDate = appointments.filter(apt => {
        const aptDate = new Date(apt.date)
        return aptDate.getMonth() === currentMonth && aptDate.getFullYear() === currentYear
      })
    }

    // Aplică sortarea optimistă pentru a prioritiza elementele în proces
    const sortedAppointments = filteredByDate.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date)
      if (dateCompare !== 0) return dateCompare
      return a.time.localeCompare(b.time)
    })
    return sortedAppointments.slice(0, appointmentsLimit)
  }, [appointments, appointmentsLimit, viewType, selectedDate, currentViewDate])

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
    const dateKey = formatDate(date)
    return appointmentsCount[dateKey] || 0
  }

  const loadMoreAppointments = () => {
    setAppointmentsLimit(prev => prev + 50)
  }

  // Calculează numărul de zile afișate în funcție de viewType
  const getDaysCount = () => {
    switch (viewType) {
      case 'day':
        return 1
      case 'week':
        return 7
      case 'month':
        // Calculează numărul de zile din luna curentă
        const year = currentViewDate.getFullYear()
        const month = currentViewDate.getMonth()
        return new Date(year, month + 1, 0).getDate()
      default:
        return 1
    }
  }

  const calendarDates = getCalendarDates()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-start gap-3">
        {/* Chip cu titlul */}
        <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-sm">
          <span className="font-semibold text-sm">Planificare</span>
        </div>

        {/* Separator subtil */}
        <div className="h-6 w-px bg-gray-200"></div>

        {/* Butoane rotunde */}
        <div className="flex gap-2">
          {/* Buton pentru comutare între List și Timeline View */}
          <button
            onClick={toggleViewMode}
            className="h-9 w-9 rounded-full bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center shadow-sm transition-all"
            title={viewMode === 'list' ? 'Comută la Timeline' : 'Comută la Listă'}
          >
            {viewMode === 'list' ? (
              <ChartNoAxesGantt className="h-4 w-4 text-gray-700" />
            ) : (
              <CalendarDays className="h-4 w-4 text-gray-700" />
            )}
          </button>

          {/* Când suntem în List View, afișăm butonul de cycle view type */}
          {viewMode === 'list' && (
            <>
              <button
                onClick={cycleViewType}
                className="h-9 px-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-1.5 shadow-sm transition-all"
                title={`Afișează ${getDaysCount()} ${getDaysCount() === 1 ? 'zi' : 'zile'}`}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">{getDaysCount()}</span>
              </button>
              <button
                onClick={goToCurrent}
                className="h-9 w-9 rounded-full bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center shadow-sm transition-all"
                title="Navighează la ziua curentă"
              >
                <RefreshCcw className="h-4 w-4 text-gray-700" />
              </button>
            </>
          )}

          {/* Când suntem în Timeline View, afișăm datepicker */}
          {viewMode === 'timeline' && (
            <input
              type="date"
              value={timelineDate}
              onChange={(e) => handleTimelineeDateChange(e.target.value)}
              className="h-9 px-3 text-sm border border-gray-200 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
            />
          )}

          <button
            onClick={() => openDrawer({ type: 'appointment', isNew: true })}
            className="h-9 w-9 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shadow-sm transition-all"
            title="Programare nouă"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Vizualizare condiționată: List View sau Timeline View */}
      {viewMode === 'list' ? (
        <>
          {/* Calendar View */}
          <div className="card">
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

              <div className={`grid gap-1 ${viewType === 'day' ? 'grid-cols-1' :
                  viewType === 'week' ? 'grid-cols-7' :
                    'grid-cols-7'
                }`}>
                {calendarDates.map((date, index) => {
                  const isCurrent = isCurrentDate(date)
                  const isSelected = isSelectedDate(date)
                  const appointmentsCount = getAppointmentsCount(date)
                  const isCurrentMonth = date.getMonth() === currentViewDate.getMonth()
                  const isClickable = viewType !== 'day'

                  return (
                    <div
                      key={index}
                      onClick={isClickable ? () => setSelectedDate(date) : undefined}
                      className={`
                        p-2 text-center text-sm border rounded-md relative
                        ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                        ${isCurrent ? 'bg-blue-500 text-white' : ''}
                        ${isSelected && !isCurrent ? 'bg-gray-200' : ''}
                        ${!isCurrentMonth && viewType === 'month' ? 'text-gray-400' : ''}
                        ${!isCurrent && !isSelected && isClickable ? 'hover:bg-muted' : ''}
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
              ) : (
                <div className="space-y-3">
                  {filteredAppointments.length > 0 ? (
                    filteredAppointments.map((appointment, index) => (
                      <div
                        key={appointment.id || appointment._tempId || index}
                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 ${appointment._isDeleting ? 'opacity-50' : ''
                          }`}
                        onClick={() => openDrawer({ type: 'appointment', data: appointment })}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                            <div className="text-sm font-medium w-16">{appointment.time}</div>
                            <div className="text-xs text-muted-foreground">
                              {appointment.date ? new Date(appointment.date).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit' }) : ''}
                            </div>
                          </div>
                          <div>
                            <div className={`font-medium ${appointment._isDeleting ? 'line-through' : ''}`}>
                              {appointment.patient?.name || appointment.patient || 'Pacient necunoscut'}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <div 
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: appointment.service?.color || '#3b82f6' }}
                                />
                                <span>
                                  {appointment.service?.name || appointment.service || 'Serviciu necunoscut'}
                                </span>
                              </div>
                              {/* Indicator pentru servicii suplimentare */}
                              {appointment.services && appointment.services.length > 1 && (
                                <span className="inline-flex items-center justify-center h-5 px-1.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700 border border-blue-200">
                                  +{appointment.services.length - 1}
                                </span>
                              )}
                            </div>

                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-sm text-muted-foreground">
                            {appointment.doctor?.name || appointment.doctor || 'Doctor necunoscut'}
                          </div>
                          <span className={`badge ${getStatusColor(appointment.status)}`}>
                            {getStatusText(appointment.status)}
                          </span>

                          {/* Indicator pentru optimistic updates */}
                          {appointment._isOptimistic && !appointment._isDeleting && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
                              <RotateCw className="h-3 w-3 mr-1 animate-spin" />
                              Salvare...
                            </span>
                          )}

                          {appointment._isDeleting && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-800">
                              <Trash2 className="h-3 w-3 mr-1" />
                              Ștergere...
                            </span>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openDrawer({ type: 'appointment', data: appointment })
                            }}
                            className="btn btn-ghost btn-sm"
                            disabled={appointment._isOptimistic}
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
        </>
      ) : (
        /* Timeline View */
        <div className="card rounded-lg" style={{ height: 'calc(100vh - 120px)' }}>
          <Timeline
            date={timelineDate}
            appointments={appointments}
            doctors={doctors}
            onDateChange={handleTimelineeDateChange}
            onAppointmentClick={handleTimelineAppointmentClick}
          />
        </div>
      )}
    </div>
  )
}

export default OperationsPlanning
