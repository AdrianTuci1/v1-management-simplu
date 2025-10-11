# AI Services Integration Summary

## Probleme Corectate (2025-10-10)

### 1. aiAssistantService.js - Înlocuire `fetch()` cu `aiApiRequest()`

**Problemă:** 
- Serviciul folosea `fetch()` direct pentru a face cereri HTTP către API-ul de sesiuni
- Nu beneficia de funcționalitățile din `aiApiRequest()` (auth tokens, health checking, error handling)

**Soluție:**
- ✅ Înlocuit toate apelurile `fetch()` cu `aiApiRequest()` din `apiClient.js`
- ✅ Adăugat suport pentru demo mode în `loadActiveSession()`
- ✅ Simplificat error handling pentru 404 responses
- ✅ Păstrat același format de endpoint-uri conform ghidului `FRONTEND_SESSIONS_INTEGRATION.md`

**Metode actualizate:**
- `loadActiveSession()` - Încarcă sesiunea activă pentru user
- `loadMessageHistory()` - Încarcă mesajele unei sesiuni
- `sendMessage()` - Trimite mesaj prin API (fallback când WebSocket nu e disponibil)
- `switchToSession()` - Comută la o sesiune specifică
- `loadSessionHistory()` - Încarcă istoricul de sesiuni
- `getSessionById()` - Obține o sesiune după ID

### 2. Beneficii ale aiApiRequest()

`aiApiRequest()` oferă următoarele avantaje față de `fetch()` direct:

1. **Auth Token Management**
   - Adaugă automat token-ul de autentificare din localStorage
   - Folosește `id_token` sau `access_token` din Cognito

2. **Health Checking Integration**
   - Verifică dacă sistemul poate face cereri înainte de a le executa
   - Marchează serverul ca healthy/unhealthy după fiecare request
   - Blochează cererile când serverul este down (doar în non-demo mode)

3. **URL Handling Inteligent**
   - Acceptă URL-uri complete (http://localhost:3003/api/sessions/...)
   - Acceptă path-uri relative care sunt concatenate cu VITE_API_URL
   - Folosit pentru AI Agent Server (port 3003) diferit de backend-ul principal

4. **Error Handling Consistent**
   - Status codes și body-uri de eroare structurate
   - Logging consistent pentru debugging

5. **Demo Mode Support**
   - Respectă VITE_DEMO_MODE flag
   - Nu blochează cereri în demo mode

### 3. Flow-ul Sesiunilor (conform ghidului)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User Opens App                                           │
│    └─> aiAssistantService.loadActiveSession()              │
│        └─> GET /api/sessions/business/X/user/Y/active     │
│            ├─> Session exists? Use it                      │
│            └─> No session? Will create on first message   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Load Messages (if session exists)                        │
│    └─> aiAssistantService.loadMessageHistory(sessionId)    │
│        └─> GET /api/sessions/:sessionId/messages          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. User Sends Message                                        │
│    └─> aiWebSocketService.sendMessage(content, context)    │
│        └─> SocketFacade → WebSocketAIAssistant             │
│            └─> WebSocket: send message with sessionId      │
│                ├─> If sessionId empty → creates new        │
│                └─> If exists → adds to existing            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Receive AI Response via WebSocket                        │
│    └─> WebSocketAIAssistant.handleNewMessage()             │
│        └─> aiWebSocketService.onMessageReceived(messages)  │
│            └─> Hook/Component updates UI                   │
│    └─> Message auto-saved in DynamoDB (server-side)       │
└─────────────────────────────────────────────────────────────┘
```

## Arhitectură Actualizată

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────┐     ┌──────────────────────┐        │
│  │ AIAssistantService   │     │ AIWebSocketService   │        │
│  │ (Session & Messages) │     │ (Real-time Messaging)│        │
│  └──────────┬───────────┘     └──────────┬───────────┘        │
│             │ aiApiRequest               │                     │
│             │                            │                     │
│  ┌──────────▼────────────────────────────▼──────────┐         │
│  │            apiClient.js                           │         │
│  │  ┌─────────────────┐   ┌─────────────────────┐  │         │
│  │  │ aiApiRequest()  │   │  apiRequest()       │  │         │
│  │  │ (AI endpoints)  │   │  (Main backend)     │  │         │
│  │  └─────────────────┘   └─────────────────────┘  │         │
│  └───────────┬──────────────────────┬───────────────┘         │
│              │                      │                          │
│  ┌───────────▼──────────────────────▼───────────┐             │
│  │         SocketFacade                         │             │
│  │  ┌────────────────────────────────────┐     │             │
│  │  │  WebSocketAIAssistant              │     │             │
│  │  │  (Manages AI WebSocket instances)  │     │             │
│  │  └────────────────────────────────────┘     │             │
│  └───────────────────────────────────────────────┘             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                         │                        │
                         │                        │
              HTTP (REST)│                        │WebSocket
                         │                        │
┌────────────────────────▼────────────────────────▼───────────────┐
│                     Backend Services                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────┐     ┌──────────────────────────┐    │
│  │  AI Agent Server     │     │   Phoenix WebSocket      │    │
│  │  (Port 3003)         │     │   (Port 4000)            │    │
│  │  - Sessions API      │     │   - Real-time messages   │    │
│  │  - Messages API      │     │   - Agent communication  │    │
│  │  - Bedrock Agent     │     │   - Draft operations     │    │
│  └──────────┬───────────┘     └──────────────────────────┘    │
│             │                                                   │
│  ┌──────────▼───────────────────────────────────────────┐     │
│  │              DynamoDB                                 │     │
│  │              - Sessions Table                         │     │
│  │              - Messages Table                         │     │
│  └───────────────────────────────────────────────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Endpoint-uri API

### Sessions API (AI Agent Server - Port 3003)

Toate endpoint-urile sunt expuse prin AI Agent Server:

| Endpoint | Metodă | Descriere |
|----------|--------|-----------|
| `/api/sessions/business/:businessId/user/:userId/active` | GET | Obține sesiunea activă pentru user |
| `/api/sessions/business/:businessId/user/:userId/history` | GET | Obține istoricul de sesiuni (cu ?limit=N) |
| `/api/sessions/:sessionId` | GET | Obține detalii despre o sesiune |
| `/api/sessions/:sessionId/messages` | GET | Obține mesajele unei sesiuni (cu ?limit=N) |
| `/api/messages` | POST | Trimite mesaj prin HTTP (fallback) |

### Configurație în aiAssistantConfig.js

```javascript
API_ENDPOINTS: {
  MESSAGES: 'http://localhost:3003/api/messages',
  SESSIONS: 'http://localhost:3003/api/sessions',
  WEBSOCKET: 'ws://localhost:4000/socket'
}
```

## Utilizare în Componente React

### Exemplu: useAIAssistant Hook

```javascript
import { useEffect, useState } from 'react';
import { createAIAssistantService } from '../services/aiAssistantService';
import { createAIWebSocketService } from '../services/aiWebSocketService';

export function useAIAssistant(businessId, userId, locationId) {
  const [sessionService] = useState(() => 
    createAIAssistantService(businessId, userId, locationId)
  );
  
  const [wsService] = useState(() => 
    createAIWebSocketService(businessId, userId, locationId)
  );
  
  const [messages, setMessages] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Set up callbacks
    sessionService.onMessageReceived = (newMessages) => {
      setMessages(prev => [...prev, ...newMessages]);
    };
    
    sessionService.onSessionChange = (sessionId) => {
      setCurrentSessionId(sessionId);
      wsService.setCurrentSessionId(sessionId);
    };
    
    wsService.onMessageReceived = (newMessages) => {
      setMessages(prev => [...prev, ...newMessages]);
    };
    
    wsService.onConnectionChange = (connected) => {
      setIsConnected(connected);
    };
    
    // Initialize
    async function init() {
      // 1. Load active session
      await sessionService.loadActiveSession();
      
      // 2. Connect WebSocket
      await wsService.connect();
    }
    
    init();
    
    return () => {
      sessionService.dispose();
      wsService.dispose();
    };
  }, [businessId, userId, locationId]);

  const sendMessage = async (content, context = {}) => {
    if (isConnected) {
      // Use WebSocket (preferred)
      await wsService.sendMessage(content, context);
    } else {
      // Fallback to HTTP
      await sessionService.sendMessage(content, context);
    }
  };

  const startNewSession = async () => {
    await sessionService.startNewSession();
    setMessages([]);
  };

  return {
    messages,
    currentSessionId,
    isConnected,
    sendMessage,
    startNewSession,
    loadSessionHistory: () => sessionService.loadSessionHistory(),
    switchToSession: (sessionId) => sessionService.switchToSession(sessionId)
  };
}
```

## Demo Mode Support

Ambele servicii suportă demo mode:

```javascript
// .env sau .env.local
VITE_DEMO_MODE=true

// În aiAssistantService.js
this.isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

if (this.isDemoMode) {
  // Return mock data instead of making API calls
  return mockSessionData;
}
```

## Error Handling

### aiApiRequest Error Structure

```javascript
try {
  const session = await aiApiRequest(endpoint);
} catch (error) {
  // error.status - HTTP status code (404, 500, etc.)
  // error.body - Response body as text
  // error.message - Error message
  
  if (error.status === 404) {
    // Handle "not found" gracefully
    return null;
  } else {
    // Handle other errors
    throw error;
  }
}
```

## Best Practices

1. **Always use aiApiRequest() for AI Agent Server endpoints**
   - Beneficiezi de auth token management
   - Health checking automat
   - Error handling consistent

2. **Prefer WebSocket pentru mesaje în timp real**
   - Mai rapid
   - Mesajele sunt salvate automat în DynamoDB
   - Session-ul se creează automat la primul mesaj

3. **Fallback la HTTP când WebSocket nu e disponibil**
   - `aiAssistantService.sendMessage()` folosește HTTP POST
   - Util pentru debugging sau când WebSocket e down

4. **Handle 404 responses gracefully**
   - 404 pentru sesiuni active = normal (user nou)
   - 404 pentru mesaje = normal (sesiune nouă)
   - Nu arunci error, returnezi `null` sau `[]`

5. **Update session ID când primești unul nou**
   - WebSocket trimite session ID în primul mesaj
   - Actualizează atât în `aiAssistantService` cât și în `aiWebSocketService`

## Testing

### Test Active Session

```bash
curl http://localhost:3003/api/sessions/business/B0100001/user/USER_ID/active
```

### Test Session History

```bash
curl "http://localhost:3003/api/sessions/business/B0100001/user/USER_ID/history?limit=10"
```

### Test Message History

```bash
curl "http://localhost:3003/api/sessions/SESSION_ID/messages?limit=50"
```

## Troubleshooting

### Problem: "Session not found" (404)
**Soluție:** Normal pentru utilizatori noi. Session-ul va fi creat automat la primul mesaj.

### Problem: Messages not loading
**Verifică:**
1. Session ID este valid?
2. AI Agent Server rulează pe port 3003?
3. Check logs în browser console pentru detalii

### Problem: WebSocket disconnects frequently
**Soluție:**
1. Verifică `WEBSOCKET.MAX_RECONNECT_ATTEMPTS` în config
2. Verifică dacă Phoenix WebSocket server rulează
3. Check firewall/network settings

### Problem: Demo mode not working
**Verifică:**
1. `VITE_DEMO_MODE=true` în `.env`
2. Restart dev server după schimbarea .env
3. Check browser console pentru "Demo mode" logs

## Related Documentation

- `FRONTEND_SESSIONS_INTEGRATION.md` - Ghid complet pentru sesiuni
- `src/config/aiAssistantConfig.js` - Configurație AI Assistant
- `src/data/infrastructure/apiClient.js` - Implementation aiApiRequest
- `src/data/SocketFacade.js` - WebSocket facade pattern
- `src/data/infrastructure/websocketAiAssistant.js` - WebSocket AI Assistant

---

**Ultima actualizare:** 2025-10-10
**Status:** ✅ Integrat și funcțional

