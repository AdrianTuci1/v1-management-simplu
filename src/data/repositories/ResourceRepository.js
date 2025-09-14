import { db, indexedDb } from "../infrastructure/db";
import { buildResourcesEndpoint, apiRequest } from "../infrastructure/apiClient.js";
import { enqueue } from "../queue/offlineQueue";
import { applyOptimistic, makeTempId } from "../store/optimistic";
import { mapTempToPermId } from "../store/idMap";

export class ResourceRepository {
  constructor(resourceType, store = "resources") {
    this.resourceType = resourceType;
    this.store = store;
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
    try {
      const resourcesEndpoint = buildResourcesEndpoint(path);
      return await apiRequest(this.resourceType, resourcesEndpoint, options);
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async query(params) {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    const response = await this.request(query, { method: "GET" });
    
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
    const response = await this.request(`/${id}`, { method: "GET" });
    
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
