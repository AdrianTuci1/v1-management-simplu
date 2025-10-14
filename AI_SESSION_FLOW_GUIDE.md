# AI Assistant Session Flow Guide

## Prezentare generală

Acest document descrie flow-ul complet de gestionare a sesiunilor AI Assistant în frontend, implementat conform specificațiilor:

1. **Conectare inițială**: Verificare sesiune activă în backend + localStorage
2. **Conectare WebSocket**: La topicul `messages:{businessId}`
3. **Trimitere mesaje**: Cu sau fără `sessionId`
4. **Persistență per zi**: localStorage cu cheia `${businessId}:${userId}:${YYYY-MM-DD}`
5. **"New chat"**: Închidere sesiune curentă și pregătire pentru sesiune nouă
6. **Istoric**: Încărcare istoric sesiuni și mesaje

---

## 1. Conectare Inițială

### Flow

```
┌─────────────────────────────────────────────────────────────┐
│ User opens AI Assistant                                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ Check localStorage for today's session                       │
│ Key: ai_session:${businessId}:${userId}:${YYYY-MM-DD}       │
└──────────────────┬──────────────────────────────────────────┘
                   │
          ┌────────┴────────┐
          │                 │
      Found?              Not Found?
          │                 │
          ▼                 ▼
┌──────────────────┐  ┌────────────────────────────────────┐
│ Verify session   │  │ GET /api/sessions/business/        │
│ exists in backend│  │     :businessId/user/:userId/active│
└────┬─────────────┘  └─────────┬──────────────────────────┘
     │                          │
     │                 ┌────────┴────────┐
     │                 │                 │
     │             Found?            Not Found?
     │                 │                 │
     ▼                 ▼                 ▼
┌──────────────────┐  ┌───────────────┐  ┌─────────────────┐
│ Load session     │  │ Load session  │  │ currentSessionId│
│ messages         │  │ messages      │  │ = null          │
│ & set as current │  │ & save to     │  │                 │
│                  │  │ localStorage  │  │ (New session    │
│                  │  │               │  │  on 1st message)│
└──────────────────┘  └───────────────┘  └─────────────────┘
```

### Cod

```javascript
// În aiAssistantService.js
async loadTodaySession() {
  // Step 1: Try localStorage
  const storedSessionId = loadSessionFromStorage(this.businessId, this.userId);
  
  if (storedSessionId) {
    // Verify with backend
    const sessionData = await this.getSessionById(storedSessionId);
    if (sessionData) {
      this.currentSessionId = storedSessionId;
      await this.loadMessageHistory(storedSessionId);
      return this.currentSessionId;
    }
  }
  
  // Step 2: Check backend for active session
  const activeSession = await this.loadActiveSession();
  if (activeSession) {
    saveSessionToStorage(this.businessId, this.userId, this.currentSessionId);
    return this.currentSessionId;
  }
  
  // Step 3: No active session - will create on first message
  this.currentSessionId = null;
  return null;
}
```

---

## 2. Conectare WebSocket

### Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Connect to ws://.../socket/websocket                         │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ Subscribe to topic: messages:${businessId}                   │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ Listen for events:                                           │
│ - new_message (răspunsuri AI)                               │
│ - ai_response (răspunsuri AI)                               │
│ - session_update (actualizări sesiune)                      │
│ - function_call (apeluri funcții)                           │
└─────────────────────────────────────────────────────────────┘
```

### Cod

```javascript
// În aiWebSocketService.js
async connect() {
  this.aiAssistantInstance = this.socketFacade.createAIAssistant(
    this.businessId, 
    this.userId, 
    this.locationId
  );
  
  // Set up event handlers
  this.aiAssistantInstance.onMessageReceived = (messages) => {
    this.onMessageReceived?.(messages);
  };
  
  this.aiAssistantInstance.onSessionUpdate = (payload) => {
    if (payload.sessionId) {
      this.currentSessionId = payload.sessionId;
      this.onSessionUpdate?.(payload);
    }
  };
  
  await this.socketFacade.connectAIAssistant(
    this.businessId, 
    this.userId, 
    this.locationId
  );
}
```

---

## 3. Trimitere Mesaje

### Flow pentru primul mesaj (fără sessionId)

```
┌─────────────────────────────────────────────────────────────┐
│ User sends first message                                     │
│ currentSessionId = null                                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ Send message via WebSocket WITHOUT sessionId                │
│ {                                                            │
│   content: "user message",                                  │
│   businessId: "...",                                        │
│   userId: "...",                                            │
│   // NO sessionId field                                     │
│ }                                                            │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend creates new session                                  │
│ Returns response with session_id                            │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ Frontend captures sessionId from response                    │
│ - handleNewMessage() or handleAIResponse()                  │
│ - Triggers onSessionUpdate callback                         │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ aiAssistantService.updateSessionId(sessionId)               │
│ - Sets currentSessionId                                     │
│ - Saves to localStorage                                     │
│   Key: ai_session:${businessId}:${userId}:${YYYY-MM-DD}    │
└─────────────────────────────────────────────────────────────┘
```

### Flow pentru mesaje ulterioare (cu sessionId)

```
┌─────────────────────────────────────────────────────────────┐
│ User sends message                                           │
│ currentSessionId = "abc123"                                 │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ Send message via WebSocket WITH sessionId                   │
│ {                                                            │
│   content: "user message",                                  │
│   businessId: "...",                                        │
│   userId: "...",                                            │
│   sessionId: "abc123"                                       │
│ }                                                            │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend processes message in existing session               │
│ Returns AI response                                         │
└─────────────────────────────────────────────────────────────┘
```

### Cod

```javascript
// În aiWebSocketService.js
async sendMessage(content, context = {}) {
  // Set session ID in instance (may be null for first message)
  if (this.currentSessionId) {
    this.aiAssistantInstance.setCurrentSessionId(this.currentSessionId);
  } else {
    // Clear session ID to force new session creation
    this.aiAssistantInstance.setCurrentSessionId(null);
    Logger.log('info', '🆕 Sending message without sessionId - backend will create new session');
  }
  
  // Send message
  const success = this.aiAssistantInstance.sendMessage(content, context);
  return success;
}

// Capture sessionId from first response
handleNewMessage(payload) {
  const sessionId = payload.sessionId || payload.session_id;
  
  // Capture session ID from first message if we don't have one yet
  if (sessionId && !this.currentSessionId) {
    this.currentSessionId = sessionId;
    
    // Trigger session update to save to localStorage
    if (this.onSessionUpdate) {
      this.onSessionUpdate({
        sessionId: sessionId,
        status: 'active',
        metadata: {
          source: 'first_message',
          reason: 'Session ID captured from backend response'
        }
      });
    }
  }
  
  // ... rest of message handling
}
```

---

## 4. Persistență per Zi (localStorage)

### Format cheie

```
ai_session:${businessId}:${userId}:${YYYY-MM-DD}
```

Exemplu:
```
ai_session:business_123:user_456:2025-10-14
```

### Structură date

```json
{
  "sessionId": "session_abc123",
  "businessId": "business_123",
  "userId": "user_456",
  "date": "2025-10-14",
  "savedAt": "2025-10-14T10:30:00.000Z",
  "lastAccessed": "2025-10-14T14:45:00.000Z"
}
```

### Funcții utilitare

```javascript
// sessionStorage.js

// Save session to localStorage
export const saveSessionToStorage = (businessId, userId, sessionId, date = null) => {
  const key = getSessionStorageKey(businessId, userId, date);
  const data = {
    sessionId,
    businessId,
    userId,
    date: date || getTodayKey(),
    savedAt: new Date().toISOString(),
    lastAccessed: new Date().toISOString()
  };
  localStorage.setItem(key, JSON.stringify(data));
};

// Load session from localStorage
export const loadSessionFromStorage = (businessId, userId, date = null) => {
  const key = getSessionStorageKey(businessId, userId, date);
  const stored = localStorage.getItem(key);
  
  if (!stored) return null;
  
  const data = JSON.parse(stored);
  data.lastAccessed = new Date().toISOString();
  localStorage.setItem(key, JSON.stringify(data));
  
  return data.sessionId;
};

// Remove session from localStorage
export const removeSessionFromStorage = (businessId, userId, date = null) => {
  const key = getSessionStorageKey(businessId, userId, date);
  localStorage.removeItem(key);
};

// Cleanup old sessions (older than N days)
export const cleanupOldSessions = (businessId, userId, daysToKeep = 30) => {
  // Removes sessions older than daysToKeep
  // Called on service initialization
};
```

---

## 5. "New Chat" (Închidere Sesiune)

### Flow

```
┌─────────────────────────────────────────────────────────────┐
│ User clicks "New Chat"                                       │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ aiAssistantService.closeSession('resolved')                 │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ Try to mark session as closed on backend                    │
│ POST /api/sessions/:sessionId/close                         │
│ { status: 'resolved' }                                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ Remove session from localStorage                            │
│ removeSessionFromStorage(businessId, userId)                │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ Clear local state                                           │
│ - currentSessionId = null                                   │
│ - messageHistory = []                                       │
│ - Notify UI via onSessionChange(null)                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ Ready for new session                                       │
│ (Will be created on first message)                         │
└─────────────────────────────────────────────────────────────┘
```

### Alternativă

Dacă endpoint-ul `/close` nu este disponibil, următorul mesaj trimis **fără** `sessionId` va forța crearea unei sesiuni noi:

```javascript
// aiAssistantService.js
async startNewSession() {
  // Remove current session from localStorage
  if (this.currentSessionId) {
    removeSessionFromStorage(this.businessId, this.userId);
  }
  
  // Clear state
  this.currentSessionId = null;
  this.messageHistory = [];
  
  // Notify UI
  this.onMessageReceived?.([]);
  this.onSessionChange?.(null);
  
  return { 
    success: true, 
    sessionId: null,
    message: 'Session will be created when first message is sent'
  };
}
```

---

## 6. Istoric Sesiuni și Mesaje

### Sidebar - Istoric Sesiuni

```javascript
// Load session history
GET /api/sessions/business/:businessId/user/:userId/history?limit=20

// Response
[
  {
    "sessionId": "session_abc123",
    "businessId": "business_123",
    "userId": "user_456",
    "createdAt": "2025-10-14T10:00:00.000Z",
    "updatedAt": "2025-10-14T12:30:00.000Z",
    "status": "active",
    "messageCount": 15
  },
  // ...
]
```

### Thread Curent - Mesaje

```javascript
// Load messages for session
GET /api/sessions/:sessionId/messages?limit=50&before=messageId

// Response
[
  {
    "messageId": "msg_123",
    "sessionId": "session_abc123",
    "userId": "user_456",
    "content": "Hello AI",
    "type": "user",
    "timestamp": "2025-10-14T10:01:00.000Z"
  },
  {
    "messageId": "msg_124",
    "sessionId": "session_abc123",
    "userId": "agent",
    "content": "Hello! How can I help?",
    "type": "agent",
    "timestamp": "2025-10-14T10:01:05.000Z"
  },
  // ...
]
```

### Switch între sesiuni

```javascript
// useAIAssistant.js
const switchToSession = async (sessionId) => {
  // Clear current messages
  setMessages([]);
  
  // Switch session in AI service
  const sessionData = await aiServiceRef.current.switchToSession(sessionId);
  
  // Update state
  setCurrentSessionId(sessionId);
  
  // Update WebSocket
  if (webSocketRef.current) {
    webSocketRef.current.setCurrentSessionId(sessionId);
  }
  
  // Messages are loaded automatically via onMessageReceived callback
};
```

---

## Rezumat Flow-ului Complet

### La deschiderea aplicației

1. ✅ Check localStorage pentru sesiune de azi
2. ✅ Dacă există, verifică în backend că sesiunea este validă
3. ✅ Dacă nu există, check backend pentru sesiune activă
4. ✅ Dacă nu există nici acolo, `currentSessionId = null`
5. ✅ Conectare WebSocket la `messages:{businessId}`

### La trimiterea primului mesaj (fără sesiune)

1. ✅ Trimite mesaj **fără** `sessionId`
2. ✅ Backend creează sesiune nouă
3. ✅ Captează `sessionId` din primul răspuns
4. ✅ Salvează în `localStorage` cu cheia `${businessId}:${userId}:${YYYY-MM-DD}`
5. ✅ Setează `currentSessionId` în toate serviciile

### La trimiterea mesajelor ulterioare

1. ✅ Trimite mesaj **cu** `sessionId` curent
2. ✅ Backend procesează în sesiunea existentă
3. ✅ Primește răspunsuri prin WebSocket

### La "New Chat"

1. ✅ Marchează sesiunea curentă ca închisă (POST `/sessions/:id/close`)
2. ✅ Șterge din localStorage
3. ✅ Resetează `currentSessionId = null`
4. ✅ Următorul mesaj va crea sesiune nouă

---

## Fișiere Modificate

### Noi

- ✅ `src/utils/sessionStorage.js` - Utilități pentru localStorage

### Modificate

- ✅ `src/services/aiAssistantService.js`
  - Import sessionStorage utilities
  - `loadTodaySession()` - Check localStorage first, then backend
  - `startNewSession()` - Nu mai creează temp ID, șterge localStorage
  - `updateSessionId()` - Salvează în localStorage
  - `closeSession()` - Șterge din localStorage
  - `switchToSession()` - Salvează în localStorage
  - `loadSession()` - Salvează în localStorage
  - `getCurrentSessionInfo()` - Elimină logica de temp session
  - `hasActiveSession()` - Simplificat

- ✅ `src/services/aiWebSocketService.js`
  - `handleNewMessage()` - Capturează sessionId din primul mesaj
  - `handleAIResponse()` - Capturează sessionId din primul răspuns
  - `sendMessage()` - Trimite cu sau fără sessionId

- ✅ `src/hooks/useAIAssistant.js`
  - `loadTodaySession()` - Setează sessionId din rezultat
  - `onSessionUpdate` - Salvează în localStorage prin updateSessionId
  - `sendMessage()` - Handle sessionId null pentru primul mesaj
  - `startNewSession()` - Elimină logica de temp ID

---

## Testare

### Scenarii de testat

1. **Primul utilizator (nu există sesiuni)**
   - [ ] Deschide AI Assistant
   - [ ] Verifică că `currentSessionId = null`
   - [ ] Trimite primul mesaj
   - [ ] Verifică că `sessionId` apare în localStorage
   - [ ] Verifică că mesajul apare în UI

2. **Utilizator existent (sesiune în localStorage)**
   - [ ] Deschide AI Assistant
   - [ ] Verifică că sesiunea se încarcă din localStorage
   - [ ] Verifică că mesajele se încarcă din backend
   - [ ] Trimite mesaj nou
   - [ ] Verifică că mesajul apare în conversație

3. **"New Chat"**
   - [ ] Click pe "New Chat"
   - [ ] Verifică că sesiunea a fost ștearsă din localStorage
   - [ ] Verifică că `currentSessionId = null`
   - [ ] Verifică că UI este gol
   - [ ] Trimite mesaj nou
   - [ ] Verifică că se creează sesiune nouă

4. **Switch între sesiuni**
   - [ ] Deschide sidebar cu istoric
   - [ ] Click pe o sesiune din istoric
   - [ ] Verifică că mesajele se încarcă corect
   - [ ] Verifică că se salvează în localStorage

5. **Cleanup localStorage (peste 30 zile)**
   - [ ] Creează sesiuni vechi în localStorage
   - [ ] Deschide AI Assistant
   - [ ] Verifică că sesiunile vechi au fost șterse

---

## Debugging

### Log messages importante

```javascript
// sessionStorage.js
'[SessionStorage] Session saved to localStorage'
'[SessionStorage] Session loaded from localStorage'
'[SessionStorage] Session removed from localStorage'

// aiAssistantService.js
'🔍 Loading today\'s session'
'💾 Found stored session in localStorage'
'🌐 No valid localStorage session, checking backend for active session'
'🆕 No active session found, will create new session on first message'
'🔄 Session ID updated from WebSocket'
'✅ New session created with ID from backend and saved to localStorage'

// aiWebSocketService.js
'🆕 Captured session ID from first message'
'🆕 Sending message without sessionId - backend will create new session'
'🔄 Updating session ID from message'

// useAIAssistant.js
'✅ Session ID updated in hook and saved to localStorage'
'✅ Message sent via WebSocket'
```

### localStorage inspection

```javascript
// În browser console
// Vezi toate sesiunile
Object.keys(localStorage).filter(k => k.startsWith('ai_session:'))

// Vezi sesiunea de azi
localStorage.getItem(`ai_session:${businessId}:${userId}:${today}`)
```

---

## Concluzie

Acest flow implementează complet specificațiile:

1. ✅ **Conectare inițială**: localStorage → backend active session
2. ✅ **WebSocket**: Topic `messages:{businessId}`
3. ✅ **Primul mesaj**: Fără sessionId, capturare din răspuns
4. ✅ **Persistență**: localStorage per zi cu cheia specifică
5. ✅ **New chat**: Închidere sesiune + resetare state
6. ✅ **Istoric**: API endpoints pentru sesiuni și mesaje

Flow-ul este robust, cu fallback-uri și logging detaliat pentru debugging.

