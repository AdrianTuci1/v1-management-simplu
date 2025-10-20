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
  FileText,
  Check
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { usePatients } from '../../hooks/usePatients.js'
import appointmentService from '../../services/appointmentService.js'
import PlanService from '../../services/planService.js'
import { useDrawer } from '../../contexts/DrawerContext.jsx'
import { 
  Drawer, 
  DrawerHeader, 
  DrawerContent, 
  DrawerFooter 
} from '../ui/drawer'
import { normalizePhoneNumber } from '../../utils/phoneUtils.js'
import resourceFilesService from '../../services/resourceFilesService.js'
import { FaTooth } from 'react-icons/fa'

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
  const [files, setFiles] = useState([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [filesError, setFilesError] = useState(null)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [selectedTreatments, setSelectedTreatments] = useState([])
  const [completedTreatments, setCompletedTreatments] = useState([])
  
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

  // Load patient files when patient changes
  useEffect(() => {
    const loadFiles = async () => {
      const resourceId = patientData?.resourceId || patientData?.id
      if (!resourceId) {
        setFiles([])
        return
      }
      setFilesLoading(true)
      setFilesError(null)
      try {
        const result = await resourceFilesService.listFiles('patient', String(resourceId))
        setFiles(Array.isArray(result?.files) ? result.files : [])
      } catch (e) {
        console.error('Error loading patient files:', e)
        setFilesError(e.message || 'Eroare la încărcarea fișierelor')
        setFiles([])
      } finally {
        setFilesLoading(false)
      }
    }
    loadFiles()
  }, [patientData?.id, patientData?.resourceId])

  // Reset treatment selections when menu changes
  useEffect(() => {
    if (currentMenu !== 2) {
      setSelectedTreatments([])
      setError(null)
    }
  }, [currentMenu])

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

  const handleBackendFileUpload = async (event) => {
    const resourceId = patientData?.resourceId || patientData?.id
    if (!resourceId) {
      setFilesError('Salvează pacientul înainte de a încărca fișiere')
      event.target.value = ''
      return
    }
    const selected = Array.from(event.target.files || [])
    if (selected.length === 0) return
    setUploadingFiles(true)
    setFilesError(null)
    try {
      for (const file of selected) {
        await resourceFilesService.uploadFile('patient', String(resourceId), file)
      }
      // Reload files
      const result = await resourceFilesService.listFiles('patient', String(resourceId))
      setFiles(Array.isArray(result?.files) ? result.files : [])
    } catch (e) {
      setFilesError(e.message || 'Încărcarea a eșuat')
    } finally {
      setUploadingFiles(false)
      event.target.value = ''
    }
  }

  const handleFileDelete = async (fileId) => {
    const resourceId = patientData?.resourceId || patientData?.id
    if (!resourceId || !fileId) return
    if (!confirm('Ești sigur că vrei să ștergi acest fișier?')) return
    try {
      await resourceFilesService.deleteFile('patient', String(resourceId), String(fileId))
      const result = await resourceFilesService.listFiles('patient', String(resourceId))
      setFiles(Array.isArray(result?.files) ? result.files : [])
    } catch (e) {
      setFilesError(e.message || 'Ștergerea a eșuat')
    }
  }

  const handleFileDownload = async (fileId) => {
    const resourceId = patientData?.resourceId || patientData?.id
    if (!resourceId || !fileId) return
    try {
      const url = await resourceFilesService.getFileUrl('patient', String(resourceId), String(fileId))
      if (url) window.open(url, '_blank')
    } catch (e) {
      setFilesError(e.message || 'Descărcarea a eșuat')
    }
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

  const handleToggleSelectTreatment = (treatment) => {
    // Nu permitem selectarea tratamentelor realizate
    const isCompleted = completedTreatments.find(t => t.id === treatment.id)
    if (isCompleted) return
    
    setSelectedTreatments(prev => {
      const isSelected = prev.find(t => t.id === treatment.id)
      if (isSelected) {
        return prev.filter(t => t.id !== treatment.id)
      }
      return [...prev, treatment]
    })
  }

  const handleToggleCompleteTreatment = (treatment) => {
    setCompletedTreatments(prev => {
      const isCompleted = prev.find(t => t.id === treatment.id)
      if (isCompleted) {
        return prev.filter(t => t.id !== treatment.id)
      }
      // Când marcăm ca realizat, îl eliminăm și din selecție
      setSelectedTreatments(current => current.filter(t => t.id !== treatment.id))
      return [...prev, treatment]
    })
  }

  const handleCreateAppointmentFromSelected = () => {
    if (selectedTreatments.length === 0) {
      setError('Selectează cel puțin un tratament pentru programare')
      return
    }

    // Pregătim serviciile din tratamentele selectate
    const services = selectedTreatments.map(treatment => ({
      id: treatment.id,
      name: treatment.title,
      price: String(treatment.price || 0),
      duration: treatment.durationMinutes || 0,
      toothNumber: treatment.toothNumber
    }))

    // Pentru AppointmentDrawer, trimitem date în formatul așteptat
    const appointmentData = {
      // Patient ca obiect simplu pentru transformAppointmentForUI
      patient: {
        id: patientData?.resourceId || patientData?.id,
        name: patientData?.name || patientData?.patientName || ''
      },
      services: services,
      date: new Date().toISOString().split('T')[0],
      time: '',
      status: 'scheduled',
      mention: `Tratamente din plan: ${selectedTreatments.map(t => `Dinte ${t.toothNumber} - ${t.title}`).join(', ')}`
    }

    // Deschidem AppointmentDrawer cu datele pre-populate
    openDrawer({
      type: 'appointment',
      data: appointmentData,
      isNew: true
    })

    // Resetăm selecția
    setSelectedTreatments([])
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
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {planItems.length} total
                    </span>
                    {completedTreatments.length > 0 && (
                      <span className="text-sm text-green-600">
                        • {completedTreatments.length} realizat(e)
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {planItems.map((item, index) => {
                    const isSelected = selectedTreatments.find(t => t.id === item.id)
                    const isCompleted = completedTreatments.find(t => t.id === item.id)
                    
                    return (
                      <div 
                        key={item.id} 
                        className={`flex items-start gap-3 text-sm p-3 rounded-lg transition-all ${
                            isCompleted
                            ? 'bg-green-50 border border-green-200 opacity-70'
                            : isSelected 
                            ? 'bg-blue-50 border border-blue-200' 
                            : 'bg-white border border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {/* Checkbox cu stări multiple */}
                        <button
                          onClick={() => {
                            if (isCompleted) {
                              // Dacă e realizat, îl demarcăm
                              handleToggleCompleteTreatment(item)
                            } else {
                              // Dacă nu e realizat, toggle selectare pentru programare
                              handleToggleSelectTreatment(item)
                            }
                          }}
                          onContextMenu={(e) => {
                            // Click dreapta = marchează ca realizat
                            e.preventDefault()
                            if (!isCompleted) {
                              handleToggleCompleteTreatment(item)
                            }
                          }}
                          className="flex-shrink-0 mt-0.5"
                          title={
                            isCompleted 
                              ? "Realizat (click pentru a anula)" 
                              : isSelected 
                              ? "Deselectează" 
                              : "Click = selectează | Click lung = realizat"
                          }
                        >
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                              isCompleted
                              ? 'bg-green-500 text-white'
                              : isSelected 
                              ? 'bg-blue-500 text-white'
                              : 'border-2 border-gray-300 hover:border-blue-400'
                          }`}>
                            {(isCompleted || isSelected) && (
                              <Check className="h-3 w-3" strokeWidth={3} />
                            )}
                          </div>
                        </button>
                        

                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <span className={`font-semibold text-base ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                              {item.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            {item.toothNumber && (
                              <span className="flex items-center gap-1">
                                <svg viewBox="0 0 12 12" className="h-4 w-4" fill="currentColor">
                                  <FaTooth className="h-4 w-4" />
                                </svg>
                                {item.toothNumber <= 100 ? `${item.toothNumber}` : item.toothNumber}
                              </span>
                            )}
                            {item.durationMinutes && (
                              <span>{item.durationMinutes} min</span>
                            )}
                            {item.price && (
                              <span>{item.price} RON</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              {/* Buton pentru crearea programării cu tratamentele selectate */}
              {selectedTreatments.length > 0 && (
                <div className="bg-blue-100 border border-blue-300 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedTreatments.length} tratament(e) selectat(e)
                    </span>
                  </div>
                  <button
                    onClick={handleCreateAppointmentFromSelected}
                    className="btn btn-primary w-full"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Creează programare cu tratamente selectate
                  </button>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                  </div>
                  <span>Click pe checkbox = selectează pentru programare</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                  </div>
                  <span>Click dreapta pe checkbox = marchează ca realizat</span>
                </div>
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

  const renderGallery = () => {
    const resourceId = patientData?.resourceId || patientData?.id
    if (!resourceId) {
      return (
        <div className="space-y-4">
          <div className="text-sm font-medium text-muted-foreground">
            Galerie fișiere pacient
          </div>
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">
              Salvează pacientul mai întâi pentru a putea încărca fișiere.
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="text-sm font-medium text-muted-foreground">
          Galerie fișiere pacient
        </div>

        {filesError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {filesError}
          </div>
        )}

        {/* Upload Area */}
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            Trageți și plasați fișierele aici sau
          </p>
          <label className="btn btn-outline btn-sm cursor-pointer">
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.obj,.pdf"
              onChange={handleBackendFileUpload}
              disabled={uploadingFiles}
              className="hidden"
            />
            {uploadingFiles ? 'Se încarcă...' : 'Selectează fișiere'}
          </label>
        </div>

        {/* Files List */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Fișiere încărcate</div>
          {filesLoading ? (
            <div className="text-center py-6 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
              Se încarcă lista de fișiere...
            </div>
          ) : files.length === 0 ? (
            <div className="text-slate-500 text-sm">Nu există fișiere încărcate.</div>
          ) : (
            <div className="space-y-2">
              {files.map((f) => (
                <div key={f.id} className="flex items-center justify-between p-2 border rounded-md">
                  <div className="flex items-center gap-3 min-w-0">
                    <Image className="h-4 w-4 text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{f.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{f.type} · {(f.size / 1024).toFixed(1)} KB</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleFileDownload(f.id)} className="btn btn-outline btn-xs">Descarcă</button>
                    <button onClick={() => handleFileDelete(f.id)} className="btn btn-destructive btn-xs">Șterge</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

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
