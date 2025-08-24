import treatmentService from '../services/treatmentService.js'

class TreatmentManager {
  // Validare pentru un tratament
  validateTreatment(treatmentData) {
    const errors = []

    if (!treatmentData.treatmentType || treatmentData.treatmentType.trim() === '') {
      errors.push('Numele tratamentului este obligatoriu')
    }

    if (!treatmentData.category || treatmentData.category.trim() === '') {
      errors.push('Categoria este obligatorie')
    }

    if (!treatmentData.duration || treatmentData.duration <= 0) {
      errors.push('Durata trebuie să fie mai mare decât 0')
    }

    if (treatmentData.duration > 480) { // 8 ore max
      errors.push('Durata nu poate fi mai mare de 8 ore')
    }

    if (treatmentData.price && treatmentData.price < 0) {
      errors.push('Prețul nu poate fi negativ')
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '))
    }

    return true
  }

  // Transformare date pentru API
  transformTreatmentForAPI(treatmentData) {
    return {
      ...treatmentData,
      treatmentType: treatmentData.treatmentType.trim(),
      category: treatmentData.category.trim(),
      duration: parseInt(treatmentData.duration) || 0,
      price: parseFloat(treatmentData.price) || 0,
      description: treatmentData.description?.trim() || '',
      createdAt: treatmentData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  // Transformare date pentru UI
  transformTreatmentForUI(treatmentData) {
    return {
      ...treatmentData,
      id: treatmentData.resourceId || treatmentData.id, // Folosim resourceId ca ID principal
      name: treatmentData.treatmentType || treatmentData.name || '', // Adăugăm name pentru compatibilitate
      treatmentType: treatmentData.treatmentType || '',
      category: treatmentData.category || '',
      duration: treatmentData.duration?.toString() || '',
      price: treatmentData.price?.toString() || '',
      description: treatmentData.description || ''
    }
  }

  // Obține statistici pentru tratamente
  async getStatistics() {
    try {
      const treatments = await treatmentService.getTreatments()
      
      const stats = {
        total: treatments.length,
        categories: {},
        averageDuration: 0,
        averagePrice: 0,
        totalRevenue: 0
      }

      if (treatments.length > 0) {
        // Calculează statistici pe categorii
        treatments.forEach(treatment => {
          if (!stats.categories[treatment.category]) {
            stats.categories[treatment.category] = 0
          }
          stats.categories[treatment.category]++
        })

        // Calculează durata și prețul mediu
        const totalDuration = treatments.reduce((sum, t) => sum + (parseInt(t.duration) || 0), 0)
        const totalPrice = treatments.reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0)
        
        stats.averageDuration = Math.round(totalDuration / treatments.length)
        stats.averagePrice = Math.round((totalPrice / treatments.length) * 100) / 100
        stats.totalRevenue = totalPrice
      }

      return stats
    } catch (error) {
      console.error('Error getting treatment statistics:', error)
      return {
        total: 0,
        categories: {},
        averageDuration: 0,
        averagePrice: 0,
        totalRevenue: 0
      }
    }
  }

  // Filtrare tratamente
  filterTreatments(treatments, filters = {}) {
    let filtered = [...treatments]

    if (filters.category) {
      filtered = filtered.filter(t => t.category === filters.category)
    }

    if (filters.treatmentType) {
      filtered = filtered.filter(t => t.treatmentType === filters.treatmentType)
    }

    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(t => 
        t.treatmentType.toLowerCase().includes(searchTerm) ||
        t.category.toLowerCase().includes(searchTerm) ||
        (t.description && t.description.toLowerCase().includes(searchTerm))
      )
    }

    if (filters.minDuration) {
      filtered = filtered.filter(t => (parseInt(t.duration) || 0) >= filters.minDuration)
    }

    if (filters.maxDuration) {
      filtered = filtered.filter(t => (parseInt(t.duration) || 0) <= filters.maxDuration)
    }

    if (filters.minPrice) {
      filtered = filtered.filter(t => (parseFloat(t.price) || 0) >= filters.minPrice)
    }

    if (filters.maxPrice) {
      filtered = filtered.filter(t => (parseFloat(t.price) || 0) <= filters.maxPrice)
    }

    return filtered
  }

  // Sortare tratamente
  sortTreatments(treatments, sortBy = 'treatmentType', sortOrder = 'asc') {
    const sorted = [...treatments]

    sorted.sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case 'treatmentType':
          aValue = a.treatmentType
          bValue = b.treatmentType
          break
        case 'category':
          aValue = a.category
          bValue = b.category
          break
        case 'duration':
          aValue = parseInt(a.duration) || 0
          bValue = parseInt(b.duration) || 0
          break
        case 'price':
          aValue = parseFloat(a.price) || 0
          bValue = parseFloat(b.price) || 0
          break
        case 'createdAt':
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
        default:
          aValue = a.treatmentType
          bValue = b.treatmentType
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return sorted
  }

  // Export tratamente
  exportTreatments(treatments, format = 'json') {
    switch (format) {
      case 'json':
        return JSON.stringify(treatments, null, 2)
      
      case 'csv':
        const headers = ['Tip Tratament', 'Categorie', 'Durata (min)', 'Preț (RON)', 'Descriere']
        const rows = treatments.map(t => [
          t.treatmentType,
          t.category,
          t.duration,
          t.price,
          t.description || ''
        ])
        
        return [headers, ...rows]
          .map(row => row.map(cell => `"${cell}"`).join(','))
          .join('\n')
      
      default:
        throw new Error(`Format necunoscut: ${format}`)
    }
  }

  // Obține toate categoriile unice
  getUniqueCategories(treatments) {
    const categories = new Set()
    treatments.forEach(treatment => {
      if (treatment.category) {
        categories.add(treatment.category)
      }
    })
    return Array.from(categories).sort()
  }

  // Obține toate tipurile de tratamente unice
  getUniqueTreatmentTypes(treatments) {
    const types = new Set()
    treatments.forEach(treatment => {
      if (treatment.treatmentType) {
        types.add(treatment.treatmentType)
      }
    })
    return Array.from(types).sort()
  }
}

export default new TreatmentManager()
