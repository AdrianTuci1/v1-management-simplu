class InvitationInvoker {
  constructor() {
    this.basePath = '/invitations'
    this.baseUrl = import.meta.env.VITE_API_URL || ''
  }

  /**
   * Get authorization token from Cognito
   * @returns {string|null} Auth token
   */
  getAuthToken() {
    try {
      const savedCognitoData = localStorage.getItem('cognito-data')
      if (savedCognitoData) {
        const userData = JSON.parse(savedCognitoData)
        return userData.id_token || userData.access_token
      }
    } catch (error) {
      console.error('Error getting auth token:', error)
    }
    return null
  }

  /**
   * Make authenticated request
   * @param {string} url - Endpoint URL
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Response data
   */
  async makeRequest(url, options = {}) {
    const authToken = this.getAuthToken()
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }
    
    // Add auth token if available (not for verify endpoint)
    if (authToken && !url.includes('/verify')) {
      headers['Authorization'] = `Bearer ${authToken}`
    }

    const response = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      headers
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.error || errorJson.message || errorMessage
      } catch (e) {
        // Keep default error message
      }
      
      throw new Error(errorMessage)
    }

    return await response.json()
  }

  /**
   * Verify invitation token
   * @param {string} token - Invitation token
   * @returns {Promise<Object>} Verification result
   */
  async verifyToken(token) {
    const url = `${this.basePath}/verify?token=${token}`
    
    try {
      return await this.makeRequest(url, {
        method: 'GET'
      })
    } catch (error) {
      console.error('Error verifying invitation token:', error)
      throw error
    }
  }

  /**
   * Send invitation to user (admin only)
   * @param {Object} params - Send invitation params
   * @param {string} params.businessId - Business ID
   * @param {string} params.locationId - Location ID
   * @param {string} params.medicResourceId - User resource ID
   * @param {string} params.email - User email
   * @returns {Promise<Object>} Send result
   */
  async sendInvitation({ businessId, locationId, medicResourceId, email }) {
    const url = `${this.basePath}/send`
    
    try {
      return await this.makeRequest(url, {
        method: 'POST',
        body: JSON.stringify({
          businessId,
          locationId,
          medicResourceId,
          email
        })
      })
    } catch (error) {
      console.error('Error sending invitation:', error)
      throw error
    }
  }

  /**
   * Create invitation (admin only)
   * @param {Object} invitationData - Invitation details
   * @returns {Promise<Object>} Created invitation
   */
  async createInvitation(invitationData) {
    const url = `${this.basePath}/create`
    
    try {
      return await this.makeRequest(url, {
        method: 'POST',
        body: JSON.stringify(invitationData)
      })
    } catch (error) {
      console.error('Error creating invitation:', error)
      throw error
    }
  }

  /**
   * List all invitations (admin only)
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of invitations
   */
  async listInvitations(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString()
    const url = `${this.basePath}${queryParams ? `?${queryParams}` : ''}`
    
    try {
      return await this.makeRequest(url, {
        method: 'GET'
      })
    } catch (error) {
      console.error('Error listing invitations:', error)
      throw error
    }
  }

  /**
   * Revoke invitation (admin only)
   * @param {string} invitationId - Invitation ID
   * @returns {Promise<Object>} Revoke result
   */
  async revokeInvitation(invitationId) {
    const url = `${this.basePath}/${invitationId}/revoke`
    
    try {
      return await this.makeRequest(url, {
        method: 'POST'
      })
    } catch (error) {
      console.error('Error revoking invitation:', error)
      throw error
    }
  }

  /**
   * Resend invitation (admin only)
   * @param {string} invitationId - Invitation ID
   * @returns {Promise<Object>} Resend result
   */
  async resendInvitation(invitationId) {
    const url = `${this.basePath}/${invitationId}/resend`
    
    try {
      return await this.makeRequest(url, {
        method: 'POST'
      })
    } catch (error) {
      console.error('Error resending invitation:', error)
      throw error
    }
  }
}

export default new InvitationInvoker()

