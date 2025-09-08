import { db, indexedDb } from "../infrastructure/db";
import { buildResourcesEndpoint } from "../infrastructure/apiClient.js";
import { generateTempId } from "../../lib/utils";

export class ResourceRepository {
  constructor(resourceType, store = "resources") {
    this.resourceType = resourceType;
    this.store = store;
  }

  // Remove all optimistic entries for this store once real data arrives
  async clearOptimisticEntries() {
    try {
      const table = db.table(this.store)
      const optimistics = await table.filter(item => item && item._isOptimistic === true).toArray()
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
      // Folosește buildResourcesEndpoint pentru a construi URL-ul corect
      const baseUrl = import.meta.env.VITE_API_URL || "";
      const resourcesEndpoint = buildResourcesEndpoint(path);
      const endpoint = baseUrl ? `${baseUrl}${resourcesEndpoint}` : resourcesEndpoint;

      const authToken = localStorage.getItem('auth-token');

      const headers = {
        "X-Resource-Type": this.resourceType,
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`,
        ...(options.headers || {}),
      };
      
      console.log('Making API request:', {
        url: endpoint,
        method: options.method || 'GET',
        resourceType: this.resourceType,
        headers: headers,
        body: options.body
      });
      
      const res = await fetch(endpoint, {
        ...options,
        headers,
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      // Încercăm să detectăm conținutul răspunsului
      const contentType = res.headers.get('content-type') || '';
      const contentLength = res.headers.get('content-length');

      // Dacă răspunsul nu este JSON sau body-ul e gol, întoarcem un obiect cu accepted
      if (!contentType.includes('application/json') || contentLength === '0' || res.status === 201 || res.status === 202) {
        try {
          // Unele servere trimit JSON chiar și pe 201/202
          const maybeJson = await res.json();
          return maybeJson;
        } catch (_) {
          return { accepted: res.status === 201 || res.status === 202, status: res.status };
        }
      }

      return res.json();
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
        const tempId = generateTempId(this.store)
        const nowIso = new Date().toISOString()
        const optimisticEntry = {
          ...resource,
          id: tempId,
          resourceId: tempId,
          _isOptimistic: true,
          _tempId: tempId,
          _createdAt: nowIso
        }
        await db.table(this.store).put(optimisticEntry)
        await indexedDb.outboxAdd({
          tempId,
          resourceType: this.store,
          operation: 'create',
          payload: resource,
          createdAt: Date.now(),
          status: 'pending'
        })
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
        const tempId = generateTempId(this.store)
        const nowIso = new Date().toISOString()
        const optimisticEntry = {
          ...resource,
          id: tempId,
          resourceId: tempId,
          _isOptimistic: true,
          _tempId: tempId,
          _createdAt: nowIso
        }
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
      const tempId = generateTempId(this.store)
      const nowIso = new Date().toISOString()
      const optimisticEntry = {
        ...resource,
        id: tempId,
        resourceId: tempId,
        _isOptimistic: true,
        _tempId: tempId,
        _createdAt: nowIso
      }
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
        const tempId = generateTempId(this.store)
        const nowIso = new Date().toISOString()
        const optimisticEntry = {
          ...resource,
          id,
          resourceId: id,
          _isOptimistic: true,
          _tempId: tempId,
          _updatedAt: nowIso
        }
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
        const tempId = generateTempId(this.store)
        const nowIso = new Date().toISOString()
        const optimisticEntry = {
          ...resource,
          id,
          resourceId: id,
          _isOptimistic: true,
          _tempId: tempId,
          _updatedAt: nowIso
        }
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
      const tempId = generateTempId(this.store)
      const nowIso = new Date().toISOString()
      const optimisticEntry = {
        ...resource,
        id,
        resourceId: id,
        _isOptimistic: true,
        _tempId: tempId,
        _updatedAt: nowIso
      }
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
      return optimisticEntry
    }
  }

  async remove(id) {
    try {
      const response = await this.request(`/${id}`, { method: "DELETE" });
      if (response && response.accepted === true) {
        const tempId = generateTempId(this.store)
        await db.table(this.store).put({ id, resourceId: id, _deleted: true, _isOptimistic: true, _tempId: tempId })
        await indexedDb.outboxAdd({
          tempId,
          resourceType: this.store,
          operation: 'delete',
          targetId: id,
          createdAt: Date.now(),
          status: 'pending'
        })
        return true
      }
      await db.table(this.store).delete(id);
    } catch (error) {
      const tempId = generateTempId(this.store)
      await db.table(this.store).put({ id, resourceId: id, _deleted: true, _isOptimistic: true, _tempId: tempId })
      await indexedDb.outboxAdd({
        tempId,
        resourceType: this.store,
        operation: 'delete',
        targetId: id,
        createdAt: Date.now(),
        status: 'pending'
      })
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
