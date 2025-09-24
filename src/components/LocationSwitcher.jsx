import { useState, useEffect } from 'react'
import { MapPin, ChevronDown, Building, Check } from 'lucide-react'
import authRepository from '../data/repositories/AuthRepository.js'
import businessInfoRepository from '../data/repositories/BusinessInfoRepository.js'

const LocationSwitcher = ({ collapsed, currentLocation, onLocationChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [locations, setLocations] = useState([])

  useEffect(() => {
    const loadLocations = () => {
      try {
        console.log('LocationSwitcher: Loading locations...')
        
        // Get user's accessible locations from the new API format
        const userData = authRepository.getStoredUserData()
        console.log('LocationSwitcher: User data from localStorage:', userData)

        // Get business info locations for names/addresses
        const businessInfo = businessInfoRepository.getStoredBusinessInfo()
        const businessLocations = businessInfo?.locations || []

        if (userData?.user?.locations) {
          console.log('LocationSwitcher: Raw locations from API:', userData.user.locations)

          // Filter by role and merge with business-info by id
          const accessibleLocations = userData.user.locations
            .filter(location => location.role && location.role !== 'user')
            .map(location => {
              const match = businessLocations.find(loc => loc.id === location.locationId)
              return {
                id: location.locationId,
                name: match?.name || location.locationName || location.locationId,
                address: match?.address || `Locația ${location.locationId}`,
                role: location.role,
                businessId: userData.user.businessId
              }
            })

          console.log('LocationSwitcher: Transformed locations (merged with business-info):', accessibleLocations)
          setLocations(accessibleLocations)
        } else {
          console.log('LocationSwitcher: No user locations found in API response')
          setLocations([])
        }
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
          className="w-full p-3 flex items-center justify-center hover:bg-accent rounded-md transition-colors"
          title="Schimbă locația"
        >
          <Building className="h-5 w-5 text-muted-foreground" />
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
            {currentLocation && (
              <div className="text-xs text-muted-foreground truncate">
                {currentLocation.address}
              </div>
            )}
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
