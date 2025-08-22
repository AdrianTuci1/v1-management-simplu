import { Shield, AlertTriangle, Home } from 'lucide-react'

const AccessDenied = ({ userEmail }) => {
  const handleLogout = () => {
    // Clear all auth data
    localStorage.removeItem('auth-token')
    localStorage.removeItem('user-email')
    localStorage.removeItem('selected-location')
    localStorage.removeItem('cognito-data')
    
    // Reload page to restart auth flow
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500 rounded-full mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Acces Refuzat
          </h1>
          <p className="text-gray-600">
            Nu ai permisiunile necesare să accesezi această aplicație
          </p>
        </div>

        {/* Error Details */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-start gap-4 mb-6">
            <AlertTriangle className="h-6 w-6 text-red-500 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Permisiuni Insuficiente
              </h3>
              <p className="text-gray-600 mb-4">
                Contul tău cu email-ul <strong>{userEmail}</strong> nu are permisiunile 
                necesare pentru a accesa dashboard-ul de administrare.
              </p>
              <p className="text-gray-600">
                Această aplicație este destinată doar utilizatorilor cu rol de administrator 
                sau manager.
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-50 rounded-md p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-2">
              Ai nevoie de acces?
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Contactează administratorul sistemului pentru a obține permisiunile necesare.
            </p>
            <div className="text-sm text-gray-600">
              <p>📧 Email: admin@cabinet-popescu.ro</p>
              <p>📞 Telefon: 021 123 4567</p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleLogout}
              className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <Home className="h-4 w-4" />
              Înapoi la Autentificare
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            © 2024 Cabinetul Dr. Popescu. Toate drepturile rezervate.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AccessDenied
