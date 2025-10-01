import { useState, useEffect } from 'react'
import { 
  User, 
  Calendar, 
  Clock, 
  Plus, 
  Edit3, 
  Trash2, 
  Save,
  X,
  LogOut
} from 'lucide-react'
import { useAppointments } from '../../hooks/useAppointments.js'
import cognitoAuthService from '../../services/cognitoAuthService'
import { 
  Drawer, 
  DrawerHeader, 
  DrawerContent, 
  DrawerFooter 
} from '../ui/drawer'

const UserProfileDrawer = ({ onClose, position = "side" }) => {
  const { appointments, loading: appointmentsLoading } = useAppointments()
  const [userInfo, setUserInfo] = useState(null)
  const [userNotes, setUserNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [editingNote, setEditingNote] = useState(null)
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [loading, setLoading] = useState(false)

  // Load user info and notes
  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true)
      try {
        // Get user info from localStorage
        const savedCognitoData = localStorage.getItem('cognito-data')
        const businessInfo = localStorage.getItem('business-info')
        
        if (savedCognitoData) {
          const userData = JSON.parse(savedCognitoData)
          let userRole = 'Administrator' // Default role
          
          // Try to get actual role from business info
          if (businessInfo) {
            try {
              const businessData = JSON.parse(businessInfo)
              if (businessData.locations && businessData.locations.length > 0) {
                const currentLocation = businessData.locations.find(loc => loc.isCurrent) || businessData.locations[0]
                userRole = currentLocation.role || 'Administrator'
              }
            } catch (e) {
              console.warn('Error parsing business info:', e)
            }
          }
          
          setUserInfo({
            name: userData.profile?.name || userData.user?.name || 'Utilizator',
            email: userData.profile?.email || userData.user?.email || '',
            role: userRole
          })
        }

        // Load user notes from localStorage
        const savedNotes = localStorage.getItem('user-notes')
        if (savedNotes) {
          setUserNotes(JSON.parse(savedNotes))
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [])

  // Get upcoming appointments (next 7 days)
  const getUpcomingAppointments = () => {
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointmentDate || appointment.startDate)
      return appointmentDate >= today && appointmentDate <= nextWeek
    }).sort((a, b) => new Date(a.appointmentDate || a.startDate) - new Date(b.appointmentDate || b.startDate))
  }

  // Add new note
  const handleAddNote = () => {
    if (newNote.trim()) {
      const note = {
        id: Date.now().toString(),
        text: newNote.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const updatedNotes = [...userNotes, note]
      setUserNotes(updatedNotes)
      localStorage.setItem('user-notes', JSON.stringify(updatedNotes))
      setNewNote('')
      setIsAddingNote(false)
    }
  }

  // Edit note
  const handleEditNote = (noteId, newText) => {
    const updatedNotes = userNotes.map(note => 
      note.id === noteId 
        ? { ...note, text: newText.trim(), updatedAt: new Date().toISOString() }
        : note
    )
    setUserNotes(updatedNotes)
    localStorage.setItem('user-notes', JSON.stringify(updatedNotes))
    setEditingNote(null)
  }

  // Delete note
  const handleDeleteNote = (noteId) => {
    if (window.confirm('Ești sigur că vrei să ștergi această notă?')) {
      const updatedNotes = userNotes.filter(note => note.id !== noteId)
      setUserNotes(updatedNotes)
      localStorage.setItem('user-notes', JSON.stringify(updatedNotes))
    }
  }

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return ''
    return timeString.substring(0, 5) // HH:MM format
  }

  const upcomingAppointments = getUpcomingAppointments()

  return (
    <Drawer onClose={onClose} size="default" position={position}>
      <DrawerHeader
        title="Profil Utilizator"
        subtitle="Informații personale și programări"
        onClose={onClose}
        variant="default"
      />

      <DrawerContent padding="spacious">
        <div className="space-y-6">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{userInfo?.name || 'Utilizator'}</h3>
              <p className="text-sm text-muted-foreground">{userInfo?.role || 'Administrator'}</p>
              {userInfo?.email && (
                <p className="text-xs text-muted-foreground">{userInfo.email}</p>
              )}
            </div>
          </div>

          {/* User Notes Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-muted-foreground">
                Note personale
              </div>
              <button
                onClick={() => setIsAddingNote(true)}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark"
              >
                <Plus className="h-3 w-3" />
                Adaugă notă
              </button>
            </div>

            {/* Add new note */}
            {isAddingNote && (
              <div className="p-3 border rounded-lg bg-gray-50">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Scrie o notă personală..."
                  className="w-full p-2 border rounded text-sm resize-none"
                  rows={3}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="flex items-center gap-1 px-3 py-1 bg-primary text-white rounded text-xs hover:bg-primary-dark disabled:opacity-50"
                  >
                    <Save className="h-3 w-3" />
                    Salvează
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingNote(false)
                      setNewNote('')
                    }}
                    className="flex items-center gap-1 px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-xs"
                  >
                    <X className="h-3 w-3" />
                    Anulează
                  </button>
                </div>
              </div>
            )}

            {/* Display notes */}
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {userNotes.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-4">
                  Nu ai note personale
                </div>
              ) : (
                userNotes.map((note) => (
                  <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                    {editingNote === note.id ? (
                      <div>
                        <textarea
                          defaultValue={note.text}
                          className="w-full p-2 border rounded text-sm resize-none"
                          rows={2}
                          ref={(el) => {
                            if (el) {
                              el.focus()
                              el.select()
                            }
                          }}
                          onBlur={(e) => {
                            if (e.target.value.trim() !== note.text) {
                              handleEditNote(note.id, e.target.value)
                            } else {
                              setEditingNote(null)
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                              handleEditNote(note.id, e.target.value)
                            } else if (e.key === 'Escape') {
                              setEditingNote(null)
                            }
                          }}
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          Apasă Ctrl+Enter pentru a salva sau Escape pentru a anula
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm">{note.text}</div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs text-muted-foreground">
                            {formatDate(note.createdAt)}
                            {note.updatedAt !== note.createdAt && (
                              <span> (modificat)</span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditingNote(note.id)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <Edit3 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="p-1 text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground">
              Programări următoare (7 zile)
            </div>
            
            {appointmentsLoading ? (
              <div className="text-center text-sm text-muted-foreground py-4">
                Se încarcă programările...
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-4">
                Nu ai programări în următoarele 7 zile
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-sm">
                        {formatDate(appointment.appointmentDate || appointment.startDate)}
                      </span>
                      <Clock className="h-3 w-3 text-blue-600 ml-auto" />
                      <span className="text-xs text-blue-600">
                        {formatTime(appointment.startTime)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700">
                      {appointment.patientName || appointment.patient?.name || 'Pacient necunoscut'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {appointment.treatmentType || appointment.type || 'Consultare'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted rounded-lg text-center">
              <div className="text-lg font-semibold">{appointments.length}</div>
              <div className="text-xs text-muted-foreground">Total programări</div>
            </div>
            <div className="p-3 bg-muted rounded-lg text-center">
              <div className="text-lg font-semibold">{userNotes.length}</div>
              <div className="text-xs text-muted-foreground">Note personale</div>
            </div>
          </div>
        </div>
      </DrawerContent>

      <DrawerFooter variant="default">
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Închide
          </button>
          <button
            onClick={async () => {
              // Handle logout
              await cognitoAuthService.signOut()
              window.location.reload()
            }}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Deconectare</span>
          </button>
        </div>
      </DrawerFooter>
    </Drawer>
  )
}

export default UserProfileDrawer
