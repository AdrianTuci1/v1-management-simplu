# AI Assistant Streaming Implementation

## Prezentare Generală

Această implementare suportă răspunsuri AI în **chunk-uri progresive** (streaming), permițând afișarea textului pe măsură ce este generat, oferind o experiență mai bună utilizatorului.

## Arhitectură

```
Backend (Elixir) → Phoenix Channels → Frontend React
     │                    │                  │
     │                    │                  │
  Generează           Broadcast          Concatenează
  chunk-uri        "new_message"         chunk-uri
     │              cu flag-uri             │
     └──────────────────┴─────────────────┘
```

---

## Flow-ul de Streaming

### 1. Backend trimite chunk-uri

Backend-ul (Python/Elixir) generează răspunsul AI în chunk-uri și le trimite la Phoenix:

```elixir
# Backend trimite chunk-uri
%{
  message_id: "msg_123",
  session_id: "session_abc",
  message: "Hello", # chunk de text
  isChunk: true,
  isComplete: false,
  timestamp: "2025-10-14T10:00:00Z"
}

# ... apoi chunk-uri ulterioare
%{
  message_id: "msg_123", # același ID
  message: " world", # următorul chunk
  isChunk: true,
  isComplete: false
}

# ... și în final
%{
  message_id: "msg_123",
  message: "!",
  isChunk: true,
  isComplete: true # ultimul chunk
}
```

### 2. Elixir broadcast-ează ca "new_message"

Phoenix Channels primește chunk-urile și le broadcast-ează pe topic-ul `messages:{businessId}`:

```elixir
# Phoenix broadcast
Phoenix.PubSub.broadcast(
  MyApp.PubSub,
  "messages:#{business_id}",
  {:new_message, payload}
)
```

### 3. Frontend procesează chunk-urile

Frontend-ul React ascultă evenimentele `new_message` și:
- Detectează `isChunk: true`
- Concatenează textul la mesajul existent
- Finalizează când `isComplete: true`

```javascript
// aiWebSocketService.js
handleNewMessage(payload) {
  const isChunk = payload.isChunk || payload.streaming?.isChunk;
  const isComplete = payload.isComplete || payload.streaming?.isComplete;
  
  if (isChunk) {
    // Get or create streaming message
    let streamingMessage = this.streamingMessages.get(messageId);
    
    if (!streamingMessage) {
      // First chunk - create new message
      streamingMessage = {
        messageId,
        content: content,
        isStreaming: true,
        isComplete: false
      };
      this.streamingMessages.set(messageId, streamingMessage);
    } else {
      // Concatenate chunk
      streamingMessage.content += content;
      streamingMessage.isComplete = isComplete;
    }
    
    // Notify UI
    this.onStreamingUpdate?.(streamingMessage);
    
    // If complete, remove from map
    if (isComplete) {
      this.streamingMessages.delete(messageId);
    }
  }
}
```

---

## Structura Mesajelor

### Mesaj Chunk (isChunk: true)

```json
{
  "messageId": "msg_123",
  "sessionId": "session_abc",
  "businessId": "biz_456",
  "userId": "agent",
  "content": "Hello", // chunk de text
  "type": "agent",
  "timestamp": "2025-10-14T10:00:00.000Z",
  "isStreaming": true,
  "isComplete": false, // mai urmează chunk-uri
  "metadata": {
    "source": "websocket",
    "streaming": true
  }
}
```

### Mesaj Complet (isComplete: true)

```json
{
  "messageId": "msg_123",
  "sessionId": "session_abc",
  "businessId": "biz_456",
  "userId": "agent",
  "content": "Hello world!", // text complet concatenat
  "type": "agent",
  "timestamp": "2025-10-14T10:00:00.000Z",
  "isStreaming": false,
  "isComplete": true, // ultimul chunk
  "metadata": {
    "source": "websocket",
    "streaming": true
  }
}
```

### Mesaj Non-Streaming (isChunk: false)

```json
{
  "messageId": "msg_124",
  "sessionId": "session_abc",
  "content": "Complete message",
  "isStreaming": false,
  "isComplete": true
}
```

---

## Implementare în Cod

### 1. aiWebSocketService.js

```javascript
class AIWebSocketService {
  constructor(businessId, userId, locationId) {
    // ...
    
    // Streaming message state
    this.streamingMessages = new Map(); // Map<messageId, {content, metadata}>
    
    // Callbacks
    this.onStreamingUpdate = null; // Callback pentru streaming updates
  }
  
  handleNewMessage(payload) {
    // Extract streaming flags
    const isChunk = messageData.isChunk || messageData.streaming?.isChunk || false;
    const isComplete = messageData.isComplete || messageData.streaming?.isComplete || false;
    
    if (isChunk) {
      // Handle streaming chunk
      let streamingMessage = this.streamingMessages.get(messageId);
      
      if (!streamingMessage) {
        // First chunk
        streamingMessage = createNewStreamingMessage();
        this.streamingMessages.set(messageId, streamingMessage);
      } else {
        // Concatenate chunk
        streamingMessage.content += content;
        streamingMessage.isComplete = isComplete;
      }
      
      // Notify UI
      this.onStreamingUpdate?.(streamingMessage);
      this.onMessageReceived?.([streamingMessage]);
      
      // Cleanup if complete
      if (isComplete) {
        this.streamingMessages.delete(messageId);
      }
    } else {
      // Handle complete message
      const completeMessage = createCompleteMessage();
      this.onMessageReceived?.([completeMessage]);
    }
  }
}
```

### 2. useAIAssistant.js

```javascript
// Message handler - handles both complete and streaming messages
webSocketRef.current.onMessageReceived = (newMessages) => {
  setMessages(prev => {
    const existingMessageIndex = prev.findIndex(
      m => m.messageId === newMessages[0]?.messageId
    );
    
    if (existingMessageIndex >= 0 && newMessages[0]?.isStreaming) {
      // Update existing streaming message
      const updated = [...prev];
      updated[existingMessageIndex] = newMessages[0];
      return updated;
    } else if (existingMessageIndex >= 0 && newMessages[0]?.isComplete) {
      // Finalize streaming message
      const updated = [...prev];
      updated[existingMessageIndex] = newMessages[0];
      return updated;
    } else {
      // Add new messages
      const existingIds = new Set(prev.map(m => m.messageId));
      const filteredNew = newMessages.filter(m => !existingIds.has(m.messageId));
      return [...prev, ...filteredNew];
    }
  });
};

// Streaming update handler
webSocketRef.current.onStreamingUpdate = (streamingMessage) => {
  // Pass through to onMessageReceived
  webSocketRef.current.onMessageReceived([streamingMessage]);
};
```

### 3. UI Component (AIAssistant.jsx)

```jsx
function AIAssistant() {
  const { messages } = useAIAssistant(businessId, userId);
  
  return (
    <div>
      {messages.map(message => (
        <div key={message.messageId}>
          <span>{message.content}</span>
          {message.isStreaming && <LoadingDots />}
        </div>
      ))}
    </div>
  );
}
```

---

## Detectarea Flag-urilor de Streaming

Frontend-ul suportă multiple formate pentru flag-urile de streaming:

```javascript
// Variante pentru isChunk
const isChunk = 
  messageData.isChunk ||              // Direct în payload
  messageData.streaming?.isChunk ||   // În obiect streaming
  false;

// Variante pentru isComplete
const isComplete = 
  messageData.isComplete ||           // Direct în payload
  messageData.streaming?.isComplete || // În obiect streaming
  false;
```

### Exemple de payload-uri acceptate

**Varianta 1: Flag-uri directe**
```json
{
  "message": "Hello",
  "isChunk": true,
  "isComplete": false
}
```

**Varianta 2: Flag-uri în obiect streaming**
```json
{
  "message": "Hello",
  "streaming": {
    "isChunk": true,
    "isComplete": false
  }
}
```

**Varianta 3: Mesaj complet (fără streaming)**
```json
{
  "message": "Complete message"
  // isChunk și isComplete lipsesc sau false
}
```

---

## State Management

### streamingMessages Map

```javascript
// Map structure
{
  "msg_123": {
    messageId: "msg_123",
    content: "Hello wor", // concatenat până acum
    isStreaming: true,
    isComplete: false,
    // ... alte proprietăți
  }
}
```

### Cleanup

```javascript
// După finalizare (isComplete: true)
this.streamingMessages.delete(messageId);

// La dispose
this.streamingMessages.clear();
```

---

## Logging și Debugging

### Log messages importante

```javascript
// Chunk primit
'📦 Received streaming chunk'
{
  messageId: "msg_123",
  chunkLength: 5,
  isComplete: false
}

// Mesaj nou de streaming
'🆕 Created new streaming message'
{
  messageId: "msg_123",
  contentLength: 5
}

// Chunk concatenat
'➕ Concatenated chunk to streaming message'
{
  messageId: "msg_123",
  totalLength: 15,
  isComplete: false
}

// Streaming finalizat
'✅ Streaming message completed'
{
  messageId: "msg_123",
  finalLength: 20
}

// Update în hook
'🔄 Updated streaming message in hook'
{
  messageId: "msg_123",
  contentLength: 15,
  isComplete: false
}

// Mesaj finalizat în hook
'✅ Completed streaming message in hook'
{
  messageId: "msg_123",
  finalLength: 20
}
```

### Debugging în Browser Console

```javascript
// Verifică mesaje în streaming
webSocketRef.current.streamingMessages

// Verifică toate mesajele
messages.filter(m => m.isStreaming)

// Verifică mesaje finalizate
messages.filter(m => m.isComplete && m.metadata?.streaming)
```

---

## Scenarii de Testare

### 1. Răspuns normal (fără streaming)

**Backend trimite:**
```json
{
  "message_id": "msg_1",
  "message": "Complete response",
  "isChunk": false
}
```

**Frontend afișează:**
- Mesaj complet apare imediat
- `isStreaming: false`
- `isComplete: true`

### 2. Răspuns cu streaming (3 chunk-uri)

**Backend trimite:**

Chunk 1:
```json
{
  "message_id": "msg_2",
  "message": "Hello",
  "isChunk": true,
  "isComplete": false
}
```

Chunk 2:
```json
{
  "message_id": "msg_2",
  "message": " world",
  "isChunk": true,
  "isComplete": false
}
```

Chunk 3:
```json
{
  "message_id": "msg_2",
  "message": "!",
  "isChunk": true,
  "isComplete": true
}
```

**Frontend afișează:**
- După chunk 1: "Hello" + loading indicator
- După chunk 2: "Hello world" + loading indicator
- După chunk 3: "Hello world!" (final, fără loading)

### 3. Mesaje multiple simultan

**Backend trimite:**
- User message (complet)
- AI response chunk 1
- AI response chunk 2
- AI response chunk 3 (complete)

**Frontend gestionează:**
- User message apare imediat
- AI response se construiește progresiv
- Ambele mesaje au ID-uri diferite

---

## Erori și Edge Cases

### 1. Chunk-uri primite în dezordine

**Problemă:** Chunk-urile nu ajung în ordine.

**Soluție:** Backend trebuie să asigure ordinea corectă. Frontend concatenează în ordinea primirii.

### 2. Chunk final lipsește

**Problemă:** `isComplete: true` nu ajunge niciodată.

**Soluție:** Implementează timeout în frontend:

```javascript
// TODO: Add timeout pentru streaming messages
setTimeout(() => {
  if (streamingMessage && !streamingMessage.isComplete) {
    // Marchează ca finalizat după timeout
    streamingMessage.isComplete = true;
    this.streamingMessages.delete(messageId);
  }
}, 30000); // 30 secunde timeout
```

### 3. Mesaje duplicate

**Problemă:** Același chunk vine de două ori.

**Soluție:** Deduplicare bazată pe messageId + chunk sequence (dacă backend trimite).

### 4. Reconectare WebSocket în timpul streaming-ului

**Problemă:** WebSocket se reconectează și chunk-urile se pierd.

**Soluție:** 
- După reconectare, reîncarcă mesajele pentru sesiune
- Mesajele incomplete sunt șterse din map
- Backend trebuie să salveze mesajele complete în DB

---

## Performance

### Optimizări

1. **Debouncing UI updates**: Update UI la fiecare N chunk-uri
2. **Batching**: Grupează chunk-uri mici
3. **Lazy rendering**: Virtualizare pentru conversații lungi

### Memory Management

```javascript
// Cleanup streaming messages
- La finalizare: delete din Map
- La dispose: clear() Map-ul
- La eroare: cleanup mesaje incomplete
```

---

## Backward Compatibility

Implementarea suportă atât mesaje cu streaming cât și fără:

```javascript
// Mesaj fără streaming (legacy)
if (!isChunk) {
  // Handle ca mesaj complet
}

// Mesaj cu streaming (nou)
if (isChunk) {
  // Handle ca streaming chunk
}
```

---

## Rezumat

### Ce face frontend-ul

1. ✅ **Ascultă** evenimente `new_message` de la Elixir
2. ✅ **Detectează** flag-uri `isChunk` și `isComplete`
3. ✅ **Concatenează** textul când `isChunk: true`
4. ✅ **Finalizează** când `isComplete: true`
5. ✅ **Update UI** progresiv pe măsură ce vin chunk-uri
6. ✅ **Cleanup** după finalizare

### Ce NU face frontend-ul

- ❌ Nu creează tipuri noi de evenimente WebSocket
- ❌ Nu controlează viteza de streaming (e în backend)
- ❌ Nu re-ordonează chunk-uri
- ❌ Nu reține chunk-uri după finalizare

### Flow simplificat

```
Backend → Elixir → "new_message" + isChunk → Frontend → Concatenează → UI
   │                                              │
   │                                              │
Chunk 1: "Hello"                    Afișează: "Hello..."
Chunk 2: " world"                   Afișează: "Hello world..."
Chunk 3: "!" (isComplete)           Afișează: "Hello world!" ✓
```

---

## Fișiere Modificate

- ✅ `src/services/aiWebSocketService.js`
  - Adăugat `streamingMessages` Map
  - Modificat `handleNewMessage()` pentru streaming
  - Adăugat callback `onStreamingUpdate`
  - Cleanup în `dispose()`

- ✅ `src/hooks/useAIAssistant.js`
  - Update `onMessageReceived` pentru streaming
  - Adăugat `onStreamingUpdate` handler
  - Logic pentru update mesaje existente vs. adăugare noi

Implementarea este completă și gata de testare! 🎉

