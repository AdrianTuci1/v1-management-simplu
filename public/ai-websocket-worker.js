// AI WebSocket Worker - handles AI Assistant WebSocket connections in a separate thread
importScripts('https://cdn.jsdelivr.net/npm/phoenix@1.6.0/priv/static/phoenix.js');

let socket = null;
let channel = null;
let connectionStatus = 'disconnected';
let messageId = 0;

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
    
    // Create Phoenix Socket for AI Assistant
    socket = new Phoenix.Socket(url, {
      logger: (kind, msg) => {
        sendToMain('log', { kind, msg });
      }
    });
    
    socket.connect();
    
    // Connect to the AI messages channel
    channel = socket.channel(channelName);
    
    channel.join()
      .receive("ok", resp => {
        sendToMain('log', { kind: 'info', msg: 'Joined AI messages channel successfully', data: resp });
        connectionStatus = 'connected';
        sendToMain('status', { status: 'connected', data: resp });
      })
      .receive("error", resp => {
        sendToMain('log', { kind: 'error', msg: 'Unable to join AI messages channel', data: resp });
        connectionStatus = 'error';
        sendToMain('status', { status: 'error', data: resp });
      })
      .receive("timeout", () => {
        sendToMain('log', { kind: 'error', msg: 'Channel join timeout' });
        connectionStatus = 'error';
        sendToMain('status', { status: 'timeout' });
      });
    
    // Listen for AI message events (keep existing communication with agent)
    channel.on("new_message", (payload) => {
      sendToMain('log', { kind: 'info', msg: 'Received new_message event', data: payload });
      sendToMain('message', { type: 'new_message', data: payload });
    });
    
    channel.on("ai_response", (payload) => {
      sendToMain('log', { kind: 'info', msg: 'Received ai_response event', data: payload });
      sendToMain('message', { type: 'ai_response', data: payload });
    });
    
    channel.on("session_update", (payload) => {
      sendToMain('log', { kind: 'info', msg: 'Received session_update event', data: payload });
      sendToMain('message', { type: 'session_update', data: payload });
    });
    
    // Listen for new AI Assistant DataFacade events
    channel.on("ai_assistant_connected", (payload) => {
      sendToMain('log', { kind: 'info', msg: 'Received ai_assistant_connected event', data: payload });
      sendToMain('message', { type: 'ai_assistant_connected', data: payload });
    });
    
    channel.on("ai_assistant_disconnected", (payload) => {
      sendToMain('log', { kind: 'info', msg: 'Received ai_assistant_disconnected event', data: payload });
      sendToMain('message', { type: 'ai_assistant_disconnected', data: payload });
    });
    
    channel.on("ai_assistant_session_loaded", (payload) => {
      sendToMain('log', { kind: 'info', msg: 'Received ai_assistant_session_loaded event', data: payload });
      sendToMain('message', { type: 'ai_assistant_session_loaded', data: payload });
    });
    
    channel.on("ai_assistant_session_closed", (payload) => {
      sendToMain('log', { kind: 'info', msg: 'Received ai_assistant_session_closed event', data: payload });
      sendToMain('message', { type: 'ai_assistant_session_closed', data: payload });
    });
    
    channel.on("ai_assistant_messages_searched", (payload) => {
      sendToMain('log', { kind: 'info', msg: 'Received ai_assistant_messages_searched event', data: payload });
      sendToMain('message', { type: 'ai_assistant_messages_searched', data: payload });
    });
    
    channel.on("ai_assistant_session_exported", (payload) => {
      sendToMain('log', { kind: 'info', msg: 'Received ai_assistant_session_exported event', data: payload });
      sendToMain('message', { type: 'ai_assistant_session_exported', data: payload });
    });
    
    channel.on("ai_assistant_stats_retrieved", (payload) => {
      sendToMain('log', { kind: 'info', msg: 'Received ai_assistant_stats_retrieved event', data: payload });
      sendToMain('message', { type: 'ai_assistant_stats_retrieved', data: payload });
    });
    
    
    channel.on("agent_request_error", (payload) => {
      sendToMain('log', { kind: 'error', msg: 'Received agent_request_error event', data: payload });
      sendToMain('message', { type: 'agent_request_error', data: payload });
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
  sendToMain('log', { kind: 'info', msg: 'Attempting to send message', data: { event, payload, connectionStatus } });
  
  if (channel && connectionStatus === 'connected') {
    // Handle different event types
    if (event === 'send_message') {
      // Send message to AI channel (keep existing agent communication)
      channel.push('send_message', payload);
      sendToMain('log', { kind: 'info', msg: 'AI message sent successfully', data: { event, payload } });
    } else if (event.startsWith('ai_assistant_')) {
      // Handle new AI Assistant DataFacade events
      channel.push(event, payload);
      sendToMain('log', { kind: 'info', msg: 'AI Assistant event sent successfully', data: { event, payload } });
    } else {
      // Send other events as-is
      channel.push(event, payload);
      sendToMain('log', { kind: 'info', msg: 'Event sent successfully', data: { event, payload } });
    }
  } else {
    sendToMain('log', { kind: 'warn', msg: 'Cannot send message: channel not connected', data: { hasChannel: !!channel, connectionStatus } });
  }
}

function sendHeartbeat() {
  if (channel && connectionStatus === 'connected') {
    channel.push('heartbeat', { timestamp: Date.now() });
    sendToMain('log', { kind: 'debug', msg: 'Heartbeat sent' });
  }
}

// Listen for messages from main thread
self.addEventListener('message', function(event) {
  const { id, type, data } = event.data;
  
  sendToMain('log', { kind: 'debug', msg: 'Received message from main thread', data: { type, data } });
  
  try {
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
        
      case 'heartbeat':
        sendHeartbeat();
        break;
        
      default:
        sendToMain('log', { kind: 'warn', msg: 'Unknown message type', data: type });
    }
  } catch (error) {
    sendToMain('log', { kind: 'error', msg: 'Error handling message', data: error.message });
  }
});

// Notify main thread that worker is ready
sendToMain('ready', { message: 'AI WebSocket Worker ready' });
