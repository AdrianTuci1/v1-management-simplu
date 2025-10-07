class RoleManager {
  // Validare rol
  validateRole(roleData, existingId = null) {
    const errors = []

    // Validări de bază
    if (!roleData.name?.trim()) {
      errors.push('Numele rolului este obligatoriu')
    }

    if (!roleData.description?.trim()) {
      errors.push('Descrierea rolului este obligatorie')
    }

    // Validări suplimentare
    if (roleData.name && roleData.name.length < 2) {
      errors.push('Numele rolului trebuie să aibă cel puțin 2 caractere')
    }

    if (roleData.name && roleData.name.length > 50) {
      errors.push('Numele rolului nu poate depăși 50 de caractere')
    }

    if (roleData.description && roleData.description.length < 10) {
      errors.push('Descrierea rolului trebuie să aibă cel puțin 10 caractere')
    }

    if (roleData.description && roleData.description.length > 500) {
      errors.push('Descrierea rolului nu poate depăși 500 de caractere')
    }

    // Validare permisiuni
    if (roleData.permissions && !Array.isArray(roleData.permissions)) {
      errors.push('Permisiunile trebuie să fie un array')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Transformare pentru API
  transformRoleForAPI(roleData) {
    const transformed = {
      name: roleData.name?.trim(),
      description: roleData.description?.trim(),
      permissions: roleData.permissions || [],
      status: roleData.status || 'active',
      createdAt: roleData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Preserve resourceId and id if they exist (needed for updates)
    if (roleData.resourceId) {
      transformed.resourceId = roleData.resourceId
    }
    if (roleData.id) {
      transformed.id = roleData.id
    }

    return transformed
  }

  // Transformare pentru UI
  transformRoleForUI(roleData) {
    return {
      id: roleData.resourceId || roleData.id,
      resourceId: roleData.resourceId || roleData.id,
      name: roleData.name,
      description: roleData.description,
      permissions: roleData.permissions || [],
      status: roleData.status || 'active',
      createdAt: roleData.createdAt,
      updatedAt: roleData.updatedAt,
      // Proprietăți calculate
      isActive: roleData.status === 'active',
      statusText: this.getStatusText(roleData.status),
      permissionsCount: (roleData.permissions || []).length,
      permissionsText: this.getPermissionsText(roleData.permissions || [])
    }
  }

  // Transformare pentru UI (array)
  transformRolesForUI(roles) {
    return roles.map(role => this.transformRoleForUI(role))
  }

  // Text pentru status
  getStatusText(status) {
    const statusMap = {
      active: 'Activ',
      inactive: 'Inactiv',
      archived: 'Arhivat'
    }
    return statusMap[status] || 'Necunoscut'
  }

  // Text pentru permisiuni
  getPermissionsText(permissions) {
    if (!permissions || permissions.length === 0) {
      return 'Fără permisiuni'
    }
    
    // Handle both string format ("resource:action") and object format ({resource, action})
    const resourceCount = new Set(permissions.map(p => {
      if (typeof p === 'string') {
        return p.split(':')[0] // Extract resource from "resource:action"
      }
      return p.resource
    })).size
    const actionCount = permissions.length
    
    return `${resourceCount} resurse, ${actionCount} acțiuni`
  }

  // Statistici roluri
  getRoleStats(roles) {
    const total = roles.length
    const active = roles.filter(r => r.status === 'active').length
    const inactive = roles.filter(r => r.status === 'inactive').length
    const archived = roles.filter(r => r.status === 'archived').length

    // Statistici pe permisiuni
    const totalPermissions = roles.reduce((sum, role) => 
      sum + (role.permissions?.length || 0), 0
    )
    const avgPermissions = total > 0 ? Math.round(totalPermissions / total) : 0

    // Roluri cu cele mai multe permisiuni
    const rolesByPermissions = [...roles]
      .sort((a, b) => (b.permissions?.length || 0) - (a.permissions?.length || 0))
      .slice(0, 5)

    return {
      total,
      active,
      inactive,
      archived,
      totalPermissions,
      avgPermissions,
      rolesByPermissions,
      activePercentage: total > 0 ? Math.round((active / total) * 100) : 0
    }
  }

  // Filtrare roluri
  filterRoles(roles, filters = {}) {
    let filtered = [...roles]

    // Filtrare după status
    if (filters.status) {
      filtered = filtered.filter(role => role.status === filters.status)
    }

    // Filtrare după căutare text
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(role => 
        role.name?.toLowerCase().includes(searchTerm) ||
        role.description?.toLowerCase().includes(searchTerm)
      )
    }

    // Filtrare după numărul de permisiuni
    if (filters.minPermissions) {
      filtered = filtered.filter(role => 
        (role.permissions?.length || 0) >= filters.minPermissions
      )
    }

    if (filters.maxPermissions) {
      filtered = filtered.filter(role => 
        (role.permissions?.length || 0) <= filters.maxPermissions
      )
    }

    return filtered
  }

  // Sortare roluri
  sortRoles(roles, sortBy = 'name', sortOrder = 'asc') {
    const sorted = [...roles]

    sorted.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]

      // Pentru numărul de permisiuni
      if (sortBy === 'permissionsCount') {
        aValue = a.permissions?.length || 0
        bValue = b.permissions?.length || 0
      }

      // Pentru valori numerice
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
      }

      // Pentru string-uri
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
        if (sortOrder === 'asc') {
          return aValue.localeCompare(bValue)
        } else {
          return bValue.localeCompare(aValue)
        }
      }

      return 0
    })

    return sorted
  }

  // Export roluri
  exportRoles(roles, format = 'json') {
    switch (format.toLowerCase()) {
      case 'csv':
        return this.exportToCSV(roles)
      case 'json':
        return JSON.stringify(roles, null, 2)
      default:
        throw new Error(`Format necunoscut: ${format}`)
    }
  }

  // Export CSV
  exportToCSV(roles) {
    const headers = [
      'ID', 'Nume', 'Descriere', 'Status', 'Număr Permisiuni', 'Data Creării'
    ]

    const rows = roles.map(role => [
      role.id,
      role.name,
      role.description,
      role.status,
      role.permissions?.length || 0,
      new Date(role.createdAt).toLocaleDateString('ro-RO')
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    return csvContent
  }

}

export const roleManager = new RoleManager()
