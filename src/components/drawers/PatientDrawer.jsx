import { 
  X, 
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
  Clock
} from 'lucide-react'
import { useState } from 'react'
import { usePatients } from '../../hooks/usePatients.js'

const PatientDrawer = ({ onClose, isNewPatient = false, patientData = null }) => {
  const [currentMenu, setCurrentMenu] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [newTag, setNewTag] = useState('')
  
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

  // Mock appointments data - in real app this would come from appointments service
  const mockAppointments = [
    {
      id: 1,
      date: '2024-01-15',
      time: '10:00',
      type: 'Consultare',
      status: 'completed',
      notes: 'Control rutină'
    },
    {
      id: 2,
      date: '2024-02-20',
      time: '14:30',
      type: 'Tratament',
      status: 'scheduled',
      notes: 'Plombare'
    },
    {
      id: 3,
      date: '2024-03-10',
      time: '09:00',
      type: 'Consultare',
      status: 'scheduled',
      notes: 'Control post-tratament'
    }
  ]

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
      
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Pill className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">
          Note dentare
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Aici vor fi afișate notele dentare și starea dinților pacientului
        </p>
        <button className="btn btn-outline">
          <Plus className="h-4 w-4 mr-2" />
          Adaugă notă dentară
        </button>
      </div>
    </div>
  )

  const renderAppointments = () => (
    <div className="space-y-4">
      <div className="text-sm font-medium text-muted-foreground">
        Programări
      </div>
      
      <div className="space-y-3">
        {mockAppointments.map((appointment) => (
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
                  {new Date(appointment.date).toLocaleDateString('ro-RO')} - {appointment.time}
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
              <div className="font-medium">{appointment.type}</div>
              {appointment.notes && (
                <div className="mt-1">{appointment.notes}</div>
              )}
            </div>
          </div>
        ))}
        
        {mockAppointments.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            Nu există programări pentru acest pacient
          </div>
        )}
      </div>
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

  return (
    <div className="drawer">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
      
      {/* Drawer Content */}
      <div className="relative z-50 h-full w-full max-w-2xl bg-white shadow-xl flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between border-b border-slate-200 flex-shrink-0 p-4">
          <div>
            <h2 className="text-xl font-semibold">
              {isNewPatient ? 'Pacient nou' : 'Editare pacient'}
            </h2>
            <p className="text-sm text-slate-600">
              {isNewPatient ? 'Adaugă un pacient nou în sistem' : 'Modifică informațiile pacientului'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation - Fixed */}
        <div className="flex border-b border-slate-200 flex-shrink-0">
          {[
            { id: 1, label: 'Detalii pacient', icon: User },
            { id: 2, label: 'Note dentare', icon: Pill },
            { id: 3, label: 'Programări', icon: Calendar }
          ].map((menu) => {
            const Icon = menu.icon
            return (
              <button
                key={menu.id}
                onClick={() => setCurrentMenu(menu.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                  currentMenu === menu.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{menu.label}</span>
              </button>
            )
          })}
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}
          
          {renderMenu()}
        </div>

        {/* Footer - Fixed */}
        <div className="flex items-center justify-between border-t border-slate-200 flex-shrink-0 p-4">
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
        </div>
      </div>
    </div>
  )
}

export default PatientDrawer
