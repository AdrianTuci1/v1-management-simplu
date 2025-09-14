import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from 'react-oidc-context'
import { initOfflineQueueProcessing } from './data/infrastructure/queueRunner.js'


const cognitoAuthConfig = {
  authority: "https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_KUaE0MTcQ",
  client_id: "ar2m2qg3gp4a0b4cld09aegdb",
  redirect_uri: "http://localhost:5173",
  response_type: "code",
  scope: "email openid phone",
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <App />
    </AuthProvider>
  </StrictMode>,
)

// Initialize offline queue processing after app bootstrap
try { initOfflineQueueProcessing(); } catch (_) {}
