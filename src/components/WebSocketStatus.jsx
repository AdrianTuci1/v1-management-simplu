import React from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

export function WebSocketStatus() {
  const { 
    connectionStatus, 
    isConnected, 
    messages, 
    channelName,
    send,
    clearMessages 
  } = useWebSocket('ws://localhost:4000/socket/websocket', {
    autoConnect: true
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  const handleTestMessage = () => {
    send('test_message', { 
      message: 'Hello from React!', 
      timestamp: new Date().toISOString() 
    });
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4">WebSocket Status</h3>
      
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getStatusIcon(connectionStatus)}</span>
          <span className={`font-medium ${getStatusColor(connectionStatus)}`}>
            {connectionStatus.toUpperCase()}
          </span>
        </div>
        
        <div className="text-sm text-gray-600">
          <p><strong>Channel:</strong> {channelName || 'Not connected'}</p>
          <p><strong>Connected:</strong> {isConnected ? 'Yes' : 'No'}</p>
          <p><strong>Messages received:</strong> {messages.length}</p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleTestMessage}
            disabled={!isConnected}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Send Test Message
          </button>
          
          <button
            onClick={clearMessages}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
          >
            Clear Messages
          </button>
        </div>
        
        {messages.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Recent Messages:</h4>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {messages.slice(-5).map((msg, index) => (
                <div key={index} className="text-xs p-2 bg-gray-50 rounded">
                  <div className="font-medium">{msg.type || 'message'}</div>
                  <div className="text-gray-600">
                    {JSON.stringify(msg.data || msg, null, 2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
