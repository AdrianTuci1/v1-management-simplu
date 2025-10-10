import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { SignUpPage } from '@/components/ui/sign-up'
import cognitoAuthService from '../services/cognitoAuthService'
import invitationRepository from '../data/repositories/InvitationRepository'
import { FaTooth } from 'react-icons/fa'

const RegisterPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const token = searchParams.get('token')
  const [verification, setVerification] = useState(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Verify invitation token on mount
  useEffect(() => {
    if (token) {
      verifyInvitationToken(token)
    } else {
      setLoading(false)
      setError('Invitație invalidă. Nu există token de invitație.')
    }
  }, [token])

  const verifyInvitationToken = async (token) => {
    try {
      // Use invitation repository to verify token
      const result = await invitationRepository.verifyToken(token)

      if (result.valid) {
        setVerification(result.data)
        console.log('✅ Invitation verified:', result.data)
      } else {
        setError(result.error || 'Invitație invalidă sau expirată')
        console.error('❌ Invalid invitation:', result.error)
        
        // Redirect to login after 5 seconds
        setTimeout(() => {
          navigate('/')
        }, 5000)
      }
    } catch (error) {
      console.error('Error verifying invitation:', error)
      setError('Eroare la verificarea invitației. Verifică conexiunea la internet.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (event) => {
    event.preventDefault()
    
    if (!verification) {
      setError('Nu există invitație validă')
      return
    }

    setError(null)
    setSuccess(null)
    setRegistering(true)

    try {
      const formData = new FormData(event.currentTarget)
      const email = formData.get('email')
      const password = formData.get('password')
      const confirmPassword = formData.get('confirmPassword')

      // Validate passwords match
      if (password !== confirmPassword) {
        setError('Parolele nu coincid')
        setRegistering(false)
        return
      }

      // Validate password length
      if (password.length < 8) {
        setError('Parola trebuie să aibă minim 8 caractere')
        setRegistering(false)
        return
      }

      console.log('Attempting sign up for:', email)

      // Sign up with Cognito, passing invitation token as clientMetadata
      await cognitoAuthService.signUp(
        email,
        password,
        null, // name will be set later if needed
        {
          invitationToken: token
        }
      )

      console.log('✅ Cognito sign up successful')

      setSuccess('Cont creat cu succes! Verifică email-ul pentru codul de confirmare.')
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/', { 
          state: { 
            email: email,
            message: 'Verifică email-ul pentru a confirma contul' 
          } 
        })
      }, 3000)
    } catch (error) {
      console.error('Registration error:', error)
      
      // Handle different error types
      if (error.code === 'UsernameExistsException') {
        setError('Acest email există deja. Poți să te autentifici.')
      } else if (error.code === 'InvalidPasswordException') {
        setError('Parolă invalidă. Trebuie să conțină: majusculă, minusculă, cifră, caracter special.')
      } else if (error.code === 'InvalidParameterException') {
        setError('Parametri invalizi. Verifică datele introduse.')
      } else {
        setError(error.message || 'Eroare la crearea contului')
      }
    } finally {
      setRegistering(false)
    }
  }

  const handleBackToLogin = () => {
    navigate('/')
  }

  // Loading state
  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-foreground font-medium">Se verifică invitația...</p>
        </div>
      </div>
    )
  }

  // Invalid invitation state
  if (!verification) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto p-8 bg-card rounded-lg shadow-lg text-center">
          <div className="mb-4 text-red-500">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Invitație Invalidă</h1>
          <p className="text-muted-foreground mb-6">{error || 'Această invitație nu mai este validă sau a expirat.'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Înapoi la Autentificare
          </button>
        </div>
      </div>
    )
  }

  const title = (
    <div className="flex items-center gap-3">
      <FaTooth className="h-10 w-10 text-primary" />
      <span className="font-semibold text-foreground">Bine ai venit</span>
    </div>
  )

  const description = verification.invitedBy 
    ? `Ai fost invitat de ${verification.invitedBy} să te alături echipei.`
    : "Completează detaliile pentru a crea contul tău"

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

      {success && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg max-w-md">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div className="flex-1">
              <p className="font-medium">{success}</p>
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="flex-shrink-0 text-white hover:text-green-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <SignUpPage
        title={title}
        description={description}
        heroImageSrc="/3dark.webp"
        email={verification.email}
        emailDisabled={true}
        onSignUp={handleSignUp}
        onBackToLogin={handleBackToLogin}
        loading={registering}
      />
    </div>
  )
}

export default RegisterPage

