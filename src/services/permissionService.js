import { ResourceRepository } from '../data/repositories/ResourceRepository.js'
import { ResourceInvoker } from '../data/invoker/ResourceInvoker.js'
import { GetCommand } from '../data/commands/GetCommand.js'
import { AddCommand } from '../data/commands/AddCommand.js'
import { UpdateCommand } from '../data/commands/UpdateCommand.js'
import { DeleteCommand } from '../data/commands/DeleteCommand.js'
import { permissionManager } from '../business/permissionManager.js'

class PermissionService {
  constructor() {
    this.repository = new ResourceRepository('permissions', 'permissions')
    this.invoker = new ResourceInvoker()
  }

  // Obține toate permisiunile
  async getPermissions(filters = {}) {
    try {
      const command = new GetCommand(this.repository, filters)
      const permissions = await this.invoker.run(command)

            // Asigură-te că rezultatul este întotdeauna un array
            const permissionsArray = Array.isArray(permissions) ? permissions : [];
      
            // Transformă datele pentru UI
            return permissionsArray.map(permission => permissionManager.transformPermissionForUI(permission));

    } catch (error) {
      console.error('Error getting permissions:', error)
      throw error
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
      
      const command = new AddCommand(this.repository, apiData)
      const result = await this.invoker.run(command)
      
      return permissionManager.transformPermissionForUI(result)
    } catch (error) {
      console.error('Error adding permission:', error)
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
      
      const command = new UpdateCommand(this.repository, id, apiData)
      const result = await this.invoker.run(command)
      
      return permissionManager.transformPermissionForUI(result)
    } catch (error) {
      console.error('Error updating permission:', error)
      throw error
    }
  }

  // Șterge o permisiune
  async deletePermission(id) {
    try {
      const command = new DeleteCommand(this.repository, id)
      await this.invoker.run(command)
      return true
    } catch (error) {
      console.error('Error deleting permission:', error)
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
      console.error('Error searching permissions:', error)
      throw error
    }
  }

  // Obține statistici despre permisiuni
  async getPermissionStats() {
    try {
      const permissions = await this.getPermissions()
      return permissionManager.getPermissionStats(permissions)
    } catch (error) {
      console.error('Error getting permission stats:', error)
      throw error
    }
  }

  // Export permisiuni
  async exportPermissions(format = 'json') {
    try {
      const permissions = await this.getPermissions()
      return permissionManager.exportPermissions(permissions, format)
    } catch (error) {
      console.error('Error exporting permissions:', error)
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
      console.error('Error getting permission by ID:', error)
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
      console.error('Error getting permissions by resource:', error)
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
      console.error('Error getting permissions by action:', error)
      throw error
    }
  }

  // Obține toate resursele disponibile
  async getAvailableResources() {
    try {
      const permissions = await this.getPermissions()
      return permissionManager.getAvailableResources(permissions)
    } catch (error) {
      console.error('Error getting available resources:', error)
      throw error
    }
  }

  // Obține toate acțiunile disponibile
  async getAvailableActions() {
    try {
      const permissions = await this.getPermissions()
      return permissionManager.getAvailableActions(permissions)
    } catch (error) {
      console.error('Error getting available actions:', error)
      throw error
    }
  }

  // Verifică dacă o permisiune există
  async hasPermission(userPermissions, resource, action) {
    try {
      return permissionManager.hasPermission(userPermissions, resource, action)
    } catch (error) {
      console.error('Error checking permission:', error)
      throw error
    }
  }

  // Obține permisiunile pentru o resursă
  async getPermissionsForResource(permissions, resource) {
    try {
      return permissionManager.getPermissionsForResource(permissions, resource)
    } catch (error) {
      console.error('Error getting permissions for resource:', error)
      throw error
    }
  }
}

export const permissionService = new PermissionService()
