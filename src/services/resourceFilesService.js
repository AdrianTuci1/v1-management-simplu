// Service for resource files: upload, list, get download URL, delete
import { apiRequest, buildResourcesEndpoint } from '../data/infrastructure/apiClient.js'

function getAuthToken() {
  const savedCognitoData = localStorage.getItem('cognito-data')
  if (!savedCognitoData) return null
  try {
    const userData = JSON.parse(savedCognitoData)
    return userData.id_token || userData.access_token || null
  } catch (_) {
    return null
  }
}

function getBusinessAndLocation() {
  // Prefer explicit keys if set by the app; fall back to legacy keys
  const businessId = localStorage.getItem('selected-business-id') || localStorage.getItem('businessId') || 'B0100001'
  const selectedLocation = JSON.parse(localStorage.getItem('selected-location') || '{}')
  const locationId = selectedLocation.id || selectedLocation.locationId || localStorage.getItem('locationId') || 'L0100001'
  return { businessId, locationId }
}

// In-memory cache for presigned URLs
const urlCache = new Map()
const ONE_HOUR_MS = 3600 * 1000
const FIVE_MIN_MS = 5 * 60 * 1000

export const resourceFilesService = {
  async listFiles(resourceType, resourceId) {
    if (!resourceType || !resourceId) return { success: true, files: [], total: 0 }
    const { businessId, locationId } = getBusinessAndLocation()
    const endpoint = `/resources/${businessId}-${locationId}/files/${resourceType}/${resourceId}`
    return apiRequest('files', endpoint, { method: 'GET' })
  },

  async getFileUrl(resourceType, resourceId, fileId) {
    if (!resourceType || !resourceId || !fileId) return null
    const { businessId, locationId } = getBusinessAndLocation()
    const endpoint = `/resources/${businessId}-${locationId}/files/${resourceType}/${resourceId}/${fileId}/url`
    const result = await apiRequest('files', endpoint, { method: 'GET' })
    return result?.url || null
  },

  async getCachedFileUrl(resourceType, resourceId, fileId) {
    if (!resourceType || !resourceId || !fileId) return null
    const { businessId, locationId } = getBusinessAndLocation()
    const cacheKey = `${businessId}-${locationId}-${resourceType}-${resourceId}-${fileId}`
    const cached = urlCache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now() + FIVE_MIN_MS) {
      return cached.url
    }
    const url = await this.getFileUrl(resourceType, resourceId, fileId)
    if (url) {
      urlCache.set(cacheKey, { url, expiresAt: Date.now() + ONE_HOUR_MS })
    }
    return url
  },

  async deleteFile(resourceType, resourceId, fileId) {
    if (!resourceType || !resourceId || !fileId) return { success: false }
    const { businessId, locationId } = getBusinessAndLocation()
    const endpoint = `/resources/${businessId}-${locationId}/files/${resourceType}/${resourceId}/${fileId}`
    return apiRequest('files', endpoint, { method: 'DELETE' })
  },

  async uploadFile(resourceType, resourceId, file) {
    if (!resourceType || !resourceId || !file) throw new Error('Missing file parameters')
    const maxSize = 10 * 1024 * 1024
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'model/obj', 'application/pdf']

    if (file.size > maxSize) {
      throw new Error('File size exceeds maximum allowed size of 10MB')
    }
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`)
    }

    const { businessId, locationId } = getBusinessAndLocation()
    const base = import.meta.env.VITE_API_URL || ''
    const url = `${base}/resources/${businessId}-${locationId}/files/${resourceType}/${resourceId}`

    const token = getAuthToken()
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        // Let browser set multipart boundary; do not set Content-Type manually
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    })

    if (!response.ok) {
      let message = `Upload failed (${response.status})`
      try {
        const err = await response.json()
        if (err?.message) message = err.message
      } catch (_) {
        try {
          const text = await response.text()
          if (text) message = text
        } catch (_) {}
      }
      const error = new Error(message)
      error.status = response.status
      throw error
    }

    const contentType = response.headers.get('content-type') || ''
    return contentType.includes('application/json') ? response.json() : response.text()
  },
}

export default resourceFilesService


