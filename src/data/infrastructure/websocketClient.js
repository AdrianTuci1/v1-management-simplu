// Minimal WebSocket client; integrate with server when available

let socket = null;
let listeners = new Set();

export function connectWebSocket(url) {
  if (socket) return socket;
  socket = new WebSocket(url);
  socket.onmessage = (msg) => {
    try {
      const payload = JSON.parse(msg.data);
      listeners.forEach((cb) => cb(payload));
    } catch (_) {
      // ignore
    }
  };
  return socket;
}

export function onMessage(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function closeWebSocket() {
  if (socket) {
    socket.close();
    socket = null;
  }
}


