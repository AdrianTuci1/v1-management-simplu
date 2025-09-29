# WebSocket Resource Handler Enhancement

## Overview

The WebSocket Resource Handler has been enhanced to properly interact with the DataFacade for querying resources and creating drafts, then broadcasting results back to the agent server. This enables seamless communication between the AI Agent Server and the frontend application.

## Key Features

### 1. Resource Querying
- **get_all_resources**: Retrieve all resources of a specific type
- **get_resource_by_id**: Get a specific resource by ID
- **search_resources**: Search resources with query parameters
- **get_drafts**: Retrieve drafts for a resource type or session

### 2. Draft Operations
- **create_draft**: Create new drafts for temporary operations
- **update_draft**: Update existing drafts
- **commit_draft**: Make drafts permanent (irreversible)
- **cancel_draft**: Cancel drafts (reversible)

### 3. Frontend Data Requests
- Request frontend data via WebSocket channels
- Broadcast requests to specific business channels
- Handle various request types with parameters

### 4. Broadcasting
- Broadcast results back to agent server
- Use DataFacade's WebSocket functionality
- Generate unique message IDs for tracking

## Architecture

```
AI Agent Server
       ↓
WebSocket Resource Handler
       ↓
DataFacade (Repository Layer)
       ↓
IndexedDB / API
       ↓
Broadcast Results Back
       ↓
AI Agent Server
```

## Usage Examples

### Handling Draft Operations

```javascript
import { websocketResourceHandler } from './websocketResourceHandler.js';

// Create a draft
const draftOperation = {
  type: 'create_draft',
  sessionId: 'session-123',
  userId: 'user-456',
  draftData: {
    resourceType: 'patient',
    data: { name: 'John Doe', email: 'john@example.com' },
    locationId: 'location-789'
  }
};

const result = await websocketResourceHandler.handleDraftOperation(
  'business-123',
  draftOperation
);
```

### Handling Resource Queries

```javascript
// Get all patients
const result = await websocketResourceHandler.handleResourceQuery(
  'business-123',
  'session-456',
  'get_all_resources',
  { resourceType: 'patient', limit: 10 }
);

// Search patients
const searchResult = await websocketResourceHandler.handleResourceQuery(
  'business-123',
  'session-456',
  'search_resources',
  { resourceType: 'patient', query: 'John' }
);
```

### Frontend Data Requests

```javascript
// Request frontend data
const requestResult = await websocketResourceHandler.requestFrontendDataViaWebSocket(
  'business-123',
  'session-456',
  'get_patient_list',
  { limit: 20, includeInactive: false }
);
```

## Integration with DataFacade

The handler uses the DataFacade for:
- **Repository Access**: Get repositories for different resource types
- **Draft Management**: Create, update, commit, and cancel drafts
- **WebSocket Communication**: Send messages through the facade
- **Health Monitoring**: Check system status

## Error Handling

The handler includes comprehensive error handling:
- Repository errors are caught and returned gracefully
- Draft operation failures are handled with proper error messages
- WebSocket communication errors are logged and handled
- All operations return success/error status

## Testing

The implementation includes:
- **Unit Tests**: Comprehensive test suite for all functionality
- **Integration Tests**: Tests with mocked DataFacade
- **Example Usage**: Complete examples showing real-world usage
- **Error Scenarios**: Tests for error handling and edge cases

## Files Modified/Created

1. **Enhanced**: `src/data/infrastructure/websocketResourceHandler.js`
   - Added WebSocketResourceHandler class
   - Integrated with DataFacade
   - Added resource querying functionality
   - Added draft operations
   - Added broadcasting capabilities

2. **Created**: `src/data/infrastructure/__tests__/websocketResourceHandler.test.js`
   - Comprehensive test suite
   - Mocked DataFacade integration
   - Error handling tests
   - Connection status tests

3. **Created**: `src/data/infrastructure/websocketResourceHandler.example.js`
   - Usage examples
   - Complete workflow demonstrations
   - Real-world scenarios

## Benefits

1. **Seamless Integration**: Direct integration with DataFacade
2. **Resource Access**: Full access to all resource types through repositories
3. **Draft Management**: Complete draft lifecycle management
4. **Real-time Communication**: WebSocket-based broadcasting
5. **Error Resilience**: Comprehensive error handling
6. **Testability**: Full test coverage with examples

## Agent Server Communication

The handler enables the AI Agent Server to:
- Query resources from the frontend
- Create and manage drafts
- Receive real-time updates
- Handle frontend data requests
- Maintain session state

This creates a bidirectional communication channel between the agent server and the frontend, enabling sophisticated AI operations while maintaining data consistency and user experience.
