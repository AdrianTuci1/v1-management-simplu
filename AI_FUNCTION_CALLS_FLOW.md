# AI Function Calls - Flow Complet

## 📋 Descriere

Acest document descrie flow-ul complet pentru executarea apelurilor de funcții AI și returnarea răspunsurilor.

---

## 🔄 Flow-ul Complet

```
┌─────────────────┐
│   AI Backend    │
│   (Elixir)      │
└────────┬────────┘
         │
         │ 1. Trimite prin WebSocket
         │    Topic: messages:B0100001
         │    Event: ai_function_call
         │
         ▼
┌─────────────────────────────┐
│ ai-websocket-worker.js      │
│ (Web Worker)                │
└────────┬────────────────────┘
         │
         │ 2. Forward către main thread
         │    type: 'message'
         │    data: { type: 'ai_function_call', data: payload }
         │
         ▼
┌─────────────────────────────┐
│ websocketAiAssistant.js     │
│ handleWorkerMessage()       │
│ → handleFunctionCall()      │
└────────┬────────────────────┘
         │
         │ 3. Callback: onFunctionCall(payload)
         │
         ▼
┌─────────────────────────────┐
│ aiWebSocketService.js       │
│ onFunctionCall callback     │
└────────┬────────────────────┘
         │
         │ 4. dataFacade.executeAIFunctionCall()
         │
         ▼
┌─────────────────────────────┐
│ DataFacade.js               │
│ executeAIFunctionCall()     │
└────────┬────────────────────┘
         │
         │ 5. agentWebSocketHandler.executeAIFunctionCall()
         │
         ▼
┌─────────────────────────────┐
│ agentWebSocketHandler.js    │
│ - Identifică function name  │
│ - Apelează handler specific │
└────────┬────────────────────┘
         │
         │ 6. Handler specific (ex: handleCreateResource)
         │    dataFacade.create(resourceType, data)
         │
         ▼
┌─────────────────────────────┐
│ DraftAwareResourceRepository│
│ Execută operațiunea CRUD    │
└────────┬────────────────────┘
         │
         │ 7. Returnează rezultatul
         │
         ▼
┌─────────────────────────────┐
│ agentWebSocketHandler.js    │
│ - Loghează în DB            │
│ - Apelează responseCallback │
└────────┬────────────────────┘
         │
         │ 8. responseCallback(response)
         │
         ▼
┌─────────────────────────────┐
│ aiWebSocketService.js       │
│ sendFunctionResponse()      │
└────────┬────────────────────┘
         │
         │ 9. aiAssistantInstance.sendFunctionResponse()
         │
         ▼
┌─────────────────────────────┐
│ websocketAiAssistant.js     │
│ sendFunctionResponse()      │
└────────┬────────────────────┘
         │
         │ 10. worker.postMessage()
         │     Event: ai_function_response
         │
         ▼
┌─────────────────────────────┐
│ ai-websocket-worker.js      │
│ Trimite prin WebSocket      │
└────────┬────────────────────┘
         │
         │ 11. WebSocket send către backend
         │     Topic: messages:B0100001
         │     Event: ai_function_response
         │
         ▼
┌─────────────────┐
│   AI Backend    │
│   (Elixir)      │
└─────────────────┘
```

---

## 📨 Formatele Mesajelor

### 1. AI Function Call (Primit de la backend)

**Topic:** `messages:{businessId}`  
**Event:** `ai_function_call`

```javascript
{
  event: "ai_function_call",
  payload: {
    callId: "fc_1234567890",
    functionName: "createResource",
    parameters: {
      resourceType: "appointment",
      data: {
        patientName: "Ion Popescu",
        date: "2024-01-21",
        time: "14:00",
        doctorId: "D001",
        notes: "Control general"
      }
    },
    timestamp: "2025-10-14T10:30:00.000Z"
  }
}
```

### 2. Function Response (Trimis către backend)

**Topic:** `messages:{businessId}`  
**Event:** `ai_function_response`

```javascript
{
  event: "ai_function_response",
  payload: {
    callId: "fc_1234567890",
    functionName: "createResource",
    success: true,
    result: {
      operation: "create",
      resourceType: "appointment",
      resource: {
        id: "A123456",
        patientName: "Ion Popescu",
        date: "2024-01-21",
        time: "14:00",
        doctorId: "D001",
        notes: "Control general",
        createdAt: "2025-10-14T10:30:05.000Z"
      }
    },
    timestamp: "2025-10-14T10:30:05.000Z"
  }
}
```

### 3. Function Response (Cu eroare)

```javascript
{
  event: "ai_function_response",
  payload: {
    callId: "fc_1234567890",
    functionName: "createResource",
    success: false,
    error: "Missing required field: patientName",
    timestamp: "2025-10-14T10:30:05.000Z"
  }
}
```

---

## 🔧 Funcții Disponibile

### 1. `createResource`

Creează o resursă nouă.

**Parametri:**
```javascript
{
  resourceType: "appointment" | "patient" | "product" | "treatment" | "sale" | ...,
  data: {
    // Datele specifice resursei
  }
}
```

**Răspuns:**
```javascript
{
  operation: "create",
  resourceType: "appointment",
  resource: { /* resursa creată */ }
}
```

---

### 2. `updateResource`

Actualizează o resursă existentă.

**Parametri:**
```javascript
{
  resourceType: "appointment",
  id: "A123456",
  data: {
    // Datele actualizate
  }
}
```

**Răspuns:**
```javascript
{
  operation: "update",
  resourceType: "appointment",
  id: "A123456",
  resource: { /* resursa actualizată */ }
}
```

---

### 3. `deleteResource`

Șterge o resursă.

**Parametri:**
```javascript
{
  resourceType: "appointment",
  id: "A123456"
}
```

**Răspuns:**
```javascript
{
  operation: "delete",
  resourceType: "appointment",
  id: "A123456",
  success: true
}
```

---

### 4. `getResource`

Obține o resursă după ID.

**Parametri:**
```javascript
{
  resourceType: "appointment",
  id: "A123456"
}
```

**Răspuns:**
```javascript
{
  operation: "get",
  resourceType: "appointment",
  id: "A123456",
  resource: { /* resursa găsită */ }
}
```

---

### 5. `queryResources`

Interogează resurse cu filtre.

**Parametri:**
```javascript
{
  resourceType: "appointment",
  params: {
    date: "2024-01-21",
    doctorId: "D001",
    limit: 50
  }
}
```

**Răspuns:**
```javascript
{
  operation: "query",
  resourceType: "appointment",
  params: { /* parametrii folosiți */ },
  resources: [ /* lista de resurse */ ],
  count: 5
}
```

---

### 6. `searchResources`

Caută resurse după un câmp specific.

**Parametri:**
```javascript
{
  resourceType: "patient",
  searchField: "name",
  searchTerm: "Ion Popescu",
  limit: 50,
  additionalFilters: {
    active: true
  }
}
```

**Răspuns:**
```javascript
{
  operation: "search",
  resourceType: "patient",
  searchField: "name",
  searchTerm: "Ion Popescu",
  resources: [ /* lista de resurse găsite */ ],
  count: 3
}
```

---

## 🗄️ Logging și Persistență

Toate apelurile de funcții AI sunt loggate în IndexedDB:

### Tabel: `aiFunctionCalls`

```javascript
{
  id: "fc_1234567890",
  functionName: "createResource",
  parameters: { /* parametrii */ },
  timestamp: "2025-10-14T10:30:00.000Z",
  status: "completed" | "executing" | "failed",
  result: { /* rezultatul */ },
  error: "Error message" // doar dacă failed
  completedAt: "2025-10-14T10:30:05.000Z"
}
```

---

## 🔍 Debugging

### Verificare status

```javascript
// În consolă
const status = dataFacade.getAgentWebSocketStatus();
console.log(status);
// {
//   hasDataFacade: true,
//   availableFunctions: ['createResource', 'updateResource', ...],
//   authenticatedAgents: 0,
//   pendingCalls: 0
// }
```

### Log-uri

Toate operațiile sunt loggate cu emoji-uri distinctive:

- 🔧 Function call primit
- 📝 Create resource
- ✏️ Update resource
- 🗑️ Delete resource
- 🔍 Get resource
- 📋 Query resources
- 🔎 Search resources
- ✅ Success
- ❌ Error

---

## 🚀 Exemple de Utilizare

### Exemplu 1: Creare Programare

**AI trimite:**
```javascript
{
  event: "ai_function_call",
  payload: {
    callId: "fc_123",
    functionName: "createResource",
    parameters: {
      resourceType: "appointment",
      data: {
        patientName: "Maria Ionescu",
        date: "2024-01-25",
        time: "10:00",
        doctorId: "D002",
        treatmentType: "Consultație"
      }
    }
  }
}
```

**Frontend răspunde:**
```javascript
{
  event: "ai_function_response",
  payload: {
    callId: "fc_123",
    functionName: "createResource",
    success: true,
    result: {
      operation: "create",
      resourceType: "appointment",
      resource: {
        id: "A987654",
        patientName: "Maria Ionescu",
        date: "2024-01-25",
        time: "10:00",
        status: "scheduled",
        // ... alte câmpuri
      }
    }
  }
}
```

---

### Exemplu 2: Căutare Pacient

**AI trimite:**
```javascript
{
  event: "ai_function_call",
  payload: {
    callId: "fc_456",
    functionName: "searchResources",
    parameters: {
      resourceType: "patient",
      searchField: "phone",
      searchTerm: "0721234567",
      limit: 10
    }
  }
}
```

**Frontend răspunde:**
```javascript
{
  event: "ai_function_response",
  payload: {
    callId: "fc_456",
    functionName: "searchResources",
    success: true,
    result: {
      operation: "search",
      resourceType: "patient",
      resources: [
        {
          id: "P001",
          name: "Ion Popescu",
          phone: "0721234567",
          // ... alte câmpuri
        }
      ],
      count: 1
    }
  }
}
```

---

## 📊 Resource Types Disponibile

Toate resource types din DataFacade sunt disponibile:

- `appointment` - Programări
- `patient` - Pacienți
- `product` - Produse
- `medic` - Medici
- `treatment` - Tratamente
- `sale` - Vânzări
- `role` - Roluri
- `permission` - Permisiuni
- `setting` - Setări
- `dental-chart` - Fișe dentare
- `plan` - Planuri de tratament
- `invoice` - Facturi
- `invoice-client` - Clienți facturi

---

## ⚠️ Erori Comune

### 1. DataFacade nu este inițializat
```javascript
{
  success: false,
  error: "DataFacade not initialized"
}
```

### 2. Funcție necunoscută
```javascript
{
  success: false,
  error: "Unknown function: invalidFunction"
}
```

### 3. Parametri lipsă
```javascript
{
  success: false,
  error: "Missing resourceType or data"
}
```

### 4. WebSocket deconectat
```javascript
{
  success: false,
  error: "Cannot send function response - WebSocket not connected"
}
```

---

## 🧪 Testing

### Test manual în consolă

```javascript
// Simulează un function call
const payload = {
  callId: "test_123",
  functionName: "createResource",
  parameters: {
    resourceType: "patient",
    data: {
      name: "Test Patient",
      phone: "0721111111",
      email: "test@example.com"
    }
  }
};

// Execută
const result = await dataFacade.executeAIFunctionCall(payload, (response) => {
  console.log("Response:", response);
});

console.log("Result:", result);
```

---

## 🔐 Securitate

- Toate operațiile sunt loggate în IndexedDB
- Apelurile timeout după 30 de secunde
- Validare parametri la nivel de handler
- Gestionarea erorilor la toate nivelurile

---

## 📝 Notes

1. Toate operațiile CRUD sunt asincrone
2. Răspunsurile sunt trimise automat către AI
3. Erorile sunt capturate și returnate către AI
4. Logging-ul este activat în toate componentele

