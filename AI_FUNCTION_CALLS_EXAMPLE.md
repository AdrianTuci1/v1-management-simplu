# AI Function Calls - Exemple Practice

## 📋 Cum să folosești AI Function Calls în aplicație

---

## 1️⃣ Utilizare în Hook (useAIAssistant.js)

### Varianta Automată (Recomandată)

Function calls-urile sunt deja conectate automat! Nu trebuie să faci nimic suplimentar.

```javascript
// În useAIAssistant.js - function calls sunt gestionate automat
const aiService = createAIWebSocketService(businessId, userId, locationId);

// Conectează-te
await aiService.connect();

// Trimite un mesaj - AI poate apela funcții automat
await aiService.sendMessage("Creează o programare pentru Ion Popescu mâine la 10:00");

// AI va primi mesajul, va decide să apeleze createResource, 
// va primi răspunsul și va răspunde utilizatorului
```

**Flow automat:**
1. 🤖 AI primește mesajul
2. 🧠 AI decide să creeze o programare
3. 📞 AI apelează `createResource`
4. ✅ Frontend execută și returnează rezultatul
5. 💬 AI răspunde utilizatorului: "Am creat programarea pentru Ion Popescu..."

---

### Varianta cu Callback Custom (Opțional)

Dacă vrei să fii notificat când AI apelează o funcție:

```javascript
// În useAIAssistant.js
const aiService = createAIWebSocketService(businessId, userId, locationId);

// Adaugă callback pentru notificări
aiService.onFunctionCall = (payload, result) => {
  console.log('🔔 AI a apelat o funcție:', payload.functionName);
  console.log('📊 Rezultat:', result);
  
  // Poți face ceva custom aici
  // Ex: afișează o notificare în UI
  toast.success(`AI a ${payload.functionName} cu succes!`);
};

await aiService.connect();
```

---

## 2️⃣ Exemplu Complet: Component React

```javascript
// components/AIAssistantWithFunctionCalls.jsx
import React, { useState, useEffect } from 'react';
import { useAIAssistant } from '../hooks/useAIAssistant';
import { toast } from 'react-hot-toast';

export function AIAssistantWithFunctionCalls() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [functionCallsLog, setFunctionCallsLog] = useState([]);
  
  const {
    sendMessage,
    isConnected,
    connect,
    disconnect
  } = useAIAssistant({
    onMessage: (newMessages) => {
      setMessages(prev => [...prev, ...newMessages]);
    },
    onFunctionCall: (payload, result) => {
      // Log function calls pentru debugging
      setFunctionCallsLog(prev => [...prev, {
        timestamp: new Date(),
        function: payload.functionName,
        parameters: payload.parameters,
        result: result,
        success: result.success
      }]);
      
      // Afișează notificare
      if (result.success) {
        toast.success(`✅ ${payload.functionName} executat cu succes`);
      } else {
        toast.error(`❌ ${payload.functionName} a eșuat`);
      }
    }
  });
  
  useEffect(() => {
    connect();
    return () => disconnect();
  }, []);
  
  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Adaugă mesajul utilizatorului
    setMessages(prev => [...prev, {
      content: input,
      type: 'user',
      timestamp: new Date().toISOString()
    }]);
    
    // Trimite către AI
    await sendMessage(input);
    setInput('');
  };
  
  return (
    <div className="flex h-screen">
      {/* Panoul principal de chat */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl p-4 rounded-lg ${
                  msg.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>
        
        <div className="border-t p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Întreabă AI-ul..."
              className="flex-1 px-4 py-2 border rounded-lg"
            />
            <button
              onClick={handleSend}
              disabled={!isConnected}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
            >
              Trimite
            </button>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Status: {isConnected ? '✅ Conectat' : '❌ Deconectat'}
          </div>
        </div>
      </div>
      
      {/* Panoul de debugging pentru function calls */}
      <div className="w-96 border-l bg-gray-50 p-4 overflow-y-auto">
        <h3 className="font-bold mb-4">🔧 Function Calls Log</h3>
        <div className="space-y-2">
          {functionCallsLog.map((log, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border ${
                log.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="font-semibold text-sm">
                {log.success ? '✅' : '❌'} {log.function}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {new Date(log.timestamp).toLocaleTimeString()}
              </div>
              <details className="mt-2 text-xs">
                <summary className="cursor-pointer text-gray-700">
                  Detalii
                </summary>
                <pre className="mt-2 bg-white p-2 rounded overflow-x-auto">
                  {JSON.stringify(log, null, 2)}
                </pre>
              </details>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## 3️⃣ Exemple de Conversații cu Function Calls

### Exemplu 1: Creare Programare

**User:** "Creează o programare pentru Ion Popescu mâine la 10:00"

**AI internă:**
1. Parsează cererea
2. Determină că trebuie să creeze o programare
3. Apelează funcția:

```javascript
{
  functionName: "createResource",
  parameters: {
    resourceType: "appointment",
    data: {
      patientName: "Ion Popescu",
      date: "2024-01-26",
      time: "10:00"
    }
  }
}
```

**Frontend:**
1. ✅ Execută prin DataFacade
2. 📤 Returnează rezultatul către AI

**AI răspunde:**
"✅ Am creat programarea pentru Ion Popescu pe 26 ianuarie 2024 la ora 10:00. ID-ul programării este A123456."

---

### Exemplu 2: Căutare și Update

**User:** "Schimbă programarea lui Ion Popescu de mâine la ora 14:00"

**AI internă:**
1. 🔍 Caută programarea:
```javascript
{
  functionName: "searchResources",
  parameters: {
    resourceType: "appointment",
    searchField: "patientName",
    searchTerm: "Ion Popescu",
    additionalFilters: {
      date: "2024-01-26"
    }
  }
}
```

2. ✏️ Actualizează programarea:
```javascript
{
  functionName: "updateResource",
  parameters: {
    resourceType: "appointment",
    id: "A123456",
    data: {
      time: "14:00"
    }
  }
}
```

**AI răspunde:**
"✅ Am modificat programarea lui Ion Popescu pentru 26 ianuarie 2024 la ora 14:00."

---

### Exemplu 3: Query Complex

**User:** "Arată-mi toate programările de azi pentru Dr. Popescu"

**AI internă:**
```javascript
{
  functionName: "queryResources",
  parameters: {
    resourceType: "appointment",
    params: {
      date: "2024-01-25",
      doctorId: "D001",
      limit: 100
    }
  }
}
```

**AI răspunde:**
"📋 Dr. Popescu are 5 programări astăzi:
1. 09:00 - Maria Ionescu (Consultație)
2. 10:00 - Ion Popescu (Control)
3. 11:30 - Ana Georgescu (Tratament)
4. 14:00 - Vasile Popa (Consultație)
5. 15:30 - Elena Dumitrescu (Control)

Vrei să fac vreo modificare?"

---

## 4️⃣ Debugging și Monitoring

### Verificare Status în Consolă

```javascript
// În browser console
const status = window.dataFacade.getAgentWebSocketStatus();
console.log(status);
// {
//   hasDataFacade: true,
//   availableFunctions: ['createResource', 'updateResource', ...],
//   authenticatedAgents: 0,
//   pendingCalls: 0
// }
```

### Vizualizare Function Calls din IndexedDB

```javascript
// În browser console
const db = await window.indexedDB.open('MyDatabase', 1);
const tx = db.transaction('aiFunctionCalls', 'readonly');
const store = tx.objectStore('aiFunctionCalls');
const calls = await store.getAll();
console.table(calls);
```

### Live Monitoring

```javascript
// Monitorizează toate function calls în timp real
import { dataFacade } from './data/DataFacade';

const originalExecute = dataFacade.executeAIFunctionCall.bind(dataFacade);
dataFacade.executeAIFunctionCall = async (payload, callback) => {
  console.group(`🔧 AI Function Call: ${payload.functionName}`);
  console.log('📥 Payload:', payload);
  console.time('⏱️ Execution Time');
  
  try {
    const result = await originalExecute(payload, callback);
    console.log('📤 Result:', result);
    console.timeEnd('⏱️ Execution Time');
    console.groupEnd();
    return result;
  } catch (error) {
    console.error('❌ Error:', error);
    console.timeEnd('⏱️ Execution Time');
    console.groupEnd();
    throw error;
  }
};
```

---

## 5️⃣ Best Practices

### ✅ DO:
- ✅ Lasă sistemul să gestioneze automat function calls
- ✅ Folosește `onFunctionCall` callback doar pentru notificări UI
- ✅ Loghează erorile pentru debugging
- ✅ Testează function calls în consolă înainte de producție

### ❌ DON'T:
- ❌ Nu bloca execuția function calls
- ❌ Nu modifica payload-ul în `onFunctionCall`
- ❌ Nu executa manual operațiuni CRUD în paralel
- ❌ Nu ignora erorile returnate

---

## 6️⃣ Troubleshooting

### Problem: Function calls nu sunt executate

**Check:**
```javascript
// 1. Verifică conexiunea WebSocket
console.log('Connected:', aiService.isConnected);

// 2. Verifică DataFacade
console.log('DataFacade:', window.dataFacade.getAgentWebSocketStatus());

// 3. Verifică log-urile în consolă
// Caută: "🔧 AI Assistant instance function call"
```

---

### Problem: Răspunsul nu ajunge la AI

**Check:**
```javascript
// Verifică că worker-ul trimite răspunsul
// Caută în consolă: "✅ Function response sent to AI"

// Verifică WebSocket status
console.log(aiService.getConnectionStatus());
```

---

### Problem: Erori la execuție

**Check:**
```javascript
// Verifică parametrii function call
// Asigură-te că resourceType există în DataFacade
const repos = dataFacade.getAllRepositories();
console.log('Available resources:', Array.from(repos.keys()));

// Verifică că datele sunt valide
// Ex: pentru appointment trebuie date, time, etc.
```

---

## 7️⃣ Testing

### Test Unitar

```javascript
// test/agentWebSocketHandler.test.js
import { agentWebSocketHandler } from '../src/data/infrastructure/agentWebSocketHandler';
import { dataFacade } from '../src/data/DataFacade';

describe('AgentWebSocketHandler', () => {
  beforeEach(() => {
    agentWebSocketHandler.setDataFacade(dataFacade);
  });

  it('should execute createResource', async () => {
    const payload = {
      callId: 'test_123',
      functionName: 'createResource',
      parameters: {
        resourceType: 'patient',
        data: {
          name: 'Test Patient',
          phone: '0721111111'
        }
      }
    };

    const result = await agentWebSocketHandler.executeAIFunctionCall(payload);
    
    expect(result.success).toBe(true);
    expect(result.result.resource).toBeDefined();
    expect(result.result.resource.name).toBe('Test Patient');
  });
});
```

---

## 🎓 Concluzie

Sistemul este configurat să funcționeze **automat**! 

Trebuie doar să:
1. ✅ Conectezi AI WebSocket service
2. ✅ Trimiți mesaje către AI
3. ✅ AI va apela funcțiile automat
4. ✅ Răspunsurile sunt trimise automat înapoi

**Simplu și eficient!** 🚀

