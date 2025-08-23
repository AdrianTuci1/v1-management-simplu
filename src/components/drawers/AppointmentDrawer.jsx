import { 
  Plus, 
  CheckCircle, 
  Upload,
  Loader2,
  Trash2,
  Calendar,
  FileText,
  Image
} from 'lucide-react'
import { useState } from 'react'
import { useAppointments } from '../../hooks/useAppointments.js'
import PatientCombobox from '../combobox/PatientCombobox.jsx'
import DoctorCombobox from '../combobox/DoctorCombobox.jsx'
import TreatmentCombobox from '../combobox/TreatmentCombobox.jsx'
import { 
  Drawer, 
  DrawerHeader, 
  DrawerNavigation, 
  DrawerContent, 
  DrawerFooter 
} from '../ui/drawer'

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
          <div className="flex-1">
            <PatientCombobox
              value={formData.patient}
              onValueChange={(value) => handleInputChange('patient', value)}
              placeholder="Selectează pacient"
            />
          </div>
          <button className="btn btn-primary btn-sm">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Doctor */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Doctor</label>
        <DoctorCombobox
          value={formData.doctor}
          onValueChange={(value) => handleInputChange('doctor', value)}
          placeholder="Selectează doctor"
        />
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
        <TreatmentCombobox
          value={formData.service}
          onValueChange={(value) => handleInputChange('service', value)}
          placeholder="Selectează serviciu"
        />
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

  const navigationItems = [
    { id: 1, label: 'Detalii', icon: Calendar },
    { id: 2, label: 'Note', icon: FileText },
    { id: 3, label: 'Galerie', icon: Image, disabled: isNewAppointment }
  ]

  return (
    <Drawer onClose={onClose}>
      <DrawerHeader
        title="Programare"
        subtitle={isNewAppointment ? 'Programare nouă' : 'Editează programarea'}
        onClose={onClose}
      />
      
      <DrawerNavigation
        items={navigationItems}
        activeItem={currentMenu}
        onItemChange={setCurrentMenu}
      />
      
      <DrawerContent>
        {renderContent()}
      </DrawerContent>
      
      <DrawerFooter>
        <div className="flex gap-2">
          {!isNewAppointment && (
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
            ) : null}
            {isNewAppointment ? 'Creează programarea' : 'Salvează modificările'}
          </button>
        </div>
      </DrawerFooter>
    </Drawer>
  )
}

export default AppointmentDrawer
