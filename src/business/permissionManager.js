class PermissionManager {
  // Validare permisiune
  validatePermission(permissionData, existingId = null) {
    const errors = []

    // Validări de bază
    if (!permissionData.resource?.trim()) {
      errors.push('Resursa este obligatorie')
    }

    if (!permissionData.action?.trim()) {
      errors.push('Acțiunea este obligatorie')
    }

    // Validări suplimentare
    if (permissionData.resource && permissionData.resource.length < 2) {
      errors.push('Resursa trebuie să aibă cel puțin 2 caractere')
    }

    if (permissionData.action && permissionData.action.length < 2) {
      errors.push('Acțiunea trebuie să aibă cel puțin 2 caractere')
    }

    // Validare acțiuni valide
    const validActions = ['view', 'create', 'edit', 'delete']
    if (permissionData.action && !validActions.includes(permissionData.action)) {
      errors.push(`Acțiunea trebuie să fie una din: ${validActions.join(', ')}`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Transformare pentru API
  transformPermissionForAPI(permissionData) {
    return {
      resource: permissionData.resource?.trim().toLowerCase(),
      action: permissionData.action?.trim().toLowerCase(),
      description: permissionData.description?.trim(),
      createdAt: permissionData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  // Transformare pentru UI
  transformPermissionForUI(permissionData) {
    return {
      id: permissionData.id,
      resource: permissionData.resource,
      action: permissionData.action,
      description: permissionData.description,
      createdAt: permissionData.createdAt,
      updatedAt: permissionData.updatedAt,
      // Proprietăți calculate
      resourceText: this.getResourceText(permissionData.resource),
      actionText: this.getActionText(permissionData.action),
      fullText: `${this.getResourceText(permissionData.resource)} - ${this.getActionText(permissionData.action)}`
    }
  }

  // Transformare pentru UI (array)
  transformPermissionsForUI(permissions) {
    return permissions.map(permission => this.transformPermissionForUI(permission))
  }

  // Text pentru resurse
  getResourceText(resource) {
    const resourceMap = {
      appointments: 'Programări',
      patients: 'Pacienți',
      users: 'Utilizatori',
      roles: 'Roluri',
      permissions: 'Permisiuni',
      products: 'Produse',
      reports: 'Rapoarte',
      settings: 'Setări',
      analytics: 'Analize',
      financial: 'Financiar'
    }
    return resourceMap[resource] || resource
  }

  // Text pentru acțiuni
  getActionText(action) {
    const actionMap = {
      view: 'Vizualizare',
      create: 'Creare',
      edit: 'Editare',
      delete: 'Ștergere'
    }
    return actionMap[action] || action
  }

  // Statistici permisiuni
  getPermissionStats(permissions) {
    const total = permissions.length

    // Statistici pe resurse
    const resources = {}
    permissions.forEach(permission => {
      const resource = permission.resource || 'Necunoscută'
      resources[resource] = (resources[resource] || 0) + 1
    })

    // Statistici pe acțiuni
    const actions = {}
    permissions.forEach(permission => {
      const action = permission.action || 'Necunoscută'
      actions[action] = (actions[action] || 0) + 1
    })

    // Permisiuni unice (resursă + acțiune)
    const uniquePermissions = new Set(
      permissions.map(p => `${p.resource}:${p.action}`)
    ).size

    return {
      total,
      resources,
      actions,
      uniquePermissions,
      resourceCount: Object.keys(resources).length,
      actionCount: Object.keys(actions).length
    }
  }

  // Filtrare permisiuni
  filterPermissions(permissions, filters = {}) {
    let filtered = [...permissions]

    // Filtrare după resursă
    if (filters.resource) {
      filtered = filtered.filter(permission => 
        permission.resource === filters.resource
      )
    }

    // Filtrare după acțiune
    if (filters.action) {
      filtered = filtered.filter(permission => 
        permission.action === filters.action
      )
    }

    // Filtrare după căutare text
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(permission => 
        permission.resource?.toLowerCase().includes(searchTerm) ||
        permission.action?.toLowerCase().includes(searchTerm) ||
        permission.description?.toLowerCase().includes(searchTerm)
      )
    }

    return filtered
  }

  // Sortare permisiuni
  sortPermissions(permissions, sortBy = 'resource', sortOrder = 'asc') {
    const sorted = [...permissions]

    sorted.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]

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

  // Export permisiuni
  exportPermissions(permissions, format = 'json') {
    switch (format.toLowerCase()) {
      case 'csv':
        return this.exportToCSV(permissions)
      case 'json':
        return JSON.stringify(permissions, null, 2)
      default:
        throw new Error(`Format necunoscut: ${format}`)
    }
  }

  // Export CSV
  exportToCSV(permissions) {
    const headers = [
      'ID', 'Resursă', 'Acțiune', 'Descriere', 'Data Creării'
    ]

    const rows = permissions.map(permission => [
      permission.id,
      permission.resource,
      permission.action,
      permission.description,
      new Date(permission.createdAt).toLocaleDateString('ro-RO')
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    return csvContent
  }

  // Generare date de test
  generateTestPermissions() {
    const resources = [
      'appointments', 'patients', 'users', 'roles', 'permissions',
      'products', 'reports', 'settings', 'analytics', 'financial'
    ]

    const actions = ['view', 'create', 'edit', 'delete']

    const permissions = []
    let id = 1

    resources.forEach(resource => {
      actions.forEach(action => {
        permissions.push({
          id: `permission_${id++}`,
          resource,
          action,
          description: `${this.getActionText(action)} ${this.getResourceText(resource).toLowerCase()}`,
          createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        })
      })
    })

    return permissions
  }

  // Verifică dacă o permisiune există
  hasPermission(userPermissions, resource, action) {
    return userPermissions.some(permission => 
      permission.resource === resource && permission.action === action
    )
  }

  // Obține permisiunile pentru o resursă
  getPermissionsForResource(permissions, resource) {
    return permissions.filter(permission => permission.resource === resource)
  }

  // Obține toate resursele disponibile
  getAvailableResources(permissions) {
    return [...new Set(permissions.map(p => p.resource))].sort()
  }

  // Obține toate acțiunile disponibile
  getAvailableActions(permissions) {
    return [...new Set(permissions.map(p => p.action))].sort()
  }
}

export const permissionManager = new PermissionManager()
