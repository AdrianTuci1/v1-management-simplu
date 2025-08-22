import { useState, useEffect } from 'react'
import { X, Save, Trash2, User, Mail, Phone, AlertCircle } from 'lucide-react'
import { useUsers } from '../../hooks/useUsers.js'
import { userManager } from '../../business/userManager.js'

const UserDrawer = ({ onClose, user = null }) => {
  const { addUser, updateUser, deleteUser, loading, error } = useUsers()
  
  const [formData, setFormData] = useState({
    medicName: '',
    email: '',
    phone: '',
    dutyDays: []
  })
  
  const [validationErrors, setValidationErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Populează formularul când se deschide pentru editare
  useEffect(() => {
    if (user) {
      setFormData({
        medicName: user.medicName || user.firstName + ' ' + user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        dutyDays: user.dutyDays || []
      })
    } else {
      // Reset formular pentru utilizator nou
      setFormData({
        medicName: '',
        email: '',
        phone: '',
        dutyDays: []
      })
    }
    setValidationErrors({})
  }, [user])

  // Validare în timp real
  const validateField = (name, value) => {
    const errors = {}
    
    switch (name) {
      case 'medicName':
        if (!value.trim()) {
          errors.medicName = 'Numele medicului este obligatoriu'
        } else if (value.trim().length < 2) {
          errors.medicName = 'Numele medicului trebuie să aibă cel puțin 2 caractere'
        }
        break
        
      case 'email':
        if (!value.trim()) {
          errors.email = 'Email-ul este obligatoriu'
        } else if (!userManager.isValidEmail(value)) {
          errors.email = 'Email-ul nu este valid'
        }
        break
        
      case 'phone':
        if (!value.trim()) {
          errors.phone = 'Telefonul este obligatoriu'
        } else if (!userManager.isValidPhone(value)) {
          errors.phone = 'Telefonul nu este valid'
        }
        break
        
      case 'dutyDays':
        if (!value || value.length === 0) {
          errors.dutyDays = 'Cel puțin o zi de serviciu trebuie selectată'
        }
        break
    }
    
    return errors
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
    
    // Validare completă
    const errors = {}
    Object.keys(formData).forEach(field => {
      const fieldErrors = validateField(field, formData[field])
      Object.assign(errors, fieldErrors)
    })
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }
    
    setIsSubmitting(true)
    
    try {
      if (user) {
        await updateUser(user.id, formData)
      } else {
        await addUser(formData)
      }
      onClose()
    } catch (err) {
      console.error('Error saving user:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!user) return
    
    if (window.confirm('Ești sigur că vrei să ștergi acest utilizator?')) {
      try {
        await deleteUser(user.id)
        onClose()
      } catch (err) {
        console.error('Error deleting user:', err)
      }
    }
  }

  const daysOfWeek = [
    'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'
  ]



  return (
    <div className="drawer">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
      
      {/* Drawer Content */}
      <div className="relative z-50 h-full w-full max-w-2xl bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="drawer-header">
          <div>
            <h2 className="text-xl font-semibold">
              {user ? 'Editează medic' : 'Medic nou'}
            </h2>
            <p className="text-sm text-slate-600">
              {user ? 'Modifică informațiile medicului' : 'Adaugă un medic nou în sistem'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

                {/* Content */}
        <div className="drawer-content">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
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
                  Nume medic *
                </label>
                <input
                  type="text"
                  name="medicName"
                  value={formData.medicName}
                  onChange={handleInputChange}
                  className={`w-full p-3 border rounded-lg ${
                    validationErrors.medicName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Numele complet al medicului"
                />
                {validationErrors.medicName && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.medicName}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full p-3 pl-10 border rounded-lg ${
                        validationErrors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="email@example.com"
                    />
                  </div>
                  {validationErrors.email && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Telefon *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full p-3 pl-10 border rounded-lg ${
                        validationErrors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="+40 123 456 789"
                    />
                  </div>
                  {validationErrors.phone && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
                  )}
                </div>
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
                      />
                      <span className="text-sm">{day}</span>
                    </label>
                  ))}
                </div>
                {validationErrors.dutyDays && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.dutyDays}</p>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="drawer-footer">
          <div className="flex gap-2">
            {user && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="btn btn-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Șterge
              </button>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn btn-outline"
            >
              Anulează
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || loading}
              className="btn btn-primary"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Salvând...' : 'Salvează'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserDrawer
