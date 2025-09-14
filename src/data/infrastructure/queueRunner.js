import { processQueue } from "../queue/offlineQueue";
import { registerNetHandlers, startQueueProcessor } from "./netStatus";
import { ResourceRepository } from "../repositories/ResourceRepository";

// Cache pentru repository-urile existente
const repositoryCache = new Map();

function getRepository(resourceType) {
  if (!repositoryCache.has(resourceType)) {
    repositoryCache.set(resourceType, new ResourceRepository(resourceType, resourceType));
  }
  return repositoryCache.get(resourceType);
}

async function queueApiRequest(resourceType, action, payload, targetId) {
  const repository = getRepository(resourceType);
  
  try {
    switch (action) {
      case "create":
        return await repository.add(payload);
      case "update":
        return await repository.update(targetId, payload);
      case "delete":
        return await repository.remove(targetId);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    // Re-throw error to be handled by processQueue
    throw error;
  }
}

export function initOfflineQueueProcessing() {
  // Process immediately when coming online
  registerNetHandlers(() => {
    processQueue(queueApiRequest).catch(() => {});
  });

  // Background processing every 15s
  startQueueProcessor(() => processQueue(queueApiRequest), 15000);
}


