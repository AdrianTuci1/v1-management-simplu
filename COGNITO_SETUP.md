# Configurare Cognito cu simplu.io Callback pentru Multiple Clienți

## Prezentare Generală

Această aplicație folosește AWS Cognito pentru autentificare, cu callback-ul configurat să se facă prin `simplu.io/auth/callback`. Sistemul suportă multiple clienți prin transmiterea DNS-ului/clientului ca parametru în fluxul de autentificare.

**Fluxul de autentificare:**
1. Aplicația client → simplu.io/auth/callback → auth.simplu.io (Cognito) → simplu.io/auth/callback → Aplicația client

## Arhitectura pentru Multiple Clienți

### Flux de Autentificare

1. **Client accesează aplicația** (ex: `dental.simplu.io`, `pharmacy.simplu.io`, `localhost:5173`)
2. **Aplicația detectează client-ul** și îl stochează
3. **Aplicația redirecționează** către `auth.simplu.io` cu client-ul ca parametru `state`
4. **auth.simplu.io (Cognito)** procesează autentificarea și redirecționează către `simplu.io/auth/callback`
5. **simplu.io/auth/callback** extrage client-ul din parametrul `state` și redirecționează înapoi
6. **Aplicația procesează callback-ul** și autentifică utilizatorul

## Configurare AWS Cognito

### 1. User Pool Configuration

În AWS Console → Cognito → User Pools → selectează pool-ul tău:

1. **App integration** → App client settings
2. **Callback URLs**: Adaugă următoarele:
   - `https://simplu.io/auth/callback`
3. **Sign out URLs**: Adaugă următoarele:
   - `https://dental.simplu.io`
   - `https://pharmacy.simplu.io`
   - `http://localhost:5173` (pentru development)
4. **Allowed OAuth Flows**: 
   - Authorization code grant
   - Implicit grant
5. **Allowed OAuth Scopes**:
   - phone
   - openid
   - email

### 2. Domain Configuration

În **App integration** → Domain name:
- Configurează un domain custom: `auth.simplu.io`
- Asigură-te că domain-ul este accesibil public

## Configurare pe simplu.io

### 1. Pagina de Callback

Creează o pagină la `https://simplu.io/auth/callback` care să redirecționeze utilizatorul către clientul corect:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Redirecting...</title>
</head>
<body>
    <script>
        // Get URL parameters from auth.simplu.io (Cognito)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state'); // This contains the client domain
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        // Validate client domain
        const allowedClients = [
            'localhost:5173',
            'dental.simplu.io',
            'pharmacy.simplu.io',
            'clinic.simplu.io'
            // Add more clients as needed
        ];
        
        if (!allowedClients.includes(state)) {
            console.error('Invalid client domain:', state);
            // Redirect to error page or default client
            window.location.href = 'https://simplu.io/error?message=invalid_client';
            return;
        }
        
        // Determine protocol based on client
        const protocol = state === 'localhost:5173' ? 'http' : 'https';
        
        // Build target URL
        const targetUrl = new URL(`${protocol}://${state}/auth/callback`);
        
        // Copy all parameters to target URL
        if (code) targetUrl.searchParams.set('code', code);
        if (state) targetUrl.searchParams.set('state', state);
        if (error) targetUrl.searchParams.set('error', error);
        if (errorDescription) targetUrl.searchParams.set('error_description', errorDescription);
        
        // Add client parameter for additional validation
        targetUrl.searchParams.set('client', state);
        
        // Redirect to client application
        window.location.href = targetUrl.toString();
    </script>
    <p>Redirecting to client application...</p>
</body>
</html>
```

### 2. CORS Configuration

Asigură-te că serverul de pe `simplu.io` permite CORS pentru toți clienții:

```javascript
// Exemplu pentru Express.js
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://dental.simplu.io',
    'https://pharmacy.simplu.io',
    'https://clinic.simplu.io',
    'https://auth.simplu.io'
    // Add more clients as needed
  ],
  credentials: true
}));
```

## Configurare Aplicație

### 1. Environment Variables

Creează un fișier `.env.development` în rădăcina proiectului:

```env
# Development Environment Configuration
VITE_DEMO_MODE=false
VITE_API_URL=http://localhost:4000
VITE_WS_URL=ws://localhost:4000/socket

# Cognito Configuration
VITE_COGNITO_AUTHORITY=https://auth.simplu.io
VITE_COGNITO_CLIENT_ID=ar2m2qg3gp4a0b4cld09aegdb
VITE_COGNITO_REDIRECT_URI=https://simplu.io/auth/callback
```

Pentru producție, creează `.env.production`:

```env
# Production Environment Configuration
VITE_DEMO_MODE=false
VITE_API_URL=https://api.simplu.io
VITE_WS_URL=wss://api.simplu.io/socket

# Cognito Configuration
VITE_COGNITO_AUTHORITY=https://auth.simplu.io
VITE_COGNITO_CLIENT_ID=ar2m2qg3gp4a0b4cld09aegdb
VITE_COGNITO_REDIRECT_URI=https://simplu.io/auth/callback
```

### 2. Vite Configuration

Configurația din `vite.config.js` include deja proxy-ul pentru development:

```javascript
server: {
  proxy: {
    '/auth/callback': {
      target: 'https://simplu.io',
      changeOrigin: true,
      secure: true,
      rewrite: (path) => path.replace('/auth/callback', '/auth/callback')
    }
  }
}
```

## Implementare în Cod

### 1. Detecția Clientului

Aplicația detectează automat client-ul din `window.location.hostname`:

```javascript
// În authService.js
getClientDomain() {
  if (import.meta.env.DEV) {
    return 'localhost:5173'
  }
  return window.location.hostname
}
```

### 2. Transmiterea Clientului

Client-ul este transmis ca parametru `state` în request-ul către `auth.simplu.io`:

```javascript
// În authService.js
getAuthUrl() {
  const clientDomain = this.getClientDomain()
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scope,
    state: clientDomain // Client domain as state
  })
  
  return `${authority}/oauth2/authorize?${params.toString()}`
}
```

### 3. Procesarea Callback-ului

Aplicația procesează callback-ul și validează client-ul:

```javascript
// În AuthCallback.jsx
const client = searchParams.get('client') // Client domain from simplu.io
console.log('Client domain:', client)
```

## Adăugarea de Clienți Noi

Pentru a adăuga un client nou:

1. **În AWS Cognito**:
   - Adaugă domain-ul în **Sign out URLs**
   - Ex: `https://newclient.simplu.io`

2. **Pe simplu.io**:
   - Adaugă domain-ul în lista `allowedClients`
   - Adaugă în configurația CORS

3. **Deploy aplicația** pe noul domain

## Securitate

### Validarea Clientului

1. **Pe simplu.io**: Validează că client-ul este în lista `allowedClients`
2. **În aplicație**: Validează că client-ul din callback corespunde cu cel stocat
3. **HTTPS**: Folosește HTTPS pentru toți clienții în producție

### Protecție CSRF

1. **State Parameter**: Folosește state-ul pentru a preveni atacurile CSRF
2. **Client Validation**: Validează că client-ul nu s-a schimbat între request-uri
3. **Token Validation**: Validează token-urile pe server

## Testare

### Development (localhost)

1. Pornește aplicația: `npm run dev`
2. Accesează `http://localhost:5173`
3. Testează autentificarea
4. Verifică că client-ul este detectat corect

### Production

1. Build aplicația: `npm run build`
2. Deploy pe fiecare client (dental.simplu.io, pharmacy.simplu.io, etc.)
3. Testează autentificarea pe fiecare client
4. Verifică că redirect-ul funcționează corect

## Troubleshooting

### Probleme Comune

1. **Invalid Client**: Verifică că client-ul este în lista `allowedClients` pe simplu.io
2. **CORS Errors**: Verifică configurația CORS pentru noul client
3. **State Mismatch**: Verifică că state-ul este transmis corect
4. **Redirect Loop**: Verifică că callback URL-urile sunt configurate corect

### Debug

1. Verifică console-ul browser-ului pentru erori
2. Verifică Network tab pentru request-uri eșuate
3. Verifică parametrii din URL în callback
4. Verifică server logs pe simplu.io
