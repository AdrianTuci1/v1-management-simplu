import { useState, useEffect } from 'react'
import { MapPin, ChevronDown, Building, Check } from 'lucide-react'

const LocationSwitcher = ({ collapsed, currentLocation, onLocationChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [locations, setLocations] = useState([])

  useEffect(() => {
    // Load accessible locations from cognito data
    const savedCognitoData = localStorage.getItem('cognito-data')
    if (savedCognitoData) {
      const cognitoData = JSON.parse(savedCognitoData)
      const accessibleLocations = cognitoData.availableLocations.filter(location => {
        const userRoleForLocation = cognitoData.locations[location.id]
        
        // User can access location if they have any role for it (not 'user' role which means no access)
        return userRoleForLocation && userRoleForLocation !== 'user'
      })
      
      setLocations(accessibleLocations)
    }
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
