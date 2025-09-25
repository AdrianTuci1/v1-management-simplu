import { useState, useEffect, useCallback } from 'react'
import { permissionService } from '../services/permissionService.js'
import { permissionManager } from '../business/permissionManager.js'

export const usePermissions = () => {
  const [userPermissions, setUserPermissions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load user permissions based on their role
  const loadUserPermissions = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Get user role from localStorage
      const businessInfo = localStorage.getItem('business-info')
      let userRole = 'Administrator' // Default role
      
      if (businessInfo) {
        try {
          const businessData = JSON.parse(businessInfo)
          if (businessData.locations && businessData.locations.length > 0) {
            const currentLocation = businessData.locations.find(loc => loc.isCurrent) || businessData.locations[0]
            userRole = currentLocation.role || 'Administrator'
          }
        } catch (e) {
          console.warn('Error parsing business info:', e)
        }
      }

      // Map role to permissions
      const rolePermissions = getRolePermissions(userRole)
      setUserPermissions(rolePermissions)
      
      return rolePermissions
    } catch (err) {
      setError(err.message)
      console.error('Error loading user permissions:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Get permissions for a specific role
  const getRolePermissions = (role) => {
    const rolePermissionMap = {
      'admin': [
        'appointments:view', 'appointments:create', 'appointments:edit', 'appointments:delete',
        'patients:view', 'patients:create', 'patients:edit', 'patients:delete',
        'users:view', 'users:create', 'users:edit', 'users:delete',
        'roles:view', 'roles:create', 'roles:edit', 'roles:delete',
        'reports:view', 'reports:create',
        'products:view', 'products:create', 'products:edit', 'products:delete',
        'sales:view', 'sales:create', 'sales:edit',
        'treatments:view', 'treatments:create', 'treatments:edit', 'treatments:delete'
      ],
      'manager': [
        'appointments:view', 'appointments:create', 'appointments:edit',
        'patients:view', 'patients:create', 'patients:edit',
        'users:view', 'users:edit',
        'reports:view', 'reports:create',
        'products:view', 'products:create', 'products:edit',
        'sales:view', 'sales:create',
        'treatments:view', 'treatments:create', 'treatments:edit'
      ],
      'doctor': [
        'appointments:view', 'appointments:create', 'appointments:edit',
        'patients:view', 'patients:create', 'patients:edit',
        'treatments:view', 'treatments:create', 'treatments:edit'
      ],
      'nurse': [
        'appointments:view', 'appointments:create',
        'patients:view', 'patients:edit',
        'treatments:view'
      ],
      'specialist': [
        'appointments:view', 'appointments:create', 'appointments:edit',
        'patients:view', 'patients:create', 'patients:edit',
        'treatments:view', 'treatments:create', 'treatments:edit',
        'reports:view'
      ],
      'resident': [
        'appointments:view', 'appointments:create',
        'patients:view', 'patients:edit',
        'treatments:view'
      ],
      'Administrator': [
        'appointments:view', 'appointments:create', 'appointments:edit', 'appointments:delete',
        'patients:view', 'patients:create', 'patients:edit', 'patients:delete',
        'users:view', 'users:create', 'users:edit', 'users:delete',
        'roles:view', 'roles:create', 'roles:edit', 'roles:delete',
        'reports:view', 'reports:create',
        'products:view', 'products:create', 'products:edit', 'products:delete',
        'sales:view', 'sales:create', 'sales:edit',
        'treatments:view', 'treatments:create', 'treatments:edit', 'treatments:delete'
      ]
    }

    return rolePermissionMap[role] || []
  }

  // Check if user has a specific permission
  const hasPermission = useCallback((resource, action) => {
    const permissionKey = `${resource}:${action}`
    return userPermissions.includes(permissionKey)
  }, [userPermissions])

  // Check if user has any of the specified permissions
  const hasAnyPermission = useCallback((permissions) => {
    return permissions.some(permission => {
      if (typeof permission === 'string') {
        return userPermissions.includes(permission)
      }
      return userPermissions.includes(`${permission.resource}:${permission.action}`)
    })
  }, [userPermissions])

  // Check if user has all of the specified permissions
  const hasAllPermissions = useCallback((permissions) => {
    return permissions.every(permission => {
      if (typeof permission === 'string') {
        return userPermissions.includes(permission)
      }
      return userPermissions.includes(`${permission.resource}:${permission.action}`)
    })
  }, [userPermissions])

  // Get permissions for a specific resource
  const getPermissionsForResource = useCallback((resource) => {
    return userPermissions.filter(permission => permission.startsWith(`${resource}:`))
  }, [userPermissions])

  // Check if user can access a specific view
  const canAccessView = useCallback((viewName) => {
    const viewPermissions = {
      'operations-planning': ['appointments:view'],
      'operations-people': ['patients:view'],
      'operations-treatments': ['treatments:view'],
      'business-sales': ['sales:view'],
      'business-inventory': ['products:view'],
      'admin-access': ['roles:view'],
      'admin-users': ['users:view'],
      'analytics-reports': ['reports:view']
    }

    const requiredPermissions = viewPermissions[viewName] || []
    return hasAnyPermission(requiredPermissions)
  }, [hasAnyPermission])

  // Load permissions on mount
  useEffect(() => {
    loadUserPermissions()
  }, [loadUserPermissions])

  return {
    // State
    userPermissions,
    loading,
    error,

    // Actions
    loadUserPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getPermissionsForResource,
    canAccessView,

    // Utilitare
    isAdmin: hasPermission('roles', 'view') && hasPermission('users', 'view'),
    canManageUsers: hasPermission('users', 'create') || hasPermission('users', 'edit'),
    canManageRoles: hasPermission('roles', 'create') || hasPermission('roles', 'edit'),
    canViewReports: hasPermission('reports', 'view'),
    canManageSales: hasPermission('sales', 'create') || hasPermission('sales', 'edit')
  }
}