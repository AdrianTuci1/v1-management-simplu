# WebSocket Worker Implementation

## Overview

Am implementat o soluție WebSocket care folosește Web Workers pentru a gestiona conexiunea WebSocket într-un thread separat, evitând blocarea thread-ului principal al aplicației React.

## Arhitectura

### 1. Web Worker (`public/websocket-worker.js`)
- Rulează într-un thread separat
- Gestionează conexiunea Phoenix WebSocket
- Comunică cu thread-ul principal prin mesaje
- Construiește canalul dinamic: `resources:${businessId}-${locationId}`

### 2. WebSocket Client (`src/data/infrastructure/websocketClient.js`)
- Interfața principală pentru aplicație
- Gestionează comunicarea cu worker-ul
- Menține starea conexiunii
- Oferă API-uri pentru conectare, deconectare și trimiterea mesajelor

### 3. React Hooks (`src/hooks/useWebSocket.js`)
- Hook-uri personalizate pentru React
- Gestionează starea în componente
- Oferă reconectare automată
- Suportă pentru tipuri specifice de resurse

## Funcționalități

### Construirea programatică a canalului
```javascript
// Construiește canalul din businessId și locationId din localStorage
const channelName = `resources:${businessId}-${locationId}`;
```

### Comunicarea cu worker-ul
```javascript
// Trimite mesaj către worker
sendToWorker('connect', { url, channelName });
sendToWorker('send', { event, payload });
sendToWorker('disconnect');
```

### Hook-uri React
```javascript
// Hook de bază
const { connectionStatus, isConnected, messages, send } = useWebSocket(url);

// Hook pentru resurse specifice
const { messages, send } = useResourceWebSocket(url, 'appointments');

// Hook cu reconectare automată
const { connectionStatus, reconnectAttempts } = useRealtimeWebSocket(url);
```

## Avantaje

1. **Performanță**: WebSocket-ul nu blochează thread-ul principal
2. **Robustețe**: Reconectare automată și gestionarea erorilor
3. **Flexibilitate**: Canalul se construiește dinamic
4. **Debugging**: Logging detaliat pentru debugging
5. **React Integration**: Hook-uri optimizate pentru React

## Utilizare

### În componente React
```javascript
import { useWebSocket } from '../hooks/useWebSocket';

function MyComponent() {
  const { connectionStatus, isConnected, messages, send } = useWebSocket(
    'ws://localhost:4000/socket/websocket'
  );

  const handleSendMessage = () => {
    send('resource_update', { 
      resourceType: 'appointments', 
      data: { id: 1, status: 'confirmed' } 
    });
  };

  return (
    <div>
      <p>Status: {connectionStatus}</p>
      <button onClick={handleSendMessage} disabled={!isConnected}>
        Send Message
      </button>
    </div>
  );
}
```

### Configurarea business/location
```javascript
// Setează business ID și location ID în localStorage
localStorage.setItem('businessId', 'B0100001');
localStorage.setItem('locationId', 'L0100001');

// Canalul se va construi automat: "resources:B0100001-L0100001"
```

## Debugging

### Logs în consolă
- Worker-ul trimite toate log-urile către thread-ul principal
- Prefixate cu `[WebSocket Worker]` pentru identificare ușoară

### Componenta de status
```javascript
import { WebSocketStatus } from '../components/WebSocketStatus';

// Afișează statusul conexiunii și mesajele recente
<WebSocketStatus />
```

## Configurare

### Vite Configuration
```javascript
// vite.config.js
export default defineConfig({
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        worker: path.resolve(__dirname, 'public/websocket-worker.js'),
      },
    },
  },
});
```

## Mesaje Worker

### De la main thread către worker
- `connect`: Inițiază conexiunea
- `disconnect`: Închide conexiunea
- `send`: Trimite mesaj pe canal
- `getStatus`: Obține statusul curent

### De la worker către main thread
- `ready`: Worker-ul este gata
- `status`: Actualizare status conexiune
- `message`: Mesaj primit pe canal
- `log`: Mesaj de logging
- `error`: Eroare

## Gestionarea erorilor

- Timeout pentru mesajele către worker (5 secunde)
- Reconectare automată cu backoff exponential
- Logging detaliat pentru debugging
- Graceful degradation când worker-ul nu este disponibil
