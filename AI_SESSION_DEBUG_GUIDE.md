# AI Session Debugging Guide

## Problema: Chat-ul nu primește sessionId la răspunsul de la agent

Când agent-ul răspunde, frontend-ul trebuie să captureze `sessionId` din răspuns pentru a-l folosi la mesajele ulterioare.

---

## Flow Normal (cum ar trebui să funcționeze)

```
1. User trimite primul mesaj FĂRĂ sessionId
   └─> Backend creează sesiune nouă
   
2. Agent răspunde CU sessionId în payload
   └─> Frontend capturează sessionId din răspuns
   └─> Salvează în aiWebSocketService.currentSessionId
   └─> Notifică prin onSessionUpdate
   └─> Hook actualizează toate serviciile
   └─> aiAssistantService.updateSessionId() salvează în localStorage
   
3. User trimite al doilea mesaj CU sessionId
   └─> Backend procesează în sesiunea existentă
   └─> Agent răspunde
   └─> Conversația continuă
```

---

## Logging Detaliat Adăugat

Am adăugat logging detaliat în următoarele locuri:

### 1. aiWebSocketService.handleNewMessage()

```javascript
Logger.log('info', 'Extracted message data', {
  content: '...',
  responseId: '...',
  timestamp: '...',
  sessionId: '...', // ← VERIFICĂ AICI
  currentSessionId: '...', // ← sessionId curent
  hasContent: true/false,
  isChunk: true/false,
  isComplete: true/false,
  payloadKeys: ['...'], // ← toate cheile din payload
  hasSessionInPayload: true/false // ← dacă sessionId există
});
```

**Ce să cauți:**
- ✅ `hasSessionInPayload: true` - sessionId este în payload
- ❌ `hasSessionInPayload: false` - sessionId LIPSEȘTE din payload

### 2. aiWebSocketService.handleNewMessage() - Capturare sessionId

```javascript
// Dacă sessionId este găsit:
Logger.log('info', '🆕 Captured session ID from first message', { 
  sessionId: '...',
  source: 'new_message'
});

// Apoi:
Logger.log('info', 'Session ID captured from backend response');
```

**Ce să cauți:**
- ✅ Apare mesajul "🆕 Captured session ID from first message"
- ✅ `sessionId` are o valoare (nu null/undefined)

### 3. useAIAssistant.onSessionUpdate()

```javascript
Logger.log('info', '🔄 WebSocket session update received in hook', {
  payload: {...},
  hasSessionId: true/false, // ← VERIFICĂ
  sessionId: '...',
  currentSessionIdBefore: '...' // sessionId înainte de update
});

Logger.log('info', '📝 Updating session ID in all services', {
  newSessionId: '...',
  oldSessionId: '...',
  source: '...'
});

Logger.log('info', '✅ Session ID fully updated in hook and saved to localStorage', { 
  sessionId: '...'
});
```

**Ce să cauți:**
- ✅ `hasSessionId: true`
- ✅ Mesajul "✅ Session ID fully updated in hook"
- ❌ "⚠️ Session update payload has no sessionId" - payload-ul nu are sessionId

### 4. aiAssistantService.updateSessionId()

```javascript
Logger.log('info', '🔄 updateSessionId called', {
  newSessionId: '...',
  oldSessionId: '...',
  businessId: '...',
  userId: '...',
  willUpdate: true/false
});

Logger.log('info', '✅ New session ID saved to localStorage', {
  sessionId: '...',
  date: '2025-10-14',
  businessId: '...',
  userId: '...',
  saved: true/false // ← VERIFICĂ dacă s-a salvat
});
```

**Ce să cauți:**
- ✅ `willUpdate: true`
- ✅ `saved: true` - salvat cu succes în localStorage
- ❌ `saved: false` - EROARE la salvare

### 5. aiWebSocketService.sendMessage() - Al doilea mesaj

```javascript
Logger.log('info', '📤 AIWebSocketService sending message', {
  content: '...',
  currentSessionId: '...', // ← VERIFICĂ AICI
  sessionIdType: 'string'/'null',
  hasContext: true/false,
  isFirstMessage: true/false, // ← ar trebui FALSE
  streamingMessagesCount: 0
});

Logger.log('info', '✅ Set session ID in AI instance', { 
  sessionId: '...' // ← sessionId setat
});
```

**Ce să cauți:**
- ✅ `currentSessionId` are valoare (nu null)
- ✅ `isFirstMessage: false` - nu mai e primul mesaj
- ✅ Apare "✅ Set session ID in AI instance"

---

## Scenarii de Debugging

### Scenario 1: sessionId nu vine în payload

**Symptom:**
```javascript
// În console:
'Extracted message data' {
  sessionId: undefined,
  hasSessionInPayload: false,
  payloadKeys: ['content', 'message', 'timestamp']
}
```

**Cauza:** Backend nu trimite sessionId în răspuns

**Soluție:**
1. Verifică în backend că sessionId este inclus în răspuns
2. Verifică structura payload-ului de la Elixir
3. Poate că sessionId vine cu alt nume de câmp (verifică `payloadKeys`)

### Scenario 2: sessionId vine dar nu este capturat

**Symptom:**
```javascript
// În console:
'Extracted message data' {
  sessionId: 'session_123',
  hasSessionInPayload: true
}

// DAR nu apare:
'🆕 Captured session ID from first message'
```

**Cauza:** Condiția de capturare nu se îndeplinește

**Verificări:**
```javascript
// Verifică în aiWebSocketService.handleNewMessage():
if (sessionId && !this.currentSessionId) {
  // Această condiție trebuie să fie TRUE
}
```

**Soluție:**
1. Verifică dacă `this.currentSessionId` deja are o valoare (de ce?)
2. Poate că un mesaj anterior a setat deja sessionId

### Scenario 3: sessionId capturat dar nu salvat în localStorage

**Symptom:**
```javascript
// În console:
'🆕 Captured session ID from first message'
'🔄 WebSocket session update received in hook'
'📝 Updating session ID in all services'

// DAR:
'❌ saveSessionToStorage result: false'
```

**Cauza:** Eroare la salvare în localStorage

**Verificări:**
1. Verifică erori în console de la `sessionStorage.js`
2. localStorage poate fi blocat de browser (incognito mode?)
3. Verifică dacă businessId/userId sunt corecte

### Scenario 4: sessionId salvat dar nu folosit la al doilea mesaj

**Symptom:**
```javascript
// La primul mesaj:
'✅ New session ID saved to localStorage' { sessionId: 'session_123' }

// La al doilea mesaj:
'📤 AIWebSocketService sending message' {
  currentSessionId: null, // ← GREȘIT!
  isFirstMessage: true
}
```

**Cauza:** sessionId nu este sincronizat între servicii

**Verificări:**
1. Verifică dacă `webSocketRef.current.setCurrentSessionId()` a fost apelat
2. Verifică dacă `aiServiceRef.current.updateSessionId()` a fost apelat
3. Verifică în localStorage dacă cheia există:
   ```javascript
   // În browser console:
   localStorage.getItem(`ai_session:${businessId}:${userId}:2025-10-14`)
   ```

### Scenario 5: Mesaje cu streaming nu capturează sessionId

**Symptom:**
```javascript
// Chunk-uri primite:
'📦 Received streaming chunk' { isComplete: false }
'📦 Received streaming chunk' { isComplete: false }
'📦 Received streaming chunk' { isComplete: true }

// DAR sessionId nu este capturat
```

**Cauza:** sessionId vine doar în ultimul chunk sau deloc

**Soluție:**
1. Verifică în TOATE chunk-urile dacă vine sessionId
2. Poate că sessionId vine într-un eveniment separat (nu în chunk-uri)
3. Backend trebuie să trimită sessionId în PRIMUL chunk sau într-un eveniment separat

---

## Quick Checks în Browser Console

### 1. Verifică localStorage

```javascript
// Vezi toate sesiunile
Object.keys(localStorage).filter(k => k.startsWith('ai_session:'))

// Vezi sesiunea de azi
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
localStorage.getItem(`ai_session:BUSINESS_ID:USER_ID:${today}`)
```

### 2. Verifică currentSessionId în servicii

```javascript
// În aiWebSocketService
console.log('WebSocket sessionId:', webSocketRef.current?.currentSessionId);

// În aiAssistantService
console.log('AI Service sessionId:', aiServiceRef.current?.currentSessionId);
```

### 3. Verifică payload-ul WebSocket

Pune breakpoint în `aiWebSocketService.handleNewMessage()` și inspectează:
```javascript
console.log('Full payload:', payload);
console.log('Message data:', messageData);
console.log('Session ID:', sessionId);
console.log('Payload keys:', Object.keys(messageData));
```

---

## Pași de Debugging Recomandat

### Step 1: Verifică dacă sessionId vine în payload

1. Deschide Developer Console (F12)
2. Mergi la tab-ul Console
3. Trimite un mesaj în chat
4. Caută în console log-ul:
   ```
   'Extracted message data'
   ```
5. Verifică:
   - `sessionId`: are valoare?
   - `hasSessionInPayload`: true?
   - `payloadKeys`: ce chei sunt în payload?

**Dacă sessionId LIPSEȘTE:**
- Problema este în backend/Elixir
- Backend nu trimite sessionId în răspuns

**Dacă sessionId EXISTĂ:**
- Mergi la Step 2

### Step 2: Verifică dacă sessionId este capturat

1. Caută în console:
   ```
   '🆕 Captured session ID from first message'
   ```

**Dacă NU apare:**
- Verifică dacă `this.currentSessionId` deja are valoare
- Verifică condiția: `if (sessionId && !this.currentSessionId)`

**Dacă APARE:**
- Mergi la Step 3

### Step 3: Verifică dacă sessionId ajunge în hook

1. Caută în console:
   ```
   '🔄 WebSocket session update received in hook'
   ```

**Dacă NU apare:**
- `onSessionUpdate` callback nu este setat corect
- Verifică în `useAIAssistant.js` că callback-ul este setat

**Dacă APARE:**
- Verifică `hasSessionId: true`
- Mergi la Step 4

### Step 4: Verifică dacă sessionId este salvat în localStorage

1. Caută în console:
   ```
   '✅ New session ID saved to localStorage'
   ```
2. Verifică `saved: true`

**Dacă saved: false:**
- Verifică localStorage în browser
- Verifică erori în console

**Dacă saved: true:**
- Mergi la Step 5

### Step 5: Verifică dacă sessionId este folosit la al doilea mesaj

1. Trimite al doilea mesaj
2. Caută în console:
   ```
   '📤 AIWebSocketService sending message'
   ```
3. Verifică:
   - `currentSessionId`: are valoare?
   - `isFirstMessage`: FALSE?

**Dacă currentSessionId e null:**
- sessionId nu este sincronizat corect între servicii
- Verifică dacă `setCurrentSessionId()` a fost apelat

**Dacă currentSessionId are valoare:**
- ✅ TOTUL FUNCȚIONEAZĂ CORECT!

---

## Soluții Rapide

### Fix 1: Backend nu trimite sessionId

**Locație:** Backend (Python/Elixir)

Asigură-te că payload-ul include sessionId:
```python
# Backend trebuie să trimită:
{
  "message": "Agent response",
  "session_id": "session_123", # ← IMPORTANT
  "message_id": "msg_456",
  "isChunk": True/False
}
```

### Fix 2: sessionId vine cu alt nume

**Locație:** `aiWebSocketService.js` linia 335-341

Adaugă varianta corectă:
```javascript
const sessionId = messageData.sessionId || 
                 messageData.session_id || 
                 messageData.session?.id ||
                 messageData.YOUR_CUSTOM_FIELD || // ← Adaugă aici
                 payload.session_id ||
                 payload.sessionId;
```

### Fix 3: onSessionUpdate nu este apelat

**Locație:** `aiWebSocketService.js` linia 355-365

Verifică că callback-ul este setat:
```javascript
if (this.onSessionUpdate) {
  this.onSessionUpdate({
    sessionId: sessionId,
    status: 'active',
    metadata: { ... }
  });
} else {
  Logger.log('warn', 'onSessionUpdate callback not set'); // ← Ar trebui să apară
}
```

### Fix 4: localStorage blocat

**Locație:** Browser

1. Verifică dacă ești în incognito mode
2. Verifică setările browser-ului pentru localStorage
3. Încearcă în alt browser

---

## Expected Flow în Console

Când totul funcționează corect, ar trebui să vezi:

```
[AI WebSocket INFO] Extracted message data
  sessionId: "session_abc123"
  hasSessionInPayload: true
  
[AI WebSocket INFO] 🆕 Captured session ID from first message
  sessionId: "session_abc123"
  
[AI WebSocket INFO] Session ID captured from backend response

[useAIAssistant INFO] 🔄 WebSocket session update received in hook
  sessionId: "session_abc123"
  hasSessionId: true
  
[useAIAssistant INFO] 📝 Updating session ID in all services
  newSessionId: "session_abc123"
  
[AI Assistant INFO] 🔄 updateSessionId called
  newSessionId: "session_abc123"
  willUpdate: true
  
[AI Assistant INFO] ✅ New session ID saved to localStorage
  sessionId: "session_abc123"
  saved: true
  
[useAIAssistant INFO] ✅ Session ID fully updated in hook and saved to localStorage
  sessionId: "session_abc123"

// La al doilea mesaj:
[AI WebSocket INFO] 📤 AIWebSocketService sending message
  currentSessionId: "session_abc123"  ← ✅ CORECT!
  isFirstMessage: false               ← ✅ CORECT!
  
[AI WebSocket INFO] ✅ Set session ID in AI instance
  sessionId: "session_abc123"
```

---

## Concluzie

Cu logging-ul detaliat adăugat, ar trebui să poți identifica exact unde se oprește flow-ul:

1. ❌ sessionId nu vine în payload → **Backend issue**
2. ❌ sessionId vine dar nu e capturat → **Condiție de capturare**
3. ❌ sessionId capturat dar nu notifică hook → **onSessionUpdate callback**
4. ❌ sessionId ajunge în hook dar nu se salvează → **localStorage issue**
5. ❌ sessionId salvat dar nu folosit la al 2-lea mesaj → **Sincronizare servicii**

Folosește acest ghid pentru a urmări log-urile și a identifica exact unde este problema! 🔍

