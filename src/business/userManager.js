class UserManager {
  // Validare utilizator
  validateUser(userData, existingId = null) {
    const errors = []

    // Validări pentru câmpurile din UserDrawer
    if (!userData.medicName?.trim()) {
      errors.push('Numele medicului este obligatoriu')
    } else if (userData.medicName.trim().length < 2) {
      errors.push('Numele medicului trebuie să aibă cel puțin 2 caractere')
    }

    if (!userData.email?.trim()) {
      errors.push('Email-ul este obligatoriu')
    } else if (!this.isValidEmail(userData.email)) {
      errors.push('Email-ul nu este valid')
    }



    // Validare pentru rol
    if (!userData.role?.trim()) {
      errors.push('Rolul este obligatoriu')
    }

    // Validare pentru zile de serviciu
    if (!userData.dutyDays || !Array.isArray(userData.dutyDays) || userData.dutyDays.length === 0) {
      errors.push('Cel puțin o zi de serviciu trebuie selectată')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Validare email
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }



  // Transformare pentru API
  transformUserForAPI(userData) {
    return {
      ...userData,
      medicName: userData.medicName?.trim(),
      email: userData.email?.trim().toLowerCase(),
      phone: userData.phone?.trim(),
      dutyDays: userData.dutyDays || [],
      role: userData.role || 'doctor',
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  // Transformare pentru UI
  transformUserForUI(userData) {
    return {
      ...userData,
      fullName: userData.medicName || userData.fullName,
      dutyDays: userData.dutyDays || [],
      // Proprietăți calculate
      isActive: userData.status === 'active',
      statusText: this.getStatusText(userData.status)
    }
  }

  // Transformare pentru UI (array)
  transformUsersForUI(users) {
    const usersArray = Array.isArray(users) ? users : []
    return usersArray.map(user => this.transformUserForUI(user))
  }

  // Text pentru status
  getStatusText(status) {
    const statusMap = {
      active: 'Activ',
      inactive: 'Inactiv',
      suspended: 'Suspendat',
      retired: 'Pensionat'
    }
    return statusMap[status] || 'Necunoscut'
  }

  // Statistici utilizatori
  getUserStats(users) {
    const total = users.length
    const active = users.filter(u => u.status === 'active').length
    const inactive = users.filter(u => u.status === 'inactive').length

    return {
      total,
      active,
      inactive,
      activePercentage: total > 0 ? Math.round((active / total) * 100) : 0
    }
  }

  // Filtrare utilizatori
  filterUsers(users, filters = {}) {
    let filtered = [...users]

    // Filtrare după status
    if (filters.status) {
      filtered = filtered.filter(user => user.status === filters.status)
    }

    // Filtrare după căutare text
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(user => 
        user.medicName?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm) ||
        user.phone?.toLowerCase().includes(searchTerm)
      )
    }

    return filtered
  }

  // Sortare utilizatori
  sortUsers(users, sortBy = 'medicName', sortOrder = 'asc') {
    const sorted = [...users]

    sorted.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]

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

  // Export utilizatori
  exportUsers(users, format = 'json') {
    switch (format.toLowerCase()) {
      case 'csv':
        return this.exportToCSV(users)
      case 'json':
        return JSON.stringify(users, null, 2)
      default:
        throw new Error(`Format necunoscut: ${format}`)
    }
  }

  // Export CSV
  exportToCSV(users) {
    const usersArray = Array.isArray(users) ? users : []
    
    const headers = [
      'ID', 'Nume Medic', 'Email', 'Telefon', 'Zile Serviciu', 'Status', 'Data Creării'
    ]

    const rows = usersArray.map(user => [
      user.id,
      user.medicName,
      user.email,
      user.phone,
      user.dutyDays?.join(', ') || '',
      user.status,
      new Date(user.createdAt).toLocaleDateString('ro-RO')
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    return csvContent
  }

  // Generare date de test
  generateTestUsers(count = 10) {
    const dutyDaysOptions = [
      ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri'],
      ['Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'],
      ['Luni', 'Marți', 'Joi', 'Vineri'],
      ['Marți', 'Miercuri', 'Joi'],
      ['Luni', 'Miercuri', 'Vineri']
    ]

    const users = []
    for (let i = 1; i <= count; i++) {
      const firstName = `Dr. ${['Ion', 'Maria', 'Alexandru', 'Elena', 'Mihai', 'Ana', 'Andrei', 'Cristina'][Math.floor(Math.random() * 8)]}`
      const lastName = `${['Popescu', 'Ionescu', 'Dumitrescu', 'Stoica', 'Munteanu', 'Florescu', 'Dobrescu', 'Constantinescu'][Math.floor(Math.random() * 8)]}`
      const medicName = `${firstName} ${lastName}`
      const dutyDays = dutyDaysOptions[Math.floor(Math.random() * dutyDaysOptions.length)]
      
      const roles = ['doctor', 'nurse', 'specialist', 'resident', 'admin']
      const role = roles[Math.floor(Math.random() * roles.length)]
      
      users.push({
        medicName: medicName,
        email: `${firstName.toLowerCase().replace('dr. ', '')}.${lastName.toLowerCase()}@example.com`,
        phone: `+40${Math.floor(Math.random() * 900000000) + 100000000}`,
        role: role,
        dutyDays: dutyDays,
        status: Math.random() > 0.1 ? 'active' : 'inactive',
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      })
    }

    return users
  }
}

export const userManager = new UserManager()
