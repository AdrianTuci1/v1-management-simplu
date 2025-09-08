import { useState } from 'react'
import { Clock, MapPin, Save } from 'lucide-react'
import { 
  Drawer, 
  DrawerHeader, 
  DrawerContent, 
  DrawerFooter 
} from '../ui/drawer'
import useSettingsStore from '../../stores/settingsStore'

const WorkingHoursDrawer = ({ onClose }) => {
  const { 
    workingHours, 
    locationDetails, 
    updateWorkingHours, 
    updateLocationDetails 
  } = useSettingsStore()
  
  const [loading, setLoading] = useState(false)

  const days = [
    { key: 'monday', label: 'Luni' },
    { key: 'tuesday', label: 'Marți' },
    { key: 'wednesday', label: 'Miercuri' },
    { key: 'thursday', label: 'Joi' },
    { key: 'friday', label: 'Vineri' },
    { key: 'saturday', label: 'Sâmbătă' },
    { key: 'sunday', label: 'Duminică' }
  ]

  const handleDayToggle = (day) => {
    updateWorkingHours(day, { enabled: !workingHours[day].enabled })
  }

  const handleTimeChange = (day, field, value) => {
    updateWorkingHours(day, { [field]: value })
  }

  const handleLocationChange = (field, value) => {
    updateLocationDetails({ [field]: value })
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // Setările sunt deja salvate în store prin updateWorkingHours și updateLocationDetails
      await new Promise(resolve => setTimeout(resolve, 500))
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
                      checked={workingHours[key].enabled}
                      onChange={() => handleDayToggle(key)}
                      className="w-4 h-4 text-primary rounded focus:ring-primary"
                    />
                    <label htmlFor={key} className="text-sm font-medium">
                      {label}
                    </label>
                  </div>
                  
                  {workingHours[key].enabled && (
                    <div className="flex items-center gap-1">
                      <input
                        type="time"
                        value={workingHours[key].start}
                        onChange={(e) => handleTimeChange(key, 'start', e.target.value)}
                        className="px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary focus:border-transparent"
                      />
                      <span className="text-xs text-muted-foreground">-</span>
                      <input
                        type="time"
                        value={workingHours[key].end}
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
                  value={locationDetails.name}
                  onChange={(e) => handleLocationChange('name', e.target.value)}
                  placeholder="Cabinet Medical Dr. Popescu"
                  className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium mb-1">Adresă</label>
                <input
                  type="text"
                  value={locationDetails.address}
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
                    value={locationDetails.phone}
                    onChange={(e) => handleLocationChange('phone', e.target.value)}
                    placeholder="+40 21 123 4567"
                    className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={locationDetails.email}
                    onChange={(e) => handleLocationChange('email', e.target.value)}
                    placeholder="contact@cabinet.ro"
                    className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium mb-1">Descriere</label>
                <textarea
                  value={locationDetails.description}
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
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
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
