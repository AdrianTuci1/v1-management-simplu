import { useState, useEffect } from 'react'
import { X, Save, Trash2, User, Mail, Phone, AlertCircle, Send, Loader2, Upload } from 'lucide-react'
import { useUsers } from '../../hooks/useUsers.js'
import { useRoles } from '../../hooks/useRoles.js'
import { useInvitations } from '../../hooks/useInvitations.js'
import { userManager } from '../../business/userManager.js'
import { 
  Drawer, 
  DrawerHeader, 
  DrawerContent, 
  DrawerFooter 
} from '../ui/drawer'
import resourceFilesService from '../../services/resourceFilesService.js'


const UserDrawer = ({ onClose, user = null, position = "side" }) => {
  const { addUser, updateUser, deleteUser, loading, error } = useUsers()
  const { roles } = useRoles()
  const { sendInvitation, loading: invitationLoading } = useInvitations()
  
  const [formData, setFormData] = useState({
    medicName: '',
    email: '',
    phone: '',
    role: null,
    dutyDays: [],
    canTakeAppointments: false
  })
  
  const [validationErrors, setValidationErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [invitationStatus, setInvitationStatus] = useState(null)
  const [showInvitationSuccess, setShowInvitationSuccess] = useState(false)
  const [profileFile, setProfileFile] = useState(null)
  const [profileUrl, setProfileUrl] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileUploading, setProfileUploading] = useState(false)
  const [profileError, setProfileError] = useState(null)

  // Populează formularul când se deschide pentru editare
  useEffect(() => {
    if (user) {
      setFormData({
        medicName: user.medicName || user.firstName + ' ' + user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || null,
        dutyDays: user.dutyDays || [],
        canTakeAppointments: user.canTakeAppointments || false
      })
      
      // Setează status-ul invitației din datele utilizatorului
      setInvitationStatus(user.invitationStatus || (user.cognitoUserId ? 'accepted' : 'not_sent'))
    } else {
      // Reset formular pentru utilizator nou
      setFormData({
        medicName: '',
        email: '',
        phone: '',
        role: roles.length > 0 ? { id: roles[0].resourceId, name: roles[0].name } : null,
        dutyDays: [],
        canTakeAppointments: false
      })
      setInvitationStatus('not_sent')
    }
    setValidationErrors({})
    setShowInvitationSuccess(false)
  }, [user, roles])

  // Load profile image for existing medic resource
  useEffect(() => {
    const loadProfileImage = async () => {
      const resourceId = user?.resourceId || user?.id
      if (!resourceId) {
        setProfileFile(null)
        setProfileUrl(null)
        return
      }
      setProfileLoading(true)
      setProfileError(null)
      try {
        const result = await resourceFilesService.listFiles('medic', String(resourceId))
        const files = Array.isArray(result?.files) ? result.files : []
        const imageFiles = files.filter(f => (f.type || '').startsWith('image/'))
        if (imageFiles.length === 0) {
          setProfileFile(null)
          setProfileUrl(null)
        } else {
          const sorted = imageFiles.sort((a, b) => {
            const ta = Date.parse(a.uploadedAt || '') || 0
            const tb = Date.parse(b.uploadedAt || '') || 0
            return tb - ta
          })
          const pf = sorted[0]
          setProfileFile(pf)
          try {
            const url = await resourceFilesService.getFileUrl('medic', String(resourceId), String(pf.id))
            setProfileUrl(url)
          } catch (_) {
            setProfileUrl(null)
          }
        }
      } catch (e) {
        setProfileError(e.message || 'Eroare la încărcarea imaginii de profil')
        setProfileFile(null)
        setProfileUrl(null)
      } finally {
        setProfileLoading(false)
      }
    }
    loadProfileImage()
  }, [user?.id, user?.resourceId])

  const handleProfileUpload = async (event) => {
    const resourceId = user?.resourceId || user?.id
    if (!resourceId) {
      setProfileError('Salvează medicul înainte de a încărca o imagine')
      event.target.value = ''
      return
    }
    const file = event.target.files?.[0]
    if (!file) return
    setProfileUploading(true)
    setProfileError(null)
    try {
      await resourceFilesService.uploadFile('medic', String(resourceId), file)
      const result = await resourceFilesService.listFiles('medic', String(resourceId))
      const files = Array.isArray(result?.files) ? result.files : []
      const imageFiles = files.filter(f => (f.type || '').startsWith('image/'))
      const pf = imageFiles.sort((a, b) => {
        const ta = Date.parse(a.uploadedAt || '') || 0
        const tb = Date.parse(b.uploadedAt || '') || 0
        return tb - ta
      })[0]
      setProfileFile(pf || null)
      if (pf) {
        const url = await resourceFilesService.getFileUrl('medic', String(resourceId), String(pf.id))
        setProfileUrl(url)
      } else {
        setProfileUrl(null)
      }
    } catch (e) {
      setProfileError(e.message || 'Încărcarea a eșuat')
    } finally {
      setProfileUploading(false)
      event.target.value = ''
    }
  }

  const handleProfileDelete = async () => {
    const resourceId = user?.resourceId || user?.id
    if (!resourceId || !profileFile?.id) return
    if (!window.confirm('Ești sigur că vrei să ștergi imaginea de profil?')) return
    try {
      await resourceFilesService.deleteFile('medic', String(resourceId), String(profileFile.id))
      setProfileFile(null)
      setProfileUrl(null)
    } catch (e) {
      setProfileError(e.message || 'Ștergerea a eșuat')
    }
  }

  // Validare folosind userManager
  const validateField = (name, value) => {
    const testData = { ...formData, [name]: value }
    const validationResult = userManager.validateUser(testData)
    
    if (validationResult.isValid) {
      return {}
    }
    
    // Găsește eroarea pentru câmpul curent
    const fieldError = validationResult.errors.find(error => {
      if (name === 'dutyDays' && error.includes('zi de serviciu')) return true
      if (name === 'role' && error.includes('Rol')) return true
      return false
    })
    
    return fieldError ? { [name]: fieldError } : {}
  }

  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    const fieldValue = type === 'number' ? parseInt(value) || 0 : value
    
    setFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }))
    
    // Validare în timp real
    const fieldErrors = validateField(name, fieldValue)
    setValidationErrors(prev => ({
      ...prev,
      ...fieldErrors
    }))
  }

  const handleDutyDaysChange = (day) => {
    setFormData(prev => {
      const newDutyDays = prev.dutyDays.includes(day)
        ? prev.dutyDays.filter(d => d !== day)
        : [...prev.dutyDays, day]
      
      return {
        ...prev,
        dutyDays: newDutyDays
      }
    })
    
    // Validare pentru duty days
    const newDutyDays = formData.dutyDays.includes(day)
      ? formData.dutyDays.filter(d => d !== day)
      : [...formData.dutyDays, day]
    
    const fieldErrors = validateField('dutyDays', newDutyDays)
    setValidationErrors(prev => ({
      ...prev,
      ...fieldErrors
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validare folosind userManager
    const validationResult = userManager.validateUser(formData)
    
    if (!validationResult.isValid) {
      // Convertește erorile în format pentru UI
      const errors = {}
      validationResult.errors.forEach(error => {
        if (error.includes('zi de serviciu')) errors.dutyDays = error
        else if (error.includes('Rol')) errors.role = error
      })
      
      setValidationErrors(errors)
      return
    }
    
    setIsSubmitting(true)
    
    try {
      let savedUser
      if (user) {
        savedUser = await updateUser(user.id, formData)
      } else {
        // Creează utilizatorul
        savedUser = await addUser(formData)
        
        // Trimite invitația automat pentru utilizatori noi
        if (savedUser && formData.email && !user?.cognitoUserId) {
          await handleSendInvitation(savedUser)
        }
      }
      
      // Închide drawer-ul după operație reușită
      // Optimistic update-ul va fi vizibil imediat în view
      onClose()
    } catch (err) {
      console.error('Error saving user:', err)
      // Nu închide drawer-ul în caz de eroare pentru a permite utilizatorului să corecteze
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendInvitation = async (targetUser = null) => {
    const userToInvite = targetUser || user
    
    if (!userToInvite || !userToInvite.email) {
      console.error('Nu există email pentru trimiterea invitației')
      return
    }
    
    // Verifică dacă utilizatorul are deja cont Cognito
    if (userToInvite.cognitoUserId) {
      setValidationErrors(prev => ({
        ...prev,
        invitation: 'Acest utilizator are deja cont'
      }))
      return
    }
    
    try {
      // Obține businessId și locationId din localStorage
      const selectedLocation = JSON.parse(localStorage.getItem('selected-location') || '{}')
      const selectedBusinessId = localStorage.getItem('selected-business-id')
      
      const businessId = selectedBusinessId || 'B010001'
      const locationId = selectedLocation.id || selectedLocation.locationId || 'L0100001'
      
      console.log('📧 Sending invitation to:', {
        email: userToInvite.email,
        medicResourceId: userToInvite.id || userToInvite.resourceId,
        businessId,
        locationId
      })
      
      const result = await sendInvitation({
        businessId,
        locationId,
        medicResourceId: userToInvite.id || userToInvite.resourceId,
        email: userToInvite.email
      })
      
      if (result.success) {
        setInvitationStatus('sent')
        setShowInvitationSuccess(true)
        
        // Ascunde mesajul după 3 secunde
        setTimeout(() => {
          setShowInvitationSuccess(false)
        }, 3000)
        
        console.log('✅ Invitație trimisă cu succes:', result)
      }
    } catch (error) {
      console.error('❌ Error sending invitation:', error)
      setValidationErrors(prev => ({
        ...prev,
        invitation: error.message || 'Eroare la trimiterea invitației'
      }))
    }
  }

  const handleDelete = async () => {
    if (!user) return
    
    if (window.confirm('Ești sigur că vrei să ștergi acest utilizator?')) {
      try {
        await deleteUser(user.id)
        // Închide drawer-ul după operație reușită
        // Optimistic update-ul va fi vizibil imediat în view
        onClose()
      } catch (err) {
        console.error('Error deleting user:', err)
        // Nu închide drawer-ul în caz de eroare
      }
    }
  }

  const daysOfWeek = [
    'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'
  ]

  return (
    <Drawer onClose={onClose} size="default" position={position}>
      <DrawerHeader
        title={user ? 'Editează medic' : 'Medic nou'}
        subtitle={user ? 'Modifică informațiile medicului' : 'Adaugă un medic nou în sistem'}
        onClose={onClose}
        variant="default"
      />

      <DrawerContent padding="spacious">
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </div>
        )}
        
        {showInvitationSuccess && (
          <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Send className="h-5 w-5 text-green-500" />
              <span className="text-green-700 text-sm">
                Invitație trimisă cu succes la {formData.email}
              </span>
            </div>
          </div>
        )}
        
        {validationErrors.invitation && (
          <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <span className="text-amber-700 text-sm">{validationErrors.invitation}</span>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informații de bază */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              Informații medic
            </h3>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Nume medic
              </label>
              <input
                type="text"
                name="medicName"
                value={formData.medicName}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg"
                placeholder="Numele complet al medicului"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg"
                    placeholder="email@example.com"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Telefon
                </label>
                <div className="relative flex items-center">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                  <span className="absolute left-10 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-700 pointer-events-none z-10">
                    +40
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone.startsWith('+40') ? formData.phone.substring(3) : formData.phone.startsWith('0') ? formData.phone.substring(1) : formData.phone}
                    onChange={(e) => {
                      // Elimină caracterele non-numerice
                      const numericValue = e.target.value.replace(/[^\d]/g, '')
                      // Salvează cu +40
                      setFormData(prev => ({ ...prev, phone: numericValue ? `+40${numericValue}` : '' }))
                    }}
                    className={`w-full p-3 pl-[4.5rem] border rounded-lg ${
                      validationErrors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="721 234 567 (opțional)"
                    disabled={isSubmitting}
                    maxLength="9"
                  />
                </div>
                {validationErrors.phone && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
                )}
              </div>
            </div>

            {/* Imagine profil medic */}
            {user && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Imagine profil
                </label>
                {profileError && (
                  <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{profileError}</div>
                )}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full border overflow-hidden bg-gray-100 flex items-center justify-center">
                    {profileLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    ) : profileUrl ? (
                      <img src={profileUrl} alt="Profil" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm cursor-pointer hover:bg-blue-700 transition-colors">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={handleProfileUpload}
                        disabled={profileUploading}
                        className="hidden"
                      />
                      {profileUploading ? 'Se încarcă...' : 'Încarcă/Înlocuiește'}
                    </label>
                    {profileFile && (
                      <button
                        type="button"
                        onClick={handleProfileDelete}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                      >
                        Șterge
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                Rol *
              </label>
              <select
                name="role"
                value={formData.role?.id || ''}
                onChange={(e) => {
                  const selectedRole = roles.find(r => r.resourceId === e.target.value || r.id === e.target.value)
                  setFormData(prev => ({
                    ...prev,
                    role: selectedRole ? { id: selectedRole.resourceId || selectedRole.id, name: selectedRole.name } : null
                  }))
                }}
                className={`w-full p-3 border rounded-lg ${
                  validationErrors.role ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              >
                <option value="">Selectează un rol</option>
                {roles.map((role) => (
                  <option key={role.resourceId || role.id} value={role.resourceId || role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              {validationErrors.role && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.role}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Zile de serviciu *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {daysOfWeek.map(day => (
                  <label key={day} className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.dutyDays.includes(day)}
                      onChange={() => handleDutyDaysChange(day)}
                      className="rounded border-gray-300"
                      disabled={isSubmitting}
                    />
                    <span className="text-sm">{day}</span>
                  </label>
                ))}
              </div>
              {validationErrors.dutyDays && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.dutyDays}</p>
              )}
            </div>

            <div>
              <label className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  name="canTakeAppointments"
                  checked={formData.canTakeAppointments}
                  onChange={(e) => setFormData(prev => ({ ...prev, canTakeAppointments: e.target.checked }))}
                  className="rounded border-gray-300"
                  disabled={isSubmitting}
                />
                <span className="text-sm font-medium">Poate prelua programări</span>
              </label>
            </div>
          </div>

          {/* Invitation Section - Only for edit mode */}
          {user && (
            <div className="space-y-4 mt-6 pt-6 border-t">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Invitație Access
              </h3>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">
                    Status invitație
                  </p>
                  <p className="text-sm text-gray-500">
                    {invitationStatus === 'accepted' && '✓ Are cont Cognito'}
                    {invitationStatus === 'sent' && '📧 Invitație trimisă'}
                    {invitationStatus === 'not_sent' && '⚠ Invitație netrimisă'}
                  </p>
                </div>
                
                {!user.cognitoUserId && (
                  <button
                    type="button"
                    onClick={() => handleSendInvitation()}
                    disabled={invitationLoading || !formData.email}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                    <span>
                      {invitationLoading ? 'Se trimite...' : 
                       invitationStatus === 'sent' ? '↻ Retrimite invitație' : 
                       '📧 Trimite invitație'}
                    </span>
                  </button>
                )}
              </div>
              
              {invitationStatus === 'sent' && user.invitationSentAt && (
                <p className="text-xs text-gray-500">
                  Ultimă trimitere: {new Date(user.invitationSentAt).toLocaleDateString('ro-RO')}
                </p>
              )}
            </div>
          )}
        </form>
      </DrawerContent>

      <DrawerFooter variant="default">
        <div className="flex gap-2">
          {user && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              <span>Șterge</span>
            </button>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Anulează
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || loading}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{isSubmitting ? 'Salvând...' : 'Salvează'}</span>
          </button>
        </div>
      </DrawerFooter>
    </Drawer>
  )
}

export default UserDrawer
