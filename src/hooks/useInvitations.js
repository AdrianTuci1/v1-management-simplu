import { useState, useEffect } from 'react'
import { invitationRepository } from '../data/repositories/InvitationRepository'

/**
 * Hook for managing invitations
 * @returns {Object} Invitation management functions and state
 */
export const useInvitations = () => {
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Verify invitation token
   * @param {string} token - Invitation token
   * @returns {Promise<Object>} Verification result
   */
  const verifyToken = async (token) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await invitationRepository.verifyToken(token)
      return result
    } catch (err) {
      setError(err.message || 'Eroare la verificarea invitației')
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * Send invitation to user
   * @param {Object} params - Send invitation params
   * @returns {Promise<Object>} Send result
   */
  const sendInvitation = async (params) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await invitationRepository.sendInvitation(params)
      return result
    } catch (err) {
      setError(err.message || 'Eroare la trimiterea invitației')
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * Create new invitation
   * @param {Object} invitationData - Invitation details
   * @returns {Promise<Object>} Created invitation
   */
  const createInvitation = async (invitationData) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await invitationRepository.createInvitation(invitationData)
      // Refresh list after creation
      await listInvitations()
      return result
    } catch (err) {
      setError(err.message || 'Eroare la crearea invitației')
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * List all invitations with optional filters
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of invitations
   */
  const listInvitations = async (filters = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await invitationRepository.listInvitations(filters)
      setInvitations(result.data || result || [])
      return result
    } catch (err) {
      setError(err.message || 'Eroare la încărcarea invitațiilor')
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * Revoke invitation
   * @param {string} invitationId - Invitation ID
   * @returns {Promise<Object>} Revoke result
   */
  const revokeInvitation = async (invitationId) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await invitationRepository.revokeInvitation(invitationId)
      // Refresh list after revocation
      await listInvitations()
      return result
    } catch (err) {
      setError(err.message || 'Eroare la revocarea invitației')
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * Resend invitation
   * @param {string} invitationId - Invitation ID
   * @returns {Promise<Object>} Resend result
   */
  const resendInvitation = async (invitationId) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await invitationRepository.resendInvitation(invitationId)
      return result
    } catch (err) {
      setError(err.message || 'Eroare la retrimiterea invitației')
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * Clear error state
   */
  const clearError = () => {
    setError(null)
  }

  return {
    invitations,
    loading,
    error,
    verifyToken,
    sendInvitation,
    createInvitation,
    listInvitations,
    revokeInvitation,
    resendInvitation,
    clearError,
  }
}

export default useInvitations

