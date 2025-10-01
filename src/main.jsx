import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initOfflineQueueProcessing } from './data/infrastructure/queueRunner.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Initialize offline queue processing after app bootstrap
try { initOfflineQueueProcessing(); } catch (_) {}
