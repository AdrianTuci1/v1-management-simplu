# Meta OAuth Implementation - Authorization Code Flow

## Arhitectura Fluxului OAuth

Implementarea folosește **Authorization Code Flow** (server-side), unde backend-ul gestionează schimbul de cod cu token-ul de acces.

## Fluxul Complet

### 1️⃣ Inițierea Autorizării (Frontend → Backend)

Când utilizatorul apasă butonul "Autorizează Meta":

```javascript
// Frontend: externalServices.js
await externalServices.connectMeta()
```

Frontend-ul face un request la backend pentru a obține URL-ul de autorizare, **incluzând redirectUri**:

```javascript
const redirectUri = window.location.origin; // ex: http://localhost:5173
```

```
GET http://localhost:3003/external/meta/auth-url?businessId=B010001&locationId=L0100001&redirectUri=http://localhost:5173
```

### 2️⃣ Generarea URL-ului de Autorizare (Backend)

Backend-ul (`meta.service.ts`) generează URL-ul de autorizare Meta:

```typescript
generateAuthUrl(
  businessId: string, 
  locationId: string, 
  customRedirectUri?: string
): string {
  const clientId = this.configService.get<string>('meta.appId');
  
  // Folosește redirectUri custom (pentru frontend) sau cel din .env (pentru callback)
  const callbackUri = this.configService.get<string>('meta.redirectUri'); // http://localhost:3003/external/meta/callback
  const frontendUri = customRedirectUri; // http://localhost:5173
  
  const scopes = [
    'pages_messaging',
    'pages_show_list',
    'pages_manage_metadata',
    'instagram_basic',
    'instagram_manage_messages',
  ];
  
  // Salvează AMBELE URI-uri în state: unul pentru Meta callback, altul pentru redirect final
  const state = Buffer.from(JSON.stringify({ 
    businessId, 
    locationId, 
    redirectUri: callbackUri,      // pentru Meta callback
    frontendUri: frontendUri        // pentru redirect final la aplicație
  })).toString('base64url');
  
  const url = new URL('https://www.facebook.com/v19.0/dialog/oauth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', callbackUri); // Meta redirectionează aici
  url.searchParams.set('scope', scopes.join(','));
  url.searchParams.set('state', state);
  
  return url.toString();
}
```

**URL-ul generat arată astfel:**
```
https://www.facebook.com/v19.0/dialog/oauth?
  client_id={META_APP_ID}
  &redirect_uri=http://localhost:3003/external/meta/callback
  &scope=pages_messaging,pages_show_list,pages_manage_metadata,instagram_basic,instagram_manage_messages
  &state=eyJidXNpbmVzc0lkIjoiQjAxMDAwMSIsImxvY2F0aW9uSWQiOiJMMDEwMDAwMSJ9
```

### 3️⃣ Redirecționare către Meta (Frontend)

Frontend-ul redirectionează utilizatorul la URL-ul returnat de backend:

```javascript
window.location.href = authUrl;
```

Utilizatorul este dus pe pagina Meta unde va acorda permisiunile necesare.

### 4️⃣ Callback de la Meta (Meta → Backend)

După ce utilizatorul aprobă, Meta redirectionează înapoi la backend cu un **authorization code**:

```
GET http://localhost:3003/external/meta/callback?code=AQD123...&state=eyJidXNpbmVzc0lkIjoiQjAxMDAwMSIsImxvY2F0aW9uSWQiOiJMMDEwMDAwMSJ9
```

### 5️⃣ Schimbul Codului cu Token-ul (Backend)

Backend-ul (`meta.service.ts`) primește callback-ul și face următoarele:

#### A. Decodează state parameter
```typescript
const { businessId, locationId } = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
```

#### B. Schimbă codul cu short-lived access token
```typescript
const tokenResp = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
  params: {
    client_id: process.env.META_APP_ID,
    client_secret: process.env.META_APP_SECRET,
    redirect_uri: process.env.META_REDIRECT_URI,
    code: code
  }
});
const accessToken = tokenResp.data.access_token;
```

**Request complet:**
```
GET https://graph.facebook.com/v19.0/oauth/access_token?
  client_id={META_APP_ID}
  &client_secret={META_APP_SECRET}
  &redirect_uri=http://localhost:3003/external/meta/callback
  &code=AQD123...
```

**Response:**
```json
{
  "access_token": "EAAx...",
  "token_type": "bearer",
  "expires_in": 5184000
}
```

#### C. Schimbă cu long-lived token (opțional)
```typescript
const longLivedResp = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
  params: {
    grant_type: 'fb_exchange_token',
    client_id: process.env.META_APP_ID,
    client_secret: process.env.META_APP_SECRET,
    fb_exchange_token: accessToken
  }
});
const longLivedToken = longLivedResp.data.access_token;
```

#### D. Salvează credențialele în baza de date
```typescript
await this.externalApis.saveMetaCredentials(businessId, {
  accessToken: longLivedToken,
  phoneNumberId: '',
  appSecret: process.env.META_APP_SECRET,
  phoneNumber: ''
});
```

### 6️⃣ Redirecționare înapoi la Frontend

**⚠️ IMPORTANT:** Backend-ul trebuie să redirectioneze utilizatorul înapoi la aplicația frontend după salvarea token-ului.

Backend-ul extrage `frontendUri` din state și redirectionează utilizatorul acolo:

```typescript
// meta.service.ts - actualizează handleCallback
async handleCallback(code: string, state: string): Promise<{ success: boolean; frontendUri?: string }> {
  if (!code || !state) throw new BadRequestException('Missing code/state');
  
  // Extract TOATE datele din state
  const stateData = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
  const { businessId, locationId, redirectUri, frontendUri } = stateData;
  
  // ... exchange code for token ...
  // ... save credentials ...
  
  return { success: true, frontendUri }; // returnează frontendUri pentru controller
}
```

```typescript
// meta.controller.ts - actualizează callback
@Get('callback')
async callback(
  @Query('code') code: string,
  @Query('state') state: string,
  @Res() res: Response
) {
  try {
    const result = await this.meta.handleCallback(code, state);
    const redirectUrl = result.frontendUri || 'http://localhost:5173';
    return res.redirect(`${redirectUrl}?meta_auth=success`);
  } catch (error) {
    // În caz de eroare, tot redirectionăm dar cu parametrul de eroare
    const redirectUrl = 'http://localhost:5173'; // fallback
    return res.redirect(`${redirectUrl}?meta_auth=error&message=${encodeURIComponent(error.message)}`);
  }
}
```

## Verificarea Stării Autorizării

Frontend-ul poate verifica dacă Meta este autorizat:

```javascript
const status = await externalServices.checkServiceStatus('meta');
console.log(status.authorized); // true/false
```

Backend endpoint (`meta.controller.ts`):
```
GET /external/meta/status?businessId=B010001&locationId=L0100001
```

Response:
```json
{
  "connected": true,
  "hasAccessToken": true,
  "hasPhoneNumberId": false,
  "hasPhoneNumber": false,
  "phoneNumber": null
}
```

## Variabile de Mediu Necesare (Backend)

```env
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_REDIRECT_URI=http://localhost:3003/external/meta/callback
```

## Securitate

### State Parameter
- Backend-ul generează state parameter care conține `businessId` și `locationId`
- State-ul este encodat în base64url pentru a fi trimis în URL
- La callback, backend-ul decodează state-ul pentru a identifica business-ul și locația

### Client Secret
- **NICIODATĂ** nu expune `META_APP_SECRET` în frontend
- Schimbul de cod cu token se face doar pe backend unde secret-ul este securizat
- Frontend-ul doar redirectionează utilizatorul, nu gestionează token-uri

## Diferențe față de Gmail OAuth

| Aspect | Gmail | Meta |
|--------|-------|------|
| Callback URL | Frontend | Backend |
| Code Exchange | Frontend → Backend | Backend direct |
| State Management | Frontend (localStorage) | Backend (base64url) |
| Redirect după callback | Nu | Da (la frontend) |

## Flow Diagram

```
┌─────────┐                ┌─────────┐                ┌──────┐
│Frontend │                │ Backend │                │ Meta │
└────┬────┘                └────┬────┘                └───┬──┘
     │                          │                         │
     │  1. getMetaAuthUrl()     │                         │
     ├─────────────────────────>│                         │
     │                          │                         │
     │  2. Return auth URL      │                         │
     │<─────────────────────────┤                         │
     │                          │                         │
     │  3. Redirect user        │                         │
     ├──────────────────────────┼────────────────────────>│
     │                          │                         │
     │                          │  4. User approves       │
     │                          │                         │
     │                          │  5. Callback with code  │
     │                          │<────────────────────────┤
     │                          │                         │
     │                          │  6. Exchange code       │
     │                          ├────────────────────────>│
     │                          │                         │
     │                          │  7. Return token        │
     │                          │<────────────────────────┤
     │                          │                         │
     │                          │  8. Save credentials    │
     │                          │  in database            │
     │                          │                         │
     │  9. Redirect to app      │                         │
     │<─────────────────────────┤                         │
     │                          │                         │
```

## Next Steps

1. ✅ Frontend gestionează inițierea OAuth
2. ✅ Backend generează URL-ul de autorizare
3. ✅ Backend face schimbul de cod cu token
4. ⚠️ **TODO:** Backend trebuie să redirectioneze la frontend după callback
5. ⚠️ **TODO:** Frontend poate afișa mesaj de succes/eroare bazat pe query params

