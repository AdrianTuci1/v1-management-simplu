# Google OAuth Token Refresh Fix

## Problema
Utilizatorii autentificați prin **Google OAuth prin Cognito** (federated identity) erau deconectați automat după ce ID token-ul expira (~60 minute). Refresh token-ul nu funcționa corect deoarece codul folosea metoda SDK-ului Cognito care funcționează doar pentru autentificare directă email/password, nu pentru identity providers federați (Google, Facebook, etc.).

## Cauza
Pentru federated identity providers, Cognito returnează token-uri prin OAuth2, iar refresh-ul acestora trebuie făcut prin endpoint-ul `/oauth2/token` cu `grant_type=refresh_token`, NU prin metoda `cognitoUser.refreshSession()` din SDK.

## Soluția Implementată

### 1. Metodă Nouă: `refreshOAuthToken()`
Am adăugat o metodă dedicată pentru refresh-ul token-urilor OAuth:

```javascript
async refreshOAuthToken() {
  // Folosește endpoint-ul Cognito OAuth2 cu grant_type=refresh_token
  const tokenResponse = await fetch(`https://${COGNITO_DOMAIN}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: poolData.ClientId,
      refresh_token: userData.refresh_token
    })
  })
}
```

### 2. Routing Inteligent în `refreshSession()`
Metoda `refreshSession()` acum detectează tipul de autentificare și alege metoda corectă:

- **Google OAuth** → folosește `refreshOAuthToken()` (OAuth2 endpoint)
- **Email/Password** → folosește `cognitoUser.refreshSession()` (SDK Cognito)

### 3. Îmbunătățiri în `checkAndRefreshToken()`
Am separat logica pentru Google OAuth și Email/Password:

- Pentru **Google OAuth**: citește token-urile direct din localStorage (nu mai depinde de `cognitoUser` din pool)
- Pentru **Email/Password**: folosește metoda clasică cu `cognitoUser.getSession()`
- Am adăugat logging extensiv pentru debugging

### 4. Setări de Persistență pentru Google OAuth
- Setăm automat `remember-me=true` pentru utilizatorii Google OAuth
- Session timestamp este actualizat la fiecare refresh
- Token-urile sunt salvate corect în localStorage după fiecare refresh

## Ce Am Schimbat

### Fișier: `src/services/cognitoAuthService.js`

1. **Metodă nouă**: `refreshOAuthToken()` - lines ~745-836
2. **Metoda actualizată**: `refreshSession()` - lines ~680-743
3. **Metoda actualizată**: `checkAndRefreshToken()` - lines ~112-251
4. **Metoda actualizată**: `handleOAuthCallback()` - line 1023 (adăugat `remember-me`)

## Logging Adăugat

Acum veți vedea în consolă:
- 🔍 Verificare token (Google OAuth/Email-Password)
- 🔄 Refresh în curs
- ✅ Refresh reușit
- ❌ Erori detaliate dacă ceva eșuează
- 📝 Request-uri către endpoint-ul OAuth2
- 📡 Status code-uri ale răspunsurilor

## Testare

### Cum să testezi dacă funcționează:

1. **Autentifică-te cu Google OAuth**
2. **Deschide Console** (F12 → Console)
3. **Așteaptă ~55 minute** sau modifică `isTokenExpiringSoon()` să returneze mai repede
4. **Observă logging-ul**:
   ```
   🔍 Checking Google OAuth token...
   🔄 Token (Google OAuth) is expiring soon, refreshing...
   📝 Refreshing OAuth token with grant_type=refresh_token
   🌐 Making refresh request to: https://auth.simplu.io/oauth2/token
   📡 Refresh response status: 200
   ✅ Token refresh successful, decoding new tokens
   ✅ OAuth token refreshed and stored successfully
   ✅ Token (Google OAuth) refreshed successfully
   ```

5. **Verifică în Application tab** → Local Storage:
   - `auth-token` ar trebui să fie actualizat
   - `cognito-data` ar trebui să conțină noul token
   - `session-timestamp` ar trebui actualizat

### Test Rapid (pentru debugging):

Modifică temporar linia 60 în `cognitoAuthService.js`:
```javascript
// Înainte:
return timeUntilExpiry < 300000 // 5 minutes

// Pentru test (30 secunde):
return timeUntilExpiry < 30000 // 30 seconds
```

Apoi refresh-ul va începe după ~30 secunde de la autentificare.

## Configurare Cognito Necesară

Asigură-te că în **AWS Cognito Console**:

1. **App Client Settings**:
   - ✅ Refresh token expiration: 30 days (default)
   - ✅ "Allowed OAuth Flows": Authorization code grant
   - ✅ "Allowed OAuth Scopes": openid, email, phone

2. **App Integration** → Domain:
   - Domeniul custom/Cognito este configurat corect

3. **Federation** → Identity Providers:
   - Google este configurat corect
   - Client ID și Client Secret sunt valide

## Variabile de Mediu

Asigură-te că ai în `.env.local`:

```env
VITE_COGNITO_USER_POOL_ID=eu-central-1_KUaE0MTcQ
VITE_COGNITO_CLIENT_ID=ar2m2qg3gp4a0b4cld09aegdb
VITE_COGNITO_DOMAIN=auth.simplu.io
VITE_COGNITO_REDIRECT_URI=http://localhost:5173/
VITE_COGNITO_SCOPES=openid email phone

# Optional - doar dacă app client-ul are secret (nu e recomandat pentru SPA):
# VITE_COGNITO_CLIENT_SECRET=your_secret_here
```

## Posibile Probleme

### 1. "Token refresh failed: invalid_grant"
**Cauză**: Refresh token-ul a expirat (30 zile) sau a fost revocat.
**Soluție**: Utilizatorul trebuie să se autentifice din nou.

### 2. "Token refresh failed: unauthorized_client"
**Cauză**: App client-ul nu are permisiune pentru refresh token grant.
**Soluție**: În Cognito Console → App clients → Edit → Enable "Refresh token"

### 3. "No refresh token found"
**Cauză**: Refresh token-ul nu a fost stocat corect la autentificare inițială.
**Soluție**: Verifică că în `handleOAuthCallback()` token-urile sunt salvate corect.

## Beneficii

✅ **Sesiuni persistente** pentru utilizatori Google OAuth  
✅ **Nu mai sunt deconectări** după expirarea ID token-ului  
✅ **Logging detaliat** pentru debugging  
✅ **Suport pentru ambele tipuri** de autentificare (Google OAuth și Email/Password)  
✅ **Error handling** îmbunătățit  
✅ **Token monitoring** automat la fiecare 30 secunde  

## Note Importante

- Refresh token-ul expiră după **30 zile** (default Cognito)
- ID token-ul expiră după **60 minute** (default Cognito)
- Access token-ul expiră după **60 minute** (default Cognito)
- Token refresh se declanșează automat când ID token-ul mai are **< 5 minute** până la expirare
- Pentru Google OAuth, nu mai depindem de `cognitoUser` din pool - folosim doar token-urile stocate

## Autor
Implementat de AI Assistant - Octombrie 2025

