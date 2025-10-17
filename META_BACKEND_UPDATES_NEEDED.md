# Meta OAuth Backend Updates Required

## Problema
Backend-ul trebuie actualizat pentru a:
1. Accepta `redirectUri` de la frontend (URL-ul aplicației)
2. Salva `redirectUri` în state parameter
3. Redirectiona utilizatorul înapoi la aplicație după autorizare

## ✅ Ce funcționează deja
- `meta.controller.ts` acceptă deja `redirectUri` ca query parameter
- `meta.service.ts` acceptă deja `customRedirectUri` în `generateAuthUrl()`

## ❌ Ce trebuie modificat

### 1. Actualizează `meta.service.ts` - Metoda `generateAuthUrl()`

**Locație:** `src/modules/external-apis/meta/meta.service.ts`

**Modificare:** Adaugă `frontendUri` în state parameter

```typescript
generateAuthUrl(
  businessId: string, 
  locationId: string, 
  customRedirectUri?: string
): { url: string; clientId: string; redirectUri: string } {
  if (!businessId || !locationId) throw new BadRequestException('Missing businessId or locationId');
  const clientId = this.configService.get<string>('meta.appId');
  
  // IMPORTANT: Separăm cele două URL-uri
  // 1. callbackUri = unde Meta trimite callback-ul (backend endpoint)
  // 2. frontendUri = unde redirectionăm utilizatorul după procesare (frontend app)
  const callbackUri = this.configService.get<string>('meta.redirectUri'); // http://localhost:3003/external/meta/callback
  const frontendUri = customRedirectUri; // http://localhost:5173 (primit de la frontend)
  
  if (!clientId) {
    this.logger.error('META_APP_ID is not configured');
    throw new BadRequestException('Meta App ID is not configured');
  }
  
  if (!callbackUri) {
    this.logger.error('META_REDIRECT_URI is not configured in .env');
    throw new BadRequestException('Meta Redirect URI is not configured');
  }
  
  const scopesString = this.configService.get<string>('meta.scopes');
  const scopes = scopesString.split(',').map(s => s.trim()).filter(s => s.length > 0);
  
  // ✅ MODIFICARE: Salvează AMBELE URI-uri în state
  const state = Buffer.from(JSON.stringify({ 
    businessId, 
    locationId, 
    redirectUri: callbackUri,  // pentru Meta callback
    frontendUri: frontendUri   // pentru redirect final la aplicație
  })).toString('base64url');
  
  const url = new URL('https://www.facebook.com/v19.0/dialog/oauth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', callbackUri); // Meta redirectionează aici
  url.searchParams.set('scope', scopes.join(','));
  url.searchParams.set('state', state);
  
  this.logger.log(`Meta OAuth URL generated for businessId: ${businessId}, locationId: ${locationId}, callbackUri: ${callbackUri}, frontendUri: ${frontendUri}`);
  
  return {
    url: url.toString(),
    clientId,
    redirectUri: callbackUri,
  };
}
```

### 2. Actualizează `meta.service.ts` - Metoda `handleCallback()`

**Modificare:** Returnează `frontendUri` pentru a fi folosit în redirect

```typescript
async handleCallback(code: string, state: string): Promise<{ success: boolean; frontendUri?: string }> {
  if (!code || !state) throw new BadRequestException('Missing code/state');
  
  // ✅ MODIFICARE: Extrage TOATE câmpurile din state, inclusiv frontendUri
  const stateData = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
  const { businessId, locationId, redirectUri, frontendUri } = stateData;
  
  const clientId = this.configService.get<string>('meta.appId');
  const clientSecret = this.configService.get<string>('meta.appSecret');

  this.logger.log(`Processing Meta OAuth callback for businessId: ${businessId}, locationId: ${locationId}, redirectUri: ${redirectUri}, frontendUri: ${frontendUri}`);

  const axiosInstance = axios.create({
    timeout: 10000,
    maxRedirects: 3
  });

  try {
    this.logger.log(`Exchanging code for token with params: clientId=${clientId}, redirectUri=${redirectUri}`);
    const tokenResp = await axiosInstance.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: { 
        client_id: clientId, 
        client_secret: clientSecret, 
        redirect_uri: redirectUri, // MUST match authorization request
        code 
      },
    });
    const accessToken = tokenResp.data?.access_token as string;
    this.logger.log(`Short-lived access token obtained for businessId: ${businessId}`);

    // Optional: exchange for long-lived token
    let longLived = accessToken;
    try {
      const ll = await axiosInstance.get('https://graph.facebook.com/v19.0/oauth/access_token', {
        params: { 
          grant_type: 'fb_exchange_token', 
          client_id: clientId, 
          client_secret: clientSecret, 
          fb_exchange_token: accessToken 
        },
      });
      longLived = ll.data?.access_token || accessToken;
      this.logger.log(`Long-lived access token obtained for businessId: ${businessId}`);
    } catch (error) {
      this.logger.warn(`Failed to exchange for long-lived token for businessId: ${businessId}, using short-lived token`);
    }

    // Store credentials
    await this.externalApis.saveMetaCredentials(businessId, {
      accessToken: longLived,
      phoneNumberId: '',
      appSecret: clientSecret,
      phoneNumber: '',
    } as any);

    this.logger.log(`Meta credentials saved successfully for businessId: ${businessId}`);

    // ✅ MODIFICARE: Returnează frontendUri pentru redirect
    return { success: true, frontendUri };
  } catch (error) {
    this.logger.error(`Meta OAuth token exchange failed for businessId: ${businessId}`, {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
      params: { clientId, redirectUri, hasCode: !!code }
    });
    throw new BadRequestException(
      error.response?.data?.error?.message || 
      'Failed to exchange OAuth code for access token. Please ensure redirect_uri matches the one configured in Meta App.'
    );
  }
}
```

### 3. Actualizează `meta.controller.ts` - Endpoint-ul `callback`

**Locație:** `src/modules/external-apis/meta/meta.controller.ts`

**Modificare:** Redirectionează la `frontendUri` după procesare

```typescript
import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { MetaService } from './meta.service';

@Controller('external/meta')
export class MetaController {
  constructor(private readonly meta: MetaService) {}

  @Get('auth-url')
  getAuthUrl(
    @Query('businessId') businessId: string, 
    @Query('locationId') locationId: string,
    @Query('redirectUri') redirectUri?: string,
  ) {
    return this.meta.generateAuthUrl(businessId, locationId, redirectUri);
  }

  @Get('status')
  async getStatus(
    @Query('businessId') businessId: string,
    @Query('locationId') locationId: string
  ) {
    return this.meta.getCredentialsStatus(businessId, locationId);
  }

  // ✅ MODIFICARE: Schimbă din simple return în redirect cu @Res()
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response
  ) {
    try {
      const result = await this.meta.handleCallback(code, state);
      
      // Folosește frontendUri din state sau fallback la localhost
      const redirectUrl = result.frontendUri || 'http://localhost:5173';
      
      // Redirectionează utilizatorul înapoi la aplicația frontend cu succes
      return res.redirect(`${redirectUrl}?meta_auth=success`);
    } catch (error) {
      console.error('Meta callback error:', error);
      
      // În caz de eroare, tot redirectionăm dar cu parametrul de eroare
      const redirectUrl = 'http://localhost:5173'; // fallback
      return res.redirect(`${redirectUrl}?meta_auth=error&message=${encodeURIComponent(error.message)}`);
    }
  }
}
```

## 4. Verificare în Frontend (Opțional)

Pentru a arăta un mesaj utilizatorului după redirect, poți adăuga în `App.jsx` sau în `BusinessProcesses.jsx`:

```javascript
// Verifică query params pentru mesaje de succes/eroare
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const metaAuth = urlParams.get('meta_auth');
  const message = urlParams.get('message');
  
  if (metaAuth === 'success') {
    console.log('✅ Meta authorization successful!');
    // Afișează toast de succes
    // Curăță URL-ul
    window.history.replaceState({}, document.title, window.location.pathname);
    // Reîncarcă status-ul serviciilor
    checkAllServicesStatus();
  } else if (metaAuth === 'error') {
    console.error('❌ Meta authorization failed:', message);
    // Afișează toast de eroare
    // Curăță URL-ul
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}, []);
```

## Rezumat Modificări

| Fișier | Modificare | Status |
|--------|-----------|---------|
| `meta.service.ts` - `generateAuthUrl()` | Adaugă `frontendUri` în state | ⚠️ TODO |
| `meta.service.ts` - `handleCallback()` | Returnează `frontendUri` | ⚠️ TODO |
| `meta.controller.ts` - `callback()` | Redirectionează la `frontendUri` | ⚠️ TODO |
| Frontend | Adaugă `redirectUri` în request | ✅ DONE |

## Flow Final

```
1. Frontend → GET /external/meta/auth-url?...&redirectUri=http://localhost:5173
2. Backend → Generează URL Meta cu state={ businessId, locationId, redirectUri, frontendUri }
3. Frontend → Redirectionează utilizatorul la Meta
4. Meta → Utilizatorul autorizează
5. Meta → GET /external/meta/callback?code=...&state=...
6. Backend → Exchange code for token + Save credentials
7. Backend → res.redirect('http://localhost:5173?meta_auth=success')
8. Frontend → Arată mesaj de succes + Reîncarcă status
```

## Testare

După modificări, testează astfel:

1. **Backend:** Restart backend-ul după modificări
2. **Frontend:** Apasă "Autorizează Meta"
3. **Meta:** Autorizează aplicația
4. **Verificare:** Ar trebui să fii redirectionat înapoi la `http://localhost:5173?meta_auth=success`
5. **Status:** Verifică că `checkServiceStatus('meta')` returnează `authorized: true`

