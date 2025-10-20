# Meta OAuth Frontend Fix - Rezolvare Problemă Redirect

## Problema Identificată

Când Meta redirectionează înapoi în aplicație după autorizare, frontend-ul primea URL-ul:
```
/?code=AQBVFYn3C0JotVuaEw...&state=eyJidXNpbmVzc0lk...
```

**Problema:** `App.jsx` încerca să proceseze TOATE codurile OAuth ca fiind de la **Cognito** (pentru autentificarea utilizatorilor), ceea ce cauza erori când primea coduri de la Meta.

**Problema suplimentară:** Nu exista logică pentru a trimite codul Meta către backend pentru procesare.

## Soluția Implementată

### 1. ✅ Adăugare metodă `sendMetaAuthCode` în `externalServices.js`

Am adăugat o metodă nouă pentru a trimite codul Meta către backend:

```javascript
// Send Meta OAuth code to backend for processing
async sendMetaAuthCode(code, state) {
  try {
    const businessId = this.getBusinessId();
    const locationId = this.getLocationId();
    
    // New format with businessId and locationId in path
    const url = `${this.baseUrl}/credentials/meta/${encodeURIComponent(businessId)}/${encodeURIComponent(locationId)}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, state })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Failed to process Meta authorization: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error sending Meta auth code to backend:', error);
    throw error;
  }
}
```

### 2. ✅ Modificare în `App.jsx`

Am adăugat logică pentru a **detecta și procesa** callback-urile Meta OAuth:

```javascript
// Flag to track if we processed a Meta callback
let isMetaCallback = false

// Check if this is a Meta OAuth callback (has state parameter with Meta info)
if (code && state && !isDemoMode) {
  try {
    // Try to decode state to see if it's from Meta OAuth
    const stateData = JSON.parse(atob(state.replace(/-/g, '+').replace(/_/g, '/')))
    if (stateData.businessId || stateData.redirectUri) {
      isMetaCallback = true
      console.log('Meta OAuth callback detected, sending code to backend...')
      
      try {
        // Import externalServices dynamically
        const { externalServices } = await import('./services/externalServices.js')
        
        // Send code and state to backend for processing
        await externalServices.sendMetaAuthCode(code, state)
        console.log('✅ Meta authorization code sent successfully to backend')
        
        // Clean URL and continue app initialization
        window.history.replaceState({}, document.title, window.location.pathname)
      } catch (metaError) {
        console.error('❌ Failed to process Meta authorization:', metaError)
        // Clean URL even on error
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }
  } catch (e) {
    // State is not decodable or not from Meta, continue with Cognito flow
  }
}

// Handle Cognito OAuth callback (for user authentication) - only if NOT a Meta callback
if (code && !isDemoMode && !isMetaCallback) {
  console.log('Cognito OAuth callback detected, processing...')
  // ... process Cognito OAuth
}
```

**Cum funcționează:**
- Verifică dacă există parametrul `state` în URL
- Încearcă să decodeze `state` (base64url encoded)
- Dacă `state` conține `businessId` sau `redirectUri` → este callback Meta → **trimite codul către backend**
- Dacă `state` nu este decodabil sau nu conține aceste câmpuri → este callback Cognito → **procesează local**
- Folosește un flag `isMetaCallback` pentru a preveni procesarea duală

### 3. ✅ Procesare Parametri Meta în `BusinessProcesses.jsx`

Am adăugat logică pentru a detecta când Meta redirectionează cu status-ul autorizării:

```javascript
// Check for OAuth redirect parameters (Meta authorization callback)
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const metaAuth = urlParams.get('meta_auth');
  const message = urlParams.get('message');
  
  if (metaAuth === 'success') {
    console.log('✅ Meta authorization successful!');
    // Clean up the URL
    window.history.replaceState({}, document.title, window.location.pathname);
    // Reload services status to reflect the new authorization
    checkAllServicesStatus();
    // TODO: Show success toast notification
  } else if (metaAuth === 'error') {
    console.error('❌ Meta authorization failed:', message);
    // Clean up the URL
    window.history.replaceState({}, document.title, window.location.pathname);
    // TODO: Show error toast notification with message
  }
}, []);
```

## Fluxul Corect Meta OAuth

```
┌──────────┐                ┌──────────┐                ┌──────┐
│ Frontend │                │ Backend  │                │ Meta │
└────┬─────┘                └────┬─────┘                └───┬──┘
     │                           │                          │
     │  1. getMetaAuthUrl()      │                          │
     ├──────────────────────────>│                          │
     │                           │                          │
     │  2. Return auth URL       │                          │
     │<──────────────────────────┤                          │
     │                           │                          │
     │  3. Redirect user         │                          │
     ├──────────────────────────────────────────────────────>│
     │                           │                          │
     │                           │  4. User approves        │
     │                           │                          │
     │  5. Redirect with code    │                          │
     │  ?code=...&state=...      │                          │
     │<──────────────────────────────────────────────────────┤
     │                           │                          │
     │  6. Send code + state     │                          │
     │  sendMetaAuthCode()       │                          │
     ├──────────────────────────>│                          │
     │                           │                          │
     │                           │  7. Exchange code        │
     │                           ├─────────────────────────>│
     │                           │                          │
     │                           │  8. Return token         │
     │                           │<─────────────────────────┤
     │                           │                          │
     │                           │  9. Save credentials     │
     │                           │                          │
     │  10. Return success       │                          │
     │<──────────────────────────┤                          │
     │                           │                          │
     │  11. Clean URL            │                          │
     │  12. Continue init        │                          │
     │                           │                          │
```

## Ce Trebuie Făcut în Backend

Backend-ul trebuie să aibă un endpoint **POST** la `/credentials/meta/{businessId}/{locationId}` care primește codul și state-ul de la frontend:

**Endpoint:** `POST /credentials/meta/:businessId/:locationId`

```typescript
@Post('credentials/meta/:businessId/:locationId')
async saveMetaCredentials(
  @Param('businessId') businessId: string,
  @Param('locationId') locationId: string,
  @Body('code') code: string,
  @Body('state') state: string
) {
  try {
    // Decode state to verify businessId and locationId match
    const stateData = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
    
    if (stateData.businessId !== businessId || stateData.locationId !== locationId) {
      throw new BadRequestException('Business ID or Location ID mismatch');
    }
    
    // Exchange code for access token with Meta
    const tokenResponse = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: {
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        redirect_uri: stateData.redirectUri, // From state
        code: code
      }
    });
    
    const accessToken = tokenResponse.data.access_token;
    
    // Optional: Exchange for long-lived token
    const longLivedResponse = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        fb_exchange_token: accessToken
      }
    });
    
    const longLivedToken = longLivedResponse.data.access_token;
    
    // Save credentials to database
    await this.externalApis.saveMetaCredentials(businessId, locationId, {
      accessToken: longLivedToken,
      phoneNumberId: '',
      appSecret: process.env.META_APP_SECRET,
      phoneNumber: ''
    });
    
    return {
      success: true,
      message: 'Meta credentials saved successfully'
    };
  } catch (error) {
    console.error('Meta authorization error:', error);
    throw new BadRequestException(error.message || 'Failed to process Meta authorization');
  }
}
```

**Request Example:**
```
POST http://localhost:3003/credentials/meta/B010001/L0100001
Content-Type: application/json

{
  "code": "AQBVFYn3C0JotVuaEw...",
  "state": "eyJidXNpbmVzc0lkIjoiQjAxMDAwMSIsImxvY2F0aW9uSWQiOiJMMDEwMDAwMSIsInJlZGlyZWN0VXJpIjoiaHR0cDovL2xvY2FsaG9zdDo1MTczIn0"
}
```

## Diferențe între Cognito OAuth și Meta OAuth

| Aspect | Cognito OAuth | Meta OAuth |
|--------|--------------|------------|
| Scop | Autentificarea utilizatorului în aplicație | Autorizarea serviciului Meta pentru business |
| Procesare | Frontend (Cognito SDK) | Backend (schimb cod cu token) |
| Parametru `code` | Procesat de App.jsx | Ignorat de App.jsx |
| Parametru `state` | Nu conține businessId | Conține businessId, locationId |
| Redirect final | Reîncarcă aplicația | Rămâne în aplicație |
| Cleanup URL | Da, după procesare | Da, în BusinessProcesses.jsx |

## Testare

### 1. Testare Meta OAuth

1. **Deschide Console** (F12 → Console)
2. **Mergi la pagina Servicii** (BusinessProcesses)
3. **Apasă "Autorizează Meta"**
4. **Autorizează pe pagina Meta**
5. **Verifică în Console**:
   ```
   Meta OAuth callback detected, ignoring in App.jsx (backend should handle this)
   ✅ Meta authorization successful!
   ```
6. **Verifică că URL-ul este curat** (fără parametri `code`, `state`, `meta_auth`)
7. **Verifică că serviciul Meta apare ca "Autorizat"**

### 2. Testare Cognito OAuth (pentru a ne asigura că nu am stricat nimic)

1. **Deconectează-te din aplicație**
2. **Apasă "Sign in with Google"**
3. **Autorizează pe pagina Google**
4. **Verifică în Console**:
   ```
   Cognito OAuth callback detected, processing...
   OAuth callback processed successfully
   ```
5. **Verifică că te-ai autentificat corect**

## Beneficii

✅ **Separare clară** între Cognito OAuth și Meta OAuth  
✅ **Nu mai sunt conflicte** când primim coduri de la servicii externe  
✅ **URL-ul este curățat automat** după procesare  
✅ **Status-ul serviciilor se reîncarcă automat** după autorizare  
✅ **Logging detaliat** pentru debugging  
✅ **Gmail OAuth nu este afectat** (funcționează ca înainte)  

## Note Importante

- **Cognito OAuth** (pentru autentificare) → codul este procesat în `App.jsx`
- **Meta OAuth** (pentru serviciu extern) → codul este ignorat în `App.jsx`, procesare în backend
- **Gmail OAuth** (pentru serviciu extern) → similar cu Meta, dar backend redirectionează diferit
- Parametrul `state` este cheia pentru a diferenția între tipurile de OAuth

## Autor

Implementat de AI Assistant - Octombrie 2025

