import InvitationInvoker from '../invoker/InvitationInvoker.js'

class InvitationRepository {
  constructor() {
    this.cache = new Map()
    this.cacheExpiry = 5 * 60 * 1000 // 5 minutes
  }

  /**
   * Verify invitation token
   * @param {string} token - Invitation token
   * @returns {Promise<Object>} Verification result with invitation data
   */
  async verifyToken(token) {
    try {
      const result = await InvitationInvoker.verifyToken(token)
      
      if (result.valid && result.data) {
        // Cache the verified invitation temporarily
        this.cache.set(token, {
          data: result.data,
          timestamp: Date.now()
        })
      }
      
      return result
    } catch (error) {
      console.error('Error verifying invitation token:', error)
      return {
        valid: false,
        error: error.message || 'Eroare la verificarea invitației'
      }
    }
  }

  /**
   * Get cached invitation data
   * @param {string} token - Invitation token
   * @returns {Object|null} Cached invitation data or null
   */
  getCachedInvitation(token) {
    const cached = this.cache.get(token)
    
    if (!cached) return null
    
    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.cacheExpiry) {
      this.cache.delete(token)
      return null
    }
    
    return cached.data
  }

  /**
   * Clear cache for specific token
   * @param {string} token - Invitation token
   */
  clearCache(token) {
    if (token) {
      this.cache.delete(token)
    } else {
      this.cache.clear()
    }
  }

  /**
   * Send invitation to user (admin only)
   * @param {Object} params - Send invitation params
   * @returns {Promise<Object>} Send result
   */
  async sendInvitation(params) {
    try {
      const result = await InvitationInvoker.sendInvitation(params)
      return result
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
    try {
      const result = await InvitationInvoker.createInvitation(invitationData)
      return result
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
    try {
      const result = await InvitationInvoker.listInvitations(filters)
      return result
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
    try {
      const result = await InvitationInvoker.revokeInvitation(invitationId)
      return result
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
    try {
      const result = await InvitationInvoker.resendInvitation(invitationId)
      return result
    } catch (error) {
      console.error('Error resending invitation:', error)
      throw error
    }
  }
}

export const invitationRepository = new InvitationRepository()
export default invitationRepository

