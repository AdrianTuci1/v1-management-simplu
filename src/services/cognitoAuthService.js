import { 
  CognitoUserPool, 
  CognitoUser, 
  AuthenticationDetails,
  CognitoUserAttribute
} from 'amazon-cognito-identity-js'

const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'eu-central-1_KUaE0MTcQ',
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || 'ar2m2qg3gp4a0b4cld09aegdb'
}

const userPool = new CognitoUserPool(poolData)

// Cognito configuration
const COGNITO_REGION = import.meta.env.VITE_COGNITO_REGION || 'eu-central-1'
const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN || 'auth.simplu.io' // Custom domain or Cognito domain

// Redirect URI MUST match EXACTLY what's configured in Cognito (including trailing slash!)
// Common values: 'http://localhost:5173/' or 'https://your-domain.com/'
const REDIRECT_URI = import.meta.env.VITE_COGNITO_REDIRECT_URI || 'http://localhost:5173/'

console.log('🔧 Cognito Configuration Loaded:')
console.log('   Domain:', COGNITO_DOMAIN)
console.log('   Redirect URI:', REDIRECT_URI)
console.log('   Client ID:', poolData.ClientId)

class CognitoAuthService {
  constructor() {
    this.currentUser = null
    this.refreshInterval = null
    this.isRefreshing = false
  }

  /**
   * Decode JWT token and get expiration time
   * @param {string} token - JWT token
   * @returns {number|null} Expiration timestamp in milliseconds, or null if invalid
   */
  getTokenExpiration(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.exp * 1000 // Convert to milliseconds
    } catch (error) {
      console.error('Error decoding token:', error)
      return null
    }
  }

  /**
   * Check if token is expired or will expire soon (within 5 minutes)
   * @param {string} token - JWT token
   * @returns {boolean} True if token is expired or will expire soon
   */
  isTokenExpiringSoon(token) {
    const expiration = this.getTokenExpiration(token)
    if (!expiration) return true
    
    // Check if token expires within 5 minutes (300000 ms)
    const timeUntilExpiry = expiration - Date.now()
    return timeUntilExpiry < 300000 // 5 minutes
  }

  /**
   * Start automatic token refresh monitoring
   */
  startTokenRefreshMonitoring() {
    // Clear any existing interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }

    // Check token every 1 minute
    this.refreshInterval = setInterval(async () => {
      try {
        await this.checkAndRefreshToken()
      } catch (error) {
        console.error('Token refresh check failed:', error)
      }
    }, 60000) // Check every minute

    // Also check immediately
    this.checkAndRefreshToken().catch(err => {
      console.error('Initial token check failed:', err)
    })

    console.log('✅ Token refresh monitoring started')
  }

  /**
   * Stop automatic token refresh monitoring
   */
  stopTokenRefreshMonitoring() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
      console.log('🛑 Token refresh monitoring stopped')
    }
  }

  /**
   * Check token and refresh if needed
   * Works for both direct Cognito auth and federated identity (Google OAuth through Cognito)
   */
  async checkAndRefreshToken() {
    // Skip if already refreshing to prevent multiple simultaneous refresh attempts
    if (this.isRefreshing) {
      return
    }

    // Try to get current Cognito user (works for both email/password and Google OAuth through Cognito)
    const cognitoUser = userPool.getCurrentUser()
    if (!cognitoUser) {
      // No Cognito user found, nothing to refresh
      return
    }

    try {
      // Get current session - this works for both direct auth and federated identity
      const session = await new Promise((resolve, reject) => {
        cognitoUser.getSession((err, session) => {
          if (err) reject(err)
          else resolve(session)
        })
      })

      if (!session || !session.isValid()) {
        console.log('Session is invalid, cannot refresh')
        return
      }

      const idToken = session.getIdToken().getJwtToken()
      
      // Check if token is expiring soon
      if (this.isTokenExpiringSoon(idToken)) {
        const authProvider = this.isGoogleAuth() ? '(Google OAuth)' : '(Email/Password)'
        console.log(`🔄 Token ${authProvider} is expiring soon, refreshing...`)
        this.isRefreshing = true
        await this.refreshSession()
        console.log(`✅ Token ${authProvider} refreshed successfully`)
      }
    } catch (error) {
      console.error('Error checking/refreshing token:', error)
      // If refresh fails and we're using Google auth, user might need to re-authenticate
      if (this.isGoogleAuth()) {
        console.warn('⚠️ Google OAuth token refresh failed. User may need to sign in again.')
      }
    } finally {
      this.isRefreshing = false
    }
  }

  /**
   * Sign in with email and password
   * @param {string} email 
   * @param {string} password 
   * @param {boolean} rememberMe 
   * @returns {Promise<Object>} User session data
   */
  async signIn(email, password, rememberMe = false) {
    return new Promise((resolve, reject) => {
      const authenticationData = {
        Username: email,
        Password: password
      }

      const authenticationDetails = new AuthenticationDetails(authenticationData)

      const userData = {
        Username: email,
        Pool: userPool
      }

      const cognitoUser = new CognitoUser(userData)

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (session) => {
          this.currentUser = cognitoUser
          
          const userData = {
            id_token: session.getIdToken().getJwtToken(),
            access_token: session.getAccessToken().getJwtToken(),
            refresh_token: session.getRefreshToken().getToken(),
            profile: {
              email: email,
              name: session.getIdToken().payload.name || email.split('@')[0],
              sub: session.getIdToken().payload.sub
            }
          }

          // Store in localStorage
          localStorage.setItem('auth-token', userData.id_token)
          localStorage.setItem('user-email', email)
          localStorage.setItem('cognito-data', JSON.stringify(userData))

          // Start token refresh monitoring
          this.startTokenRefreshMonitoring()

          resolve(userData)
        },
        onFailure: (err) => {
          console.error('Authentication failed:', err)
          reject(err)
        },
        newPasswordRequired: (userAttributes, requiredAttributes) => {
          // Handle new password required scenario
          reject({
            code: 'NewPasswordRequired',
            message: 'New password required',
            userAttributes,
            requiredAttributes
          })
        }
      })
    })
  }

  /**
   * Sign up a new user
   * @param {string} email 
   * @param {string} password 
   * @param {string} name 
   * @returns {Promise<Object>}
   */
  async signUp(email, password, name) {
    return new Promise((resolve, reject) => {
      const attributeList = []
      
      const dataEmail = {
        Name: 'email',
        Value: email
      }
      
      const dataName = {
        Name: 'name',
        Value: name
      }

      attributeList.push(new CognitoUserAttribute(dataEmail))
      attributeList.push(new CognitoUserAttribute(dataName))

      userPool.signUp(email, password, attributeList, null, (err, result) => {
        if (err) {
          console.error('Sign up failed:', err)
          reject(err)
          return
        }
        resolve(result.user)
      })
    })
  }

  /**
   * Confirm sign up with verification code
   * @param {string} email 
   * @param {string} code 
   * @returns {Promise<void>}
   */
  async confirmSignUp(email, code) {
    return new Promise((resolve, reject) => {
      const userData = {
        Username: email,
        Pool: userPool
      }

      const cognitoUser = new CognitoUser(userData)

      cognitoUser.confirmRegistration(code, true, (err, result) => {
        if (err) {
          console.error('Confirmation failed:', err)
          reject(err)
          return
        }
        resolve(result)
      })
    })
  }

  /**
   * Initiate forgot password flow
   * @param {string} email 
   * @returns {Promise<void>}
   */
  async forgotPassword(email) {
    return new Promise((resolve, reject) => {
      const userData = {
        Username: email,
        Pool: userPool
      }

      const cognitoUser = new CognitoUser(userData)

      cognitoUser.forgotPassword({
        onSuccess: (result) => {
          resolve(result)
        },
        onFailure: (err) => {
          console.error('Forgot password failed:', err)
          reject(err)
        }
      })
    })
  }

  /**
   * Confirm new password with verification code
   * @param {string} email 
   * @param {string} code 
   * @param {string} newPassword 
   * @returns {Promise<void>}
   */
  async confirmPassword(email, code, newPassword) {
    return new Promise((resolve, reject) => {
      const userData = {
        Username: email,
        Pool: userPool
      }

      const cognitoUser = new CognitoUser(userData)

      cognitoUser.confirmPassword(code, newPassword, {
        onSuccess: () => {
          resolve()
        },
        onFailure: (err) => {
          console.error('Confirm password failed:', err)
          reject(err)
        }
      })
    })
  }

  /**
   * Sign out current user
   * @returns {Promise<void>}
   */
  async signOut() {
    return new Promise((resolve) => {
      const cognitoUser = userPool.getCurrentUser()
      
      if (cognitoUser) {
        cognitoUser.signOut()
      }
      
      // Stop token refresh monitoring
      this.stopTokenRefreshMonitoring()
      
      // Clear localStorage (including Google auth)
      localStorage.removeItem('auth-token')
      localStorage.removeItem('user-email')
      localStorage.removeItem('cognito-data')
      localStorage.removeItem('auth-provider')
      
      this.currentUser = null
      resolve()
    })
  }

  /**
   * Get current authenticated user session
   * @returns {Promise<Object|null>}
   */
  async getCurrentSession() {
    return new Promise((resolve, reject) => {
      const cognitoUser = userPool.getCurrentUser()

      if (!cognitoUser) {
        resolve(null)
        return
      }

      cognitoUser.getSession((err, session) => {
        if (err) {
          reject(err)
          return
        }

        if (!session.isValid()) {
          resolve(null)
          return
        }

        this.currentUser = cognitoUser

        const userData = {
          id_token: session.getIdToken().getJwtToken(),
          access_token: session.getAccessToken().getJwtToken(),
          refresh_token: session.getRefreshToken().getToken(),
          profile: {
            email: session.getIdToken().payload.email,
            name: session.getIdToken().payload.name || session.getIdToken().payload.email.split('@')[0],
            sub: session.getIdToken().payload.sub
          }
        }

        // Start token refresh monitoring
        this.startTokenRefreshMonitoring()

        resolve(userData)
      })
    })
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    // Check for Google auth
    if (localStorage.getItem('auth-provider') === 'google') {
      return !!localStorage.getItem('auth-token')
    }
    
    // Check for Cognito auth
    const cognitoUser = userPool.getCurrentUser()
    return cognitoUser !== null || !!localStorage.getItem('auth-token')
  }

  /**
   * Refresh the session
   * @returns {Promise<Object>}
   */
  async refreshSession() {
    return new Promise((resolve, reject) => {
      const cognitoUser = userPool.getCurrentUser()

      if (!cognitoUser) {
        reject(new Error('No current user'))
        return
      }

      cognitoUser.getSession((err, session) => {
        if (err) {
          reject(err)
          return
        }

        const refreshToken = session.getRefreshToken()
        cognitoUser.refreshSession(refreshToken, (err, session) => {
          if (err) {
            reject(err)
            return
          }

          const userData = {
            id_token: session.getIdToken().getJwtToken(),
            access_token: session.getAccessToken().getJwtToken(),
            refresh_token: session.getRefreshToken().getToken(),
            profile: {
              email: session.getIdToken().payload.email,
              name: session.getIdToken().payload.name || session.getIdToken().payload.email.split('@')[0],
              sub: session.getIdToken().payload.sub
            }
          }

          // Update localStorage
          localStorage.setItem('auth-token', userData.id_token)
          localStorage.setItem('cognito-data', JSON.stringify(userData))

          resolve(userData)
        })
      })
    })
  }

  /**
   * Sign in with Google through Cognito Federated Identity
   * Redirects to Cognito Hosted UI with Google as identity provider
   */
  signInWithGoogle() {
    if (!COGNITO_DOMAIN) {
      throw new Error('VITE_COGNITO_DOMAIN is not configured. Please set it in .env.local')
    }

    // Get scopes from env or use default matching Cognito configuration
    // Your Cognito scopes: openid, email, phone
    const scopes = import.meta.env.VITE_COGNITO_SCOPES || 'openid email phone'

    // Build Cognito OAuth URL for Google sign-in
    const params = new URLSearchParams({
      client_id: poolData.ClientId,
      response_type: 'code',
      scope: scopes,
      redirect_uri: REDIRECT_URI,
      identity_provider: 'Google'
    })

    const googleSignInUrl = `https://${COGNITO_DOMAIN}/oauth2/authorize?${params.toString()}`
    
    console.log('🚀 Redirecting to Google sign-in through Cognito')
    console.log('   Domain:', COGNITO_DOMAIN)
    console.log('   Redirect URI:', REDIRECT_URI)
    console.log('   Scopes:', scopes)
    console.log('   Full URL:', googleSignInUrl)
    
    // Redirect to Cognito which will redirect to Google
    window.location.href = googleSignInUrl
  }

  /**
   * Handle OAuth callback from Cognito (after Google sign-in)
   * @param {string} code - Authorization code from Cognito
   * @returns {Promise<Object>} User session data
   */
  async handleOAuthCallback(code) {
    try {
      console.log('Handling OAuth callback with code:', code)
      console.log('Using Cognito Domain:', COGNITO_DOMAIN)
      console.log('Using redirect URI:', REDIRECT_URI)
      
      // Build request body
      const requestBody = {
        grant_type: 'authorization_code',
        client_id: poolData.ClientId,
        code: code,
        redirect_uri: REDIRECT_URI
      }

      // If client secret is provided, add it to the request
      const clientSecret = import.meta.env.VITE_COGNITO_CLIENT_SECRET
      if (clientSecret) {
        requestBody.client_secret = clientSecret
      }

      console.log('Token exchange request (without sensitive data):', {
        grant_type: requestBody.grant_type,
        client_id: requestBody.client_id,
        redirect_uri: requestBody.redirect_uri,
        has_secret: !!clientSecret
      })

      // Exchange authorization code for tokens
      const tokenResponse = await fetch(`https://${COGNITO_DOMAIN}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(requestBody)
      })

      console.log('Token response status:', tokenResponse.status)

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        console.error('Token exchange failed:', errorText)
        try {
          const errorJson = JSON.parse(errorText)
          throw new Error(`Token exchange failed: ${errorJson.error || errorJson.message || 'Unknown error'}`)
        } catch (e) {
          throw new Error(`Token exchange failed: ${errorText}`)
        }
      }

      const tokens = await tokenResponse.json()
      console.log('Token exchange successful')
      
      // Decode ID token to get user info
      const payload = JSON.parse(atob(tokens.id_token.split('.')[1]))
      
      // Store authentication data
      const userData = {
        id_token: tokens.id_token,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        profile: {
          email: payload.email,
          name: payload.name || payload.email.split('@')[0],
          sub: payload.sub,
          picture: payload.picture,
          provider: payload.identities ? payload.identities[0]?.providerName : 'cognito'
        },
        // Add default locations for federated auth users
        locations: {
          'L0100001': 'admin',
          'L0100002': 'manager',
          'L0100003': 'user'
        },
        isGoogleAuth: payload.identities && payload.identities[0]?.providerName === 'Google'
      }

      // Store in localStorage
      localStorage.setItem('auth-token', userData.id_token)
      localStorage.setItem('user-email', payload.email)
      localStorage.setItem('cognito-data', JSON.stringify(userData))
      if (userData.isGoogleAuth) {
        localStorage.setItem('auth-provider', 'google')
      }

      console.log('✅ OAuth callback processed successfully:', {
        email: payload.email,
        name: payload.name,
        provider: userData.profile.provider
      })

      // Start token refresh monitoring
      this.startTokenRefreshMonitoring()

      return userData
    } catch (error) {
      console.error('OAuth callback error:', error)
      throw new Error('Failed to process OAuth callback')
    }
  }

  /**
   * Check if user is authenticated via Google
   * @returns {boolean}
   */
  isGoogleAuth() {
    return localStorage.getItem('auth-provider') === 'google'
  }
}

export default new CognitoAuthService()

