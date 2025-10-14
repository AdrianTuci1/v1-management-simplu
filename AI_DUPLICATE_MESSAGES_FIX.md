# Fix pentru Mesaje Duplicate în AI Chat

## Problema

Răspunsurile de la agent apăreau de **2 ori** în același mesaj (răspuns dublat).

## Cauza

Duplicarea venea din două surse:

### 1. Dublă notificare în streaming

În `aiWebSocketService.js`, pentru mesajele cu streaming, notificam UI-ul de **DOUĂ ori**:

```javascript
// ❌ ÎNAINTE (GREȘIT)
// Notify UI about streaming update
if (this.onStreamingUpdate) {
  this.onStreamingUpdate(streamingMessage);  // ← Prima notificare
}

// Also notify onMessageReceived for backward compatibility
if (this.onMessageReceived) {
  this.onMessageReceived([streamingMessage]); // ← A doua notificare
}
```

Apoi în `useAIAssistant.js`, `onStreamingUpdate` apela din nou `onMessageReceived`:

```javascript
// ❌ ÎNAINTE (GREȘIT)
webSocketRef.current.onStreamingUpdate = (streamingMessage) => {
  // Handle streaming updates by passing through onMessageReceived
  if (webSocketRef.current.onMessageReceived) {
    webSocketRef.current.onMessageReceived([streamingMessage]); // ← A treia notificare!
  }
};
```

**Rezultat:** Același mesaj era notificat de 2-3 ori!

### 2. Logic incorect de adăugare în hook

În hook-ul `onMessageReceived`, logica de adăugare nu procesa corect array-ul de mesaje și putea crea duplicate.

---

## Soluția

### 1. Eliminat dublă notificare pentru streaming

**În `aiWebSocketService.js`:**

```javascript
// ✅ DUPĂ (CORECT)
// Notify UI about streaming update (only one callback)
if (this.onMessageReceived) {
  this.onMessageReceived([streamingMessage]);
  Logger.log('debug', '📤 Notified onMessageReceived for streaming chunk');
} else {
  Logger.log('warn', 'onMessageReceived callback not set for streaming chunk');
}
```

- ❌ Eliminat apelul către `onStreamingUpdate`
- ✅ Păstrat doar `onMessageReceived`

**În `useAIAssistant.js`:**

```javascript
// ✅ DUPĂ (CORECT)
// Streaming update handler - REMOVED to avoid duplicates
// Streaming messages are now handled directly through onMessageReceived
```

- ❌ Eliminat complet `onStreamingUpdate` handler
- ✅ Tot streaming-ul merge prin `onMessageReceived`

### 2. Îmbunătățit logica de procesare în hook

**În `useAIAssistant.js`:**

```javascript
// ✅ DUPĂ (CORECT)
setMessages(prev => {
  // Process each new message
  let updated = [...prev];
  
  for (const newMessage of newMessages) {
    const existingIndex = updated.findIndex(m => m.messageId === newMessage.messageId);
    
    if (existingIndex >= 0) {
      // Message exists - UPDATE it (for streaming or corrections)
      updated[existingIndex] = newMessage;
    } else {
      // New message - ADD it
      updated.push(newMessage);
    }
  }
  
  return updated;
});
```

**Beneficii:**
- ✅ Procesează fiecare mesaj individual
- ✅ Verifică dacă mesajul există deja (prin `messageId`)
- ✅ Update în loc de adăugare dacă există
- ✅ Logging detaliat pentru fiecare operație

### 3. Adăugat logging pentru detectare duplicate

**În `aiWebSocketService.js`:**

```javascript
Logger.log('info', 'Processing worker message', { 
  type, 
  messageId, // ← Log messageId pentru detectare duplicate
  payloadType: typeof payload,
  payloadKeys: payload ? Object.keys(payload) : 'no payload'
});
```

Acum putem vedea în console dacă același `messageId` vine de mai multe ori.

---

## Verificare

### 1. Verifică în Console

După fix, ar trebui să vezi:

```javascript
// La primirea unui mesaj:
'Processing worker message' {
  type: 'new_message',
  messageId: 'msg_123' // ← notează ID-ul
}

'Handling new_message type' { messageId: 'msg_123' }

'📤 Notified onMessageReceived for streaming chunk' // ← O SINGURĂ dată

// În hook:
'🎯 Hook received messages from WebSocket' {
  messageCount: 1, // ← DOAR 1 mesaj
  messageIds: ['msg_123']
}

'➕ Adding new message' { messageId: 'msg_123' } // ← Prima dată

// Dacă vine din nou același messageId (chunk streaming):
'🔄 Updating existing message' { messageId: 'msg_123' } // ← Update, NU adăugare
```

### 2. Verifică dacă vin duplicate prin canale diferite

Dacă același `messageId` apare de 2 ori în console cu **type diferit**:

```javascript
// ❌ DUPLICAT (BAD):
'Processing worker message' { type: 'new_message', messageId: 'msg_123' }
'Processing worker message' { type: 'ai_response', messageId: 'msg_123' }
```

Înseamnă că backend trimite același mesaj prin 2 canale diferite. În acest caz, **problema e în backend**, nu în frontend.

### 3. Verifică în UI

- ✅ Un mesaj de la agent ar trebui să apară **o singură dată**
- ✅ Pentru streaming, mesajul se **actualizează** (nu se adaugă din nou)
- ❌ Dacă mesajul apare de 2 ori, verifică log-urile din pașii de mai sus

---

## Scenarii de Testare

### Scenario 1: Mesaj simplu (fără streaming)

**Input:** User trimite "Hello"
**Expected:**
1. Agent răspunde "Hi there!"
2. Mesajul apare **o singură dată** în chat
3. În console: `messageCount: 1`, `added: 1`

### Scenario 2: Mesaj cu streaming (3 chunk-uri)

**Input:** User trimite "Tell me a story"
**Expected:**

Chunk 1:
```
'➕ Adding new message' { messageId: 'msg_story' }
Content: "Once"
```

Chunk 2:
```
'🔄 Updating existing message' { messageId: 'msg_story' }
Content: "Once upon"
```

Chunk 3:
```
'🔄 Updating existing message' { messageId: 'msg_story' }
Content: "Once upon a time"
```

**Result:** Mesajul apare **o singură dată**, dar conținutul se actualizează progresiv.

### Scenario 3: Mesaje multiple rapid

**Input:** User trimite 3 mesaje rapid
**Expected:**
1. 3 mesaje de la user în chat
2. 3 răspunsuri de la agent în chat
3. **FĂRĂ duplicate**
4. Total: 6 mesaje în chat

---

## Modificări în Fișiere

### Modificate

1. **`src/services/aiWebSocketService.js`**
   - Eliminat dublă notificare în `handleNewMessage()` pentru streaming
   - Adăugat `messageId` în logging pentru `handleWorkerMessage()`

2. **`src/hooks/useAIAssistant.js`**
   - Eliminat `onStreamingUpdate` handler complet
   - Refactorizat `onMessageReceived` pentru procesare corectă a mesajelor
   - Adăugat logging detaliat pentru update vs. add

---

## Rezumat

### Ce am schimbat

1. ✅ **Eliminat dublă notificare** pentru streaming messages
2. ✅ **Eliminat `onStreamingUpdate`** handler (nu mai e necesar)
3. ✅ **Îmbunătățit logica de procesare** în hook (update vs. add)
4. ✅ **Adăugat logging** pentru detectare duplicate

### Rezultat

- ✅ Mesajele de la agent apar **o singură dată**
- ✅ Streaming funcționează corect (update progresiv)
- ✅ Nu mai sunt duplicate în chat
- ✅ Logging detaliat pentru debugging

### Verificare Rapidă

Dacă vezi în console:
- ✅ `messageCount: 1` → CORECT
- ✅ `added: 1` pentru mesaj nou → CORECT
- ✅ `🔄 Updating existing message` pentru streaming → CORECT
- ❌ `added: 2` sau mesaj apare de 2 ori → Verifică log-urile din ghid

---

## Dacă încă ai duplicate

### Verifică logging-ul:

1. **Același mesaj vine de 2 ori prin WebSocket?**
   - Caută în console: `Processing worker message` cu același `messageId`
   - Dacă DA → Problema e în backend (trimite de 2 ori)

2. **Mesajul trece prin 2 handler-uri diferite?**
   - Caută: `Handling new_message` și `Handling ai_response` cu același `messageId`
   - Dacă DA → Backend trimite prin 2 canale (trebuie ales unul)

3. **Hook-ul adaugă de 2 ori?**
   - Caută: `➕ Adding new message` de 2 ori cu același `messageId`
   - Dacă DA → Verifică logica din hook (ar trebui să fie fix-uit deja)

4. **`onMessageReceived` este apelat de 2 ori?**
   - Caută: `🎯 Hook received messages` de 2 ori rapid
   - Dacă DA → Verifică dacă ai 2 listener-i pe același event

---

## Concluzie

Fix-ul elimină duplicarea cauzată de:
1. Dublă notificare în streaming
2. Logic incorect de adăugare în hook

Cu logging-ul adăugat, poți identifica rapid dacă mai există probleme și de unde provin! 🔍

