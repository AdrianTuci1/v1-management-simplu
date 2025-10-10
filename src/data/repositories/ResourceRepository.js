import { db, indexedDb } from "../infrastructure/db";
import { buildResourcesEndpoint, apiRequest } from "../infrastructure/apiClient.js";
import { enqueue } from "../queue/offlineQueue";
import { applyOptimistic, makeTempId } from "../store/optimistic";
import { healthRepository } from "./HealthRepository.js";

export class ResourceRepository {
  constructor(resourceType, store = "resources") {
    this.resourceType = resourceType;
    this.store = store;
  }

  // Check if we're using a demo token
  isDemoToken() {
    const authToken = localStorage.getItem('auth-token');
    return authToken === 'demo-jwt-token';
  }

  // Check if in demo mode
  isInDemoMode() {
    return import.meta.env.VITE_DEMO_MODE === 'true' || this.isDemoToken();
  }

  // Remove all optimistic entries for this store once real data arrives
  async clearOptimisticEntries() {
    try {
      const table = db.table(this.store)
      const optimistics = await table.filter(item => item && (item._isOptimistic === true || item._optimistic === true)).toArray()
      if (optimistics.length > 0) {
        const keys = optimistics
          .map(item => item.resourceId || item.id)
          .filter(Boolean)
        if (keys.length > 0) {
          await table.bulkDelete(keys)
        }
      }
    } catch (e) {
      console.warn(`Failed to clear optimistic entries for ${this.store}:`, e)
    }
  }

  async request(path = "", options = {}) {
    // Verifică dacă sistemul poate face cereri
    // Permite cererile dacă nu s-a făcut încă health check sau dacă este în demo mode
    const healthStatus = healthRepository.getCurrentStatus();
    const isDemoMode = this.isInDemoMode();
    
    // Blochează cererile doar dacă:
    // 1. Nu este în demo mode
    // 2. Health check-ul a fost executat (lastCheck există)
    // 3. Și sistemul confirmă că nu poate face cereri
    if (!isDemoMode && healthStatus.lastCheck && !healthStatus.canMakeRequests) {
      console.warn('System is offline or server is down. Request blocked.');
      throw new Error('System is offline or server is down');
    }

    try {
      const resourcesEndpoint = buildResourcesEndpoint(path);
      const response = await apiRequest(this.resourceType, resourcesEndpoint, options);
      
      // Dacă cererea a reușit, actualizează starea de sănătate la 'healthy'
      if (!isDemoMode) {
        // Notifică health repository că serverul răspunde
        healthRepository.markServerHealthy();
      }
      
      return response;
    } catch (error) {
      // In demo mode, API calls are expected to fail - don't log as error
      if (!isDemoMode) {
        console.error('API request failed:', error);
        // Notifică health repository că serverul nu răspunde
        healthRepository.markServerUnhealthy(error.message);
        
        // Dacă aceasta este prima cerere și a eșuat, blochează cererile ulterioare
        const healthStatus = healthRepository.getCurrentStatus();
        if (!healthStatus.lastCheck || healthStatus.lastCheck === null) {
          console.warn('First API request failed - blocking subsequent requests until server is healthy');
        }
      }
      throw error;
    }
  }

  async query(params) {
    const isDemoMode = this.isInDemoMode();

    // In demo mode, get data from IndexedDB instead of API
    if (isDemoMode) {
      console.log(`📦 Demo mode: Getting ${this.resourceType} data from IndexedDB`);
      try {
        const data = await db.table(this.store).toArray();
        console.log(`✅ Demo mode: Found ${data.length} ${this.resourceType} items in IndexedDB`);
        return data;
      } catch (error) {
        console.warn(`⚠️ Demo mode: Error getting ${this.resourceType} from IndexedDB:`, error);
        return [];
      }
    }

    // Offline fallback: if requests are blocked, read from IndexedDB
    try {
      const healthStatus = healthRepository.getCurrentStatus();
      if (healthStatus.lastCheck && !healthStatus.canMakeRequests) {
        const local = await db.table(this.store).toArray();
        return local;
      }
    } catch (_) {}

    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    let response;
    try {
      response = await this.request(query, { method: "GET" });
    } catch (error) {
      // Network/API error: fallback to local cache
      try {
        const local = await db.table(this.store).toArray();
        return local;
      } catch (_) {
        throw error;
      }
    }
    
    // Extract data from API response structure
    let data = response;
    if (response && response.success && Array.isArray(response.data)) {
      data = response.data;
    } else if (response && Array.isArray(response.data)) {
      data = response.data;
    }
    
    // Transform nested data structure to flat structure
    if (Array.isArray(data)) {
      const transformedData = data.map(item => {
        // If the item has a nested data property, merge it with the main item
        if (item && item.data && typeof item.data === 'object') {
          return {
            ...item.data,
            id: item.id || item.data.id,
            businessId: item.businessId,
            locationId: item.locationId,
            resourceType: item.resourceType,
            resourceId: item.resourceId,
            timestamp: item.timestamp,
            lastUpdated: item.lastUpdated
          };
        }
        return item;
      });
      
      const validData = transformedData.filter(item => {
        if (!item || !item.id) {
          console.warn('Item without ID found:', item);
          return false;
        }
        return true;
      });
      // Ensure resourceId fallback to id when missing
      const normalized = validData.map(item => ({
        ...item,
        resourceId: item.resourceId || item.id
      }))
      
      if (normalized.length > 0) {
        await db.table(this.store).bulkPut(normalized);
        // After receiving fresh data, clear any leftover optimistic entries for this store
        await this.clearOptimisticEntries()
      }
      
      return normalized;
    } else if (data && data.id) {
      // Handle single item
      let transformedData = data;
      if (data.data && typeof data.data === 'object') {
        transformedData = {
          ...data.data,
          id: data.id || data.data.id,
          businessId: data.businessId,
          locationId: data.locationId,
          resourceType: data.resourceType,
          resourceId: data.resourceId || data.id || data.data.id,
          timestamp: data.timestamp,
          lastUpdated: data.lastUpdated
        };
      }
      // Ensure resourceId exists
      transformedData = {
        ...transformedData,
        resourceId: transformedData.resourceId || transformedData.id
      }
      await db.table(this.store).put(transformedData);
      // Clear optimistic entries when a concrete item is received
      await this.clearOptimisticEntries()
      return transformedData;
    }
    
    return data;
  }

  async getById(id) {
    const isDemoMode = this.isInDemoMode();
    
    // In demo mode, get data from IndexedDB instead of API
    if (isDemoMode) {
      console.log(`Demo mode: Getting ${this.resourceType} with ID ${id} from IndexedDB`);
      try {
        const data = await db.table(this.store).get(id);
        console.log(`Demo mode: Found ${this.resourceType} item:`, data);
        return data;
      } catch (error) {
        console.warn(`Demo mode: Error getting ${this.resourceType} with ID ${id} from IndexedDB:`, error);
        return null;
      }
    }
    
    // Offline fallback: if requests are blocked, read from IndexedDB
    try {
      const healthStatus = healthRepository.getCurrentStatus();
      if (healthStatus.lastCheck && !healthStatus.canMakeRequests) {
        const local = await db.table(this.store).get(id);
        return local || null;
      }
    } catch (_) {}

    let response;
    try {
      response = await this.request(`/${id}`, { method: "GET" });
    } catch (error) {
      try {
        const local = await db.table(this.store).get(id);
        return local || null;
      } catch (_) {
        throw error;
      }
    }
    
    // Extract data from API response structure
    let data = response;
    if (response && response.success && response.data) {
      data = response.data;
    } else if (response && response.data) {
      data = response.data;
    }
    
    // Transform nested data structure to flat structure
    if (data && data.data && typeof data.data === 'object') {
      const normalized = {
        ...data.data,
        id: data.id || data.data.id,
        businessId: data.businessId,
        locationId: data.locationId,
        resourceType: data.resourceType,
        resourceId: data.resourceId || data.id || data.data.id,
        timestamp: data.timestamp,
        lastUpdated: data.lastUpdated
      };
      try { await db.table(this.store).put(normalized) } catch (_) {}
      await this.clearOptimisticEntries()
      return normalized;
    }
    
    return data;
  }

  async add(resource) {
    const isDemoMode = this.isInDemoMode();
    
    // In demo mode, add to IndexedDB directly
    if (isDemoMode) {
      console.log(`Demo mode: Adding ${this.resourceType} to IndexedDB`);
      try {
        const id = `${this.resourceType.toUpperCase()}${Date.now()}`;
        const newResource = {
          ...resource,
          id,
          resourceId: id,
          businessId: 'B0100001',
          locationId: 'L0100001',
          resourceType: this.resourceType,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await db.table(this.store).put(newResource);
        console.log(`Demo mode: Added ${this.resourceType} with ID ${id}`);
        return newResource;
      } catch (error) {
        console.error(`Demo mode: Error adding ${this.resourceType} to IndexedDB:`, error);
        throw error;
      }
    }
    
    // Trimite cererea dar tratează și cazul când serverul răspunde 201/202 fără body util
    try {
      const response = await this.request("", {
        method: "POST",
        body: JSON.stringify(resource),
      });
      
      // Dacă serverul a acceptat procesarea asincronă fără body util
      if (response && response.accepted === true) {
        const tempId = makeTempId(`${this.store}_`)
        const optimisticEntry = applyOptimistic({ ...resource, id: tempId, resourceId: tempId }, "create", tempId)
        await db.table(this.store).put(optimisticEntry)
        await indexedDb.outboxAdd({
          tempId,
          resourceType: this.store,
          operation: 'create',
          payload: resource,
          createdAt: Date.now(),
          status: 'pending'
        })
        await enqueue({ resourceType: this.store, action: "create", payload: resource, tempId })
        return optimisticEntry
      }

      // Extract data from API response structure
      let data = response;
      if (response && response.success && response.data) {
        data = response.data;
      } else if (response && response.data) {
        data = response.data;
      }
      
      // If server responded without a concrete payload/id, fallback to optimistic entry
      if (!data || (typeof data === 'object' && !data.id && !data.resourceId && !data.data)) {
        const tempId = makeTempId(`${this.store}_`)
        const optimisticEntry = applyOptimistic({ ...resource, id: tempId, resourceId: tempId }, "create", tempId)
        // Best-effort local cache; if it fails, just return optimistic entry
        try { await db.table(this.store).put(optimisticEntry) } catch (_) {}
        return optimisticEntry
      }
      
      // Transform nested data structure to flat structure
      if (data && data.data && typeof data.data === 'object') {
        data = {
          ...data.data,
          id: data.id || data.data.id,
          businessId: data.businessId,
          locationId: data.locationId,
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          timestamp: data.timestamp,
          lastUpdated: data.lastUpdated
        };
      }
      
      // Ensure resourceId exists and is a valid key
      const normalized = { ...data };
      if (!normalized.resourceId) {
        normalized.resourceId = normalized.id || generateTempId(this.store)
      }
      try {
        await db.table(this.store).put(normalized);
      } catch (e) {
        console.warn('Failed to persist newly added resource, continuing optimistically:', e)
      }
      return normalized;
    } catch (error) {
      // Dacă serverul a răspuns fără body util sau cererea e acceptată async, generăm un ID temporar
      const tempId = makeTempId(`${this.store}_`)
      const optimisticEntry = applyOptimistic({ ...resource, id: tempId, resourceId: tempId }, "create", tempId)
      // Salvează în store local
      await db.table(this.store).put(optimisticEntry)
      // Pune în outbox pentru reconciliere când vine evenimentul de pe websocket
      await indexedDb.outboxAdd({
        tempId,
        resourceType: this.store,
        operation: 'create',
        payload: resource,
        createdAt: Date.now(),
        status: 'pending'
      })
      await enqueue({ resourceType: this.store, action: "create", payload: resource, tempId })
      return optimisticEntry
    }
  }

  async update(id, resource) {
    const isDemoMode = this.isInDemoMode();
    
    // In demo mode, update IndexedDB directly
    if (isDemoMode) {
      console.log(`Demo mode: Updating ${this.resourceType} with ID ${id} in IndexedDB`);
      try {
        const existingResource = await db.table(this.store).get(id);
        if (!existingResource) {
          throw new Error(`Resource with ID ${id} not found`);
        }
        
        const updatedResource = {
          ...existingResource,
          ...resource,
          id,
          resourceId: id,
          updatedAt: new Date().toISOString()
        };
        await db.table(this.store).put(updatedResource);
        console.log(`Demo mode: Updated ${this.resourceType} with ID ${id}`);
        return updatedResource;
      } catch (error) {
        console.error(`Demo mode: Error updating ${this.resourceType} with ID ${id}:`, error);
        throw error;
      }
    }
    
    try {
      const response = await this.request(`/${id}`, {
        method: "PUT",
        body: JSON.stringify(resource),
      });
      
      if (response && response.accepted === true) {
        const tempId = makeTempId(`${this.store}_`)
        const optimisticEntry = applyOptimistic({ ...resource, id, resourceId: id }, "update", tempId)
        await db.table(this.store).put(optimisticEntry)
        await indexedDb.outboxAdd({
          tempId,
          resourceType: this.store,
          operation: 'update',
          targetId: id,
          payload: resource,
          createdAt: Date.now(),
          status: 'pending'
        })
        await enqueue({ resourceType: this.store, action: "update", payload: resource, targetId: id, tempId })
        return optimisticEntry
      }

      // Extract data from API response structure
      let data = response;
      if (response && response.success && response.data) {
        data = response.data;
      } else if (response && response.data) {
        data = response.data;
      }
      
      // If server responded without a concrete payload/id, fallback to optimistic update
      if (!data || (typeof data === 'object' && !data.id && !data.resourceId && !data.data)) {
        const tempId = makeTempId(`${this.store}_`)
        const optimisticEntry = applyOptimistic({ ...resource, id, resourceId: id }, "update", tempId)
        try { await db.table(this.store).put(optimisticEntry) } catch (_) {}
        return optimisticEntry
      }
      
      // Transform nested data structure to flat structure
      if (data && data.data && typeof data.data === 'object') {
        data = {
          ...data.data,
          id: data.id || data.data.id,
          businessId: data.businessId,
          locationId: data.locationId,
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          timestamp: data.timestamp,
          lastUpdated: data.lastUpdated
        };
      }
      
      const normalized = { ...data };
      if (!normalized.resourceId) {
        normalized.resourceId = normalized.id || id || generateTempId(this.store)
      }
      try {
        await db.table(this.store).put(normalized);
      } catch (e) {
        console.warn('Failed to persist updated resource, continuing optimistically:', e)
      }
      return normalized;
    } catch (error) {
      // Optimistic local update with temp operation
      const tempId = makeTempId(`${this.store}_`)
      const optimisticEntry = applyOptimistic({ ...resource, id, resourceId: id }, "update", tempId)
      await db.table(this.store).put(optimisticEntry)
      await indexedDb.outboxAdd({
        tempId,
        resourceType: this.store,
        operation: 'update',
        targetId: id,
        payload: resource,
        createdAt: Date.now(),
        status: 'pending'
      })
      await enqueue({ resourceType: this.store, action: "update", payload: resource, targetId: id, tempId })
      return optimisticEntry
    }
  }

  async remove(id) {
    const isDemoMode = this.isInDemoMode();
    
    // In demo mode, delete from IndexedDB directly
    if (isDemoMode) {
      console.log(`Demo mode: Deleting ${this.resourceType} with ID ${id} from IndexedDB`);
      try {
        await db.table(this.store).delete(id);
        console.log(`Demo mode: Deleted ${this.resourceType} with ID ${id}`);
        return true;
      } catch (error) {
        console.error(`Demo mode: Error deleting ${this.resourceType} with ID ${id}:`, error);
        throw error;
      }
    }
    
    try {
      const response = await this.request(`/${id}`, { method: "DELETE" });
      if (response && response.accepted === true) {
        const tempId = makeTempId(`${this.store}_`)
        await db.table(this.store).put({ id, resourceId: id, _deleted: true, _isOptimistic: true, _tempId: tempId })
        await indexedDb.outboxAdd({
          tempId,
          resourceType: this.store,
          operation: 'delete',
          targetId: id,
          createdAt: Date.now(),
          status: 'pending'
        })
        await enqueue({ resourceType: this.store, action: "delete", targetId: id, tempId })
        return true
      }
      await db.table(this.store).delete(id);
    } catch (error) {
      const tempId = makeTempId(`${this.store}_`)
      await db.table(this.store).put({ id, resourceId: id, _deleted: true, _isOptimistic: true, _tempId: tempId })
      await indexedDb.outboxAdd({
        tempId,
        resourceType: this.store,
        operation: 'delete',
        targetId: id,
        createdAt: Date.now(),
        status: 'pending'
      })
      await enqueue({ resourceType: this.store, action: "delete", targetId: id, tempId })
      return true
    }
  }

  async syncFromEvent(event) {
    const store = db.table(this.store);
    switch (event.type) {
      case "create":
      case "update":
        await store.put(event.data);
        break;
      case "delete":
        await store.delete(event.id);
        break;
    }
  }
}
