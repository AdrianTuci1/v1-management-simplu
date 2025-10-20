# Agent Logs Integration

## Descriere

Această implementare permite afișarea și actualizarea în timp real a log-urilor generate de agent în interfața `OperationsActivities`.

## Componente Implementate

### 1. **Agent Log Service** (`src/services/agentLogService.js`)

Serviciu simplu pentru gestionarea operațiunilor cu log-urile agentului.

**Caracteristici:**
- ✅ Nu folosește IndexedDB (doar date în timp real)
- ✅ Încarcă date de la endpoint `/resources/{businessId}-{locationId}` cu header `X-Resource-Type: agent-log`
- ✅ Suport pentru filtrare (dată, service, status, category)
- ✅ Suport pentru paginare
- ✅ Funcții pentru căutare și statistici

**Metode principale:**
```javascript
// Încarcă log-uri cu filtre
await agentLogService.getAgentLogs({
  page: 1,
  limit: 50,
  date: '2025-10-20',
  service: 'sms',
  status: 'success'
})

// Obține un log specific
await agentLogService.getAgentLogById(logId)

// Caută în log-uri
await agentLogService.searchAgentLogs('programare')

// Obține statistici
await agentLogService.getAgentLogStats({ date: '2025-10-20' })
```

### 2. **useAgentLogs Hook** (`src/hooks/useAgentLogs.js`)

Hook React pentru gestionarea stării log-urilor în componente.

**Caracteristici:**
- ✅ Shared state între toate instanțele hook-ului
- ✅ WebSocket subscription pentru actualizări în timp real
- ✅ Transformare automată a datelor pentru UI
- ✅ Notificarea tuturor subscriber-ilor la modificări

**Folosire:**
```javascript
import { useAgentLogs } from '../../hooks/useAgentLogs.js'

function MyComponent() {
  const { logs, loading, error, loadAgentLogs, getLogById } = useAgentLogs()
  
  useEffect(() => {
    loadAgentLogs(1, 50, { date: '2025-10-20' })
  }, [])
  
  return (
    // ... render logs
  )
}
```

### 3. **OperationsActivities Component** (actualizat)

Componenta principală pentru afișarea activităților agentului.

**Modificări:**
- ✅ Folosește `useAgentLogs` în loc de date mock
- ✅ Încarcă date automat când se schimbă data selectată
- ✅ Afișează loading state și error handling
- ✅ Păstrează date mock pentru backwards compatibility (dacă nu există date reale)

## Flux de Date

```
┌─────────────────────────────────────────────────────────────┐
│                    OperationsActivities                      │
│                   (UI Component)                             │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ useAgentLogs()
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    useAgentLogs Hook                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Shared State │  │   Loading    │  │    Error     │      │
│  │   (logs[])   │  │   (boolean)  │  │   (string)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────┬────────────────────────────────────────┬─────────┘
           │                                        │
           │ agentLogService                        │ WebSocket
           ▼                                        ▼
┌──────────────────────────┐          ┌──────────────────────┐
│   agentLogService        │          │  websocketClient.js  │
│   (API calls)            │          │  (Real-time updates) │
└──────────┬───────────────┘          └──────────┬───────────┘
           │                                      │
           │ GET /resources                       │ Subscribe to
           │ X-Resource-Type: agent-log           │ 'agent-log' messages
           ▼                                      ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend Server                          │
│              (Elixir Phoenix - Resources)                    │
└─────────────────────────────────────────────────────────────┘
```

## WebSocket Integration

Hook-ul se abonează automat la mesajele WebSocket pentru tipul de resursă `agent-log`:

**Tipuri de mesaje suportate:**
- `resource_created` / `create` - Adaugă noul log în listă
- `resource_updated` / `update` - Actualizează log-ul existent
- `resource_deleted` / `delete` - Elimină log-ul din listă

**Variante de nume acceptate:**
- `agent-logs` (PRINCIPAL - plural cu cratimă)
- `agent-log` (singular cu cratimă)
- `agent_logs` (plural cu underscore)
- `agent_log` (singular cu underscore)

## Structura Datelor

### Log Format (Backend → Frontend)

**Format Backend (așa cum vine de la server):**

```typescript
{
  resourceType: 'agent-logs',  // Plural pentru consistență cu alte resurse
  resourceId: 'log-a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  operation: 'create',
  businessId: 'B0100001',
  locationId: 'L0100001',
  data: {
    actionType: 'voice_call',      // voice_call, sms, email, social
    subAction: 'call_ended',       // call_ended, message_sent, etc.
    agentSessionId: 'conv_abc456',
    triggeredBy: 'elevenlabs',     // elevenlabs, bedrock_agent
    provider: 'elevenlabs',
    externalId: 'conv_abc456',
    metadata: {
      conversationId: 'conv_abc456',
      callDuration: 42,            // secunde
      cost: 350,                   // cost în unități (Eleven Labs, etc.)
      startTime: 1739537297,       // Unix timestamp
      status: 'done',              // done, failed, pending
      transcriptLength: 15,        // număr de mesaje în transcript
      transcriptAvailable: true,
      deliveryStatus: 'delivered'  // delivered, failed, pending
    }
  },
  timestamp: '2025-10-19T10:00:00Z',
  requestId: 'req-uuid-here'
}
```

**Format UI (după transformare în hook):**

```javascript
{
  id: "log-a1b2c3d4...",
  resourceId: "log-a1b2c3d4...",
  timestamp: Date,                 // Obiect Date JavaScript
  action: "PATCH",                 // POST, PATCH (mapate din actionType)
  resourceType: "voice_call",      // Păstrat din actionType
  service: "elevenLabs",           // Normalizat din triggeredBy/provider
  description: "Apel vocal finalizat",  // Generat automat
  details: "Durată: 42s, 15 mesaje în transcript",  // Generat automat
  status: "success",               // Derivat din metadata.status
  priority: "high",                // Derivat din actionType și status
  category: "appointment",         // Derivat din actionType
  // Date originale păstrate
  actionType: "voice_call",
  subAction: "call_ended",
  agentSessionId: "conv_abc456",
  triggeredBy: "elevenlabs",
  provider: "elevenlabs",
  externalId: "conv_abc456",
  metadata: { ... },               // Toate metadatele originale
  context: { ... },                // Extras pentru backwards compatibility
  _rawData: { ... }                // Toate datele originale din backend
}
```

### Transformare UI

Hook-ul (`useAgentLogs`) transformă automat datele din backend pentru UI:

**Mapări automate:**
- `actionType` → `action` (POST/PATCH)
- `triggeredBy`/`provider` → `service` (elevenLabs, bedrock, etc.)
- `metadata.status` → `status` (success, error, pending)
- Generează `description` bazată pe `actionType` și `subAction`
- Generează `details` bazate pe `metadata`
- Determină `priority` în funcție de `actionType` și `metadata.status`
- Determină `category` în funcție de `actionType`

**Transformări speciale:**
- Unix timestamp (`startTime`) → JavaScript `Date` object
- `status: 'done'` + `deliveryStatus: 'delivered'` → `status: 'success'`
- `status: 'failed'` → `status: 'error'` + `priority: 'high'`

## Diferențe față de alte resurse (ex: patients)

| Aspect | Patients | Agent Logs |
|--------|----------|------------|
| **IndexedDB** | ✅ Da (cache local) | ❌ Nu (doar live data) |
| **Drafts** | ✅ Da (DraftAwareRepository) | ❌ Nu |
| **CRUD Operations** | ✅ Create, Update, Delete | ❌ Doar Read |
| **WebSocket** | ✅ Da | ✅ Da |
| **Business Manager** | ✅ patientManager | ❌ Nu (transformări simple) |
| **Optimistic Updates** | ✅ Da | ❌ Nu (doar server data) |

## Testare

Pentru a testa implementarea:

1. **Backend Mock Data**
   - Trimite date de test prin endpoint-ul `/resources/{businessId}-{locationId}`
   - Header: `X-Resource-Type: agent-logs` (PLURAL)
   - Structura: vezi "Exemplu Backend Response" mai sus

2. **WebSocket Testing**
   - Trimite mesaje prin WebSocket cu `resourceType: 'agent-logs'`
   - Verifică actualizarea automată în UI
   - Test cu toate variantele: `agent-logs`, `agent-log`, `agent_logs`, `agent_log`

3. **Filtrare**
   - Selectează o dată în date picker
   - Verifică că se încarcă doar log-urile pentru data respectivă
   - Folosește query param: `data.date=2025-10-20`

4. **Test cu Elixir Backend**
   ```elixir
   # Structura mesajului de trimis
   %{
     resource_type: "agent-logs",
     resource_id: "log-uuid",
     operation: "create",
     business_id: "B0100001",
     location_id: "L0100001",
     data: %{
       action_type: "voice_call",
       sub_action: "call_ended",
       triggered_by: "elevenlabs",
       metadata: %{
         status: "done",
         call_duration: 42
       }
     },
     timestamp: DateTime.utc_now()
   }
   ```

## Exemplu Backend Response

### Răspuns la GET /resources/{businessId}-{locationId}

```json
{
  "data": [
    {
      "resourceType": "agent-logs",
      "resourceId": "log-a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "operation": "create",
      "businessId": "B0100001",
      "locationId": "L0100001",
      "data": {
        "actionType": "voice_call",
        "subAction": "call_ended",
        "agentSessionId": "conv_abc456",
        "triggeredBy": "elevenlabs",
        "provider": "elevenlabs",
        "externalId": "conv_abc456",
        "metadata": {
          "conversationId": "conv_abc456",
          "callDuration": 42,
          "cost": 350,
          "startTime": 1739537297,
          "status": "done",
          "transcriptLength": 15,
          "transcriptAvailable": true,
          "deliveryStatus": "delivered"
        }
      },
      "timestamp": "2025-10-19T10:00:00Z",
      "requestId": "req-uuid-here"
    }
  ]
}
```

### WebSocket Message Example

```json
{
  "type": "resource_created",
  "resourceType": "agent-logs",
  "data": {
    "id": "log-new-uuid",
    "resourceId": "log-new-uuid",
    "data": {
      "actionType": "voice_call",
      "subAction": "call_ended",
      "metadata": {
        "status": "done",
        "callDuration": 65,
        "transcriptLength": 8
      }
    },
    "timestamp": "2025-10-20T11:30:00Z"
  }
}
```

## Extensii Viitoare

Potențiale îmbunătățiri:
- [ ] Filtrare avansată (multiple servicii, range de date)
- [ ] Export log-uri (CSV, JSON)
- [ ] Alerting pentru log-uri cu erori
- [ ] Dashboard cu statistici agregare
- [ ] Retention policy (ștergere automată log-uri vechi)

## Troubleshooting

### Log-urile nu se încarcă
- Verifică că backend-ul returnează date pentru resource type `agent-log`
- Verifică autentificarea (token Cognito)
- Verifică console-ul pentru erori de network

### WebSocket nu actualizează
- Verifică că WebSocket-ul este conectat (status indicator)
- Verifică că mesajele au `resourceType: 'agent-log'`
- Verifică că nu sunt erori în handler-ul WebSocket

### Date mock în loc de date reale
- Normală la prima încărcare până când backend-ul răspunde
- Persistă dacă backend-ul returnează array gol
- Verifică parametrii de filtrare (data, etc.)

