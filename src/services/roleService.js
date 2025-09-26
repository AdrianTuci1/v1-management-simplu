import { dataFacade } from '../data/DataFacade.js'
import { DraftAwareResourceRepository } from '../data/repositories/DraftAwareResourceRepository.js'
import { roleManager } from '../business/roleManager.js'

class RoleService {
  constructor() {
    this.repository = new DraftAwareResourceRepository('roles', 'role')
    this.dataFacade = dataFacade
  }

  // Obține toate rolurile
  async getRoles(filters = {}) {
    try {
      const roles = await this.dataFacade.getAll('roles', filters)
      
      // Transformă datele pentru UI
      return roles.map(role => roleManager.transformRoleForUI(role));
    } catch (error) {
      console.error('Error getting roles:', error)
      return []
    }
  }

  // Adaugă un rol nou
  async addRole(roleData) {
    try {
      // Validare
      const validationResult = roleManager.validateRole(roleData)
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors.join(', '))
      }

      // Transformare pentru API
      const apiData = roleManager.transformRoleForAPI(roleData)
      
      const result = await this.dataFacade.create('roles', apiData)
      
      return roleManager.transformRoleForUI(result)
    } catch (error) {
      console.error('Error adding role:', error)
      throw error
    }
  }

  // Actualizează un rol
  async updateRole(id, roleData) {
    try {
      // Validare
      const validationResult = roleManager.validateRole(roleData, id)
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors.join(', '))
      }

      // Transformare pentru API
      const apiData = roleManager.transformRoleForAPI(roleData)
      
      const result = await this.dataFacade.update('roles', id, apiData)
      
      return roleManager.transformRoleForUI(result)
    } catch (error) {
      console.error('Error updating role:', error)
      throw error
    }
  }

  // Șterge un rol
  async deleteRole(id) {
    try {
      await this.dataFacade.delete('roles', id)
      return true
    } catch (error) {
      console.error('Error deleting role:', error)
      throw error
    }
  }

  // Căutare roluri
  async searchRoles(query, filters = {}) {
    try {
      const searchFilters = {
        ...filters,
        search: query
      }
      const command = new GetCommand(this.repository, searchFilters)
      const roles = await this.invoker.run(command)
      return roles.map(role => roleManager.transformRoleForUI(role))
    } catch (error) {
      console.error('Error searching roles from API, trying IndexedDB:', error)
      
      // Fallback la IndexedDB
      try {
        const { indexedDb } = await import('../data/infrastructure/db.js');
        const cachedRoles = await indexedDb.searchRoles(query);
        console.log(`Found ${cachedRoles.length} roles matching "${query}" from IndexedDB cache`);
        
        return cachedRoles.map(role => roleManager.transformRoleForUI(role));
      } catch (cacheError) {
        console.error('Error searching roles from IndexedDB:', cacheError);
        return [];
      }
    }
  }

  // Obține statistici despre roluri
  async getRoleStats() {
    try {
      const roles = await this.getRoles()
      return roleManager.getRoleStats(roles)
    } catch (error) {
      console.error('Error getting role stats:', error)
      throw error
    }
  }

  // Export roluri
  async exportRoles(format = 'json') {
    try {
      const roles = await this.getRoles()
      return roleManager.exportRoles(roles, format)
    } catch (error) {
      console.error('Error exporting roles:', error)
      throw error
    }
  }

  // Obține un rol după ID
  async getRoleById(id) {
    try {
      const command = new GetCommand(this.repository, { id })
      const roles = await this.invoker.run(command)
      if (roles.length > 0) {
        return roleManager.transformRoleForUI(roles[0])
      }
      return null
    } catch (error) {
      console.error('Error getting role by ID:', error)
      throw error
    }
  }

  // Obține roluri după status
  async getRolesByStatus(status) {
    try {
      const command = new GetCommand(this.repository, { status })
      const roles = await this.invoker.run(command)
      return roles.map(role => roleManager.transformRoleForUI(role))
    } catch (error) {
      console.error('Error getting roles by status from API, trying IndexedDB:', error)
      
      // Fallback la IndexedDB
      try {
        const { indexedDb } = await import('../data/infrastructure/db.js');
        const cachedRoles = await indexedDb.getRolesByStatus(status);
        console.log(`Found ${cachedRoles.length} roles with status "${status}" from IndexedDB cache`);
        
        return cachedRoles.map(role => roleManager.transformRoleForUI(role));
      } catch (cacheError) {
        console.error('Error getting roles by status from IndexedDB:', cacheError);
        return [];
      }
    }
  }
}

export const roleService = new RoleService()
