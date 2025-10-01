# Debugging 401 Unauthorized Error

## Problema
Eroarea `Failed to load resource: the server responded with a status of 401 (Unauthorized)` la endpoint-ul `/api/auth/me/B0100001` indică că token-ul de autentificare nu este valid sau a expirat.

## Soluțiile implementate

### 1. **Refresh automat înainte de cerere**
```javascript
// În apiClient.js - verifică dacă token-ul a expirat înainte de a face cererea
if (cognitoAuthService.isTokenExpired(authToken)) {
  console.log('🔄 Token is expired, attempting refresh before request...');
  const refreshedSession = await cognitoAuthService.refreshSession();
  if (refreshedSession) {
    authToken = refreshedSession.id_token || refreshedSession.access_token;
  }
}
```

### 2. **Refresh automat după eroarea 401**
```javascript
// În apiClient.js - dacă primim 401, încearcă refresh-ul și retry
if (response.status === 401 && authToken && resourceType === 'auth') {
  console.log('🔄 Received 401, attempting token refresh...');
  const refreshedSession = await cognitoAuthService.refreshSession();
  if (refreshedSession) {
    // Retry cererea cu noul token
  }
}
```

### 3. **Debugging token-ului**

Pentru a verifica starea token-ului, rulează în consolă:

```javascript
// Copiază și lipește în consolă pentru a verifica token-ul
const savedCognitoData = localStorage.getItem('cognito-data');
if (savedCognitoData) {
  const userData = JSON.parse(savedCognitoData);
  const authToken = userData.id_token || userData.access_token;
  
  if (authToken) {
    const payload = JSON.parse(atob(authToken.split('.')[1]));
    const expiration = payload.exp * 1000;
    const now = Date.now();
    const isExpired = now >= expiration;
    
    console.log('Token expiration:', new Date(expiration));
    console.log('Current time:', new Date(now));
    console.log('Is expired:', isExpired);
  }
}
```

## Pași pentru debugging

### 1. **Verifică token-ul în localStorage**
```javascript
// În consolă
console.log('cognito-data:', localStorage.getItem('cognito-data'));
console.log('auth-token:', localStorage.getItem('auth-token'));
```

### 2. **Verifică dacă token-ul a expirat**
```javascript
// În consolă
const cognitoData = JSON.parse(localStorage.getItem('cognito-data'));
const token = cognitoData.id_token;
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Expires at:', new Date(payload.exp * 1000));
console.log('Is expired:', Date.now() >= payload.exp * 1000);
```

### 3. **Testează refresh-ul manual**
```javascript
// În consolă
import cognitoAuthService from './src/services/cognitoAuthService.js';
cognitoAuthService.refreshSession().then(console.log);
```

## Cauze comune ale erorii 401

1. **Token expirat** - cel mai comun caz
2. **Token invalid** - format greșit sau corupt
3. **Token lipsă** - nu există în localStorage
4. **Server-ul nu recunoaște token-ul** - configurație greșită

## Soluții automate implementate

✅ **Refresh înainte de cerere** - verifică și refresh-ează token-ul înainte de a face cererea
✅ **Refresh după 401** - dacă primim 401, încearcă refresh-ul și retry
✅ **Redirectare automată** - dacă refresh-ul eșuează, redirectează la login
✅ **Curățare automată** - șterge datele invalide din localStorage

## Testarea soluției

1. **Autentifică-te** în aplicație
2. **Așteaptă** ca token-ul să expire (sau modifică manual timestamp-ul)
3. **Încearcă** să accesezi o pagină care face cereri către API
4. **Verifică** în consolă dacă apare mesajul de refresh
5. **Confirmă** că cererea reușește după refresh

## Log-uri de monitorizare

Urmărește aceste mesaje în consolă:
- `🔄 Token is expired, attempting refresh before request...`
- `✅ Token refreshed successfully before request`
- `🔄 Received 401, attempting token refresh...`
- `✅ Request succeeded after token refresh`
