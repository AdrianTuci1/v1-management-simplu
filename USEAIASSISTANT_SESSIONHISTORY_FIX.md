# useAIAssistant Hook - Session History Fix

## Problema Identificată

Hook-ul `useAIAssistant` avea o metodă `loadSessionHistory()` care apela `aiServiceRef.current.loadSessionHistory(limit)`, dar **nu salva rezultatul în state**. 

Aceasta înseamnă că:
- ❌ Rezultatul era returnat direct din funcție, dar nu era persistent
- ❌ Componenta trebuia să gestioneze manual state-ul pentru session history
- ❌ Nu exista un state centralizat pentru istoricul de sesiuni

## Soluția Implementată (2025-10-10)

### 1. Adăugat State pentru Session History

```javascript
// ÎNAINTE
const [messages, setMessages] = useState([]);
const [isConnected, setIsConnected] = useState(false);
const [currentSessionId, setCurrentSessionId] = useState(null);
const [isLoading, setIsLoading] = useState(false);

// ACUM ✅
const [messages, setMessages] = useState([]);
const [isConnected, setIsConnected] = useState(false);
const [currentSessionId, setCurrentSessionId] = useState(null);
const [sessionHistory, setSessionHistory] = useState([]); // ← NOU
const [isLoading, setIsLoading] = useState(false);
```

### 2. Actualizat `loadSessionHistory()` să Salveze în State

```javascript
// ÎNAINTE ❌
const loadSessionHistory = useCallback(async (limit = 20) => {
  if (!aiServiceRef.current) {
    throw new Error('AI Service not initialized');
  }

  try {
    return await aiServiceRef.current.loadSessionHistory(limit);
    // Returnează direct, dar nu salvează în state
  } catch (error) {
    setError({ message: 'Failed to load session history', error });
    throw error;
  }
}, []);

// ACUM ✅
const loadSessionHistory = useCallback(async (limit = 20) => {
  if (!aiServiceRef.current) {
    throw new Error('AI Service not initialized');
  }

  try {
    Logger.log('info', '📜 Loading session history', { limit });
    setIsLoading(true);
    
    const history = await aiServiceRef.current.loadSessionHistory(limit);
    
    // Salvează în state ← NOU
    setSessionHistory(Array.isArray(history) ? history : []);
    
    Logger.log('info', '✅ Session history loaded', { 
      count: history?.length || 0 
    });
    
    return history;
  } catch (error) {
    Logger.log('error', '❌ Failed to load session history', error);
    setError({ message: 'Failed to load session history', error });
    throw error;
  } finally {
    setIsLoading(false);
  }
}, []);
```

### 3. Adăugat `sessionHistory` în Return Value

```javascript
// ÎNAINTE
return {
  // State
  messages,
  isConnected,
  currentSessionId,
  isLoading,
  // ...
};

// ACUM ✅
return {
  // State
  messages,
  isConnected,
  currentSessionId,
  sessionHistory, // ← NOU
  isLoading,
  // ...
};
```

### 4. Actualizat `cleanupServices()` să Șteargă Session History

```javascript
const cleanupServices = useCallback(() => {
  // ...
  setMessages([]);
  setCurrentSessionId(null);
  setSessionHistory([]); // ← NOU
  setIsConnected(false);
  setConnectionStatus('disconnected');
  setError(null);
}, []);
```

### 5. Actualizat `startNewSession()` să Reîncarce History

```javascript
const startNewSession = useCallback(async () => {
  // ... create new session logic ...
  
  // Optionally reload session history to include the new session ← NOU
  try {
    const history = await aiServiceRef.current.loadSessionHistory(20);
    setSessionHistory(Array.isArray(history) ? history : []);
  } catch (historyError) {
    Logger.log('warn', 'Could not reload session history after creating new session', historyError);
  }
  
  // ...
}, []);
```

## Utilizare în Componente

### Exemplu: Afișare Session History

```jsx
import { useAIAssistant } from '../hooks/useAIAssistant';

function ChatComponent({ businessId, userId }) {
  const {
    sessionHistory,      // ← Acum disponibil în state
    currentSessionId,
    loadSessionHistory,
    switchToSession,
    startNewSession,
    isLoading
  } = useAIAssistant(businessId, userId);

  // Load session history on mount
  useEffect(() => {
    loadSessionHistory(20);
  }, [loadSessionHistory]);

  return (
    <div className="chat-container">
      {/* Sidebar cu istoric sesiuni */}
      <div className="sidebar">
        <button onClick={startNewSession}>
          + New Conversation
        </button>
        
        <h3>History</h3>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <div className="session-list">
            {sessionHistory.map(session => (
              <div
                key={session.sessionId}
                className={session.sessionId === currentSessionId ? 'active' : ''}
                onClick={() => switchToSession(session.sessionId)}
              >
                <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                <span>{session.status}</span>
                <span>{session.messageCount || 0} messages</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main chat area */}
      <div className="chat-main">
        {/* ... messages ... */}
      </div>
    </div>
  );
}
```

### Exemplu: Dropdown cu Sesiuni Recente

```jsx
function SessionDropdown({ businessId, userId }) {
  const {
    sessionHistory,
    currentSessionId,
    switchToSession,
    loadSessionHistory
  } = useAIAssistant(businessId, userId);

  useEffect(() => {
    loadSessionHistory(10); // Load last 10 sessions
  }, [loadSessionHistory]);

  return (
    <select
      value={currentSessionId || ''}
      onChange={(e) => switchToSession(e.target.value)}
    >
      <option value="">Select a session</option>
      {sessionHistory.map(session => (
        <option key={session.sessionId} value={session.sessionId}>
          {new Date(session.createdAt).toLocaleString()} - 
          {session.messageCount || 0} messages
        </option>
      ))}
    </select>
  );
}
```

### Exemplu: Card pentru Fiecare Sesiune

```jsx
function SessionCard({ session, isActive, onSelect }) {
  return (
    <div 
      className={`session-card ${isActive ? 'active' : ''}`}
      onClick={() => onSelect(session.sessionId)}
    >
      <div className="session-header">
        <span className="session-date">
          {new Date(session.createdAt).toLocaleDateString('ro-RO')}
        </span>
        <span className={`session-status ${session.status}`}>
          {session.status}
        </span>
      </div>
      
      <div className="session-info">
        <span>{session.messageCount || 0} mesaje</span>
        <span>
          Ultima activitate: {new Date(session.lastMessageAt).toLocaleTimeString('ro-RO')}
        </span>
      </div>
    </div>
  );
}

function SessionList({ businessId, userId }) {
  const {
    sessionHistory,
    currentSessionId,
    switchToSession,
    loadSessionHistory,
    isLoading
  } = useAIAssistant(businessId, userId);

  useEffect(() => {
    loadSessionHistory(20);
  }, [loadSessionHistory]);

  if (isLoading) {
    return <div>Se încarcă sesiunile...</div>;
  }

  return (
    <div className="session-list">
      {sessionHistory.map(session => (
        <SessionCard
          key={session.sessionId}
          session={session}
          isActive={session.sessionId === currentSessionId}
          onSelect={switchToSession}
        />
      ))}
    </div>
  );
}
```

## API Session History

### Structura unei sesiuni în `sessionHistory`

```typescript
interface Session {
  sessionId: string;           // ID-ul unic al sesiunii
  businessId: string;          // ID-ul business-ului
  locationId: string;          // ID-ul locației
  userId: string;              // ID-ul utilizatorului
  status: 'active' | 'resolved'; // Statusul sesiunii
  createdAt: string;           // ISO timestamp când a fost creată
  updatedAt: string;           // ISO timestamp ultima actualizare
  lastMessageAt: string;       // ISO timestamp ultimul mesaj
  messageCount?: number;       // Număr de mesaje (opțional)
  metadata?: {
    businessType: string;
    context: Record<string, any>;
  };
}
```

### Exemplu de date în `sessionHistory`

```javascript
[
  {
    sessionId: "550e8400-e29b-41d4-a716-446655440000",
    businessId: "B0100001",
    locationId: "L0100001",
    userId: "33948842-b061-7036-f02f-79b9c0b4225b",
    status: "active",
    createdAt: "2024-01-15T10:30:00.000Z",
    updatedAt: "2024-01-15T11:45:00.000Z",
    lastMessageAt: "2024-01-15T11:45:00.000Z",
    messageCount: 12,
    metadata: {
      businessType: "dental",
      context: {}
    }
  },
  {
    sessionId: "660e8400-e29b-41d4-a716-446655440001",
    businessId: "B0100001",
    locationId: "L0100001",
    userId: "33948842-b061-7036-f02f-79b9c0b4225b",
    status: "resolved",
    createdAt: "2024-01-14T09:00:00.000Z",
    updatedAt: "2024-01-14T10:00:00.000Z",
    lastMessageAt: "2024-01-14T10:00:00.000Z",
    messageCount: 8,
    metadata: {
      businessType: "dental",
      context: {}
    }
  }
]
```

## Comportament

### 1. Load Session History

```javascript
// Încarcă ultimele 20 de sesiuni
const { sessionHistory, loadSessionHistory } = useAIAssistant(businessId, userId);

await loadSessionHistory(20);
// sessionHistory este acum populat cu ultimele 20 sesiuni
```

### 2. Session History după Start New Session

```javascript
const { startNewSession } = useAIAssistant(businessId, userId);

await startNewSession();
// Session history este automat reîncărcat
// Noua sesiune va apărea în listă după ce trimiți primul mesaj
```

### 3. Session History după Switch Session

```javascript
const { switchToSession } = useAIAssistant(businessId, userId);

await switchToSession(sessionId);
// Session history rămâne neschimbat
// Doar currentSessionId și messages se actualizează
```

### 4. Session History după Cleanup

```javascript
const { reconnect } = useAIAssistant(businessId, userId);

await reconnect();
// Session history este șters
// Trebuie apelat manual loadSessionHistory() din nou
```

## Best Practices

1. **Încarcă session history la mount**
   ```javascript
   useEffect(() => {
     loadSessionHistory(20);
   }, [loadSessionHistory]);
   ```

2. **Reîncarcă history periodic pentru actualizări**
   ```javascript
   useEffect(() => {
     const interval = setInterval(() => {
       loadSessionHistory(20);
     }, 60000); // La fiecare minut
     
     return () => clearInterval(interval);
   }, [loadSessionHistory]);
   ```

3. **Verifică dacă history este gol**
   ```javascript
   if (sessionHistory.length === 0) {
     return <div>Nu există sesiuni anterioare</div>;
   }
   ```

4. **Sortează sesiunile după dată (dacă nu sunt sortate deja)**
   ```javascript
   const sortedHistory = [...sessionHistory].sort((a, b) => 
     new Date(b.createdAt) - new Date(a.createdAt)
   );
   ```

5. **Filtrează sesiuni active vs resolved**
   ```javascript
   const activeSessions = sessionHistory.filter(s => s.status === 'active');
   const resolvedSessions = sessionHistory.filter(s => s.status === 'resolved');
   ```

## Troubleshooting

### Problem: `sessionHistory` este mereu gol

**Verificări:**
1. Ai apelat `loadSessionHistory()`?
   ```javascript
   useEffect(() => {
     loadSessionHistory();
   }, [loadSessionHistory]);
   ```

2. AI Agent Server rulează pe port 3003?
   ```bash
   curl http://localhost:3003/api/sessions/business/B0100001/user/USER_ID/history?limit=20
   ```

3. Verifică console pentru erori:
   ```javascript
   const { error } = useAIAssistant(businessId, userId);
   
   useEffect(() => {
     if (error) {
       console.error('Session history error:', error);
     }
   }, [error]);
   ```

### Problem: Session history nu se actualizează

**Soluție:** Apelează manual `loadSessionHistory()` după operații:
```javascript
const handleSendMessage = async (content) => {
  await sendMessage(content);
  // Reîncarcă history pentru a vedea actualizări
  await loadSessionHistory();
};
```

### Problem: Sesiuni duplicate în listă

**Verificare:** `sessionHistory` folosește deja `sessionId` unic, dar verifică în componenta ta:
```javascript
const uniqueSessions = sessionHistory.filter((session, index, self) =>
  index === self.findIndex(s => s.sessionId === session.sessionId)
);
```

## Related Documentation

- `AI_SERVICES_INTEGRATION_SUMMARY.md` - Integrare completă AI Services
- `FRONTEND_SESSIONS_INTEGRATION.md` - Ghid API pentru sesiuni
- `src/services/aiAssistantService.js` - Service pentru sesiuni
- `src/hooks/useAIAssistant.js` - Hook-ul actualizat

---

**Ultima actualizare:** 2025-10-10  
**Status:** ✅ Corectat și funcțional  
**Versiune hook:** 2.0 (cu session history state)

