# AI Services - SocketFacade Integration

## Overview

This document describes the integration between AI Assistant Services and SocketFacade, providing a unified interface for WebSocket operations and real-time communication.

## Updated Services

### 1. AIAssistantService (`aiAssistantService.js`)

**Key Changes:**
- Added SocketFacade import and integration
- Enhanced session management with WebSocket events
- Added real-time event broadcasting for session operations

**New Features:**
- Session loaded events via `socketFacade.sendAIAssistantSessionLoaded()`
- Session closed events via `socketFacade.sendAIAssistantSessionClosed()`
- Message search events via `socketFacade.sendAIAssistantMessageSearch()`
- Session export events via `socketFacade.sendAIAssistantSessionExport()`
- Statistics events via `socketFacade.sendAIAssistantStats()`

**Updated Methods:**
```javascript
// Session management now sends WebSocket events
async loadTodaySession() {
  // ... existing logic ...
  this.socketFacade.sendAIAssistantSessionLoaded(this.businessId, this.userId, sessionId, this.locationId);
}

async closeSession(status = 'resolved') {
  // ... existing logic ...
  this.socketFacade.sendAIAssistantSessionClosed(this.currentSessionId, status);
}

async getSessionStats() {
  // ... existing logic ...
  this.socketFacade.sendAIAssistantStats(this.businessId, stats);
}
```

### 2. AIWebSocketService (`aiWebSocketService.js`)

**Key Changes:**
- Replaced direct DataFacade calls with SocketFacade integration
- Enhanced connection management through SocketFacade
- Improved error handling and async operations

**Updated Methods:**
```javascript
// Connection now uses SocketFacade
async connect() {
  const result = await this.socketFacade.connectAIAssistant(this.businessId, this.userId, this.locationId);
  this.aiAssistantInstance = this.socketFacade.createAIAssistant(this.businessId, this.userId, this.locationId);
}

// Message sending via SocketFacade
async sendMessage(content, context = {}) {
  const result = await this.socketFacade.sendAIAssistantMessage(
    this.businessId, this.userId, content, context, this.locationId
  );
}

// Disconnect via SocketFacade
async disconnect() {
  await this.socketFacade.disconnectAIAssistant(this.businessId, this.userId, this.locationId);
}
```

## Integration Benefits

### 1. **Unified WebSocket Management**
- Single point of control for all WebSocket operations
- Consistent event handling across services
- Centralized connection management

### 2. **Real-time Event Broadcasting**
- Session lifecycle events are automatically broadcast
- Message operations trigger real-time notifications
- Statistics and analytics events are shared

### 3. **Improved Error Handling**
- Centralized error management through SocketFacade
- Consistent error reporting across services
- Better debugging and monitoring capabilities

### 4. **Enhanced Scalability**
- Easier to add new WebSocket features
- Simplified service interactions
- Better separation of concerns

## Event Flow

### AI Assistant Session Events
```
AIAssistantService → SocketFacade → WebSocket → Server
     ↓
Session Operations (load, close, search, export, stats)
     ↓
Real-time notifications to connected clients
```

### AI WebSocket Communication
```
AIWebSocketService → SocketFacade → WebSocket Infrastructure
     ↓
Message sending/receiving
     ↓
Real-time bidirectional communication
```

## Usage Examples

### Basic Service Initialization
```javascript
import { createAIAssistantService } from './services/aiAssistantService.js';
import { createAIWebSocketService } from './services/aiWebSocketService.js';

// Create services with SocketFacade integration
const aiAssistantService = createAIAssistantService(businessId, userId, locationId);
const aiWebSocketService = createAIWebSocketService(businessId, userId, locationId);

// Set up event handlers
aiWebSocketService.onMessageReceived = (messages) => {
  console.log('AI messages received:', messages);
};

aiWebSocketService.onConnectionChange = (isConnected) => {
  console.log('Connection status:', isConnected);
};
```

### Session Management with Real-time Events
```javascript
// Load session (triggers WebSocket event)
await aiAssistantService.loadTodaySession();

// Close session (triggers WebSocket event)
await aiAssistantService.closeSession('resolved');

// Search messages (triggers WebSocket event)
const results = await aiAssistantService.searchMessages('test query', 20);
```

### WebSocket Communication
```javascript
// Connect via SocketFacade
await aiWebSocketService.connect();

// Send message via SocketFacade
await aiWebSocketService.sendMessage('Hello AI!', { context: 'greeting' });

// Get connection status via SocketFacade
const status = aiWebSocketService.getConnectionStatus();
```

## Testing

Integration tests are available in `src/services/__tests__/integration-test.js` to verify:
- Service initialization with SocketFacade
- Event broadcasting functionality
- WebSocket connection management
- Error handling scenarios

## Migration Notes

### Breaking Changes
- `AIWebSocketService.dispose()` is now async
- `AIWebSocketService.disconnect()` is now async
- `AIWebSocketService.sendMessage()` is now async

### Backward Compatibility
- All existing service interfaces remain the same
- Event handlers continue to work as before
- Service creation and basic usage unchanged

## Future Enhancements

1. **Agent Resource Integration**: Enhanced integration with agent resource queries
2. **Draft Management**: Real-time draft operations via WebSocket
3. **Analytics**: Advanced real-time analytics and monitoring
4. **Multi-instance Support**: Better support for multiple AI Assistant instances

## Troubleshooting

### Common Issues

1. **Connection Failures**
   - Verify SocketFacade is properly initialized
   - Check WebSocket endpoint configuration
   - Review error logs for specific connection issues

2. **Event Broadcasting Issues**
   - Ensure SocketFacade is connected before sending events
   - Verify event handler registration
   - Check for proper service initialization

3. **Async Operation Errors**
   - Use proper await/async patterns for new async methods
   - Handle promise rejections appropriately
   - Check for proper error handling in event callbacks

### Debug Mode
Enable debug logging by setting the appropriate configuration flags in `aiAssistantConfig.js`:

```javascript
LOGGING: {
  ENABLED: true,
  LEVEL: 'debug',
  SHOW_CONSOLE: true
}
```
