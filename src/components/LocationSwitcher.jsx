import { useState, useEffect } from 'react'
import { MapPin, ChevronDown, Building, Check } from 'lucide-react'
import authRepository from '../data/repositories/AuthRepository.js'
import businessInfoRepository from '../data/repositories/BusinessInfoRepository.js'

const LocationSwitcher = ({ collapsed, currentLocation, onLocationChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [locations, setLocations] = useState([])

  useEffect(() => {
    const loadLocations = async () => {
      try {
        console.log('LocationSwitcher: Loading locations...')
        
        // Get user's accessible locations from the new API format
        const userData = authRepository.getStoredUserData()
        console.log('LocationSwitcher: User data from localStorage:', userData)

        // Get business info locations for names/addresses
        let businessInfo = businessInfoRepository.getStoredBusinessInfo()
        let businessLocations = businessInfo?.locations || []
        
        // If no business info is stored, try to load it
        if (!businessInfo || !businessLocations.length) {
          console.log('LocationSwitcher: No business info found, attempting to load...')
          try {
            businessInfo = await businessInfoRepository.getBusinessInfo(userData?.user?.businessId)
            businessLocations = businessInfo?.locations || []
            console.log('LocationSwitcher: Loaded business info:', businessInfo)
          } catch (error) {
            console.log('LocationSwitcher: Could not load business info, using fallback')
          }
        }

        if (userData?.user?.locations) {
          console.log('LocationSwitcher: Raw locations from API:', userData.user.locations)

          // Filter by role and merge with business-info by id
          const accessibleLocations = userData.user.locations
            .filter(location => location.role && location.role !== 'user')
            .map(location => {
              // Try to find matching business location
              const match = businessLocations.find(loc => loc.id === location.locationId)
              
              // If no match found, create a basic location object
              if (!match) {
                console.log(`LocationSwitcher: No business info found for location ${location.locationId}`)
                return {
                  id: location.locationId,
                  name: location.locationName || `Locația ${location.locationId}`,
                  address: `Adresa pentru ${location.locationName || location.locationId}`,
                  role: location.role,
                  businessId: userData.user.businessId
                }
              }
              
              return {
                id: location.locationId,
                name: match.name || location.locationName || location.locationId,
                address: match.address || `Locația ${location.locationId}`,
                role: location.role,
                businessId: userData.user.businessId
              }
            })

          console.log('LocationSwitcher: Transformed locations (merged with business-info):', accessibleLocations)
          setLocations(accessibleLocations)
        } else {
          console.log('LocationSwitcher: No user locations found in API response')
          // Fallback: try to get locations from business info if available
          if (businessLocations.length > 0) {
            console.log('LocationSwitcher: Using business info locations as fallback')
            const fallbackLocations = businessLocations.map(loc => ({
              id: loc.id,
              name: loc.name,
              address: loc.address,
              role: 'user', // Default role
              businessId: userData?.user?.businessId
            }))
            setLocations(fallbackLocations)
          } else {
            setLocations([])
          }
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
