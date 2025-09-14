import { processQueue } from "../queue/offlineQueue";
import { registerNetHandlers, startQueueProcessor } from "./netStatus";
import { apiRequest, buildResourcesEndpoint } from "./apiClient";

async function queueApiRequest(resourceType, action, payload, targetId) {
  let method = "POST";
  let path = "";
  if (action === "update") {
    method = "PUT";
    path = `/${targetId}`;
  } else if (action === "delete") {
    method = "DELETE";
    path = `/${targetId}`;
  }
  const endpoint = buildResourcesEndpoint(path);
  const options = {
    method,
    ...(method !== "DELETE" && { body: JSON.stringify(payload) })
  };
  return apiRequest(resourceType, endpoint, options);
}

export function initOfflineQueueProcessing() {
  // Process immediately when coming online
  registerNetHandlers(() => {
    processQueue(queueApiRequest).catch(() => {});
  });

  // Background processing every 15s
  startQueueProcessor(() => processQueue(queueApiRequest), 15000);
}


