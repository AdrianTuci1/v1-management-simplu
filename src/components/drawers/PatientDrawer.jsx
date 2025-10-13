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
  X,
  Upload,
  Image,
  ClipboardList,
  FileText
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { usePatients } from '../../hooks/usePatients.js'
import appointmentService from '../../services/appointmentService.js'
import PlanService from '../../services/planService.js'
import { useDrawer } from '../../contexts/DrawerContext.jsx'
import { 
  Drawer, 
  DrawerHeader, 
  DrawerNavigation, 
  DrawerContent, 
  DrawerFooter 
} from '../ui/drawer'
import FullscreenTreatmentPlan from '../dental-chart/FullscreenTreatmentPlan'
import { normalizePhoneNumber } from '../../utils/phoneUtils.js'

const PatientDrawer = ({ onClose, isNewPatient = false, patientData = null, position = "side", externalCurrentMenu, onExternalMenuChange }) => {
  const [currentMenu, setCurrentMenu] = useState(1)
  
  // Sincronizează cu navigația externă dacă este disponibilă
  useEffect(() => {
    if (externalCurrentMenu !== undefined && onExternalMenuChange) {
      setCurrentMenu(externalCurrentMenu)
    }
  }, [externalCurrentMenu, onExternalMenuChange])
  
  const handleMenuChange = (id) => {
    setCurrentMenu(id)
    if (onExternalMenuChange) {
      onExternalMenuChange(id)
    }
    // Închide planul de tratament când se schimbă meniul
    if (showTreatmentPlan) {
      setShowTreatmentPlan(false)
      setTreatmentPlanOpen(false)
      setTreatmentPlanPatientId(null)
    }
  }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [newTag, setNewTag] = useState('')
  const [appointments, setAppointments] = useState([])
  const [appointmentsLoading, setAppointmentsLoading] = useState(false)
  const [showTreatmentPlan, setShowTreatmentPlan] = useState(false)
  const [planItems, setPlanItems] = useState([])
  const [planLoading, setPlanLoading] = useState(false)
  
  // Hook pentru gestionarea pacienților
  const { addPatient, updatePatient, deletePatient } = usePatients()
  const { openDrawer, setTreatmentPlanOpen, setTreatmentPlanPatientId } = useDrawer()
  
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
        status: patientData.status || 'active',
        images: patientData.images || []
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
      status: 'active',
      images: []
    }
  })

  // Load appointments when patient data changes
  useEffect(() => {
    const loadAppointments = async () => {
      if (patientData?.id) {
        setAppointmentsLoading(true)
        console.log('patientData', patientData)
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
  }, [patientData?.id])

  // Load plan when patient data changes or when treatment plan closes
  useEffect(() => {
    const loadPlan = async () => {
      if (patientData?.id) {
        setPlanLoading(true)
        try {
          const patientId = patientData.resourceId || patientData.id
          const planService = new PlanService()
          const plan = await planService.getPlan(patientId)
          setPlanItems(plan)
        } catch (error) {
          console.error('Error loading plan:', error)
          setPlanItems([])
        } finally {
          setPlanLoading(false)
        }
      } else {
        setPlanItems([])
      }
    }

    loadPlan()
  }, [patientData?.id, showTreatmentPlan])

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
      // Normalizează numărul de telefon înainte de salvare
      const dataToSave = {
        ...formData,
        phone: normalizePhoneNumber(formData.phone)
      }
      
      if (isNewPatient) {
        await addPatient(dataToSave)
      } else {
        await updatePatient(patientData.id, dataToSave)
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

  console.log('appointments', appointments)

  const handleAppointmentClick = (appointment) => {
    openDrawer({
      type: 'appointment',
      data: appointment,
      isNew: false
    })
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
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
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
          <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
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
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
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
        <div className="relative flex items-center">
          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
          <span className="absolute left-9 top-1/2 -translate-y-1/2 text-sm text-foreground font-medium pointer-events-none z-10">
            +40
          </span>
          <input
            type="tel"
            value={formData.phone.startsWith('+40') ? formData.phone.substring(3) : formData.phone.startsWith('0') ? formData.phone.substring(1) : formData.phone}
            onChange={(e) => {
              // Elimină caracterele non-numerice
              const numericValue = e.target.value.replace(/[^\d]/g, '')
              // Salvează cu +40
              handleInputChange('phone', numericValue ? `+40${numericValue}` : '')
            }}
            placeholder="721 234 567"
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 pl-[4.5rem] text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            maxLength="9"
          />
        </div>
      </div>

      {/* Adresa */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Adresa</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
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
              <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
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

  const renderDentalNotes = () => {
    if (!patientData?.id && !patientData?.resourceId) {
      return (
        <div className="space-y-4">
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">
              Salvează pacientul mai întâi pentru a putea accesa planul de tratament.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">
              Plan de tratament
            </div>
            <button
              onClick={() => {
                setShowTreatmentPlan(true)
                setTreatmentPlanOpen(true)
                setTreatmentPlanPatientId(String(patientData?.id || patientData?.resourceId || ''))
              }}
              className="btn btn-primary btn-sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              {planItems.length > 0 ? 'Editează planul' : 'Crează plan nou'}
            </button>
          </div>
          
          {planLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-slate-500">Se încarcă planul...</p>
            </div>
          ) : planItems.length > 0 ? (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Plan de tratament activ</h4>
                  <span className="text-sm text-blue-600">{planItems.length} tratamente</span>
                </div>
                <div className="space-y-2">
                  {planItems.slice(0, 5).map((item, index) => (
                    <div key={item.id} className="flex items-start gap-2 text-sm">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            Dinte {item.toothNumber}
                          </span>
                          <span className="text-gray-700 truncate">
                            {item.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                          {item.durationMinutes && (
                            <span>{item.durationMinutes} min</span>
                          )}
                          {item.price && (
                            <span>{item.price} RON</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {planItems.length > 5 && (
                    <div className="text-center pt-2">
                      <button
                        onClick={() => {
                          setShowTreatmentPlan(true)
                          setTreatmentPlanOpen(true)
                          setTreatmentPlanPatientId(String(patientData?.id || patientData?.resourceId || ''))
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        +{planItems.length - 5} tratamente suplimentare
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                Click pe "Editează planul" pentru a modifica ordinea tratamentelor sau pentru a adăuga/șterge tratamente.
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-500 mb-3">
                Nu există încă un plan de tratament pentru acest pacient.
              </p>
              <button
                onClick={() => {
                  setShowTreatmentPlan(true)
                  setTreatmentPlanOpen(true)
                  setTreatmentPlanPatientId(String(patientData?.id || patientData?.resourceId || ''))
                }}
                className="btn btn-primary"
              >
                <Plus className="h-4 w-4 mr-1" />
                Crează plan nou
              </button>
            </div>
          )}
        </div>
    );
  }

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
              onClick={() => handleAppointmentClick(appointment)}
              className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                appointment.status === 'completed' 
                  ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                  : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {appointment.date ? new Date(appointment.date).toLocaleDateString('ro-RO') : 'Data necunoscută'} - {appointment.time || 'Ora necunoscută'}
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
                <div className="font-medium">{appointment.service?.name || appointment.treatmentType || appointment.type || 'Consultare'}</div>
                {appointment.doctor?.name && (
                  <div className="mt-1"><strong>Doctor:</strong> {appointment.doctor.name}</div>
                )}
                {appointment.price && appointment.price !== '0' && (
                  <div className="mt-1"><strong>Preț:</strong> {appointment.price} RON</div>
                )}
                {appointment.prescription && (
                  <div className="mt-1"><strong>Prescripție:</strong> {appointment.prescription}</div>
                )}
                {appointment.postOperativeNotes && (
                  <div className="mt-1"><strong>Observații:</strong> {appointment.postOperativeNotes}</div>
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

  const renderGallery = () => (
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

  const renderMenu = () => {
    switch (currentMenu) {
      case 1: return renderPatientDetails()
      case 2: return renderDentalNotes()
      case 3: return renderAppointments()
      case 4: return renderGallery()
      default: return renderPatientDetails()
    }
  }



  return (
    <Drawer onClose={onClose} position={position}>
        <DrawerHeader
          title={isNewPatient ? 'Pacient nou' : 'Editare pacient'}
          subtitle={isNewPatient ? 'Adaugă un pacient nou în sistem' : 'Modifică informațiile pacientului'}
          onClose={onClose}
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
