import { dataFacade } from '../data/DataFacade.js'
import { DraftAwareResourceRepository } from '../data/repositories/DraftAwareResourceRepository.js'

class SettingsService {
  constructor() {
    this.repository = new DraftAwareResourceRepository('settings', 'settings')
    this.dataFacade = dataFacade
  }

  // Obține toate setările
  async getSettings(filters = {}) {
    try {
      const settings = await this.dataFacade.getAll('settings', filters)
      return this.transformSettingsForUI(settings)
    } catch (error) {
      console.error('Error getting settings:', error)
      return []
    }
  }

  // Obține o setare specifică după ID
  async getSettingById(id) {
    try {
      const setting = await this.dataFacade.getById('settings', id)
      return setting ? this.transformSettingForUI(setting) : null
    } catch (error) {
      console.error('Error getting setting by ID:', error)
      return null
    }
  }

  // Obține setările pentru working-hours
  async getWorkingHours() {
    try {
      // Caută în toate setările și filtrează după settingType din data
      const allSettings = await this.dataFacade.getAll('settings')
      const workingHoursSettings = allSettings.filter(setting => 
        setting.data && setting.data.settingType === 'working-hours'
      )
      return workingHoursSettings.length > 0 ? this.transformSettingForUI(workingHoursSettings[0]) : null
    } catch (error) {
      console.error('Error getting working hours:', error)
      return null
    }
  }

  // Adaugă o setare nouă
  async addSetting(settingData) {
    try {
      // Validare
      const validationResult = this.validateSetting(settingData)
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors.join(', '))
      }

      // Transformare pentru API
      const apiData = this.transformSettingForAPI(settingData)
      
      const result = await this.dataFacade.create('settings', apiData)
      
      return this.transformSettingForUI(result)
    } catch (error) {
      throw error
    }
  }

  // Actualizează o setare
  async updateSetting(id, settingData) {
    try {
      // Validare
      const validationResult = this.validateSetting(settingData, id)
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors.join(', '))
      }

      // Transformare pentru API
      const apiData = this.transformSettingForAPI(settingData)
      
      const result = await this.dataFacade.update('settings', id, apiData)
      
      return this.transformSettingForUI(result)
    } catch (error) {
      throw error
    }
  }

  // Șterge o setare
  async deleteSetting(id) {
    try {
      await this.dataFacade.delete('settings', id)
      return true
    } catch (error) {
      throw error
    }
  }

  // Salvează working hours
  async saveWorkingHours(workingHoursData) {
    try {
      // Structura corectă: settingType în data, nu la exterior
      const settingData = {
        data: {
          settingType: 'working-hours',
          name: 'Program de funcționare',
          isActive: true,
          ...workingHoursData
        }
      }

      // Verifică dacă există deja o setare pentru working-hours
      const existingSettings = await this.getWorkingHours()
      
      if (existingSettings) {
        return await this.updateSetting(existingSettings.id, settingData)
      } else {
        return await this.addSetting(settingData)
      }
    } catch (error) {
      throw error
    }
  }

  // Căutare setări
  async searchSettings(query, filters = {}) {
    try {
      const limit = filters.limit || 50
      const additionalFilters = { ...filters }
      delete additionalFilters.limit
      
      const settings = await this.dataFacade.searchWithFallback(
        'settings',
        'name',
        query,
        limit,
        async (searchTerm, fallbackFilters) => {
          try {
            const searchFilters = {
              ...fallbackFilters,
              search: searchTerm
            }
            const settings = await this.dataFacade.getAll('settings', searchFilters)
            return Array.isArray(settings) ? settings : []
          } catch (error) {
            return []
          }
        },
        additionalFilters
      )
      
      return this.transformSettingsForUI(settings)
    } catch (error) {
      return []
    }
  }

  // ========================================
  // VALIDATION & TRANSFORMATION
  // ========================================

  validateSetting(settingData, id = null) {
    const errors = []

    if (!settingData.settingType) {
      errors.push('Tipul setării este obligatoriu')
    }

    if (!settingData.name) {
      errors.push('Numele setării este obligatoriu')
    }

    if (!settingData.data) {
      errors.push('Datele setării sunt obligatorii')
    }

    // Validare specifică pentru working-hours
    if (settingData.settingType === 'working-hours') {
      if (!settingData.data.days || !Array.isArray(settingData.data.days)) {
        errors.push('Zilele de lucru sunt obligatorii pentru working-hours')
      }

      if (settingData.data.days) {
        settingData.data.days.forEach((day, index) => {
          if (!day.name) {
            errors.push(`Numele zilei ${index + 1} este obligatoriu`)
          }
          if (day.isWorking === undefined) {
            errors.push(`Statusul de lucru pentru ziua ${index + 1} este obligatoriu`)
          }
          if (day.isWorking && (!day.startTime || !day.endTime)) {
            errors.push(`Orele de lucru pentru ziua ${index + 1} sunt obligatorii`)
          }
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  transformSettingForAPI(settingData) {
    // Structura corectă: toate datele în câmpul data
    return {
      data: {
        settingType: settingData.settingType,
        name: settingData.name,
        isActive: settingData.isActive !== undefined ? settingData.isActive : true,
        description: settingData.description || '',
        metadata: settingData.metadata || {},
        ...settingData.data // Include datele specifice (working hours, etc.)
      }
    }
  }

  transformSettingForUI(settingData) {
    // Extrage datele din câmpul data pentru UI
    const data = settingData.data || {}
    return {
      id: settingData.id || settingData.resourceId,
      resourceId: settingData.resourceId || settingData.id,
      settingType: data.settingType,
      name: data.name,
      data: data,
      isActive: data.isActive,
      description: data.description,
      metadata: data.metadata,
      createdAt: settingData.createdAt,
      updatedAt: settingData.updatedAt,
      lastUpdated: settingData.lastUpdated,
      businessId: settingData.businessId,
      locationId: settingData.locationId,
      resourceType: settingData.resourceType
    }
  }

  transformSettingsForUI(settings) {
    return settings.map(setting => this.transformSettingForUI(setting))
  }

  // ========================================
  // DRAFT MANAGEMENT
  // ========================================

  async createSettingDraft(settingData, sessionId = null) {
    const validationResult = this.validateSetting(settingData)
    if (!validationResult.isValid) {
      throw new Error(validationResult.errors.join(', '))
    }

    const apiData = this.transformSettingForAPI(settingData)
    
    return await this.dataFacade.createDraft('settings', apiData, sessionId)
  }

  async updateSettingDraft(draftId, settingData) {
    const validationResult = this.validateSetting(settingData)
    if (!validationResult.isValid) {
      throw new Error(validationResult.errors.join(', '))
    }

    const apiData = this.transformSettingForAPI(settingData)
    
    return await this.dataFacade.updateDraft(draftId, apiData)
  }

  async commitSettingDraft(draftId) {
    return await this.dataFacade.commitDraft(draftId)
  }

  async cancelSettingDraft(draftId) {
    return await this.dataFacade.cancelDraft(draftId)
  }

  async getSettingDrafts(sessionId = null) {
    if (sessionId) {
      return await this.dataFacade.getDraftsBySession(sessionId)
    }
    return await this.dataFacade.getDraftsByResourceType('settings')
  }

  async getSettingsWithDrafts(params = {}) {
    try {
      const settings = await this.repository.queryWithDrafts(params)
      return this.transformSettingsForUI(settings)
    } catch (error) {
      return []
    }
  }
}

export const settingsService = new SettingsService()
