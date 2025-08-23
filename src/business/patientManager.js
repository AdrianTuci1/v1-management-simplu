
class PatientManager {
  // Validare pentru un pacient
  validatePatient(patientData) {
    const errors = []

    if (!patientData.name || patientData.name.trim().length < 2) {
      errors.push('Numele trebuie să aibă cel puțin 2 caractere')
    }

    if (!patientData.email) {
      errors.push('Email-ul este obligatoriu')
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(patientData.email)) {
        errors.push('Email-ul nu este valid')
      }
    }

    if (!patientData.phone) {
      errors.push('Numărul de telefon este obligatoriu')
    } else {
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/
      if (!phoneRegex.test(patientData.phone)) {
        errors.push('Numărul de telefon nu este valid')
      }
    }

    if (patientData.birthDate) {
      const birthDate = new Date(patientData.birthDate)
      const today = new Date()
      if (birthDate > today) {
        errors.push('Data nașterii nu poate fi în viitor')
      }
      
      const age = today.getFullYear() - birthDate.getFullYear()
      if (age > 120) {
        errors.push('Vârsta nu poate fi mai mare de 120 de ani')
      }
    }

    if (patientData.cnp && patientData.cnp.length !== 13) {
      errors.push('CNP-ul trebuie să aibă exact 13 cifre')
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '))
    }

    return true
  }

  // Transformare date pentru API
  transformPatientForAPI(patientData) {
    return {
      name: patientData.name?.trim(),
      email: patientData.email?.toLowerCase().trim(),
      phone: patientData.phone?.trim(),
      birthDate: patientData.birthDate ? new Date(patientData.birthDate).toISOString() : null,
      cnp: patientData.cnp?.trim() || null,
      address: patientData.address?.trim() || null,
      city: patientData.city?.trim() || null,
      county: patientData.county?.trim() || null,
      postalCode: patientData.postalCode?.trim() || null,
      emergencyContact: patientData.emergencyContact?.trim() || null,
      emergencyPhone: patientData.emergencyPhone?.trim() || null,
      medicalHistory: patientData.medicalHistory?.trim() || null,
      allergies: patientData.allergies?.trim() || null,
      medications: patientData.medications?.trim() || null,
      insuranceProvider: patientData.insuranceProvider?.trim() || null,
      insuranceNumber: patientData.insuranceNumber?.trim() || null,
      status: patientData.status || 'active',
      notes: patientData.notes?.trim() || null,
      createdAt: patientData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  // Transformare date pentru UI
  transformPatientForUI(patientData) {
    return {
      ...patientData,
      birthDate: patientData.birthDate ? new Date(patientData.birthDate).toISOString().split('T')[0] : '',
      age: patientData.birthDate ? this.calculateAge(patientData.birthDate) : null,
      fullAddress: this.formatAddress(patientData),
      statusLabel: this.getStatusLabel(patientData.status)
    }
  }

  // Calculează vârsta
  calculateAge(birthDate) {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  // Formatează adresa completă
  formatAddress(patient) {
    const parts = []
    if (patient.address) parts.push(patient.address)
    if (patient.city) parts.push(patient.city)
    if (patient.county) parts.push(patient.county)
    if (patient.postalCode) parts.push(patient.postalCode)
    
    return parts.length > 0 ? parts.join(', ') : 'Adresa nespecificată'
  }

  // Obține eticheta pentru status
  getStatusLabel(status) {
    const statusLabels = {
      active: 'Activ',
      inactive: 'Inactiv',
      archived: 'Arhivat'
    }
    return statusLabels[status] || status
  }

  // Filtrează pacienții după criterii
  filterPatients(patients, filters = {}) {
    let filtered = [...patients]

    // Filtrare după nume
    if (filters.name) {
      const searchTerm = filters.name.toLowerCase()
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm) ||
        p.email.toLowerCase().includes(searchTerm)
      )
    }

    // Filtrare după status
    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status)
    }

    // Filtrare după vârstă
    if (filters.minAge || filters.maxAge) {
      filtered = filtered.filter(p => {
        if (!p.birthDate) return false
        const age = this.calculateAge(p.birthDate)
        return (!filters.minAge || age >= filters.minAge) &&
               (!filters.maxAge || age <= filters.maxAge)
      })
    }

    // Filtrare după oraș
    if (filters.city) {
      const cityTerm = filters.city.toLowerCase()
      filtered = filtered.filter(p => 
        p.city && p.city.toLowerCase().includes(cityTerm)
      )
    }

    return filtered
  }

  // Sortează pacienții
  sortPatients(patients, sortBy = 'name', sortOrder = 'asc') {
    const sorted = [...patients]
    
    sorted.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'name':
          aValue = a.name?.toLowerCase() || ''
          bValue = b.name?.toLowerCase() || ''
          break
        case 'email':
          aValue = a.email?.toLowerCase() || ''
          bValue = b.email?.toLowerCase() || ''
          break
        case 'createdAt':
          aValue = new Date(a.createdAt || 0)
          bValue = new Date(b.createdAt || 0)
          break
        case 'age':
          aValue = a.birthDate ? this.calculateAge(a.birthDate) : 0
          bValue = b.birthDate ? this.calculateAge(b.birthDate) : 0
          break
        default:
          aValue = a[sortBy] || ''
          bValue = b[sortBy] || ''
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
    
    return sorted
  }

  // Exportă pacienții în format CSV
  exportPatients(patients, format = 'csv') {
    if (format === 'csv') {
      const headers = [
        'Nume',
        'Email',
        'Telefon',
        'Data nașterii',
        'Vârsta',
        'CNP',
        'Adresa',
        'Oraș',
        'Județ',
        'Cod poștal',
        'Contact de urgență',
        'Telefon urgență',
        'Istoric medical',
        'Alergii',
        'Medicamente',
        'Asigurător',
        'Număr asigurare',
        'Status',
        'Note',
        'Data creării'
      ]
      
      const rows = patients.map(p => [
        p.name || '',
        p.email || '',
        p.phone || '',
        p.birthDate ? new Date(p.birthDate).toLocaleDateString('ro-RO') : '',
        p.birthDate ? this.calculateAge(p.birthDate) : '',
        p.cnp || '',
        p.address || '',
        p.city || '',
        p.county || '',
        p.postalCode || '',
        p.emergencyContact || '',
        p.emergencyPhone || '',
        p.medicalHistory || '',
        p.allergies || '',
        p.medications || '',
        p.insuranceProvider || '',
        p.insuranceNumber || '',
        this.getStatusLabel(p.status),
        p.notes || '',
        p.createdAt ? new Date(p.createdAt).toLocaleDateString('ro-RO') : ''
      ])
      
      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n')
      
      return csvContent
    }
    
    throw new Error('Format de export nesuportat')
  }

  // Generează statistici despre pacienți
  generateStats(patients) {
    const stats = {
      total: patients.length,
      active: patients.filter(p => p.status === 'active').length,
      inactive: patients.filter(p => p.status === 'inactive').length,
      archived: patients.filter(p => p.status === 'archived').length,
      withInsurance: patients.filter(p => p.insuranceProvider).length,
      ageGroups: {
        '0-18': 0,
        '19-30': 0,
        '31-50': 0,
        '51-70': 0,
        '70+': 0
      },
      topCities: {},
      newThisMonth: 0
    }
    
    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()
    
    patients.forEach(patient => {
      // Vârsta
      if (patient.birthDate) {
        const age = this.calculateAge(patient.birthDate)
        if (age <= 18) stats.ageGroups['0-18']++
        else if (age <= 30) stats.ageGroups['19-30']++
        else if (age <= 50) stats.ageGroups['31-50']++
        else if (age <= 70) stats.ageGroups['51-70']++
        else stats.ageGroups['70+']++
      }
      
      // Orașe
      if (patient.city) {
        stats.topCities[patient.city] = (stats.topCities[patient.city] || 0) + 1
      }
      
      // Noi în această lună
      if (patient.createdAt) {
        const created = new Date(patient.createdAt)
        if (created.getMonth() === thisMonth && created.getFullYear() === thisYear) {
          stats.newThisMonth++
        }
      }
    })
    
    // Sortează orașele după numărul de pacienți
    stats.topCities = Object.entries(stats.topCities)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .reduce((obj, [city, count]) => {
        obj[city] = count
        return obj
      }, {})
    
    return stats
  }
}

export default new PatientManager()
