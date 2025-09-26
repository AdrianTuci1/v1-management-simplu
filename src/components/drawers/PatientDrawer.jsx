import { 
  Plus, 
  Save,
  Loader2,
  Trash2,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Tag,
  Pill,
  Clock,
  X
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { usePatients } from '../../hooks/usePatients.js'
import appointmentService from '../../services/appointmentService.js'
import { 
  Drawer, 
  DrawerHeader, 
  DrawerNavigation, 
  DrawerContent, 
  DrawerFooter 
} from '../ui/drawer'
import TeethChartTab from '../dental-chart/TeethChartTab'

const PatientDrawer = ({ onClose, isNewPatient = false, patientData = null, position = "side" }) => {
  const [currentMenu, setCurrentMenu] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [newTag, setNewTag] = useState('')
  const [appointments, setAppointments] = useState([])
  const [appointmentsLoading, setAppointmentsLoading] = useState(false)
  
  // Hook pentru gestionarea pacienților
  const { addPatient, updatePatient, deletePatient } = usePatients()
  
  const [formData, setFormData] = useState(() => {
    if (patientData) {
      return {
        name: patientData.name || '',
        email: patientData.email || '',
        phone: patientData.phone || '',
        birthYear: patientData.birthYear || '',
        gender: patientData.gender || '',
        address: patientData.address || '',
        notes: patientData.notes || '',
        tags: patientData.tags || [],
        status: patientData.status || 'active'
      }
    }
    return {
      name: '',
      email: '',
      phone: '',
      birthYear: '',
      gender: '',
      address: '',
      notes: '',
      tags: [],
      status: 'active'
    }
  })

  // Load appointments when patient data changes
  useEffect(() => {
    const loadAppointments = async () => {
      if (patientData?.id || patientData?.resourceId) {
        setAppointmentsLoading(true)
        try {
          const patientId = patientData.resourceId || patientData.id
          const patientAppointments = await appointmentService.getAppointmentsByPatientId(patientId)
          setAppointments(patientAppointments)
        } catch (error) {
          console.error('Error loading appointments:', error)
          setAppointments([])
        } finally {
          setAppointmentsLoading(false)
        }
      } else {
        setAppointments([])
      }
    }

    loadAppointments()
  }, [patientData?.id, patientData?.resourceId])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    
    try {
      if (isNewPatient) {
        await addPatient(formData)
      } else {
        await updatePatient(patientData.id, formData)
      }
      onClose()
    } catch (err) {
      setError(err.message)
      console.error('Error saving patient:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!patientData?.id) return
    
    if (!confirm('Ești sigur că vrei să ștergi acest pacient?')) return
    
    setLoading(true)
    setError(null)
    
    try {
      await deletePatient(patientData.id)
      onClose()
    } catch (err) {
      setError(err.message)
      console.error('Error deleting patient:', err)
    } finally {
      setLoading(false)
    }
  }


  const renderPatientDetails = () => (
    <div className="space-y-4">
      <div className="text-sm font-medium text-muted-foreground">
        Informații personale
      </div>
      
      {/* Nume */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Nume complet *</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Numele și prenumele pacientului"
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </div>

      {/* Anul nașterii */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Anul nașterii</label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="number"
            value={formData.birthYear}
            onChange={(e) => handleInputChange('birthYear', e.target.value)}
            placeholder="1990"
            min="1900"
            max={new Date().getFullYear()}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </div>

      {/* Gen */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Gen</label>
        <select
          value={formData.gender}
          onChange={(e) => handleInputChange('gender', e.target.value)}
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 pl-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">Selectează genul</option>
          <option value="male">Masculin</option>
          <option value="female">Feminin</option>
          <option value="other">Altul</option>
        </select>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="email@exemplu.com"
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </div>

      {/* Telefon */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Telefon *</label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="021 123 4567"
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </div>

      {/* Adresa */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Adresa</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <textarea
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="Adresa completă"
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </div>

      {/* Note */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Note</label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Note suplimentare despre pacient"
          rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 pl-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Etichete</label>
        <div className="space-y-2">
          {/* Existing tags */}
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-blue-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          
          {/* Add new tag */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Adaugă o etichetă"
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <button
              onClick={handleAddTag}
              disabled={!newTag.trim()}
              className="btn btn-outline btn-sm"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Status</label>
        <select
          value={formData.status}
          onChange={(e) => handleInputChange('status', e.target.value)}
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 pl-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="active">Activ</option>
          <option value="inactive">Inactiv</option>
          <option value="archived">Arhivat</option>
        </select>
      </div>
    </div>
  )

  const renderDentalNotes = () => (
    <div className="space-y-4">
      <div className="text-sm font-medium text-muted-foreground">
        Note dentare
      </div>
      <div className="border rounded-md p-2">
        <TeethChartTab patientId={String(patientData?.id || patientData?.resourceId || '')} />
      </div>
    </div>
  )

  const renderAppointments = () => (
    <div className="space-y-4">
      <div className="text-sm font-medium text-muted-foreground">
        Programări
      </div>
      
      {appointmentsLoading ? (
        <div className="text-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-slate-500">Se încarcă programările...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className={`p-4 rounded-lg border ${
                appointment.status === 'completed' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString('ro-RO') : 'Data necunoscută'} - {appointment.startTime || 'Ora necunoscută'}
                  </span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  appointment.status === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {appointment.status === 'completed' ? 'Finalizată' : 'Programată'}
                </span>
              </div>
              <div className="text-sm text-slate-600">
                <div className="font-medium">{appointment.treatmentType || appointment.type || 'Consultare'}</div>
                {appointment.notes && (
                  <div className="mt-1">{appointment.notes}</div>
                )}
              </div>
            </div>
          ))}
          
          {appointments.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              Nu există programări pentru acest pacient
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderMenu = () => {
    switch (currentMenu) {
      case 1: return renderPatientDetails()
      case 2: return renderDentalNotes()
      case 3: return renderAppointments()
      default: return renderPatientDetails()
    }
  }

  const navigationItems = [
    { id: 1, label: 'Detalii pacient', icon: User },
    { id: 2, label: 'Note dentare', icon: Pill },
    { id: 3, label: 'Programări', icon: Calendar }
  ]

  return (
    <Drawer onClose={onClose} position={position}>
      <DrawerHeader
        title={isNewPatient ? 'Pacient nou' : 'Editare pacient'}
        subtitle={isNewPatient ? 'Adaugă un pacient nou în sistem' : 'Modifică informațiile pacientului'}
        onClose={onClose}
      />
      
      <DrawerNavigation
        items={navigationItems}
        activeItem={currentMenu}
        onItemChange={setCurrentMenu}
      />
      
      <DrawerContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}
        
        {renderMenu()}
      </DrawerContent>
      
      <DrawerFooter>
        <div className="flex gap-2">
          {!isNewPatient && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="btn btn-destructive"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Șterge
            </button>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="btn btn-outline"
            disabled={loading}
          >
            Anulează
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isNewPatient ? 'Adaugă' : 'Salvează'}
          </button>
        </div>
      </DrawerFooter>
    </Drawer>
  )
}

export default PatientDrawer
