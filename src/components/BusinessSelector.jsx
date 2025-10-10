import { useState } from 'react'
import { Building, ChevronRight, MapPin } from 'lucide-react'
import { FaTooth } from 'react-icons/fa'

/**
 * BusinessSelector - Component for selecting a business after authentication
 * Displays all businesses the user has access to and allows them to select one
 */
const BusinessSelector = ({ businesses, onSelect }) => {
  const [selectedBusinessId, setSelectedBusinessId] = useState(null)

  const handleBusinessSelect = (businessId) => {
    setSelectedBusinessId(businessId)
  }

  const handleConfirm = () => {
    if (!selectedBusinessId) return
    
    const selectedBusiness = businesses.find(b => b.businessId === selectedBusinessId)
    if (selectedBusiness) {
      onSelect(selectedBusiness)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-card rounded-lg shadow-lg border border-border p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <FaTooth className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Selectează Business-ul
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Alege business-ul cu care dorești să lucrezi
            </p>
          </div>
        </div>

        {/* Business List */}
        <div className="space-y-3 mb-6">
          {businesses.map((business) => {
            const isSelected = selectedBusinessId === business.businessId
            const accessibleLocations = business.locations.filter(
              loc => loc.role && loc.role !== 'user'
            )

            return (
              <button
                key={business.businessId}
                onClick={() => handleBusinessSelect(business.businessId)}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50 hover:bg-accent'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Business Name */}
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-foreground">
                        {business.businessName}
                      </h3>
                    </div>

                    {/* Business ID */}
                    <div className="text-xs text-muted-foreground mb-3">
                      ID: {business.businessId}
                    </div>

                    {/* Locations */}
                    {accessibleLocations.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          Locații accesibile:
                        </p>
                        {accessibleLocations.map((location) => (
                          <div
                            key={location.locationId}
                            className="flex items-center gap-2 text-sm"
                          >
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-foreground">
                              {location.locationName}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">
                              {location.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="flex-shrink-0 ml-4">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <ChevronRight className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          disabled={!selectedBusinessId}
          className={`w-full py-3 rounded-lg font-medium transition-all ${
            selectedBusinessId
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          {selectedBusinessId ? 'Continuă' : 'Selectează un business'}
        </button>

        {/* Info Message */}
        {businesses.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Nu ai acces la niciun business. Te rugăm să contactezi administratorul.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default BusinessSelector

