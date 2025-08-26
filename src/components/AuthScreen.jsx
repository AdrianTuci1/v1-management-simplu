import { useState } from 'react'
import { useAuth } from "react-oidc-context"
import { Building, LogIn } from 'lucide-react'

const AuthScreen = () => {
  const auth = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    setIsLoading(true)
    try {
      await auth.signinRedirect()
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <Building className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Cabinetul Dr. Popescu
          </h1>
          <p className="text-gray-600">
            Autentifică-te pentru a accesa dashboard-ul
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="space-y-6">
            {/* Sign In Button */}
            <button
              onClick={handleSignIn}
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Se încarcă...
                </div>
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  Autentificare cu AWS Cognito
                </>
              )}
            </button>

            {/* Info */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Vei fi redirecționat către pagina de autentificare AWS Cognito
              </p>
            </div>
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

export default AuthScreen
