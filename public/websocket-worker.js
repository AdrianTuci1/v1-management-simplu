// WebSocket Worker - handles WebSocket connections in a separate thread
importScripts('https://cdn.jsdelivr.net/npm/phoenix@1.6.0/priv/static/phoenix.js');

let socket = null;
let channel = null;
let connectionStatus = 'disconnected';
let messageId = 0;

function buildResourcesChannel() {
  // We'll get these from the main thread
  return null; // Will be set by main thread
}

function sendToMain(type, data) {
  try {
    self.postMessage({
      id: messageId++,
      type,
      data,
      timestamp: Date.now()
    });
  } catch (err) {
    // Fallback minimal, avoid sending non-cloneable objects
    self.postMessage({
      id: messageId++,
      type: 'log',
      data: { kind: 'error', msg: 'worker postMessage failed', note: String(err) },
      timestamp: Date.now()
    });
  }
}

function connectWebSocket(url, channelName) {
  try {
    connectionStatus = 'connecting';
    sendToMain('status', { status: 'connecting' });
    
    // Create Phoenix Socket following the documentation
    socket = new Phoenix.Socket(url, {
      logger: (kind, msg) => {
        // Do not forward Phoenix's logger "data" (can contain non-cloneable Event/Window)
        sendToMain('log', { kind, msg });
      }
    });
    
    socket.connect();
    
    // Connect to the specific resources channel
    channel = socket.channel(channelName);
    
    channel.join()
      .receive("ok", resp => {
        sendToMain('log', { kind: 'info', msg: 'Joined resources channel successfully', data: resp });
        connectionStatus = 'connected';
        sendToMain('status', { status: 'connected', data: resp });
      })
      .receive("error", resp => {
        sendToMain('log', { kind: 'error', msg: 'Unable to join resources channel', data: resp });
        connectionStatus = 'error';
        sendToMain('status', { status: 'error', data: resp });
      })
      .receive("timeout", () => {
        sendToMain('log', { kind: 'error', msg: 'Channel join timeout' });
        connectionStatus = 'error';
        sendToMain('status', { status: 'timeout' });
      });
    
    // Listen for resource_update events as per documentation
    channel.on("resource_update", (payload) => {
      sendToMain('log', { kind: 'info', msg: 'RAW resource_update', data: payload });
      sendToMain('message', { type: 'resource_update', data: payload });
    });
    
    // Handle socket connection events
    socket.onOpen(() => {
      connectionStatus = 'connected';
      sendToMain('status', { status: 'connected' });
    });
    
    socket.onError((error) => {
      const safe = { type: (error && error.type) || 'error', message: (error && error.message) || undefined };
      connectionStatus = 'error';
      sendToMain('status', { status: 'error', data: safe });
    });
    
    socket.onClose((event) => {
      const safe = { type: (event && event.type) || 'close' };
      connectionStatus = 'disconnected';
      sendToMain('status', { status: 'disconnected', data: safe });
    });
    
  } catch (error) {
    connectionStatus = 'error';
    sendToMain('status', { status: 'error', data: error });
  }
}

function closeWebSocket() {
  if (channel) {
    channel.leave();
    channel = null;
  }
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  connectionStatus = 'disconnected';
  sendToMain('status', { status: 'disconnected' });
}

function sendMessage(event, payload) {
  if (channel && connectionStatus === 'connected') {
    channel.push(event, payload);
    sendToMain('log', { kind: 'info', msg: 'Message sent', data: { event, payload } });
  } else {
    sendToMain('log', { kind: 'warn', msg: 'Cannot send message: channel not connected' });
  }
}

// Listen for messages from main thread
self.addEventListener('message', function(event) {
  const { type, data } = event.data;
  
  switch (type) {
    case 'connect':
      connectWebSocket(data.url, data.channelName);
      break;
      
    case 'disconnect':
      closeWebSocket();
      break;
      
    case 'send':
      sendMessage(data.event, data.payload);
      break;
      
    case 'getStatus':
      sendToMain('status', { status: connectionStatus });
      break;
      
    default:
      sendToMain('log', { kind: 'warn', msg: 'Unknown message type', data: type });
  }
});

// Send ready message
sendToMain('ready', { message: 'WebSocket Worker ready' });
