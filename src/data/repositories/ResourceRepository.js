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
    const data = await this.request(query, { method: "GET" });
    
    // Verifică și asigură-te că toate datele au ID-uri valide
    if (Array.isArray(data)) {
      const validData = data.filter(item => {
        if (!item || !item.id) {
          console.warn('Item without ID found:', item);
          return false;
        }
        return true;
      });
      
      if (validData.length > 0) {
        await db.table(this.store).bulkPut(validData);
      }
    } else if (data && data.id) {
      await db.table(this.store).put(data);
    }
    
    return data;
  }

  async getById(id) {
    return this.request(`/${id}`, { method: "GET" });
  }

  async add(resource) {
    const data = await this.request("", {
      method: "POST",
      body: JSON.stringify(resource),
    });
    await db.table(this.store).put(data);
    return data;
  }

  async update(id, resource) {
    const data = await this.request(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(resource),
    });
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
