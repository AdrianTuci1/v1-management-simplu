import { db } from "../infrastructure/db";
import { buildResourcesEndpoint } from "../infrastructure/apiClient.js";

export class ResourceRepository {
  constructor(resourceType, store = "resources") {
    this.resourceType = resourceType;
    this.store = store;
  }

  async request(path = "", options = {}) {
    try {
      // Folosește buildResourcesEndpoint pentru a construi URL-ul corect
      const baseUrl = import.meta.env.VITE_API_URL || "";
      const resourcesEndpoint = buildResourcesEndpoint(path);
      const endpoint = baseUrl ? `${baseUrl}${resourcesEndpoint}` : resourcesEndpoint;
      
      const headers = {
        "X-Resource-Type": this.resourceType,
        "Content-Type": "application/json",
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
      
      if (validData.length > 0) {
        await db.table(this.store).bulkPut(validData);
      }
      
      return validData;
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
          resourceId: data.resourceId,
          timestamp: data.timestamp,
          lastUpdated: data.lastUpdated
        };
      }
      
      await db.table(this.store).put(transformedData);
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
      return {
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
    
    return data;
  }

  async add(resource) {
    const response = await this.request("", {
      method: "POST",
      body: JSON.stringify(resource),
    });
    
    // Extract data from API response structure
    let data = response;
    if (response && response.success && response.data) {
      data = response.data;
    } else if (response && response.data) {
      data = response.data;
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
    
    await db.table(this.store).put(data);
    return data;
  }

  async update(id, resource) {
    const response = await this.request(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(resource),
    });
    
    // Extract data from API response structure
    let data = response;
    if (response && response.success && response.data) {
      data = response.data;
    } else if (response && response.data) {
      data = response.data;
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
    
    await db.table(this.store).put(data);
    return data;
  }

  async remove(id) {
    await this.request(`/${id}`, { method: "DELETE" });
    await db.table(this.store).delete(id);
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
