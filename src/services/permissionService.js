import { dataFacade } from '../data/DataFacade.js'
import { DraftAwareResourceRepository } from '../data/repositories/DraftAwareResourceRepository.js'
import { permissionManager } from '../business/permissionManager.js'

class PermissionService {
  constructor() {
    this.repository = new DraftAwareResourceRepository('permissions', 'permission')
    this.dataFacade = dataFacade
  }

  // Obține toate permisiunile
  async getPermissions(filters = {}) {
    try {
      const permissions = await this.dataFacade.getAll('permission', filters)
      
      // Transformă datele pentru UI
      return permissions.map(permission => permissionManager.transformPermissionForUI(permission));
    } catch (error) {
      return []
    }
  }

  // Adaugă o permisiune nouă
  async addPermission(permissionData) {
    try {
      // Validare
      const validationResult = permissionManager.validatePermission(permissionData)
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors.join(', '))
      }

      // Transformare pentru API
      const apiData = permissionManager.transformPermissionForAPI(permissionData)
      
      const result = await this.dataFacade.create('permission', apiData)
      
      return permissionManager.transformPermissionForUI(result)
    } catch (error) {
      throw error
    }
  }

  // Actualizează o permisiune
  async updatePermission(id, permissionData) {
    try {
      // Validare
      const validationResult = permissionManager.validatePermission(permissionData, id)
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors.join(', '))
      }

      // Transformare pentru API
      const apiData = permissionManager.transformPermissionForAPI(permissionData)
      
      const result = await this.dataFacade.update('permission', id, apiData)
      
      return permissionManager.transformPermissionForUI(result)
    } catch (error) {
      throw error
    }
  }

  // Șterge o permisiune
  async deletePermission(id) {
    try {
      await this.dataFacade.delete('permission', id)
      return true
    } catch (error) {
      throw error
    }
  }

  // Căutare permisiuni
  async searchPermissions(query, filters = {}) {
    try {
      const searchFilters = {
        ...filters,
        search: query
      }
      const command = new GetCommand(this.repository, searchFilters)
      const permissions = await this.invoker.run(command)
      return permissions.map(permission => permissionManager.transformPermissionForUI(permission))
    } catch (error) {
      throw error
    }
  }

  // Obține statistici despre permisiuni
  async getPermissionStats() {
    try {
      const permissions = await this.getPermissions()
      return permissionManager.getPermissionStats(permissions)
    } catch (error) {
      throw error
    }
  }

  // Export permisiuni
  async exportPermissions(format = 'json') {
    try {
      const permissions = await this.getPermissions()
      return permissionManager.exportPermissions(permissions, format)
    } catch (error) {
      throw error
    }
  }

  // Obține o permisiune după ID
  async getPermissionById(id) {
    try {
      const command = new GetCommand(this.repository, { id })
      const permissions = await this.invoker.run(command)
      if (permissions.length > 0) {
        return permissionManager.transformPermissionForUI(permissions[0])
      }
      return null
    } catch (error) {
      throw error
    }
  }

  // Obține permisiuni după resursă
  async getPermissionsByResource(resource) {
    try {
      const command = new GetCommand(this.repository, { resource })
      const permissions = await this.invoker.run(command)
      return permissions.map(permission => permissionManager.transformPermissionForUI(permission))
    } catch (error) {
      throw error
    }
  }

  // Obține permisiuni după acțiune
  async getPermissionsByAction(action) {
    try {
      const command = new GetCommand(this.repository, { action })
      const permissions = await this.invoker.run(command)
      return permissions.map(permission => permissionManager.transformPermissionForUI(permission))
    } catch (error) {
      throw error
    }
  }

  // Obține toate resursele disponibile
  async getAvailableResources() {
    try {
      const permissions = await this.getPermissions()
      return permissionManager.getAvailableResources(permissions)
    } catch (error) {
      throw error
    }
  }

  // Obține toate acțiunile disponibile
  async getAvailableActions() {
    try {
      const permissions = await this.getPermissions()
      return permissionManager.getAvailableActions(permissions)
    } catch (error) {
      throw error
    }
  }

  // Verifică dacă o permisiune există
  async hasPermission(userPermissions, resource, action) {
    try {
      return permissionManager.hasPermission(userPermissions, resource, action)
    } catch (error) {
      throw error
    }
  }

  // Obține permisiunile pentru o resursă
  async getPermissionsForResource(permissions, resource) {
    try {
      return permissionManager.getPermissionsForResource(permissions, resource)
    } catch (error) {
      throw error
    }
  }
}

export const permissionService = new PermissionService()
