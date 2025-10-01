# Troubleshooting: Cognito Google Authentication Error

## Eroarea Primită

```json
{
  "code": "BadRequest",
  "message": "The server did not understand the operation that was requested.",
  "type": "client"
}
```

## Cauze Posibile

### 1. ❌ App Client Are Secret Configurat

**Problema**: Cognito App Client-ul tău are un "client secret" dar nu îl incluzi în cerere.

**Verificare**:
1. Deschide [AWS Cognito Console](https://console.aws.amazon.com/cognito/)
2. Selectează User Pool: `eu-central-1_KUaE0MTcQ`
3. Navighează la **App integration** > **App clients**
4. Selectează client: `ar2m2qg3gp4a0b4cld09aegdb`
5. Verifică dacă există un **Client secret** afișat

**Soluție**:

**Opțiunea A - Folosește Client Secret** (Recomandat pentru producție):
```env
# Adaugă în .env.local
VITE_COGNITO_CLIENT_SECRET=your-client-secret-here
```

**Opțiunea B - Elimină Client Secret** (Mai simplu pentru development):
1. În Cognito Console, la App client
2. Click **Edit**
3. Scroll la **Authentication flows**
4. **Dezactivează** "Generate client secret" dacă este posibil
5. Sau creează un nou App client fără secret

### 2. ❌ Redirect URI Nu Se Potrivește

**Problema**: `redirect_uri` trimis în cerere nu se potrivește cu cel configurat în Cognito.

**Verificare**:
1. În App client settings
2. Verifică **Allowed callback URLs**
3. Trebuie să fie **EXACT**: `http://localhost:5173/` (cu slash final!)

**Soluție**:
```
Callback URLs configurate în Cognito:
✅ http://localhost:5173/    (CU slash final)
❌ http://localhost:5173     (FĂRĂ slash final)
```

### 3. ❌ OAuth Flow Nu Este Permis

**Problema**: App client nu are "Authorization code grant" activat.

**Verificare**:
1. În App client, secțiunea **Hosted UI**
2. Verifică **Allowed OAuth Flows**
3. Trebuie să fie bifat: ✅ **Authorization code grant**

**Soluție**:
1. Click **Edit** pe App client
2. În **Hosted UI settings**
3. Bifează **Authorization code grant**
4. Salvează

### 4. ❌ Cognito Domain Nu Este Configurat

**Problema**: `VITE_COGNITO_DOMAIN` lipsește sau este incorect.

**Verificare**:
1. În User Pool, navighează la **App integration** > **Domain**
2. Verifică dacă există un domain configurat
3. Format corect: `your-app-name.auth.eu-central-1.amazoncognito.com`

**Soluție**:
```env
# În .env.local - FĂRĂ https:// și FĂRĂ trailing slash
VITE_COGNITO_DOMAIN=your-app-name.auth.eu-central-1.amazoncognito.com
```

### 5. ❌ Google Nu Este Configurat Ca Identity Provider

**Problema**: Google nu este adăugat ca Identity Provider în Cognito.

**Verificare**:
1. În User Pool, navighează la **Sign-in experience**
2. Verifică dacă există **Google** în lista de Identity providers

**Soluție**:
Vezi [COGNITO_GOOGLE_FEDERATION_SETUP.md](./COGNITO_GOOGLE_FEDERATION_SETUP.md)

## Debugging Steps

### Pas 1: Verifică Console Logs

După ce dai click pe "Continue with Google", verifică în Browser Console (F12):

```javascript
// Ar trebui să vezi:
"Handling OAuth callback with code: ..."
"Using Cognito Domain: your-app-name.auth.eu-central-1.amazoncognito.com"
"Using redirect URI: http://localhost:5173/"
"Token exchange request (without sensitive data): { ... }"
```

### Pas 2: Verifică Exact Eroarea

În console vei vedea și eroarea exactă de la Cognito. Caută după:
```
"Token exchange failed: ..."
```

### Pas 3: Verifică Configurarea Completă

Rulează acest checklist:

```javascript
// În Browser Console
console.log('Cognito Config Check:')
console.log('Client ID:', import.meta.env.VITE_COGNITO_CLIENT_ID)
console.log('Domain:', import.meta.env.VITE_COGNITO_DOMAIN)
console.log('Has Secret:', !!import.meta.env.VITE_COGNITO_CLIENT_SECRET)
console.log('Redirect URI:', window.location.origin + '/')
```

## Configurare Corectă `.env.local`

### Pentru App Client FĂRĂ Secret

```env
VITE_COGNITO_USER_POOL_ID=eu-central-1_KUaE0MTcQ
VITE_COGNITO_CLIENT_ID=ar2m2qg3gp4a0b4cld09aegdb
VITE_COGNITO_REGION=eu-central-1
VITE_COGNITO_DOMAIN=your-app-name.auth.eu-central-1.amazoncognito.com
```

### Pentru App Client CU Secret

```env
VITE_COGNITO_USER_POOL_ID=eu-central-1_KUaE0MTcQ
VITE_COGNITO_CLIENT_ID=ar2m2qg3gp4a0b4cld09aegdb
VITE_COGNITO_CLIENT_SECRET=your-actual-secret-here
VITE_COGNITO_REGION=eu-central-1
VITE_COGNITO_DOMAIN=your-app-name.auth.eu-central-1.amazoncognito.com
```

**IMPORTANT**: După orice modificare în `.env.local`, **REPORNEȘTE SERVERUL**:
```bash
npm run dev
```

## Verificare Rapidă AWS Cognito

### App Client Settings

Configurația ta trebuie să fie:

```
App client ID: ar2m2qg3gp4a0b4cld09aegdb

Hosted UI:
✅ Allowed OAuth Flows:
   ✅ Authorization code grant
   
✅ Allowed OAuth Scopes:
   ✅ openid
   ✅ email
   ✅ profile

✅ Allowed callback URLs:
   http://localhost:5173/
   
✅ Allowed sign-out URLs:
   http://localhost:5173/

✅ Identity providers:
   ✅ Cognito User Pool
   ✅ Google
```

## Test Manual

### Test 1: Verifică URL-ul Direct

Încearcă să accesezi direct URL-ul de autentificare:

```
https://YOUR_DOMAIN.auth.eu-central-1.amazoncognito.com/oauth2/authorize?client_id=ar2m2qg3gp4a0b4cld09aegdb&response_type=code&scope=openid+email+profile&redirect_uri=http://localhost:5173/&identity_provider=Google
```

Înlocuiește `YOUR_DOMAIN` cu domain-ul tău Cognito.

**Rezultat așteptat**: Ar trebui să te redirecteze la Google pentru autentificare.

### Test 2: Verifică Token Endpoint

Dacă ai un authorization code (de la test 1), poți testa manual:

```bash
curl -X POST https://YOUR_DOMAIN.auth.eu-central-1.amazoncognito.com/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&client_id=ar2m2qg3gp4a0b4cld09aegdb&code=YOUR_CODE&redirect_uri=http://localhost:5173/"
```

## Soluții Rapide

### Soluția 1: Recreează App Client (Cel Mai Simplu)

1. În Cognito Console, creează un nou App client:
   - Name: `dashboard-business-public`
   - **NU bifa** "Generate client secret"
   - OAuth flows: ✅ Authorization code grant
   - OAuth scopes: ✅ openid, email, profile
   - Callback URLs: `http://localhost:5173/`
   - Identity providers: ✅ Google

2. Notează noul Client ID

3. Actualizează `.env.local`:
```env
VITE_COGNITO_CLIENT_ID=new-client-id-here
```

4. Repornește serverul

### Soluția 2: Folosește Existing Client cu Secret

Dacă vrei să păstrezi client-ul existent:

1. În Cognito Console, găsește Client Secret-ul
2. Adaugă în `.env.local`:
```env
VITE_COGNITO_CLIENT_SECRET=your-client-secret
```
3. Repornește serverul

## Erori Comune și Soluții

| Eroare | Cauză | Soluție |
|--------|-------|---------|
| "invalid_client" | Client secret lipsește sau incorect | Adaugă VITE_COGNITO_CLIENT_SECRET |
| "invalid_grant" | Authorization code invalid sau expirat | Încearcă din nou procesul de login |
| "redirect_uri_mismatch" | Redirect URI nu se potrivește | Verifică slash final în URL |
| "BadRequest" | Configurare generală | Verifică toate punctele de mai sus |

## Need Help?

Dacă eroarea persistă:

1. **Copiază LOG-urile complete** din Browser Console
2. **Screenshot la configurația** App Client din Cognito
3. **Verifică exact** ce eroare primești de la Cognito (în console logs)

---

**TIP**: Cel mai simplu este să creezi un App Client NOU fără secret pentru development!

