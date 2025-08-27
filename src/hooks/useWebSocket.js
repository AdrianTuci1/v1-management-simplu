import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  connectWebSocket, 
  onMessage, 
  onResourceMessage, 
  closeWebSocket, 
  sendMessage, 
  getConnectionStatus, 
  isConnected,
  getCurrentChannelName,
  reconnectWithNewContext
} from '../data/infrastructure/websocketClient';

export function useWebSocket(websocketUrl, options = {}) {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [messages, setMessages] = useState([]);
  const [lastMessage, setLastMessage] = useState(null);
  const unsubscribeRef = useRef(null);
  const resourceUnsubscribeRef = useRef(null);

  const connect = useCallback(() => {
    if (!websocketUrl) {
      console.warn('WebSocket URL is required');
      return;
    }

    try {
      connectWebSocket(websocketUrl);
      
      // Subscribe to general messages
      unsubscribeRef.current = onMessage((message) => {
        setLastMessage(message);
        setMessages(prev => [...prev, message]);
        
        // Update connection status based on message type
        if (message.type === 'connection') {
          setConnectionStatus(message.status);
        }
      });

      // Subscribe to specific resource messages if resourceType is provided
      if (options.resourceType) {
        resourceUnsubscribeRef.current = onResourceMessage(options.resourceType, (message) => {
          setLastMessage(message);
          setMessages(prev => [...prev, message]);
        });
      }

      // Set initial connection status
      setConnectionStatus(getConnectionStatus());
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      setConnectionStatus('error');
    }
  }, [websocketUrl, options.resourceType]);

  const disconnect = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    if (resourceUnsubscribeRef.current) {
      resourceUnsubscribeRef.current();
      resourceUnsubscribeRef.current = null;
    }
    closeWebSocket();
    setConnectionStatus('disconnected');
  }, []);

  const send = useCallback((event, payload) => {
    if (isConnected()) {
      sendMessage(event, payload);
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setLastMessage(null);
  }, []);

  // Auto-connect on mount if autoConnect is true
  useEffect(() => {
    if (options.autoConnect !== false) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      if (options.autoDisconnect !== false) {
        disconnect();
      }
    };
  }, [connect, disconnect, options.autoConnect, options.autoDisconnect]);

  // Update connection status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const status = getConnectionStatus();
      setConnectionStatus(status);
    }, 2000); // Less frequent updates since worker handles status

    return () => clearInterval(interval);
  }, []);

  return {
    connectionStatus,
    isConnected: isConnected(),
    messages,
    lastMessage,
    connect,
    disconnect,
    send,
    clearMessages,
    channelName: getCurrentChannelName()
  };
}

// Hook for listening to specific resource types
export function useResourceWebSocket(websocketUrl, resourceType, options = {}) {
  return useWebSocket(websocketUrl, {
    ...options,
    resourceType
  });
}

// Hook for real-time updates with automatic reconnection
export function useRealtimeWebSocket(websocketUrl, options = {}) {
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = options.maxReconnectAttempts || 5;
  const reconnectInterval = options.reconnectInterval || 3000;

  const {
    connectionStatus,
    isConnected,
    messages,
    lastMessage,
    connect,
    disconnect,
    send,
    clearMessages
  } = useWebSocket(websocketUrl, { ...options, autoConnect: false });

  // Auto-reconnect logic
  useEffect(() => {
    if (connectionStatus === 'error' || connectionStatus === 'disconnected') {
      if (reconnectAttempts < maxReconnectAttempts) {
        const timeout = setTimeout(() => {
          console.log(`Attempting to reconnect (${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          setReconnectAttempts(prev => prev + 1);
          connect();
        }, reconnectInterval);

        return () => clearTimeout(timeout);
      } else {
        console.error('Max reconnection attempts reached');
      }
    } else if (connectionStatus === 'connected') {
      setReconnectAttempts(0);
    }
  }, [connectionStatus, reconnectAttempts, maxReconnectAttempts, reconnectInterval, connect]);

  // Initial connect
  useEffect(() => {
    if (options.autoConnect !== false) {
      connect();
    }
  }, [connect, options.autoConnect]);

  return {
    connectionStatus,
    isConnected,
    messages,
    lastMessage,
    connect,
    disconnect,
    send,
    clearMessages,
    reconnectAttempts,
    maxReconnectAttempts,
    channelName: getCurrentChannelName()
  };
}
