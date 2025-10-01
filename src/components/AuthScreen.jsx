import { useState } from 'react'
import { SignInPage } from '@/components/ui/sign-in'
import cognitoAuthService from '../services/cognitoAuthService'
import { Building } from 'lucide-react'
import { FaTooth } from 'react-icons/fa'


const AuthScreen = () => {
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async (event) => {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const formData = new FormData(event.currentTarget)
      const email = formData.get('email')
      const password = formData.get('password')
      const rememberMe = formData.get('rememberMe') === 'on'

      console.log('Attempting sign in with:', { email, rememberMe })

      const userData = await cognitoAuthService.signIn(email, password, rememberMe)
      
      console.log('Sign in successful:', userData)
      
      // Reload the page to trigger App.jsx to re-initialize with the new auth data
      window.location.reload()
    } catch (err) {
      console.error('Sign in error:', err)
      
      // User-friendly error messages
      let errorMessage = 'Autentificare eșuată. Verifică email-ul și parola.'
      
      if (err.code === 'UserNotFoundException') {
        errorMessage = 'Utilizator inexistent. Verifică email-ul introdus.'
      } else if (err.code === 'NotAuthorizedException') {
        errorMessage = 'Email sau parolă incorectă.'
      } else if (err.code === 'UserNotConfirmedException') {
        errorMessage = 'Contul nu este confirmat. Verifică email-ul pentru codul de confirmare.'
      } else if (err.code === 'NetworkError') {
        errorMessage = 'Eroare de rețea. Verifică conexiunea la internet.'
      } else if (err.code === 'NewPasswordRequired') {
        errorMessage = 'Este necesară o parolă nouă. Te rugăm să contactezi administratorul.'
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    const cognitoDomain = import.meta.env.VITE_COGNITO_DOMAIN
    
    if (!cognitoDomain) {
      setError('Autentificarea cu Google nu este configurată. Adaugă VITE_COGNITO_DOMAIN în .env.local și configurează Google în AWS Cognito. Vezi COGNITO_GOOGLE_FEDERATION_SETUP.md')
      return
    }
    
    try {
      // Redirect to Google sign-in through Cognito
      cognitoAuthService.signInWithGoogle()
    } catch (error) {
      console.error('Google sign-in error:', error)
      setError(error.message || 'Eroare la inițierea autentificării cu Google.')
    }
  }

  const handleResetPassword = () => {
    const email = prompt('Introdu adresa de email pentru resetarea parolei:')
    
    if (!email) return

    setIsLoading(true)
    cognitoAuthService.forgotPassword(email)
      .then(() => {
        alert('Un email cu instrucțiuni pentru resetarea parolei a fost trimis la adresa ta.')
      })
      .catch((err) => {
        console.error('Forgot password error:', err)
        let errorMessage = 'Eroare la resetarea parolei.'
        
        if (err.code === 'UserNotFoundException') {
          errorMessage = 'Utilizator inexistent.'
        } else if (err.code === 'LimitExceededException') {
          errorMessage = 'Prea multe încercări. Te rugăm să încerci mai târziu.'
        }
        
        alert(errorMessage)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  const handleCreateAccount = () => {
    alert('Pentru a crea un cont nou, te rugăm să contactezi administratorul platformei.')
  }

  const title = (
    <div className="flex items-center gap-3">
      <FaTooth className="h-10 w-10 text-primary" />
      <span className="font-semibold text-foreground">Bine ai venit</span>
    </div>
  )

  const description = "Autentifică-te pentru a accesa platforma de management medical"

  return (
    <div className="bg-background text-foreground">
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg max-w-md">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="font-medium">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="flex-shrink-0 text-white hover:text-red-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-foreground font-medium">Se încarcă...</p>
          </div>
        </div>
      )}

      <SignInPage
        title={title}
        description={description}
        heroImageSrc="/3dark.webp"
        onSignIn={handleSignIn}
        onGoogleSignIn={handleGoogleSignIn}
        onResetPassword={handleResetPassword}
        onCreateAccount={handleCreateAccount}
      />
    </div>
  )
}

export default AuthScreen
