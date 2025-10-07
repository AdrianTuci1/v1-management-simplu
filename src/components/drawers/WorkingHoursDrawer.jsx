import { useState, useEffect } from 'react'
import { Clock, MapPin, Save } from 'lucide-react'
import { 
  Drawer, 
  DrawerHeader, 
  DrawerContent, 
  DrawerFooter 
} from '../ui/drawer'
import { useSettings } from '../../hooks/useSettings'

const WorkingHoursDrawer = ({ onClose, settingId, settingData }) => {
  const { 
    workingHours, 
    saveWorkingHours, 
    updateSetting,
    loading: settingsLoading, 
    error: settingsError 
  } = useSettings()
  
  const [loading, setLoading] = useState(false)
  const [localWorkingHours, setLocalWorkingHours] = useState({})
  const [localLocationDetails, setLocalLocationDetails] = useState({})

  const days = [
    { key: 'monday', label: 'Luni' },
    { key: 'tuesday', label: 'Marți' },
    { key: 'wednesday', label: 'Miercuri' },
    { key: 'thursday', label: 'Joi' },
    { key: 'friday', label: 'Vineri' },
    { key: 'saturday', label: 'Sâmbătă' },
    { key: 'sunday', label: 'Duminică' }
  ]

  // Inițializează datele locale cu datele din server
  useEffect(() => {
    console.log('🔍 WorkingHoursDrawer - Props primite:', { settingId, settingData })
    console.log('🔍 WorkingHoursDrawer - workingHours din hook:', workingHours)
    
    // Prioritizează settingData dacă este furnizat (din AdminSettings)
    const sourceData = settingData || workingHours
    console.log('🔍 WorkingHoursDrawer - sourceData final:', sourceData)
    
    if (sourceData) {
      // Verifică dacă datele sunt în câmpul data sau direct în obiect
      const workingHoursData = sourceData.data || sourceData
      const locationData = workingHoursData.locationDetails || sourceData.locationDetails || {}
      
      console.log('🔍 WorkingHoursDrawer - workingHoursData procesat:', workingHoursData)
      console.log('🔍 WorkingHoursDrawer - locationData procesat:', locationData)
      
      // Procesează datele days pentru formatul așteptat de UI
      if (workingHoursData.days && Array.isArray(workingHoursData.days)) {
        const processedWorkingHours = {}
        workingHoursData.days.forEach(day => {
          processedWorkingHours[day.key] = {
            enabled: day.isWorking,
            start: day.startTime,
            end: day.endTime
          }
        })
        console.log('🔍 WorkingHoursDrawer - processedWorkingHours:', processedWorkingHours)
        setLocalWorkingHours(processedWorkingHours)
      } else {
        setLocalWorkingHours(workingHoursData)
      }
      
      setLocalLocationDetails(locationData)
    } else {
      // Inițializează cu datele default dacă nu există setări
      const defaultWorkingHours = {}
      const defaultLocationDetails = {
        name: '',
        address: '',
        phone: '',
        email: '',
        description: ''
      }
      
      days.forEach(day => {
        defaultWorkingHours[day.key] = {
          enabled: false,
          start: '09:00',
          end: '17:00'
        }
      })
      
      setLocalWorkingHours(defaultWorkingHours)
      setLocalLocationDetails(defaultLocationDetails)
    }
  }, [workingHours, settingData])

  const handleDayToggle = (day) => {
    setLocalWorkingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled
      }
    }))
  }

  const handleTimeChange = (day, field, value) => {
    setLocalWorkingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }))
  }

  const handleLocationChange = (field, value) => {
    setLocalLocationDetails(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // Pregătește datele pentru salvare
      const workingHoursData = {
        days: days.map(day => ({
          name: day.label,
          key: day.key,
          isWorking: localWorkingHours[day.key]?.enabled || false,
          startTime: localWorkingHours[day.key]?.start || '09:00',
          endTime: localWorkingHours[day.key]?.end || '17:00'
        })),
        locationDetails: localLocationDetails
      }

      // Dacă există settingId, actualizează setarea existentă
      if (settingId) {
        const settingData = {
          data: {
            settingType: 'working-hours',
            name: 'Program de funcționare',
            isActive: true,
            ...workingHoursData
          }
        }
        await updateSetting(settingId, settingData)
      } else {
        // Altfel, creează o setare nouă
        await saveWorkingHours(workingHoursData)
      }
      
      onClose()
    } catch (error) {
      console.error('Eroare la salvarea setărilor:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer onClose={onClose} size="default">
      <DrawerHeader 
        title="Program de funcționare și detalii locație"
        subtitle="Configurează orele de funcționare și informațiile despre locație"
        onClose={onClose}
      />
      
      <DrawerContent padding="default">
        <div className="space-y-6">
          {/* Program de funcționare */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold">Program de funcționare</h3>
            </div>
            
            <div className="space-y-2">
              {days.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3 p-2 border rounded">
                  <div className="flex items-center gap-2 min-w-[80px]">
                    <input
                      type="checkbox"
                      id={key}
                      checked={localWorkingHours[key]?.enabled || false}
                      onChange={() => handleDayToggle(key)}
                      className="w-4 h-4 text-primary rounded focus:ring-primary"
                    />
                    <label htmlFor={key} className="text-sm font-medium">
                      {label}
                    </label>
                  </div>
                  
                  {(localWorkingHours[key]?.enabled || false) && (
                    <div className="flex items-center gap-1">
                      <input
                        type="time"
                        value={localWorkingHours[key]?.start || '09:00'}
                        onChange={(e) => handleTimeChange(key, 'start', e.target.value)}
                        className="px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary focus:border-transparent"
                      />
                      <span className="text-xs text-muted-foreground">-</span>
                      <input
                        type="time"
                        value={localWorkingHours[key]?.end || '17:00'}
                        onChange={(e) => handleTimeChange(key, 'end', e.target.value)}
                        className="px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Detalii locație */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold">Detalii locație</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Numele locației</label>
                <input
                  type="text"
                  value={localLocationDetails.name || ''}
                  onChange={(e) => handleLocationChange('name', e.target.value)}
                  placeholder="Cabinet Medical Dr. Popescu"
                  className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium mb-1">Adresă</label>
                <input
                  type="text"
                  value={localLocationDetails.address || ''}
                  onChange={(e) => handleLocationChange('address', e.target.value)}
                  placeholder="Str. Mihai Viteazu nr. 10, București"
                  className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-1">Telefon</label>
                  <input
                    type="tel"
                    value={localLocationDetails.phone || ''}
                    onChange={(e) => handleLocationChange('phone', e.target.value)}
                    placeholder="+40 21 123 4567"
                    className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={localLocationDetails.email || ''}
                    onChange={(e) => handleLocationChange('email', e.target.value)}
                    placeholder="contact@cabinet.ro"
                    className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium mb-1">Descriere</label>
                <textarea
                  value={localLocationDetails.description || ''}
                  onChange={(e) => handleLocationChange('description', e.target.value)}
                  placeholder="Descrierea locației și serviciilor oferite..."
                  rows={2}
                  className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
      
      <DrawerFooter>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Anulează
        </button>
        <button
          onClick={handleSave}
          disabled={loading || settingsLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {(loading || settingsLoading) ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Salvare...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Salvează
            </>
          )}
        </button>
      </DrawerFooter>
    </Drawer>
  )
}

export default WorkingHoursDrawer
