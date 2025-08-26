import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from 'react-oidc-context'
import './index.css'
import App from './App.jsx'

const cognitoAuthConfig = {
  authority: "https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_KUaE0MTcQ",
  client_id: "ar2m2qg3gp4a0b4cld09aegdb",
  redirect_uri: window.location.href,
  response_type: "code",
  scope: "phone openid email",
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <App />
    </AuthProvider>
  </StrictMode>,
)
