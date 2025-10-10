import { useState, useEffect } from 'react'
import { MapPin, ChevronDown, Building, Check } from 'lucide-react'
import authRepository from '../data/repositories/AuthRepository.js'

const LocationSwitcher = ({ collapsed, currentLocation, onLocationChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [locations, setLocations] = useState([])

  useEffect(() => {
    const loadLocations = () => {
      try {
        console.log('LocationSwitcher: Loading locations from selected business...')
        
        // Get selected business
        const selectedBusiness = authRepository.getSelectedBusiness()
        console.log('LocationSwitcher: Selected business:', selectedBusiness)

        if (!selectedBusiness) {
          console.warn('LocationSwitcher: No business selected')
          setLocations([])
          return
        }

        // Get accessible locations from selected business
        const accessibleLocations = selectedBusiness.locations
          .filter(location => location.role && location.role !== 'user')
          .map(location => ({
            id: location.locationId,
            name: location.locationName,
            address: location.address || `Locația ${location.locationName}`,
            role: location.role,
            businessId: selectedBusiness.businessId
          }))

        console.log('LocationSwitcher: Accessible locations:', accessibleLocations)
        setLocations(accessibleLocations)
      } catch (error) {
        console.error('LocationSwitcher: Error loading locations:', error)
        setLocations([])
      }
    }

    loadLocations()
  }, [])

  const handleLocationSelect = (location) => {
    onLocationChange(location)
    setIsOpen(false)
  }

  if (collapsed) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-3 flex items-center justify-center hover:bg-accent rounded-md transition-colors group"
          title={currentLocation ? currentLocation.name : "Schimbă locația"}
        >
          <Building className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
        </button>
        
        {/* Dropdown for collapsed state */}
        {isOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-64 bg-card border border-border rounded-md shadow-lg z-50">
            <div className="p-2 space-y-1">
              {locations.map((location) => (
                <button
                  key={location.id}
                  onClick={() => handleLocationSelect(location)}
                  className={`w-full flex items-center p-2 rounded-md text-sm transition-colors ${
                    currentLocation?.id === location.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center flex-1">
                    <MapPin className="h-4 w-4 mr-2" />
                    <div className="text-left">
                      <div className="font-medium">{location.name}</div>
                      <div className="text-xs opacity-75">{location.address}</div>
                    </div>
                  </div>
                  {currentLocation?.id === location.id && (
                    <Check className="h-4 w-4" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 flex items-center justify-between hover:bg-accent rounded-md transition-colors"
      >
        <div className="flex items-center gap-3">
          <Building className="h-4 w-4 text-muted-foreground" />
          <div className="text-left">
            <div className="text-sm font-medium truncate">
              {currentLocation?.name || 'Selectează locația'}
            </div>
          </div>
        </div>
        <ChevronDown 
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>
      
      {/* Dropdown */}
      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-md shadow-lg z-50">
          <div className="p-2 space-y-1">
            {locations.map((location) => (
              <button
                key={location.id}
                onClick={() => handleLocationSelect(location)}
                className={`w-full flex items-center p-2 rounded-md text-sm transition-colors ${
                  currentLocation?.id === location.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                <div className="flex items-center flex-1">
                  <MapPin className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">{location.name}</div>
                    <div className="text-xs opacity-75">{location.address}</div>
                  </div>
                </div>
                {currentLocation?.id === location.id && (
                  <Check className="h-4 w-4" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default LocationSwitcher
