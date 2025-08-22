import { 
  X, 
  Plus, 
  CheckCircle, 
  Upload,
  Loader2,
  Trash2
} from 'lucide-react'
import { useState } from 'react'
import { useAppointments } from '../../hooks/useAppointments.js'

const AppointmentDrawer = ({ onClose, isNewAppointment = false, appointmentData = null }) => {
  const [currentMenu, setCurrentMenu] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Hook pentru gestionarea programărilor
  const { addAppointment, updateAppointment, deleteAppointment } = useAppointments()
  
  const [formData, setFormData] = useState(() => {
    if (appointmentData) {
      return {
        patient: appointmentData.patient || '',
        doctor: appointmentData.doctor || '',
        date: appointmentData.date ? new Date(appointmentData.date).toISOString().split('T')[0] : '',
        time: appointmentData.time || '',
        service: appointmentData.service || '',
        status: appointmentData.status || 'scheduled',
        postOperativeNotes: appointmentData.postOperativeNotes || '',
        prescription: appointmentData.prescription || '',
        price: appointmentData.price || '',
        images: appointmentData.images || []
      }
    }
    return {
      patient: '',
      doctor: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      service: '',
      status: 'scheduled',
      postOperativeNotes: '',
      prescription: '',
      price: '',
      images: []
    }
  })

  const patients = [
    { id: 1, name: 'Ion Marinescu' },
    { id: 2, name: 'Maria Popescu' },
    { id: 3, name: 'Alexandru Dumitrescu' },
    { id: 4, name: 'Elena Ionescu' }
  ]

  const doctors = [
    { id: 1, name: 'Dr. Ana Popa' },
    { id: 2, name: 'Dr. Mihai Vasilescu' },
    { id: 3, name: 'Dr. Elena Dumitru' }
  ]

  const treatments = [
    'Control de rutină',
    'Obturație',
    'Extracție',
    'Canal radicular',
    'Proteză',
    'Curățare profesională'
  ]

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files)
    const newImages = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      url: URL.createObjectURL(file)
    }))
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }))
  }

  const removeImage = (imageId) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== imageId)
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const appointmentData = {
        ...formData,
        date: new Date(formData.date).toISOString(),
        price: parseFloat(formData.price) || 0
      }
      
      if (isNewAppointment) {
        await addAppointment(appointmentData)
      } else {
        await updateAppointment(appointmentData.id, appointmentData)
      }
      
      onClose()
    } catch (err) {
      setError(err.message)
      console.error('Error saving appointment:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!appointmentData?.id) return
    
    if (!confirm('Sigur doriți să ștergeți această programare?')) return
    
    setLoading(true)
    setError(null)
    
    try {
      await deleteAppointment(appointmentData.id)
      onClose()
    } catch (err) {
      setError(err.message)
      console.error('Error deleting appointment:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAppointmentDone = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const updatedData = {
        ...formData,
        status: 'completed',
        date: new Date(formData.date).toISOString(),
        price: parseFloat(formData.price) || 0
      }
      
      await updateAppointment(appointmentData.id, updatedData)
      onClose()
    } catch (err) {
      setError(err.message)
      console.error('Error completing appointment:', err)
    } finally {
      setLoading(false)
    }
  }

  const renderMenu1 = () => (
    <div className="space-y-4">
      <div className="text-sm font-medium text-muted-foreground">
        Detalii programare
      </div>
      
      {/* Patient */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Pacient</label>
        <div className="flex gap-2">
          <select
            value={formData.patient}
            onChange={(e) => handleInputChange('patient', e.target.value)}
            className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 pl-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Selectează pacient</option>
            {patients.map(patient => (
              <option key={patient.id} value={patient.id}>
                {patient.name}
              </option>
            ))}
          </select>
          <button className="btn btn-primary btn-sm">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Doctor */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Doctor</label>
        <select
          value={formData.doctor}
          onChange={(e) => handleInputChange('doctor', e.target.value)}
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 pl-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">Selectează doctor</option>
          {doctors.map(doctor => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.name}
            </option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Data</label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => handleInputChange('date', e.target.value)}
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 pl-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      {/* Time */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Ora</label>
        <input
          type="time"
          value={formData.time}
          onChange={(e) => handleInputChange('time', e.target.value)}
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 pl-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      {/* Service */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Serviciu</label>
        <select
          value={formData.service}
          onChange={(e) => handleInputChange('service', e.target.value)}
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 pl-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">Selectează serviciu</option>
          {treatments.map(treatment => (
            <option key={treatment} value={treatment}>
              {treatment}
            </option>
          ))}
        </select>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Status</label>
        <select
          value={formData.status}
          onChange={(e) => handleInputChange('status', e.target.value)}
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 pl-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="scheduled">Programat</option>
          <option value="in-progress">În curs</option>
          <option value="completed">Completat</option>
          <option value="cancelled">Anulat</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>
    </div>
  )

  const renderMenu2 = () => (
    <div className="space-y-4">
      <div className="text-sm font-medium text-muted-foreground">
        Note post-operatorii
      </div>
      
      {/* Post Operative Notes */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Note post-operatorii</label>
        <textarea
          value={formData.postOperativeNotes}
          onChange={(e) => handleInputChange('postOperativeNotes', e.target.value)}
          placeholder="Introduceți notele post-operatorii..."
          rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 pl-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      {/* Prescription */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Prescripție</label>
        <textarea
          value={formData.prescription}
          onChange={(e) => handleInputChange('prescription', e.target.value)}
          placeholder="Introduceți prescripția..."
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 pl-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      {/* Price */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Preț</label>
        <div className="relative">
          <input
            type="number"
            value={formData.price}
            onChange={(e) => handleInputChange('price', e.target.value)}
            placeholder="0.00"
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            RON
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        {!isNewAppointment && (
          <button
            onClick={handleAppointmentDone}
            disabled={loading}
            className="w-full btn btn-primary"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Programarea este gata
          </button>
        )}
        
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full btn btn-outline"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          {isNewAppointment ? 'Creează programarea' : 'Salvează modificările'}
        </button>
        
        {!isNewAppointment && (
          <button
            onClick={handleDelete}
            disabled={loading}
            className="w-full btn btn-destructive"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Șterge programarea
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  )

  const renderMenu3 = () => (
    <div className="space-y-4">
      <div className="text-sm font-medium text-muted-foreground">
        Galerie foto
      </div>
      
      {/* Upload Area */}
      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">
          Trageți și plasați imaginile aici sau
        </p>
        <label className="btn btn-outline btn-sm cursor-pointer">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          Selectează fișiere
        </label>
      </div>

      {/* Images Grid */}
      {formData.images.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Imagini atașate</div>
          <div className="grid grid-cols-2 gap-2">
            {formData.images.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  onClick={() => removeImage(image.id)}
                  className="absolute top-1 right-1 h-6 w-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
                <div className="absolute bottom-1 left-1 right-1 bg-black/50 text-white text-xs p-1 rounded truncate">
                  {image.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderContent = () => {
    switch (currentMenu) {
      case 1:
        return renderMenu1()
      case 2:
        return renderMenu2()
      case 3:
        return renderMenu3()
      default:
        return renderMenu1()
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="drawer z-50">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">Programare</h2>
            <p className="text-sm text-muted-foreground">
              {isNewAppointment ? 'Programare nouă' : 'Editează programarea'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Menu Navigation */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setCurrentMenu(1)}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              currentMenu === 1 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Detalii
          </button>
          <button
            onClick={() => setCurrentMenu(2)}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              currentMenu === 2 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Note
          </button>
          <button
            onClick={() => setCurrentMenu(3)}
            disabled={isNewAppointment}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              currentMenu === 3 
                ? 'border-b-2 border-primary text-primary' 
                : isNewAppointment
                ? 'text-muted-foreground cursor-not-allowed'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Galerie
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {renderContent()}
        </div>
      </div>
    </>
  )
}

export default AppointmentDrawer
