import { db } from "../infrastructure/db";
import { apiRequest, buildResourcesEndpoint } from "../infrastructure/apiClient.js";

export class ResourceRepository {
  constructor(resourceType, store = "resources") {
    this.resourceType = resourceType;
    this.store = store;
  }

  async request(path = "", options = {}) {
    try {
      const endpoint = buildResourcesEndpoint(path);
      return await apiRequest(this.resourceType, endpoint, options);
    } catch (error) {
      // Dacă buildResourcesEndpoint eșuează, încercă cu endpoint-ul simplu
      console.warn('Failed to build resources endpoint, trying simple endpoint:', error.message);
      const res = await fetch(`/api/resources${path}`, {
        ...options,
        headers: {
          "X-Resource-Type": this.resourceType,
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      return res.json();
    }
  }

  async query(params) {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    const data = await this.request(query, { method: "GET" });
    await db.table(this.store).bulkPut(data);
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
