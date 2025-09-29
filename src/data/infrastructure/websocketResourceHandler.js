import { db } from "./db";
import { clearOptimistic } from "../store/optimistic";
import { mapTempToPermId } from "../store/idMap";
import { runRetention } from "../policies/retention";
import { dataFacade } from "../DataFacade.js";

/**
 * Enhanced WebSocket Resource Handler
 * Handles resource operations from AI Agent Server and broadcasts results back
 */
export class WebSocketResourceHandler {
  constructor() {
    this.facade = dataFacade;
    this.activeConnections = new Map();
  }

  /**
   * Handle resource events from WebSocket
   * @param {Object} ev - Event data
   */
  async handleResourceEvent(ev) {
    const { type, resourceType, data, id, clientId, tempId } = normalizeEvent(ev);
    const store = db.table(resourceType);

    switch (type) {
      case "create":
        if (clientId) {
          await mapTempToPermId(resourceType, clientId, data.id || id);
        } else if (tempId) {
          await mapTempToPermId(resourceType, tempId, data.id || id);
        } else {
          await store.put(clearOptimistic(data));
        }
        break;
      case "update":
        await store.put(clearOptimistic(data));
        break;
      case "delete":
        await store.delete(id || data?.id);
        break;
      default:
        break;
    }

    await runRetention();
  }

  /**
   * Handle draft operations from AI Agent Server
   * @param {string} tenantId - Business ID
   * @param {Object} draftData - Draft operation data
   * @returns {Promise<Object>} Result of the operation
   */
  async handleDraftOperation(tenantId, draftData) {
    try {
      console.log("=== HANDLING DRAFT OPERATION ===");
      console.log("Tenant ID:", tenantId);
      console.log("Draft data:", draftData);

      // Extract draft operation details
      const operationType = draftData.type;
      const draftInfo = draftData.draftData;

      console.log("Operation type:", operationType);
      console.log("Draft info:", draftInfo);

      // Create draft using DataFacade
      let result;
      switch (operationType) {
        case "create_draft":
          result = await this.facade.createDraft(
            draftInfo.resourceType,
            draftInfo.data,
            draftData.sessionId
          );
          break;
        case "update_draft":
          result = await this.facade.updateDraft(
            draftInfo.draftId,
            draftInfo.data
          );
          break;
        case "commit_draft":
          result = await this.facade.commitDraft(draftInfo.draftId);
          break;
        case "cancel_draft":
          result = await this.facade.cancelDraft(draftInfo.draftId);
          break;
        default:
          throw new Error(`Unknown draft operation: ${operationType}`);
      }

      // Broadcast draft operation to WebSocket clients
      const channelTopic = `messages:${tenantId}`;
      const broadcastPayload = {
        messageId: this.generateMessageId(),
        message: `Draft operation: ${operationType}`,
        timestamp: draftInfo.timestamp || new Date().toISOString(),
        sessionId: draftData.sessionId,
        businessId: tenantId,
        locationId: draftInfo.locationId || "default",
        userId: draftData.userId || "system",
        type: operationType,
        draftData: draftInfo,
        result: result
      };

      console.log("Broadcasting draft operation:", broadcastPayload);

      // Broadcast to WebSocket channel
      await this.broadcastToChannel(channelTopic, operationType, broadcastPayload);

      console.log(`Successfully broadcasted draft operation to channel: ${channelTopic}`);
      return { success: true, data: broadcastPayload };

    } catch (error) {
      console.error("Error handling draft operation:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle resource queries from AI Agent Server
   * @param {string} businessId - Business ID
   * @param {string} sessionId - Session ID
   * @param {string} requestType - Type of request
   * @param {Object} parameters - Query parameters
   * @returns {Promise<Object>} Query results
   */
  async handleResourceQuery(businessId, sessionId, requestType, parameters = {}) {
    try {
      console.log("=== HANDLING RESOURCE QUERY ===");
      console.log("Business ID:", businessId);
      console.log("Session ID:", sessionId);
      console.log("Request type:", requestType);
      console.log("Parameters:", parameters);

      let results = [];

      // Handle different request types
      switch (requestType) {
        case "get_all_resources":
          results = await this.getAllResources(parameters.resourceType, parameters);
          break;
        case "get_resource_by_id":
          results = await this.getResourceById(parameters.resourceType, parameters.id);
          break;
        case "search_resources":
          results = await this.searchResources(parameters.resourceType, parameters.query, parameters);
          break;
        case "get_drafts":
          results = await this.getDrafts(parameters.resourceType, sessionId);
          break;
        default:
          throw new Error(`Unknown request type: ${requestType}`);
      }

      // Broadcast query results back to agent server
      const channelTopic = `messages:${businessId}`;
      const broadcastPayload = {
        messageId: this.generateMessageId(),
        message: `Resource query results: ${requestType}`,
        timestamp: new Date().toISOString(),
        sessionId: sessionId,
        businessId: businessId,
        userId: "ai-agent",
        type: "resource_query_response",
        requestData: {
          requestType: requestType,
          parameters: parameters,
          timestamp: new Date().toISOString()
        },
        results: results
      };

      console.log("Broadcasting resource query results:", broadcastPayload);

      // Broadcast to WebSocket channel
      await this.broadcastToChannel(channelTopic, "resource_query_response", broadcastPayload);

      console.log(`Successfully broadcasted resource query results to channel: ${channelTopic}`);
      return { success: true, data: broadcastPayload };

    } catch (error) {
      console.error("Error handling resource query:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all resources of a specific type
   * @param {string} resourceType - Type of resource
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} Array of resources
   */
  async getAllResources(resourceType, params = {}) {
    try {
      const repository = this.facade.getRepository(resourceType);
      return await repository.query(params);
    } catch (error) {
      console.error(`Error getting all ${resourceType} resources:`, error);
      throw error; // Re-throw the error so it can be caught by the calling method
    }
  }

  /**
   * Get a specific resource by ID
   * @param {string} resourceType - Type of resource
   * @param {string} id - Resource ID
   * @returns {Promise<Object|null>} Resource or null
   */
  async getResourceById(resourceType, id) {
    try {
      const repository = this.facade.getRepository(resourceType);
      return await repository.getById(id);
    } catch (error) {
      console.error(`Error getting ${resourceType} resource by ID ${id}:`, error);
      throw error; // Re-throw the error so it can be caught by the calling method
    }
  }

  /**
   * Search resources with query
   * @param {string} resourceType - Type of resource
   * @param {string} query - Search query
   * @param {Object} params - Additional parameters
   * @returns {Promise<Array>} Search results
   */
  async searchResources(resourceType, query, params = {}) {
    try {
      const repository = this.facade.getRepository(resourceType);
      // Add search query to parameters
      const searchParams = { ...params, search: query };
      return await repository.query(searchParams);
    } catch (error) {
      console.error(`Error searching ${resourceType} resources:`, error);
      throw error; // Re-throw the error so it can be caught by the calling method
    }
  }

  /**
   * Get drafts for a resource type and session
   * @param {string} resourceType - Type of resource
   * @param {string} sessionId - Session ID
   * @returns {Promise<Array>} Array of drafts
   */
  async getDrafts(resourceType, sessionId) {
    try {
      if (sessionId) {
        return await this.facade.getDraftsBySession(sessionId);
      } else {
        return await this.facade.getDraftsByResourceType(resourceType);
      }
    } catch (error) {
      console.error(`Error getting drafts for ${resourceType}:`, error);
      throw error; // Re-throw the error so it can be caught by the calling method
    }
  }

  /**
   * Request frontend data via WebSocket
   * @param {string} businessId - Business ID
   * @param {string} sessionId - Session ID
   * @param {string} requestType - Type of request
   * @param {Object} parameters - Request parameters
   * @returns {Promise<Object>} Request result
   */
  async requestFrontendDataViaWebSocket(businessId, sessionId, requestType, parameters = {}) {
    try {
      console.log("Requesting frontend data via WebSocket");
      console.log("Business ID:", businessId);
      console.log("Session ID:", sessionId);
      console.log("Request type:", requestType);

      // Create channel topic for the business
      const channelTopic = `messages:${businessId}`;

      // Create request payload
      const requestPayload = {
        messageId: this.generateMessageId(),
        message: `AI Agent requesting frontend data: ${requestType}`,
        timestamp: new Date().toISOString(),
        sessionId: sessionId,
        businessId: businessId,
        userId: "ai-agent",
        type: "frontend_data_request",
        requestData: {
          requestType: requestType,
          parameters: parameters,
          timestamp: new Date().toISOString()
        }
      };

      console.log("Broadcasting frontend data request:", requestPayload);

      // Broadcast request to WebSocket channel
      await this.broadcastToChannel(channelTopic, "frontend_data_request", requestPayload);

      console.log(`Successfully broadcasted frontend data request to channel: ${channelTopic}`);
      return { success: true, data: requestPayload };

    } catch (error) {
      console.error("Error requesting frontend data via WebSocket:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Broadcast message to WebSocket channel
   * @param {string} channelTopic - Channel topic
   * @param {string} event - Event type
   * @param {Object} payload - Message payload
   */
  async broadcastToChannel(channelTopic, event, payload) {
    try {
      // Use the facade's WebSocket functionality
      this.facade.sendWebSocketMessage(event, payload);
      console.log(`Broadcasted ${event} to ${channelTopic}`);
    } catch (error) {
      console.error("Error broadcasting to channel:", error);
      throw error;
    }
  }

  /**
   * Generate a unique message ID
   * @returns {string} Message ID
   */
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get connection status
   * @returns {Object} Connection status
   */
  getConnectionStatus() {
    return {
      facade: this.facade.getWebSocketStatus(),
      activeConnections: this.activeConnections.size
    };
  }
}

// Legacy function for backward compatibility
export async function handleResourceEvent(ev) {
  const { type, resourceType, data, id, clientId, tempId } = normalizeEvent(ev);
  const store = db.table(resourceType);

  switch (type) {
    case "create":
      if (clientId) {
        await mapTempToPermId(resourceType, clientId, data.id || id);
      } else if (tempId) {
        await mapTempToPermId(resourceType, tempId, data.id || id);
      } else {
        await store.put(clearOptimistic(data));
      }
      break;
    case "update":
      await store.put(clearOptimistic(data));
      break;
    case "delete":
      await store.delete(id || data?.id);
      break;
    default:
      break;
  }

  await runRetention();
}

function normalizeEvent(ev) {
  if (!ev) return { };
  // Support shapes from websocketClient and worker messages
  const type = ev.type?.startsWith("resource_") ? ev.type.replace("resource_", "") : ev.type;
  return {
    type,
    resourceType: ev.resourceType || ev.data?.resourceType,
    data: ev.data || ev.payload?.data || ev,
    id: ev.id || ev.resourceId || ev.data?.id,
    clientId: ev.clientId || ev.tempId || ev.data?.clientId,
    tempId: ev.tempId
  };
}

// Export singleton instance
export const websocketResourceHandler = new WebSocketResourceHandler();


