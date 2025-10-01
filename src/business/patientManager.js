
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

    if (patientData.birthYear) {
      const currentYear = new Date().getFullYear()
      const birthYear = parseInt(patientData.birthYear)
      
      if (isNaN(birthYear) || birthYear < 1900 || birthYear > currentYear) {
        errors.push('Anul nașterii trebuie să fie între 1900 și anul curent')
      }
      
      const age = currentYear - birthYear
      if (age > 120) {
        errors.push('Vârsta nu poate fi mai mare de 120 de ani')
      }
    }

    if (patientData.gender && !['male', 'female', 'other'].includes(patientData.gender)) {
      errors.push('Genul trebuie să fie masculin, feminin sau altul')
    }

    if (patientData.tags && !Array.isArray(patientData.tags)) {
      errors.push('Etichetele trebuie să fie o listă')
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '))
    }

    return true
  }

  // Transformare date pentru API
  transformPatientForAPI(patientData) {
    return {
      patientName: patientData.name?.trim(),
      email: patientData.email?.toLowerCase().trim(),
      phone: patientData.phone?.trim(),
      birthYear: patientData.birthYear ? parseInt(patientData.birthYear) : null,
      gender: patientData.gender || null,
      address: patientData.address?.trim() || null,
      notes: patientData.notes?.trim() || null,
      tags: Array.isArray(patientData.tags) ? patientData.tags : [],
      status: patientData.status || 'active',
      createdAt: patientData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  // Transformare date pentru UI
  transformPatientForUI(patientData) {
    // Flatten nested data structure dacă există
    const data = patientData.data || patientData;
    
    // Asigură-te că avem ambele câmpuri pentru compatibilitate
    const patientName = data.patientName || patientData.patientName || data.name || patientData.name;
    
    if (!patientName) {
      console.warn('⚠️ patientManager.transformPatientForUI - No name found in:', patientData);
    }
    
    return {
      ...patientData,
      ...data, // Spread nested data peste proprietățile root
      id: patientData._tempId || patientData.resourceId || patientData.id, // Prioritizează tempId pentru optimistic updates
      resourceId: patientData.resourceId || patientData.id, // Păstrăm resourceId
      name: patientName, // Pentru UI
      patientName: patientName, // Pentru backend/search - păstrăm ambele
      birthYear: data.birthYear ? data.birthYear.toString() : '',
      age: data.birthYear ? this.calculateAgeFromYear(data.birthYear) : null,
      fullAddress: this.formatAddress(data),
      statusLabel: this.getStatusLabel(data.status),
      tags: Array.isArray(data.tags) ? data.tags : []
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

  // Calculează vârsta din anul nașterii
  calculateAgeFromYear(birthYear) {
    const currentYear = new Date().getFullYear()
    const birth = parseInt(birthYear)
    return currentYear - birth
  }



  // Formatează adresa completă
  formatAddress(patient) {
    if (patient.address && patient.address.trim()) {
      return patient.address.trim()
    }
    return 'Adresa nespecificată'
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
        if (!p.birthYear) return false
        const age = this.calculateAgeFromYear(p.birthYear)
        return (!filters.minAge || age >= filters.minAge) &&
               (!filters.maxAge || age <= filters.maxAge)
      })
    }

    // Filtrare după gen
    if (filters.gender) {
      filtered = filtered.filter(p => p.gender === filters.gender)
    }

    // Filtrare după etichete
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(p => 
        p.tags && p.tags.some(tag => filters.tags.includes(tag))
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
        case 'birthYear':
          aValue = a.birthYear || 0
          bValue = b.birthYear || 0
          break
        case 'age':
          aValue = a.birthYear ? this.calculateAgeFromYear(a.birthYear) : 0
          bValue = b.birthYear ? this.calculateAgeFromYear(b.birthYear) : 0
          break
        case 'gender':
          aValue = a.gender || ''
          bValue = b.gender || ''
          break
        case 'status':
          aValue = a.status || ''
          bValue = b.status || ''
          break
        case 'id':
          // Pentru sortarea după ID, folosim ID-ul real sau tempId
          aValue = a.resourceId || a._tempId || a.id || ''
          bValue = b.resourceId || b._tempId || b.id || ''
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
        'Anul nașterii',
        'Vârsta',
        'Gen',
        'Adresa',
        'Note',
        'Etichete',
        'Status',
        'Data creării'
      ]
      
      const rows = patients.map(p => [
        p.name || '',
        p.email || '',
        p.phone || '',
        p.birthYear || '',
        p.birthYear ? this.calculateAgeFromYear(p.birthYear) : '',
        p.gender || '',
        p.address || '',
        p.notes || '',
        Array.isArray(p.tags) ? p.tags.join('; ') : '',
        this.getStatusLabel(p.status),
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
      ageGroups: {
        '0-18': 0,
        '19-30': 0,
        '31-50': 0,
        '51-70': 0,
        '70+': 0
      },
      genderDistribution: {
        male: 0,
        female: 0,
        other: 0,
        unspecified: 0
      },
      topTags: {},
      newThisMonth: 0
    }
    
    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()
    
    patients.forEach(patient => {
      // Vârsta
      if (patient.birthYear) {
        const age = this.calculateAgeFromYear(patient.birthYear)
        if (age <= 18) stats.ageGroups['0-18']++
        else if (age <= 30) stats.ageGroups['19-30']++
        else if (age <= 50) stats.ageGroups['31-50']++
        else if (age <= 70) stats.ageGroups['51-70']++
        else stats.ageGroups['70+']++
      }
      
      // Gen
      if (patient.gender) {
        if (stats.genderDistribution[patient.gender] !== undefined) {
          stats.genderDistribution[patient.gender]++
        } else {
          stats.genderDistribution.other++
        }
      } else {
        stats.genderDistribution.unspecified++
      }
      
      // Etichete
      if (patient.tags && Array.isArray(patient.tags)) {
        patient.tags.forEach(tag => {
          stats.topTags[tag] = (stats.topTags[tag] || 0) + 1
        })
      }
      
      // Noi în această lună
      if (patient.createdAt) {
        const created = new Date(patient.createdAt)
        if (created.getMonth() === thisMonth && created.getFullYear() === thisYear) {
          stats.newThisMonth++
        }
      }
    })
    
    // Sortează etichetele după numărul de utilizări
    stats.topTags = Object.entries(stats.topTags)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .reduce((obj, [tag, count]) => {
        obj[tag] = count
        return obj
      }, {})
    
    return stats
  }
}

export default new PatientManager()
