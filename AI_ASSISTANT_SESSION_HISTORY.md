# AI Assistant Session History Implementation

## Overview

This document describes the implementation of session history functionality for the AI Assistant system, including the ability to retrieve and manage user session history and fix the sessionId generation issue.

## Implemented Features

### 1. Session History Endpoints

The following API endpoints are now supported:

- **GET /api/sessions/business/:businessId/user/:userId/active** - Get active session for user
- **GET /api/sessions/business/:businessId/user/:userId/history?limit=20** - Get user session history
- **GET /api/sessions/business/:businessId/active** - Get active sessions for business
- **GET /api/sessions/:sessionId** - Get specific session by ID
- **GET /api/sessions/:sessionId/messages** - Get messages for a session

### 2. Repository Layer (AIAssistantRepository)

Added new methods to `AIAssistantRepository`:

```javascript
// Get active session for user
async getActiveSessionForUser(businessId, userId)

// Get user session history
async getUserSessionHistory(businessId, userId, limit = 20)

// Get session by ID
async getSessionById(sessionId)

// Load specific session with messages
async loadSession(sessionId)
```

### 3. DataFacade Layer

Added corresponding methods to `DataFacade`:

```javascript
// Get active session for user
async getActiveAIAssistantSessionForUser(businessId, userId)

// Get user session history
async getUserAIAssistantSessionHistory(businessId, userId, limit = 20)

// Get session by ID
async getAIAssistantSessionById(sessionId)

// Load specific session
async loadAIAssistantSession(sessionId)
```

### 4. Service Layer (AIAssistantService)

Enhanced `AIAssistantService` with session history methods:

```javascript
// Get active session for current user
async getActiveSessionForUser()

// Get user session history
async getUserSessionHistory(limit = 20)

// Get session by ID
async getSessionById(sessionId)

// Load specific session
async loadSession(sessionId)
```

### 5. React Hook (useAIAssistant)

Updated `useAIAssistant` hook with new methods:

```javascript
// Get active session for current user
const getActiveSessionForUser = useCallback(async () => { ... })

// Get user session history
const getUserSessionHistory = useCallback(async (limit = 20) => { ... })

// Get session by ID
const getSessionById = useCallback(async (sessionId) => { ... })

// Load specific session
const loadSession = useCallback(async (sessionId) => { ... })
```

### 6. Session Management Hook (useAIAssistantSessions)

Enhanced `useAIAssistantSessions` hook for comprehensive session management:

```javascript
const {
  sessions,           // Active sessions
  sessionHistory,     // User session history
  isLoading,
  error,
  loadActiveSessions,
  loadSessionHistory,
  getActiveSessionForUser,
  loadSession,
  closeSession,
  clearError
} = useAIAssistantSessions(businessId, userId);
```

## Fixed Issues

### SessionId Generation Issue

**Problem**: The system was generating new session IDs on the client side even when no sessionId existed.

**Solution**: Modified `loadTodaySession()` method in `AIAssistantService` to:

1. First check for an existing active session for the user
2. If an active session exists, use that session ID
3. Only generate a new session ID if no active session is found

```javascript
async loadTodaySession() {
  // First, try to get active session for user
  const activeSession = await this.dataFacade.getActiveAIAssistantSessionForUser(this.businessId, this.userId);
  
  if (activeSession) {
    // Use existing active session
    this.currentSessionId = activeSession.sessionId;
    // ... load existing session
  } else {
    // No active session found, create new one
    const sessionId = this.generateSessionId();
    // ... create new session
  }
}
```

## Usage Examples

### 1. Get User Session History

```javascript
import { useAIAssistant } from '../hooks/useAIAssistant';

const MyComponent = () => {
  const { getUserSessionHistory } = useAIAssistant(businessId, userId);
  
  const loadHistory = async () => {
    try {
      const history = await getUserSessionHistory(20);
      console.log('Session history:', history.sessions);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };
  
  return (
    <button onClick={loadHistory}>
      Load Session History
    </button>
  );
};
```

### 2. Load Specific Session

```javascript
import { useAIAssistant } from '../hooks/useAIAssistant';

const SessionViewer = ({ sessionId }) => {
  const { loadSession, messages } = useAIAssistant(businessId, userId);
  
  const loadSpecificSession = async () => {
    try {
      await loadSession(sessionId);
      // Messages will be automatically updated in the hook state
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };
  
  return (
    <div>
      <button onClick={loadSpecificSession}>
        Load Session
      </button>
      <div>
        {messages.map(message => (
          <div key={message.messageId}>
            {message.content}
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 3. Session Management

```javascript
import { useAIAssistantSessions } from '../hooks/useAIAssistant';

const SessionManager = ({ businessId, userId }) => {
  const {
    sessions,
    sessionHistory,
    loadSessionHistory,
    getActiveSessionForUser,
    loadSession
  } = useAIAssistantSessions(businessId, userId);
  
  const loadUserHistory = async () => {
    await loadSessionHistory(20);
  };
  
  const getActiveSession = async () => {
    const activeSession = await getActiveSessionForUser();
    if (activeSession) {
      console.log('Active session:', activeSession);
    }
  };
  
  return (
    <div>
      <button onClick={loadUserHistory}>
        Load History
      </button>
      <button onClick={getActiveSession}>
        Get Active Session
      </button>
      
      <div>
        <h3>Active Sessions</h3>
        {sessions.map(session => (
          <div key={session.sessionId}>
            Session: {session.sessionId}
          </div>
        ))}
      </div>
      
      <div>
        <h3>Session History</h3>
        {sessionHistory.map(session => (
          <div key={session.sessionId}>
            Session: {session.sessionId} - Status: {session.status}
          </div>
        ))}
      </div>
    </div>
  );
};
```

## Demo Mode Support

All new functionality includes demo mode support with mock data:

- Mock session history with sample sessions
- Mock active sessions
- Mock session data for testing

## Error Handling

All methods include comprehensive error handling:

- Try-catch blocks for all async operations
- Error logging with context
- User-friendly error messages
- Graceful fallbacks in demo mode

## Integration Points

The session history functionality integrates with:

- **SocketFacade**: Session events are sent via WebSocket
- **DataFacade**: All data operations go through the facade
- **IndexedDB**: Local caching of session data
- **API Client**: HTTP requests to backend endpoints

## Future Enhancements

Potential future improvements:

1. **Session Search**: Add search functionality for sessions
2. **Session Analytics**: Track session metrics and analytics
3. **Session Export**: Export session data in various formats
4. **Session Sharing**: Share sessions between users
5. **Session Templates**: Create session templates for common scenarios
