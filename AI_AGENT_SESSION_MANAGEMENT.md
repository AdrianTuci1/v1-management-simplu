# AI Agent Session Management & Messaging Guide

## Descriere Generală

Acest ghid explică cum să gestionezi sesiunile cu AI agent-ul și cum să trimiți/primești mesaje. Sesiunile sunt organizate **per tenant_id (business) și user_id pe zi**, permițând utilizatorilor să vadă întreaga conversație din ziua respectivă fără a gestiona conversații separate.

## Arhitectura Sesiunilor

### 1. **Structura Sesiunii**
```typescript
interface Session {
  sessionId: string;           // Format: "businessId:userId:timestamp"
  businessId: string;          // ID-ul business-ului (tenant)
  locationId: string;          // ID-ul locației
  userId: string;              // ID-ul utilizatorului
  status: 'active' | 'closed' | 'resolved' | 'abandoned';
  createdAt: string;           // Timestamp creare
  updatedAt: string;           // Timestamp ultima actualizare
  lastMessageAt: string;       // Timestamp ultimul mesaj
  metadata: {
    businessType: string;      // Tipul business-ului
    context: any;              // Context suplimentar
  };
}
```

### 2. **Structura Mesajului**
```typescript
interface Message {
  messageId: string;           // ID unic mesaj
  sessionId: string;           // ID-ul sesiunii
  businessId: string;          // ID-ul business-ului
  userId: string;              // ID-ul utilizatorului
  content: string;             // Conținutul mesajului
  type: 'user' | 'agent' | 'system';
  timestamp: string;           // Timestamp mesaj
  metadata: {
    source: 'websocket' | 'webhook' | 'cron';
    externalId?: string;       // ID extern (opțional)
    responseId?: string;       // ID răspuns (opțional)
  };
}
```

### 3. **Strategia Sesiunilor Zilnice**
- **Sesiunea se creează automat** la primul mesaj al zilei
- **Toate mesajele din ziua respectivă** sunt grupate în aceeași sesiune
- **Sesiunea se închide automat** la sfârșitul zilei (00:00)
- **Istoricul complet** este păstrat pentru fiecare zi

## API Endpoints

### 1. **Trimitere Mesaj către AI Agent**

**Endpoint:** `POST http://localhost:4000/api/messages`

**Request Body:**
```json
{
  "tenant_id": "B0100001",        // ID business (obligatoriu)
  "user_id": "user_123",          // ID utilizator (obligatoriu)
  "content": "Vreau să fac o programare", // Conținut (obligatoriu)
  "session_id": "sess_123",       // Opțional - se generează automat
  "message_id": "msg_456",        // Opțional - se generează automat
  "payload": {                     // Opțional
    "context": {
      "urgency": "high",
      "preferredTime": "morning"
    }
  }
}
```

**Response Success:**
```json
{
  "status": "success",
  "message": {
    "tenantId": "B0100001",
    "userId": "user_123",
    "sessionId": "B0100001:user_123:1704067200000",
    "messageId": "msg_1704067200000_abc123",
    "type": "user.message",
    "payload": {
      "content": "Vreau să fac o programare",
      "context": {
        "urgency": "high",
        "preferredTime": "morning"
      }
    },
    "timestamp": "2024-01-01T10:00:00.000Z"
  }
}
```

**Response Error:**
```json
{
  "status": "error",
  "message": "Missing required parameters: tenant_id, user_id, content"
}
```

### 2. **Obținere Istoric Sesiune**

**Endpoint:** `GET http://localhost:3001/api/sessions/{sessionId}/messages`

**Query Parameters:**
- `limit` (opțional): Numărul de mesaje (default: 50)
- `before` (opțional): Timestamp pentru paginare

**Response:**
```json
{
  "sessionId": "B0100001:user_123:1704067200000",
  "businessId": "B0100001",
  "userId": "user_123",
  "messages": [
    {
      "messageId": "msg_1704067200000_abc123",
      "sessionId": "B0100001:user_123:1704067200000",
      "businessId": "B0100001",
      "userId": "user_123",
      "content": "Vreau să fac o programare",
      "type": "user",
      "timestamp": "2024-01-01T10:00:00.000Z",
      "metadata": {
        "source": "websocket"
      }
    },
    {
      "messageId": "msg_1704067200000_def456",
      "sessionId": "B0100001:user_123:1704067200000",
      "businessId": "B0100001",
      "userId": "agent",
      "content": "Bună! Te ajut să faci o programare. Ce tip de serviciu dorești?",
      "type": "agent",
      "timestamp": "2024-01-01T10:00:05.000Z",
      "metadata": {
        "source": "websocket",
        "responseId": "resp_1704067200000_xyz789"
      }
    }
  ],
  "pagination": {
    "hasMore": false,
    "nextCursor": null
  }
}
```

### 3. **Obținere Sesiuni Active pentru Business**

**Endpoint:** `GET http://localhost:3001/api/sessions/business/{businessId}/active`

**Response:**
```json
{
  "businessId": "B0100001",
  "activeSessions": [
    {
      "sessionId": "B0100001:user_123:1704067200000",
      "businessId": "B0100001",
      "locationId": "L0100001",
      "userId": "user_123",
      "status": "active",
      "createdAt": "2024-01-01T10:00:00.000Z",
      "updatedAt": "2024-01-01T15:30:00.000Z",
      "lastMessageAt": "2024-01-01T15:30:00.000Z",
      "metadata": {
        "businessType": "medical",
        "context": {}
      }
    }
  ]
}
```

## WebSocket pentru Mesaje în Timp Real

### 1. **Conectare WebSocket**

**URL:** `ws://localhost:4000/socket/websocket`

**Canal pentru mesaje:** `messages:{businessId}`

### 2. **Client JavaScript Complet**

```javascript
import { Socket } from "phoenix";

class AISessionClient {
  constructor(businessId, userId) {
    this.businessId = businessId;
    this.userId = userId;
    this.socket = null;
    this.messagesChannel = null;
    this.currentSessionId = null;
    this.messageHistory = [];
    this.isConnected = false;
  }

  // Conectare la WebSocket
  connect() {
    this.socket = new Socket("/socket", {
      params: { 
        businessId: this.businessId,
        userId: this.userId 
      }
    });

    this.socket.connect();

    // Join la canalul de mesaje
    this.messagesChannel = this.socket.channel(`messages:${this.businessId}`, {
      userId: this.userId
    });

    this.messagesChannel.join()
      .receive("ok", resp => {
        console.log("Conectat la canalul de mesaje:", resp);
        this.isConnected = true;
        this.loadTodaySession();
      })
      .receive("error", resp => {
        console.error("Eroare la conectarea la canal:", resp);
      });

    // Ascultă pentru răspunsuri AI
    this.messagesChannel.on("new_message", payload => {
      console.log("Mesaj nou primit:", payload);
      this.handleNewMessage(payload);
    });

    // Gestionare reconectare
    this.socket.onClose(() => {
      console.log("Conexiune WebSocket închisă");
      this.isConnected = false;
      setTimeout(() => this.connect(), 5000);
    });
  }

  // Încărcare sesiunea zilei
  async loadTodaySession() {
    try {
      // Generează ID-ul sesiunii pentru ziua curentă
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const sessionId = `${this.businessId}:${this.userId}:${startOfDay.getTime()}`;
      
      this.currentSessionId = sessionId;
      
      // Încarcă istoricul mesajelor
      await this.loadMessageHistory(sessionId);
      
      console.log("Sesiunea zilei încărcată:", sessionId);
    } catch (error) {
      console.error("Eroare la încărcarea sesiunii:", error);
    }
  }

  // Încărcare istoric mesaje
  async loadMessageHistory(sessionId) {
    try {
      const response = await fetch(`http://localhost:3001/api/sessions/${sessionId}/messages?limit=100`);
      const data = await response.json();
      
      this.messageHistory = data.messages || [];
      this.displayMessageHistory();
      
      console.log("Istoric încărcat:", this.messageHistory.length, "mesaje");
    } catch (error) {
      console.error("Eroare la încărcarea istoricului:", error);
    }
  }

  // Trimitere mesaj către AI
  async sendMessage(content, context = {}) {
    if (!this.isConnected) {
      console.error("Nu sunt conectat la WebSocket");
      return;
    }

    const messageData = {
      tenant_id: this.businessId,
      user_id: this.userId,
      session_id: this.currentSessionId,
      content: content,
      context: context
    };

    try {
      const response = await fetch('http://localhost:4000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        // Adaugă mesajul utilizatorului în istoric
        const userMessage = {
          messageId: result.message.messageId,
          sessionId: this.currentSessionId,
          businessId: this.businessId,
          userId: this.userId,
          content: content,
          type: 'user',
          timestamp: new Date().toISOString(),
          metadata: { source: 'websocket' }
        };
        
        this.messageHistory.push(userMessage);
        this.displayMessage(userMessage);
        
        console.log('Mesaj trimis:', result);
      } else {
        console.error('Eroare la trimiterea mesajului:', result.message);
      }
    } catch (error) {
      console.error('Eroare la trimiterea mesajului:', error);
    }
  }

  // Gestionare mesaj nou primit
  handleNewMessage(payload) {
    const { content, role, timestamp, message_id } = payload;
    
    if (role === 'agent') {
      // Adaugă răspunsul AI în istoric
      const aiMessage = {
        messageId: message_id,
        sessionId: this.currentSessionId,
        businessId: this.businessId,
        userId: 'agent',
        content: content,
        type: 'agent',
        timestamp: timestamp,
        metadata: { source: 'websocket' }
      };
      
      this.messageHistory.push(aiMessage);
      this.displayMessage(aiMessage);
    }
  }

  // Afișare mesaj în UI
  displayMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.type}-message`;
    
    const isUser = message.type === 'user';
    const sender = isUser ? 'Tu' : 'AI Agent';
    
    messageDiv.innerHTML = `
      <div class="message-header">
        <span class="sender">${sender}</span>
        <span class="time">${new Date(message.timestamp).toLocaleTimeString()}</span>
      </div>
      <div class="message-content">${message.content}</div>
    `;
    
    document.getElementById('chat-container').appendChild(messageDiv);
    messageDiv.scrollIntoView({ behavior: 'smooth' });
  }

  // Afișare istoric complet
  displayMessageHistory() {
    const container = document.getElementById('chat-container');
    container.innerHTML = ''; // Curăță container-ul
    
    this.messageHistory.forEach(message => {
      this.displayMessage(message);
    });
  }

  // Deconectare
  disconnect() {
    if (this.messagesChannel) {
      this.messagesChannel.leave();
    }
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
```

### 3. **HTML Template pentru Chat**

```html
<!DOCTYPE html>
<html>
<head>
    <title>AI Chat - Sesiune Zilnică</title>
    <script src="https://cdn.jsdelivr.net/npm/phoenix@1.6.0/priv/static/phoenix.js"></script>
    <style>
        .chat-container {
            max-width: 800px;
            margin: 20px auto;
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .chat-header {
            background: #007bff;
            color: white;
            padding: 15px;
            text-align: center;
        }
        
        .chat-messages {
            height: 500px;
            overflow-y: auto;
            padding: 20px;
            background: #f8f9fa;
        }
        
        .message {
            margin: 15px 0;
            padding: 12px;
            border-radius: 8px;
            max-width: 80%;
        }
        
        .user-message {
            background: #007bff;
            color: white;
            margin-left: auto;
            text-align: right;
        }
        
        .agent-message {
            background: white;
            border: 1px solid #ddd;
        }
        
        .message-header {
            font-size: 12px;
            margin-bottom: 5px;
            opacity: 0.8;
        }
        
        .message-content {
            line-height: 1.4;
        }
        
        .chat-input {
            padding: 20px;
            background: white;
            border-top: 1px solid #ddd;
        }
        
        .input-group {
            display: flex;
            gap: 10px;
        }
        
        .message-input {
            flex: 1;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .send-button {
            padding: 12px 24px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .send-button:hover {
            background: #0056b3;
        }
        
        .session-info {
            background: #e9ecef;
            padding: 10px;
            text-align: center;
            font-size: 12px;
            color: #6c757d;
        }
    </style>
</head>
<body>
    <div class="chat-container">
        <div class="chat-header">
            <h2>AI Chat Assistant</h2>
            <div class="session-info" id="session-info">
                Încărcare sesiune...
            </div>
        </div>
        
        <div class="chat-messages" id="chat-container">
            <!-- Mesajele vor fi afișate aici -->
        </div>
        
        <div class="chat-input">
            <div class="input-group">
                <input 
                    type="text" 
                    id="message-input" 
                    class="message-input" 
                    placeholder="Scrie un mesaj..."
                    onkeypress="handleKeyPress(event)"
                >
                <button id="send-button" class="send-button" onclick="sendMessage()">
                    Trimite
                </button>
            </div>
        </div>
    </div>

    <script>
        // Configurare
        const BUSINESS_ID = 'B0100001'; // Înlocuiește cu ID-ul tău
        const USER_ID = 'user_123';     // Înlocuiește cu ID-ul utilizatorului
        
        // Inițializare client
        const chatClient = new AISessionClient(BUSINESS_ID, USER_ID);
        
        // Conectare la WebSocket
        chatClient.connect();
        
        // Funcții pentru UI
        function sendMessage() {
            const input = document.getElementById('message-input');
            const content = input.value.trim();
            
            if (content) {
                chatClient.sendMessage(content);
                input.value = '';
            }
        }
        
        function handleKeyPress(event) {
            if (event.key === 'Enter') {
                sendMessage();
            }
        }
        
        // Actualizare informații sesiune
        function updateSessionInfo() {
            const sessionInfo = document.getElementById('session-info');
            if (chatClient.currentSessionId) {
                const sessionDate = new Date(parseInt(chatClient.currentSessionId.split(':')[2]));
                sessionInfo.textContent = `Sesiune: ${sessionDate.toLocaleDateString('ro-RO')} - ${chatClient.messageHistory.length} mesaje`;
            }
        }
        
        // Actualizare la fiecare mesaj nou
        const originalDisplayMessage = chatClient.displayMessage;
        chatClient.displayMessage = function(message) {
            originalDisplayMessage.call(this, message);
            updateSessionInfo();
        };
    </script>
</body>
</html>
```

## Gestionarea Sesiunilor

### 1. **Crearea Automată a Sesiunilor**

Sesiunea se creează automat la primul mesaj al zilei:

```typescript
// În ai-agent-server
private generateSessionId(data: MessageDto): string {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return `${data.businessId}:${data.userId}:${startOfDay.getTime()}`;
}
```

### 2. **Închiderea Automată a Sesiunilor**

Sesiunile se închid automat la sfârșitul zilei prin cron job:

```typescript
// Cron job zilnic la 00:00
@Cron('0 0 * * *')
async closeDailySessions() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Închide toate sesiunile active din ziua anterioară
  await this.sessionService.closeDailySessions(yesterday);
}
```

### 3. **Cleanup Sesiuni Vechi**

Sesiunile rezolvate se șterg automat după 30 de zile:

```typescript
// Cron job zilnic la 02:00
@Cron('0 2 * * *')
async cleanupResolvedSessions() {
  await this.sessionService.cleanupResolvedSessions();
}
```

## Exemple de Utilizare

### 1. **Trimitere Mesaj Simplu**

```javascript
// Trimitere mesaj către AI
const response = await fetch('http://localhost:4000/api/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenant_id: 'B0100001',
    user_id: 'user_123',
    content: 'Salut! Vreau să fac o programare pentru mâine'
  })
});

const result = await response.json();
console.log('Mesaj trimis:', result);
```

### 2. **Încărcare Istoric Sesiune**

```javascript
// Încărcare istoric mesaje
const sessionId = 'B0100001:user_123:1704067200000';
const response = await fetch(`http://localhost:3001/api/sessions/${sessionId}/messages?limit=100`);
const data = await response.json();

console.log('Istoric mesaje:', data.messages);
```

### 3. **Monitorizare Sesiuni Active**

```javascript
// Obținere sesiuni active pentru business
const response = await fetch('http://localhost:3001/api/sessions/business/B0100001/active');
const data = await response.json();

console.log('Sesiuni active:', data.activeSessions);
```

## Avantajele Sistemului

### 1. **Simplitate**
- **O singură sesiune pe zi** per utilizator
- **Nu trebuie să gestionezi conversații separate**
- **Istoricul complet** este disponibil automat

### 2. **Performanță**
- **Sesiuni scurte** (maxim 24 ore)
- **Cleanup automat** pentru sesiuni vechi
- **Indexare optimizată** în DynamoDB

### 3. **Scalabilitate**
- **Sesiuni per business și utilizator**
- **Separare clară** între diferitele business-uri
- **Arhitectură distribuită** cu WebSocket și HTTP

### 4. **UX Îmbunătățit**
- **Conversații continue** pe zi
- **Context păstrat** pentru întreaga zi
- **Notificări în timp real** prin WebSocket

## Troubleshooting

### 1. **Sesiunea nu se creează**
- Verifică dacă `tenant_id` și `user_id` sunt corecte
- Verifică dacă ai-agent-server rulează pe portul 3001
- Verifică logurile pentru erori

### 2. **WebSocket nu se conectează**
- Verifică dacă Elixir server rulează pe portul 4000
- Verifică CORS settings
- Verifică dacă canalul este corect formatat

### 3. **Mesajele nu se trimit**
- Verifică dacă toate câmpurile obligatorii sunt prezente
- Verifică formatul JSON
- Verifică logurile Elixir pentru erori

### 4. **Istoricul nu se încarcă**
- Verifică dacă sessionId este corect formatat
- Verifică dacă ai-agent-server este accesibil
- Verifică logurile DynamoDB

## Concluzie

Acest sistem oferă o gestionare simplă și eficientă a sesiunilor cu AI agent-ul, permițând utilizatorilor să aibă conversații continue pe zi fără a gestiona conversații separate. Arhitectura este scalabilă și oferă performanță optimă prin utilizarea WebSocket pentru mesaje în timp real și HTTP pentru operații CRUD.
