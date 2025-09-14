export function registerNetHandlers(onOnline) {
  window.addEventListener("online", onOnline);
}

let intervalId = null;
export function startQueueProcessor(processFn, intervalMs = 15000) {
  if (intervalId) return;
  intervalId = setInterval(() => {
    processFn().catch(() => {});
  }, intervalMs);
}

export function stopQueueProcessor() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}


