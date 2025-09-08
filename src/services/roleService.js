import { ResourceRepository } from '../data/repositories/ResourceRepository.js'
import { ResourceInvoker } from '../data/invoker/ResourceInvoker.js'
import { GetCommand } from '../data/commands/GetCommand.js'
import { AddCommand } from '../data/commands/AddCommand.js'
import { UpdateCommand } from '../data/commands/UpdateCommand.js'
import { DeleteCommand } from '../data/commands/DeleteCommand.js'
import { roleManager } from '../business/roleManager.js'

class RoleService {
  constructor() {
    this.repository = new ResourceRepository('role', 'role')
    this.invoker = new ResourceInvoker()
  }

  // Obține toate rolurile
  async getRoles(filters = {}) {
    try {
      const command = new GetCommand(this.repository, filters)
      const roles = await this.invoker.run(command)
      
            // Asigură-te că rezultatul este întotdeauna un array
            const rolesArray = Array.isArray(roles) ? roles : [];
      
                  // Transformă datele pentru UI
      return rolesArray.map(role => roleManager.transformRoleForUI(role));
    } catch (error) {
      console.error('Error getting roles:', error)
      throw error
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
      
      const command = new AddCommand(this.repository, apiData)
      const result = await this.invoker.run(command)
      
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
      
      const command = new UpdateCommand(this.repository, id, apiData)
      const result = await this.invoker.run(command)
      
      return roleManager.transformRoleForUI(result)
    } catch (error) {
      console.error('Error updating role:', error)
      throw error
    }
  }

  // Șterge un rol
  async deleteRole(id) {
    try {
      const command = new DeleteCommand(this.repository, id)
      await this.invoker.run(command)
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
      console.error('Error searching roles:', error)
      throw error
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
      console.error('Error getting roles by status:', error)
      throw error
    }
  }
}

export const roleService = new RoleService()
