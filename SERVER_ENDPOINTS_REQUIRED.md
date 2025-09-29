# Server Endpoints Required for AI Assistant Sessions

## Current Status

The client has been updated to work with the existing server endpoints, but some functionality is missing because the server doesn't have all required endpoints for production use.

## Existing Endpoints (Working)

✅ **GET /api/sessions/:sessionId** - Get specific session by ID
✅ **GET /api/sessions/:sessionId/messages** - Get messages for a session  
✅ **GET /api/sessions/business/:businessId/active** - Get active sessions for business
✅ **GET /api/sessions/business/:businessId/user/:userId/active** - Get active session for user
✅ **GET /api/sessions/business/:businessId/user/:userId/history** - Get user session history

## Missing Endpoints (Required for Production)

❌ **POST /api/sessions** - Create new session

## Required Implementation

### 1. Create New Session Endpoint

```typescript
@Post()
async createSession(
  @Body() createSessionDto: CreateSessionDto
): Promise<Session> {
  this.logger.log(`Creating new session for user ${createSessionDto.userId} in business ${createSessionDto.businessId}`);
  
  try {
    const session = await this.sessionService.createSession(
      createSessionDto.businessId,
      createSessionDto.locationId || 'L0100001', // Default location
      createSessionDto.userId,
      createSessionDto.sessionType || 'general'
    );
    
    this.logger.log(`✅ Session created: ${session.sessionId}`);
    return session;
  } catch (error) {
    this.logger.error(`Error creating session:`, error);
    throw error;
  }
}
```

### 2. CreateSessionDto Interface

```typescript
export interface CreateSessionDto {
  businessId: string;
  userId: string;
  locationId?: string;
  sessionType?: string;
}
```

### 3. Update Session Endpoint (Optional but Recommended)

```typescript
@Patch(':sessionId')
async updateSession(
  @Param('sessionId') sessionId: string,
  @Body() updateSessionDto: UpdateSessionDto
): Promise<Session> {
  this.logger.log(`Updating session: ${sessionId}`);
  
  try {
    const session = await this.sessionService.updateSession(sessionId, updateSessionDto);
    
    if (!session) {
      this.logger.warn(`Session not found: ${sessionId}`);
      throw new NotFoundException(`Session ${sessionId} not found`);
    }
    
    return session;
  } catch (error) {
    this.logger.error(`Error updating session ${sessionId}:`, error);
    throw error;
  }
}
```

### 4. Delete Session Endpoint (Optional)

```typescript
@Delete(':sessionId')
async deleteSession(@Param('sessionId') sessionId: string): Promise<void> {
  this.logger.log(`Deleting session: ${sessionId}`);
  
  try {
    const deleted = await this.sessionService.deleteSession(sessionId);
    
    if (!deleted) {
      this.logger.warn(`Session not found: ${sessionId}`);
      throw new NotFoundException(`Session ${sessionId} not found`);
    }
    
    this.logger.log(`✅ Session deleted: ${sessionId}`);
  } catch (error) {
    this.logger.error(`Error deleting session ${sessionId}:`, error);
    throw error;
  }
}
```

## Current Workaround

The client currently handles the missing session creation endpoint by:

1. **Checking for existing active session first**
2. **If no active session exists**, throwing a helpful error message
3. **Suggesting server implementation**

```javascript
// Current client behavior
try {
  const activeSession = await this.getActiveSessionForUser(businessId, userId);
  if (activeSession) {
    return activeSession; // Use existing session
  }
} catch (error) {
  // No active session found
}

// Throw helpful error
throw new Error(`No active session found for user ${userId} in business ${businessId}. Server needs to implement session creation endpoint (POST /api/sessions) or ensure users have active sessions.`);
```

## Session Lifecycle Flow

### Current Flow (Limited)
```
1. Check for active session ✅
2. If found → use it ✅
3. If not found → throw error ❌
```

### Desired Flow (With POST /api/sessions)
```
1. Check for active session ✅
2. If found → use it ✅
3. If not found → create new session ✅
4. Return new session ✅
```

## Testing the Implementation

### 1. Test Session Creation
```bash
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "B0100001",
    "userId": "user_123",
    "locationId": "L001",
    "sessionType": "general"
  }'
```

### 2. Test Session Retrieval
```bash
curl http://localhost:3000/api/sessions/business/B0100001/user/user_123/active
```

### 3. Test Session History
```bash
curl "http://localhost:3000/api/sessions/business/B0100001/user/user_123/history?limit=20"
```

## Priority

**HIGH PRIORITY**: Implement `POST /api/sessions` endpoint to enable full session management functionality.

**MEDIUM PRIORITY**: Implement `PATCH /api/sessions/:sessionId` for session updates.

**LOW PRIORITY**: Implement `DELETE /api/sessions/:sessionId` for session deletion.

## Benefits of Full Implementation

1. **Complete Session Management**: Users can create, retrieve, update, and delete sessions
2. **Better User Experience**: No errors when no active session exists
3. **Production Ready**: Full functionality for production deployment
4. **Consistent API**: All CRUD operations available
5. **Error Handling**: Proper error responses for all scenarios
