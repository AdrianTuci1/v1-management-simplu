// WebSocket client that uses a Web Worker for connection handling
let worker = null;
let listeners = new Set();
let resourceListeners = new Map(); // resourceType -> Set(callback)
let connectionStatus = 'disconnected'; // 'connecting', 'connected', 'disconnected', 'error'
let messageId = 0;
let pendingMessages = new Map(); // messageId -> { resolve, reject }

function buildResourcesChannel() {
  const businessId = localStorage.getItem("businessId") || 'B0100001';
  const locationId = localStorage.getItem("locationId") || 'L0100001';

  if (!businessId || !locationId) {
    throw new Error("Business ID and Location ID must be set before connecting to resources channel.");
  }
  
  return `resources:${businessId}-${locationId}`;
}

function createWorker() {
  if (worker) return worker;
  
  try {
    worker = new Worker('/websocket-worker.js');
    
    worker.onmessage = function(event) {
      const { id, type, data, timestamp } = event.data;
      
      // Handle pending messages
      if (id && pendingMessages.has(id)) {
        const { resolve, reject } = pendingMessages.get(id);
        pendingMessages.delete(id);
        
        console.debug('Worker message response:', { id, type, data });
        
        if (type === 'error') {
          reject(new Error(data));
        } else {
          resolve(data);
        }
        return;
      }
      
      // Handle different message types
      switch (type) {
        case 'ready':
          break;
          
        case 'status':
          connectionStatus = data.status;
          listeners.forEach((cb) => cb({ type: 'connection', status: data.status, data: data.data }));
          break;
          
        case 'message':
          listeners.forEach((cb) => cb(data));
          if (data.data && data.data.resourceType && resourceListeners.has(data.data.resourceType)) {
            resourceListeners.get(data.data.resourceType).forEach(cb => cb(data.data));
          }
          break;
          
        case 'log':
          const logLevel = data.kind === 'error' ? 'error' : data.kind === 'warn' ? 'warn' : 'log';
          console[logLevel](`[WebSocket Worker] ${data.msg}`, data);
          break;
          
        case 'agent_request':
          // Handle requests from AI Agent
          handleAgentRequest(data);
          break;
          
        default:
          break;
      }
    };
    
    worker.onerror = function(error) {
      // WebSocket Worker error
      connectionStatus = 'error';
      listeners.forEach((cb) => cb({ type: 'connection', status: 'error', data: error }));
    };
    
  } catch (error) {
    // Error creating WebSocket Worker
    throw error;
  }
  
  return worker;
}

function sendToWorker(type, data) {
  return new Promise((resolve, reject) => {
    const id = messageId++;
    pendingMessages.set(id, { resolve, reject });
    
    console.debug('Sending message to worker:', { id, type, data });
    
    worker.postMessage({
      id,
      type,
      data
    });
    
    // Timeout for pending messages - increased timeout for AI Assistant operations
    setTimeout(() => {
      if (pendingMessages.has(id)) {
        pendingMessages.delete(id);
        reject(new Error(`Worker message timeout after 10 seconds for operation: ${type}`));
      }
    }, 10000);
  });
}

export function connectWebSocket(url) {
  // Check if we're in demo mode - if so, don't connect
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
  if (isDemoMode) {
    return;
  }

  if (worker && connectionStatus === 'connected') return;
  
  try {
    createWorker();
    const channelName = buildResourcesChannel();
    
    sendToWorker('connect', { url, channelName }).catch(error => {
      console.error('[WebSocket] Connection failed:', error);
      connectionStatus = 'error';
      // Notify listeners about connection error
      listeners.forEach((cb) => cb({ 
        type: 'connection_error', 
        status: 'error'
      }));
    });
    
  } catch (error) {
    console.error('[WebSocket] Failed to initialize:', error);
    connectionStatus = 'error';
    // Notify listeners about initialization error
    listeners.forEach((cb) => cb({ 
      type: 'connection_error', 
      status: 'error'
    }));
  }
}

export function onMessage(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function onResourceMessage(resourceType, callback) {
  if (!resourceListeners.has(resourceType)) {
    resourceListeners.set(resourceType, new Set());
  }
  const set = resourceListeners.get(resourceType);
  set.add(callback);
  return () => {
    if (resourceListeners.has(resourceType)) {
      resourceListeners.get(resourceType).delete(callback);
    }
  };
}

export function closeWebSocket() {
  if (worker) {
    sendToWorker('disconnect');
    worker.terminate();
    worker = null;
  }
  connectionStatus = 'disconnected';
}

// Helper function to send messages to the channel
export function sendMessage(event, payload) {
  if (worker && connectionStatus === 'connected') {
    sendToWorker('send', { event, payload });
  } else {
    // Cannot send message: WebSocket not connected
  }
}

// Get current connection status
export function getConnectionStatus() {
  return connectionStatus;
}

// Check if connected
export function isConnected() {
  return connectionStatus === 'connected';
}

// Get current channel name
export function getCurrentChannelName() {
  try {
    return buildResourcesChannel();
  } catch (error) {
    // Error getting channel name
    return null;
  }
}

// Reconnect with new business/location if needed
export function reconnectWithNewContext() {
  if (worker) {
    closeWebSocket();
    // Small delay to ensure proper cleanup
    setTimeout(() => {
      if (worker) {
        const channelName = buildResourcesChannel();
        sendToWorker('connect', { url: worker.url, channelName });
      }
    }, 100);
  }
}




