class UserManager {
  // Validare utilizator
  validateUser(userData, existingId = null) {
    const errors = []

    // Validări de bază
    if (!userData.firstName?.trim()) {
      errors.push('Prenumele este obligatoriu')
    }

    if (!userData.lastName?.trim()) {
      errors.push('Numele este obligatoriu')
    }

    if (!userData.email?.trim()) {
      errors.push('Email-ul este obligatoriu')
    } else if (!this.isValidEmail(userData.email)) {
      errors.push('Email-ul nu este valid')
    }

    if (!userData.phone?.trim()) {
      errors.push('Telefonul este obligatoriu')
    } else if (!this.isValidPhone(userData.phone)) {
      errors.push('Telefonul nu este valid')
    }

    if (!userData.specialization?.trim()) {
      errors.push('Specializarea este obligatorie')
    }

    if (!userData.licenseNumber?.trim()) {
      errors.push('Numărul de licență este obligatoriu')
    }

    // Validări suplimentare
    if (userData.firstName && userData.firstName.length < 2) {
      errors.push('Prenumele trebuie să aibă cel puțin 2 caractere')
    }

    if (userData.lastName && userData.lastName.length < 2) {
      errors.push('Numele trebuie să aibă cel puțin 2 caractere')
    }

    if (userData.licenseNumber && userData.licenseNumber.length < 5) {
      errors.push('Numărul de licență trebuie să aibă cel puțin 5 caractere')
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

  // Validare telefon
  isValidPhone(phone) {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/
    return phoneRegex.test(phone)
  }

  // Transformare pentru API
  transformUserForAPI(userData) {
    return {
      firstName: userData.firstName?.trim(),
      lastName: userData.lastName?.trim(),
      email: userData.email?.trim().toLowerCase(),
      phone: userData.phone?.trim(),
      specialization: userData.specialization?.trim(),
      licenseNumber: userData.licenseNumber?.trim(),
      experience: userData.experience || 0,
      education: userData.education?.trim(),
      certifications: userData.certifications?.trim(),
      bio: userData.bio?.trim(),
      status: userData.status || 'active',
      role: userData.role || 'doctor',
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  // Transformare pentru UI
  transformUserForUI(userData) {
    return {
      id: userData.id,
      firstName: userData.firstName,
      lastName: userData.lastName,
      fullName: `${userData.firstName} ${userData.lastName}`,
      email: userData.email,
      phone: userData.phone,
      specialization: userData.specialization,
      licenseNumber: userData.licenseNumber,
      experience: userData.experience || 0,
      education: userData.education,
      certifications: userData.certifications,
      bio: userData.bio,
      status: userData.status || 'active',
      role: userData.role || 'doctor',
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
      // Proprietăți calculate
      isActive: userData.status === 'active',
      experienceText: this.getExperienceText(userData.experience),
      statusText: this.getStatusText(userData.status)
    }
  }

  // Transformare pentru UI (array)
  transformUsersForUI(users) {
    // Asigură-te că users este un array
    const usersArray = Array.isArray(users) ? users : []
    return usersArray.map(user => this.transformUserForUI(user))
  }

  // Text pentru experiență
  getExperienceText(experience) {
    if (!experience || experience === 0) {
      return 'Fără experiență'
    }
    if (experience === 1) {
      return '1 an'
    }
    return `${experience} ani`
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
    const suspended = users.filter(u => u.status === 'suspended').length
    const retired = users.filter(u => u.status === 'retired').length

    // Statistici pe specializări
    const specializations = {}
    users.forEach(user => {
      const spec = user.specialization || 'Necunoscută'
      specializations[spec] = (specializations[spec] || 0) + 1
    })

    // Experiență medie
    const totalExperience = users.reduce((sum, user) => sum + (user.experience || 0), 0)
    const avgExperience = total > 0 ? Math.round(totalExperience / total) : 0

    return {
      total,
      active,
      inactive,
      suspended,
      retired,
      specializations,
      avgExperience,
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

    // Filtrare după specializare
    if (filters.specialization) {
      filtered = filtered.filter(user => 
        user.specialization?.toLowerCase().includes(filters.specialization.toLowerCase())
      )
    }

    // Filtrare după căutare text
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(user => 
        user.firstName?.toLowerCase().includes(searchTerm) ||
        user.lastName?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm) ||
        user.specialization?.toLowerCase().includes(searchTerm) ||
        user.licenseNumber?.toLowerCase().includes(searchTerm)
      )
    }

    // Filtrare după experiență
    if (filters.minExperience) {
      filtered = filtered.filter(user => (user.experience || 0) >= filters.minExperience)
    }

    if (filters.maxExperience) {
      filtered = filtered.filter(user => (user.experience || 0) <= filters.maxExperience)
    }

    return filtered
  }

  // Sortare utilizatori
  sortUsers(users, sortBy = 'lastName', sortOrder = 'asc') {
    const sorted = [...users]

    sorted.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]

      // Pentru nume complete
      if (sortBy === 'fullName') {
        aValue = `${a.firstName} ${a.lastName}`
        bValue = `${b.firstName} ${b.lastName}`
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
    // Asigură-te că users este un array
    const usersArray = Array.isArray(users) ? users : []
    
    const headers = [
      'ID', 'Prenume', 'Nume', 'Email', 'Telefon', 'Specializare',
      'Număr Licență', 'Experiență', 'Educație', 'Status', 'Data Creării'
    ]

    const rows = usersArray.map(user => [
      user.id,
      user.firstName,
      user.lastName,
      user.email,
      user.phone,
      user.specialization,
      user.licenseNumber,
      user.experience,
      user.education,
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
    const specializations = [
      'Cardiologie', 'Dermatologie', 'Endocrinologie', 'Gastroenterologie',
      'Neurologie', 'Oftalmologie', 'Ortopedie', 'Pediatrie', 'Psihiatrie',
      'Radiologie', 'Urologie', 'Ginecologie'
    ]

    const users = []
    for (let i = 1; i <= count; i++) {
      const firstName = `Prenume${i}`
      const lastName = `Nume${i}`
      const specialization = specializations[Math.floor(Math.random() * specializations.length)]
      
      users.push({
        id: `user_${i}`,
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        phone: `+40${Math.floor(Math.random() * 900000000) + 100000000}`,
        specialization,
        licenseNumber: `LIC${String(i).padStart(6, '0')}`,
        experience: Math.floor(Math.random() * 30) + 1,
        education: 'Universitatea de Medicină și Farmacie',
        certifications: 'Certificat de specialitate',
        bio: `Dr. ${firstName} ${lastName} este specialist în ${specialization.toLowerCase()}.`,
        status: Math.random() > 0.1 ? 'active' : 'inactive',
        role: 'doctor',
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      })
    }

    return users
  }
}

export const userManager = new UserManager()
