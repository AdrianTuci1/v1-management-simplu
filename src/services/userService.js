import { ResourceRepository } from '../data/repositories/ResourceRepository.js'
import { ResourceInvoker } from '../data/invoker/ResourceInvoker.js'
import { GetCommand } from '../data/commands/GetCommand.js'
import { AddCommand } from '../data/commands/AddCommand.js'
import { UpdateCommand } from '../data/commands/UpdateCommand.js'
import { DeleteCommand } from '../data/commands/DeleteCommand.js'
import { userManager } from '../business/userManager.js'

class UserService {
  constructor() {
    this.repository = new ResourceRepository('medic', 'users')
    this.invoker = new ResourceInvoker()
  }

  // Obține toți utilizatorii
  async getUsers(filters = {}) {
    try {
      const command = new GetCommand(this.repository, filters)
      const result = await this.invoker.run(command)
      
      // Extragem datele din răspunsul API
      let users = []
      if (result && result.data) {
        users = Array.isArray(result.data) ? result.data : []
      } else if (Array.isArray(result)) {
        users = result
      }
      
      return userManager.transformUsersForUI(users)
    } catch (error) {
      console.error('Error getting users from API, trying IndexedDB:', error)
      
      // Fallback la IndexedDB
      try {
        const { indexedDb } = await import('../data/infrastructure/db.js');
        const cachedUsers = await indexedDb.getAll('users');
        console.log(`Loaded ${cachedUsers.length} users from IndexedDB cache`);
        
        return userManager.transformUsersForUI(cachedUsers);
      } catch (cacheError) {
        console.error('Error loading users from IndexedDB:', cacheError);
        return [];
      }
    }
  }



  // Adaugă un utilizator nou
  async addUser(userData) {
    try {
      // Validare
      const validationResult = userManager.validateUser(userData)
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors.join(', '))
      }

      // Transformare pentru API
      const apiData = userManager.transformUserForAPI(userData)
      
      const command = new AddCommand(this.repository, apiData)
      const result = await this.invoker.run(command)
      
      return userManager.transformUserForUI(result)
    } catch (error) {
      console.error('Error adding user:', error)
      throw error
    }
  }

  // Actualizează un utilizator
  async updateUser(id, userData) {
    try {
      // Validare
      const validationResult = userManager.validateUser(userData, id)
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors.join(', '))
      }

      // Transformare pentru API
      const apiData = userManager.transformUserForAPI(userData)
      
      const command = new UpdateCommand(this.repository, id, apiData)
      const result = await this.invoker.run(command)
      
      return userManager.transformUserForUI(result)
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  // Șterge un utilizator
  async deleteUser(id) {
    try {
      const command = new DeleteCommand(this.repository, id)
      await this.invoker.run(command)
      return true
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  }

  // Căutare utilizatori
  async searchUsers(query, filters = {}) {
    try {
      const searchFilters = {
        ...filters,
        search: query
      }
      const command = new GetCommand(this.repository, searchFilters)
      const users = await this.invoker.run(command)
      // Asigură-te că rezultatul este întotdeauna un array
      console.log(users)
      const usersArray = Array.isArray(users) ? users : []
      return userManager.transformUsersForUI(usersArray)
    } catch (error) {
      console.error('Error searching users from API, trying IndexedDB:', error)
      
      // Fallback la IndexedDB
      try {
        const { indexedDb } = await import('../data/infrastructure/db.js');
        const cachedUsers = await indexedDb.searchUsers(query);
        console.log(`Found ${cachedUsers.length} users matching "${query}" from IndexedDB cache`);
        
        return userManager.transformUsersForUI(cachedUsers);
      } catch (cacheError) {
        console.error('Error searching users from IndexedDB:', cacheError);
        return [];
      }
    }
  }

  // Obține statistici despre utilizatori
  async getUserStats() {
    try {
      const users = await this.getUsers()
      return userManager.getUserStats(users)
    } catch (error) {
      console.error('Error getting user stats:', error)
      throw error
    }
  }

  // Export utilizatori
  async exportUsers(format = 'json') {
    try {
      const users = await this.getUsers()
      return userManager.exportUsers(users, format)
    } catch (error) {
      console.error('Error exporting users:', error)
      throw error
    }
  }
}

export const userService = new UserService()
