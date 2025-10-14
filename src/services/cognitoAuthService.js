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
   * Check if token is completely expired
   * @param {string} token - JWT token
   * @returns {boolean} True if token is expired
   */
  isTokenExpired(token) {
    const expiration = this.getTokenExpiration(token)
    if (!expiration) return true
    
    return Date.now() >= expiration
  }

  /**
   * Start automatic token refresh monitoring
   */
  startTokenRefreshMonitoring() {
    // Clear any existing interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }

    // Check token every 30 seconds for better responsiveness
    this.refreshInterval = setInterval(async () => {
      try {
        await this.checkAndRefreshToken()
      } catch (error) {
        console.error('Token refresh check failed:', error)
      }
    }, 30000) // Check every 30 seconds

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
      console.log('⏳ Already refreshing token, skipping...')
      return
    }

    const isGoogleAuth = this.isGoogleAuth()
    const authType = isGoogleAuth ? 'Google OAuth' : 'Email/Password'

    // For Google OAuth, we don't rely on cognitoUser from the pool
    // Instead, we use stored tokens and refresh via OAuth endpoint
    if (isGoogleAuth) {
      console.log(`🔍 Checking ${authType} token...`)
      
      try {
        const savedCognitoData = localStorage.getItem('cognito-data')
        if (!savedCognitoData) {
          console.log('❌ No stored auth data found')
          return
        }

        const userData = JSON.parse(savedCognitoData)
        const idToken = userData.id_token
        
        if (!idToken) {
          console.log('❌ No ID token found in stored data')
          return
        }

        // Check if token is completely expired
        if (this.isTokenExpired(idToken)) {
          console.log('⚠️ Token is expired, attempting refresh...')
          this.isRefreshing = true
          try {
            const refreshedSession = await this.refreshSession()
            if (refreshedSession) {
              console.log('✅ Token refreshed successfully after expiration')
              return
            }
          } catch (refreshError) {
            console.error('❌ Failed to refresh expired token:', refreshError)
            console.log('🚪 Token refresh failed, redirecting to login')
            await this.signOut()
            window.location.href = '/login'
            return
          } finally {
            this.isRefreshing = false
          }
        }
        
        // Check if token is expiring soon
        if (this.isTokenExpiringSoon(idToken)) {
          console.log(`🔄 Token ${authType} is expiring soon, refreshing...`)
          this.isRefreshing = true
          try {
            await this.refreshSession()
            console.log(`✅ Token ${authType} refreshed successfully`)
          } catch (error) {
            console.error(`❌ Failed to refresh ${authType} token:`, error)
            console.log('🚪 Redirecting to login')
            await this.signOut()
            window.location.href = '/login'
          } finally {
            this.isRefreshing = false
          }
        }
        
        return
      } catch (error) {
        console.error('❌ Error checking/refreshing Google OAuth token:', error)
        await this.signOut()
        window.location.href = '/login'
        return
      }
    }

    // For Email/Password authentication, use Cognito SDK
    console.log(`🔍 Checking ${authType} token...`)
    
    const cognitoUser = userPool.getCurrentUser()
    if (!cognitoUser) {
      console.log('❌ No Cognito user found in pool')
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
        console.log('❌ Session is invalid, cannot refresh')
        return
      }

      const idToken = session.getIdToken().getJwtToken()
      
      // Check if token is completely expired
      if (this.isTokenExpired(idToken)) {
        console.log('⚠️ Token is expired, attempting refresh...')
        this.isRefreshing = true
        try {
          const refreshedSession = await this.refreshSession()
          if (refreshedSession) {
            console.log('✅ Token refreshed successfully after expiration')
            return
          }
        } catch (refreshError) {
          console.error('❌ Failed to refresh expired token:', refreshError)
          console.log('🚪 Token refresh failed, redirecting to login')
          await this.signOut()
          window.location.href = '/login'
          return
        } finally {
          this.isRefreshing = false
        }
      }
      
      // Check if token is expiring soon
      if (this.isTokenExpiringSoon(idToken)) {
        console.log(`🔄 Token ${authType} is expiring soon, refreshing...`)
        this.isRefreshing = true
        await this.refreshSession()
        console.log(`✅ Token ${authType} refreshed successfully`)
      }
    } catch (error) {
      console.error(`❌ Error checking/refreshing ${authType} token:`, error)
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

          // Store in localStorage with remember me preference
          localStorage.setItem('auth-token', userData.id_token)
          localStorage.setItem('user-email', email)
          localStorage.setItem('cognito-data', JSON.stringify(userData))
          localStorage.setItem('remember-me', rememberMe.toString())
          
          // Store session timestamp for better persistence tracking
          localStorage.setItem('session-timestamp', Date.now().toString())

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
   * @param {Object} clientMetadata - Optional metadata to pass to Lambda triggers
   * @returns {Promise<Object>}
   */
  async signUp(email, password, name = null, clientMetadata = null) {
    return new Promise((resolve, reject) => {
      const attributeList = []
      
      const dataEmail = {
        Name: 'email',
        Value: email
      }

      attributeList.push(new CognitoUserAttribute(dataEmail))
      
      // Add name attribute if provided
      if (name) {
        const dataName = {
          Name: 'name',
          Value: name
        }
        attributeList.push(new CognitoUserAttribute(dataName))
      }

      // Prepare validation data array for clientMetadata
      const validationData = clientMetadata ? Object.entries(clientMetadata).map(([key, value]) => ({
        Name: key,
        Value: value
      })) : null

      userPool.signUp(email, password, attributeList, validationData, (err, result) => {
        if (err) {
          console.error('Sign up failed:', err)
          reject(err)
          return
        }
        console.log('Sign up successful:', result)
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
    return new Promise(async (resolve) => {
      const cognitoUser = userPool.getCurrentUser()
      
      if (cognitoUser) {
        cognitoUser.signOut()
      }
      
      // Stop token refresh monitoring
      this.stopTokenRefreshMonitoring()
      
      // Clear localStorage (including Google auth and business data)
      this.clearAuthData()
      
      // Clear IndexedDB
      try {
        const { indexedDb } = await import('../data/infrastructure/db.js')
        await indexedDb.clearAllData()
      } catch (error) {
        console.error('Error clearing IndexedDB:', error)
      }
      
      this.currentUser = null
      resolve()
    })
  }

  /**
   * Get current authenticated user session
   * @returns {Promise<Object|null>}
   */
  async getCurrentSession() {
    // First try to restore session from stored data
    const restoredSession = await this.restoreSession()
    if (restoredSession) {
      return restoredSession
    }

    // If no stored session, try to refresh using stored refresh token
    const refreshedSession = await this.tryRefreshOnPageLoad()
    if (refreshedSession) {
      return refreshedSession
    }

    // If no refresh possible, try to get current Cognito session
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

        // Store session timestamp
        localStorage.setItem('session-timestamp', Date.now().toString())

        // Start token refresh monitoring
        this.startTokenRefreshMonitoring()

        resolve(userData)
      })
    })
  }

  /**
   * Try to refresh session using stored refresh token
   * This is called when the app loads and we have a refresh token but no valid session
   * @returns {Promise<Object|null>}
   */
  async tryRefreshOnPageLoad() {
    try {
      console.log('🔄 Attempting to refresh session on page load...')
      
      // Check if we have stored data
      const savedCognitoData = localStorage.getItem('cognito-data')
      if (!savedCognitoData) {
        console.log('No stored auth data found')
        return null
      }

      const userData = JSON.parse(savedCognitoData)
      if (!userData.refresh_token) {
        console.log('No refresh token found')
        return null
      }

      // Check if we should persist this session
      if (!this.shouldPersistSession()) {
        console.log('Session should not be persisted, clearing auth data')
        this.clearAuthData()
        return null
      }

      // Try to get current user and refresh session
      const cognitoUser = userPool.getCurrentUser()
      if (!cognitoUser) {
        console.log('No current Cognito user found')
        return null
      }

      // Attempt to refresh the session
      const refreshedSession = await this.refreshSession()
      if (refreshedSession) {
        console.log('✅ Session refreshed successfully on page load')
        this.startTokenRefreshMonitoring()
        return refreshedSession
      }

      return null
    } catch (error) {
      console.error('Error refreshing session on page load:', error)
      this.clearAuthData()
      return null
    }
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    // Check for Google auth
    if (localStorage.getItem('auth-provider') === 'google') {
      const token = localStorage.getItem('auth-token')
      if (!token) return false
      
      // Check if token is expired
      if (this.isTokenExpired(token)) {
        console.log('Stored token is expired, clearing auth data')
        this.clearAuthData()
        return false
      }
      return true
    }
    
    // Check for Cognito auth
    const cognitoUser = userPool.getCurrentUser()
    const token = localStorage.getItem('auth-token')
    
    if (token && this.isTokenExpired(token)) {
      console.log('Stored token is expired, but we might be able to refresh it')
      // Don't clear auth data immediately - let the app try to refresh
      return true // Return true to allow refresh attempt
    }
    
    return cognitoUser !== null || !!token
  }

  /**
   * Check if session should be persisted based on remember me setting
   * @returns {boolean}
   */
  shouldPersistSession() {
    const rememberMe = localStorage.getItem('remember-me')
    const sessionTimestamp = localStorage.getItem('session-timestamp')
    
    if (rememberMe === 'true' && sessionTimestamp) {
      const sessionAge = Date.now() - parseInt(sessionTimestamp)
      // Keep session for 30 days if remember me is enabled
      const maxSessionAge = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
      return sessionAge < maxSessionAge
    }
    
    return false
  }

  /**
   * Restore session from stored data
   * @returns {Promise<Object|null>}
   */
  async restoreSession() {
    try {
      const cognitoUser = userPool.getCurrentUser()
      if (!cognitoUser) {
        return null
      }

      // Check if we should persist this session
      if (!this.shouldPersistSession()) {
        console.log('Session should not be persisted, clearing auth data')
        this.clearAuthData()
        return null
      }

      // Get current session
      const session = await new Promise((resolve, reject) => {
        cognitoUser.getSession((err, session) => {
          if (err) reject(err)
          else resolve(session)
        })
      })

      if (!session || !session.isValid()) {
        console.log('Stored session is invalid')
        this.clearAuthData()
        return null
      }

      // Check if token is expired
      const idToken = session.getIdToken().getJwtToken()
      if (this.isTokenExpired(idToken)) {
        console.log('Stored token is expired, attempting refresh...')
        // Try to refresh the token using refresh token
        try {
          const refreshedSession = await this.refreshSession()
          if (refreshedSession) {
            console.log('✅ Session refreshed successfully on page load')
            this.startTokenRefreshMonitoring()
            return refreshedSession
          }
        } catch (refreshError) {
          console.error('Failed to refresh session:', refreshError)
        }
        
        // If refresh failed, clear auth data
        this.clearAuthData()
        return null
      }

      // Session is valid, start monitoring
      this.startTokenRefreshMonitoring()

      const userData = {
        id_token: idToken,
        access_token: session.getAccessToken().getJwtToken(),
        refresh_token: session.getRefreshToken().getToken(),
        profile: {
          email: session.getIdToken().payload.email,
          name: session.getIdToken().payload.name || session.getIdToken().payload.email.split('@')[0],
          sub: session.getIdToken().payload.sub
        }
      }

      // Update stored data
      localStorage.setItem('auth-token', userData.id_token)
      localStorage.setItem('cognito-data', JSON.stringify(userData))

      return userData
    } catch (error) {
      console.error('Error restoring session:', error)
      this.clearAuthData()
      return null
    }
  }

  /**
   * Clear authentication data from localStorage
   */
  clearAuthData() {
    // Clear old auth keys
    localStorage.removeItem('auth-token')
    localStorage.removeItem('user-email')
    localStorage.removeItem('cognito-data')
    localStorage.removeItem('auth-provider')
    localStorage.removeItem('remember-me')
    localStorage.removeItem('session-timestamp')
    
    // Clear new business selection keys
    localStorage.removeItem('auth-user-data')
    localStorage.removeItem('selected-business-id')
    localStorage.removeItem('selected-location')
    
    // Clear UI state
    localStorage.removeItem('dashboard-view')
    localStorage.removeItem('sidebar-collapsed')
    
    console.log('🧹 All auth data cleared from localStorage')
  }

  /**
   * Refresh the session
   * For Google OAuth users, use OAuth2 token endpoint
   * For email/password users, use Cognito SDK method
   * @returns {Promise<Object>}
   */
  async refreshSession() {
    // Check if this is a Google OAuth user
    const isGoogleAuth = this.isGoogleAuth()
    
    if (isGoogleAuth) {
      console.log('🔄 Refreshing Google OAuth token via OAuth2 endpoint')
      return this.refreshOAuthToken()
    }

    // Standard Cognito email/password refresh
    console.log('🔄 Refreshing Cognito token via SDK')
    return new Promise((resolve, reject) => {
      const cognitoUser = userPool.getCurrentUser()

      if (!cognitoUser) {
        console.error('❌ No current user found for refresh')
        reject(new Error('No current user'))
        return
      }

      cognitoUser.getSession((err, session) => {
        if (err) {
          console.error('❌ Failed to get session for refresh:', err)
          reject(err)
          return
        }

        const refreshToken = session.getRefreshToken()
        console.log('📝 Attempting to refresh session with refresh token')
        
        cognitoUser.refreshSession(refreshToken, (err, session) => {
          if (err) {
            console.error('❌ Refresh session failed:', err)
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

          console.log('✅ Cognito token refreshed successfully')
          resolve(userData)
        })
      })
    })
  }

  /**
   * Refresh OAuth token using Cognito OAuth2 endpoint
   * This is used for federated identity providers (Google, Facebook, etc.)
   * @returns {Promise<Object>}
   */
  async refreshOAuthToken() {
    try {
      // Get stored refresh token
      const savedCognitoData = localStorage.getItem('cognito-data')
      if (!savedCognitoData) {
        throw new Error('No stored auth data found')
      }

      const userData = JSON.parse(savedCognitoData)
      if (!userData.refresh_token) {
        throw new Error('No refresh token found')
      }

      console.log('📝 Refreshing OAuth token with grant_type=refresh_token')

      // Build request body for token refresh
      const requestBody = {
        grant_type: 'refresh_token',
        client_id: poolData.ClientId,
        refresh_token: userData.refresh_token
      }

      // If client secret is provided, add it to the request
      const clientSecret = import.meta.env.VITE_COGNITO_CLIENT_SECRET
      if (clientSecret) {
        requestBody.client_secret = clientSecret
      }

      console.log('🌐 Making refresh request to:', `https://${COGNITO_DOMAIN}/oauth2/token`)

      // Call Cognito token endpoint
      const tokenResponse = await fetch(`https://${COGNITO_DOMAIN}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(requestBody)
      })

      console.log('📡 Refresh response status:', tokenResponse.status)

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        console.error('❌ Token refresh failed:', errorText)
        try {
          const errorJson = JSON.parse(errorText)
          throw new Error(`Token refresh failed: ${errorJson.error || errorJson.message || 'Unknown error'}`)
        } catch (e) {
          throw new Error(`Token refresh failed: ${errorText}`)
        }
      }

      const tokens = await tokenResponse.json()
      console.log('✅ Token refresh successful, decoding new tokens')
      
      // Decode ID token to get user info
      const payload = JSON.parse(atob(tokens.id_token.split('.')[1]))
      
      // Update stored authentication data
      const newUserData = {
        id_token: tokens.id_token,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || userData.refresh_token, // Keep old refresh token if new one not provided
        profile: {
          email: payload.email,
          name: payload.name || payload.email.split('@')[0],
          sub: payload.sub,
          picture: payload.picture,
          provider: payload.identities ? payload.identities[0]?.providerName : 'cognito'
        },
        locations: userData.locations, // Preserve existing locations
        isGoogleAuth: payload.identities && payload.identities[0]?.providerName === 'Google'
      }

      // Update localStorage
      localStorage.setItem('auth-token', newUserData.id_token)
      localStorage.setItem('cognito-data', JSON.stringify(newUserData))
      localStorage.setItem('session-timestamp', Date.now().toString())

      console.log('✅ OAuth token refreshed and stored successfully')

      return newUserData
    } catch (error) {
      console.error('❌ OAuth token refresh error:', error)
      throw error
    }
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
      localStorage.setItem('session-timestamp', Date.now().toString())
      localStorage.setItem('remember-me', 'true') // Google OAuth users should stay logged in
      if (userData.isGoogleAuth) {
        localStorage.setItem('auth-provider', 'google')
      }

      console.log('✅ OAuth callback processed successfully:', {
        email: payload.email,
        name: payload.name,
        provider: userData.profile.provider,
        hasRefreshToken: !!userData.refresh_token
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

