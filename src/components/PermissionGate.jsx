import { usePermissions } from '../hooks/usePermissions'

const PermissionGate = ({ 
  children, 
  permission, 
  permissions = [], 
  resource, 
  action, 
  fallback = null,
  requireAll = false 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()

  // Determine what permission to check
  let permissionToCheck = null

  if (permission) {
    // Single permission string like "appointments:view"
    permissionToCheck = hasPermission(permission.split(':')[0], permission.split(':')[1])
  } else if (permissions.length > 0) {
    // Multiple permissions
    if (requireAll) {
      permissionToCheck = hasAllPermissions(permissions)
    } else {
      permissionToCheck = hasAnyPermission(permissions)
    }
  } else if (resource && action) {
    // Resource and action specified separately
    permissionToCheck = hasPermission(resource, action)
  }

  // If no permission is specified, show content (for backward compatibility)
  if (permissionToCheck === null) {
    return children
  }

  // Show content if user has permission, otherwise show fallback
  return permissionToCheck ? children : fallback
}

export default PermissionGate
