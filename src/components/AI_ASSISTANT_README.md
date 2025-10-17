# AI Assistant System - Implementation Guide

## Overview

The AI Assistant system has been implemented according to the `AI_AGENT_SESSION_MANAGEMENT.md` specification, providing a complete solution for managing AI agent sessions with daily session management, WebSocket real-time communication, and a modular architecture.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Assistant Component                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────────────────────┐  │
│  │   useAIAssistant│  │      AIAssistantService        │  │
│  │      Hook       │  │    (HTTP API Communication)     │  │
│  └─────────────────┘  └─────────────────────────────────┘  │
│           │                           │                    │
│           │                           │                    │
│           ▼                           ▼                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              AIWebSocketService                        │ │
│  │           (Real-time Communication)                    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                           │                                │
│                           ▼                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                Configuration                            │ │
│  │           (aiAssistantConfig.js)                      │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. AIAssistant.jsx
The main React component that provides the AI chat interface.

**Features:**
- Real-time messaging with AI agent
- Daily session management
- WebSocket connection status
- Message search and export
- Session management controls

**Usage:**
```jsx
import AIAssistantComponent from './components/AIAssistant';

// The component is automatically managed by the store
// No additional props needed
```

### 2. aiAssistantConfig.js
Centralized configuration for all AI Assistant settings.

**Key Configuration Options:**
```javascript
import { getConfig, setConfig } from '../config/aiAssistantConfig';

// Get configuration values
const apiEndpoint = getConfig('API_ENDPOINTS.MESSAGES');
const maxMessageLength = getConfig('MESSAGE.MAX_LENGTH');

// Set configuration values
setConfig('API_ENDPOINTS.MESSAGES', 'https://your-domain.com/api/messages');
```

**Environment-specific Configuration:**
- Development: Uses localhost endpoints
- Staging: Uses staging domain endpoints  
- Production: Uses production domain endpoints

### 3. aiAssistantService.js
Service class for HTTP API communication with the AI agent server.

**Features:**
- Session management (create, load, close)
- Message history retrieval
- Message sending
- Session statistics
- Message search
- Session export

**Usage:**
```javascript
import { createAIAssistantService } from '../services/aiAssistantService';

const aiService = createAIAssistantService('B0100001', 'user_123', 'L0100001');

// Load today's session
await aiService.loadTodaySession();

// Send message
await aiService.sendMessage('Hello AI!', { context: 'greeting' });

// Search messages
const results = await aiService.searchMessages('appointment', 20);

// Export session
const data = await aiService.exportSession('json');
```

### 4. aiWebSocketService.js
Service class for real-time WebSocket communication.

**Features:**
- Phoenix Socket support (preferred)
- Native WebSocket fallback
- Automatic reconnection with exponential backoff
- Heartbeat management
- Channel-based messaging

**Usage:**
```javascript
import { createAIWebSocketService } from '../services/aiWebSocketService';

const wsService = createAIWebSocketService('B0100001', 'user_123', 'L0100001');

// Connect to WebSocket
await wsService.connect();

// Send message via WebSocket
await wsService.sendMessage('Hello!', { priority: 'high' });

// Get connection status
const status = wsService.getConnectionStatus();
```

### 5. useAIAssistant.js
Custom React hook that manages AI Assistant state and services.

**Features:**
- Automatic service initialization
- State management (messages, connection, errors)
- Message sending with fallback
- Session management
- Error handling and recovery

**Usage:**
```jsx
import { useAIAssistant } from '../hooks/useAIAssistant';

const MyComponent = () => {
  const {
    messages,
    isConnected,
    currentSessionId,
    isLoading,
    error,
    sendMessage,
    searchMessages,
    exportSession,
    closeSession
  } = useAIAssistant('B0100001', 'user_123');

  const handleSend = async () => {
    try {
      await sendMessage('Hello AI!');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.messageId}>{msg.content}</div>
      ))}
      <button onClick={handleSend} disabled={!isConnected}>
        Send Message
      </button>
    </div>
  );
};
```

## Configuration

### Basic Configuration
```javascript
// src/config/aiAssistantConfig.js
export const AI_ASSISTANT_CONFIG = {
  API_ENDPOINTS: {
    MESSAGES: 'http://localhost:3003/api/messages',
    SESSIONS: 'http://localhost:3003/api/sessions',
    WEBSOCKET: 'ws://localhost:4000/socket/websocket'
  },
  
  DEFAULTS: {
    BUSINESS_ID: 'B0100001',
    USER_ID: 'user_123',
    LOCATION_ID: 'L0100001'
  }
};
```

### Environment Overrides
```javascript
// Automatically loaded based on NODE_ENV
if (process.env.NODE_ENV === 'production') {
  setConfig('API_ENDPOINTS.MESSAGES', 'https://your-domain.com/api/messages');
  setConfig('API_ENDPOINTS.WEBSOCKET', 'wss://your-domain.com/socket/websocket');
}
```

### Runtime Configuration
```javascript
import { setConfig, saveConfig } from '../config/aiAssistantConfig';

// Update configuration at runtime
setConfig('WEBSOCKET.RECONNECT_DELAY', 10000);
setConfig('MESSAGE.MAX_LENGTH', 2000);

// Save to localStorage
saveConfig();
```

## Session Management

### Daily Sessions
The system automatically creates daily sessions:
- **Session ID Format**: `businessId:userId:timestamp`
- **Auto-creation**: First message of the day creates a new session
- **Auto-closure**: Sessions close automatically at midnight
- **Cleanup**: Old sessions are cleaned up after 30 days

### Session Lifecycle
```javascript
// 1. Session creation (automatic)
const sessionId = aiService.generateSessionId();
// Result: "B0100001:user_123:1704067200000"

// 2. Load today's session
await aiService.loadTodaySession();

// 3. Send messages
await aiService.sendMessage('Hello AI!');

// 4. Close session (optional)
await aiService.closeSession('resolved');
```

## WebSocket Communication

### WebSocket Worker (Recommended)
```javascript
// Uses Web Worker for Phoenix Socket connection
const wsService = createAIWebSocketService(businessId, userId, locationId);
await wsService.connect();

// Automatically joins channel: messages:{userId}
// Listens for events: new_message, session_update, ai_response
// Handles connection in separate thread for better performance
```

## Error Handling

### Service Errors
```javascript
// All services provide error callbacks
aiService.onError = (message, error) => {
  console.error('AI Service Error:', message, error);
  // Show user notification
};

wsService.onError = (message, error) => {
  console.error('WebSocket Error:', message, error);
  // Handle connection issues
};
```

### Hook Error State
```javascript
const { error, clearError } = useAIAssistant();

if (error) {
  return (
    <div className="error">
      <p>{error.message}</p>
      <button onClick={clearError}>Dismiss</button>
    </div>
  );
}
```

## Advanced Usage

### Custom Business Integration
```javascript
// Use with your business context
const { sendMessage, currentSessionId } = useAIAssistant(
  currentBusiness.id,
  currentUser.id,
  currentLocation.id
);

// Send message with business context
await sendMessage('Check inventory', {
  businessType: 'medical',
  location: 'main-clinic',
  urgency: 'high'
});
```

### Session Monitoring
```javascript
const { getSessionStats, getActiveSessions } = useAIAssistant();

// Monitor session statistics
const stats = await getSessionStats();
console.log('Active sessions:', stats.activeCount);

// Get all active sessions
const activeSessions = await getActiveSessions();
activeSessions.forEach(session => {
  console.log(`Session ${session.sessionId}: ${session.status}`);
});
```

### Message Search
```javascript
const { searchMessages } = useAIAssistant();

// Search for specific content
const results = await searchMessages('appointment', 50);
results.forEach(msg => {
  console.log(`Found: ${msg.content}`);
});
```

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check if Phoenix Socket library is loaded
   - Verify WebSocket endpoint is accessible
   - Check CORS settings on server

2. **Session Not Loading**
   - Verify business ID and user ID are correct
   - Check API endpoint accessibility
   - Review server logs for errors

3. **Messages Not Sending**
   - Check connection status
   - Verify message format
   - Check server-side validation

4. **Configuration Issues**
   - Verify environment variables
   - Check localStorage permissions
   - Review configuration file syntax

### Debug Mode
```javascript
// Enable debug logging
setConfig('LOGGING.LEVEL', 'debug');
setConfig('LOGGING.SHOW_CONSOLE', true);

// Check connection status
const status = getConnectionStatus();
console.log('Connection status:', status);
```

## Performance Considerations

### Message Handling
- Messages are deduplicated by ID
- Automatic scrolling to latest message
- Lazy loading of message history
- Efficient state updates

### Connection Management
- Automatic reconnection with exponential backoff
- Heartbeat monitoring
- Graceful degradation to HTTP API
- Connection pooling

### Memory Management
- Automatic cleanup of disposed services
- Message history limits
- Session cleanup
- Garbage collection friendly

## Security

### Authentication
- Business ID and user ID validation
- Location-based access control
- Session isolation per business

### Data Protection
- No sensitive data in localStorage
- Secure WebSocket connections
- Input validation and sanitization
- Error message sanitization

## Future Enhancements

### Planned Features
- Message encryption
- File attachment support
- Voice message support
- Multi-language support
- Advanced analytics
- Integration with business systems

### Extension Points
- Custom message handlers
- Plugin system for AI responses
- Custom UI themes
- Integration hooks
- Webhook support

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review server logs
3. Verify configuration settings
4. Test with minimal setup
5. Check browser console for errors

## License

This implementation follows the same license as the main project.
