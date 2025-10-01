# Custom Domain Setup pentru Cognito (auth.simplu.io)

## ✅ Ai Configurat Custom Domain!

Foarte bine că folosești custom domain `auth.simplu.io` pentru Cognito! Asta face aplicația mai profesională.

## 🔧 Configurare Necesară

### 1. Environment Variables

Creează/actualizează `.env.local`:

```env
# AWS Cognito Configuration
VITE_COGNITO_USER_POOL_ID=eu-central-1_KUaE0MTcQ
VITE_COGNITO_CLIENT_ID=ar2m2qg3gp4a0b4cld09aegdb
VITE_COGNITO_REGION=eu-central-1

# Custom Domain (FĂRĂ https:// și FĂRĂ trailing slash)
VITE_COGNITO_DOMAIN=auth.simplu.io

# Client Secret (dacă app client-ul tău are secret)
# VITE_COGNITO_CLIENT_SECRET=your-secret-here

# Demo Mode
VITE_DEMO_MODE=false
```

### 2. Verifică Configurația în AWS Cognito

#### A. Custom Domain

1. Deschide [AWS Cognito Console](https://console.aws.amazon.com/cognito/)
2. Selectează User Pool: `eu-central-1_KUaE0MTcQ`
3. Navighează la **App integration** > **Domain**
4. Verifică că `auth.simplu.io` este configurat
5. Status ar trebui să fie: **Active**

#### B. App Client - Callback URLs

1. În același User Pool, mergi la **App integration** > **App clients**
2. Selectează app client: `ar2m2qg3gp4a0b4cld09aegdb`
3. Verifică **Allowed callback URLs**:

```
Pentru Development:
http://localhost:5173/

Pentru Production:
https://your-production-domain.com/
https://simplu.io/
```

**IMPORTANT**: URL-ul trebuie să aibă slash final: `/`

#### C. App Client - Sign-out URLs

```
http://localhost:5173/
https://your-production-domain.com/
```

#### D. OAuth Settings

Verifică că sunt bifate:

**Allowed OAuth Flows:**
- ✅ Authorization code grant
- ✅ Implicit grant (opțional)

**Allowed OAuth Scopes:**
- ✅ openid
- ✅ email
- ✅ profile

**Identity providers:**
- ✅ Cognito User Pool
- ✅ Google (dacă vrei Google Sign-In)

### 3. Configurare Google (pentru Google Sign-In)

În [Google Cloud Console](https://console.cloud.google.com/):

**Authorized redirect URIs:**
```
https://auth.simplu.io/oauth2/idpresponse
```

**Authorized JavaScript origins:**
```
http://localhost:5173
https://your-production-domain.com
```

## 🚀 Cum Funcționează

### Flux de Autentificare

```
User clicks "Continue with Google"
    ↓
Redirect la https://auth.simplu.io/oauth2/authorize
    ↓
Cognito redirect la Google
    ↓
User autentificare Google
    ↓
Google redirect înapoi la https://auth.simplu.io/oauth2/idpresponse
    ↓
Cognito procesează și redirect la http://localhost:5173/?code=xxx
    ↓
App procesează code și obține tokens
    ↓
User autentificat!
```

### URL-uri Generate

Cu custom domain, URL-urile vor arăta astfel:

**Authorization URL:**
```
https://auth.simplu.io/oauth2/authorize?
  client_id=ar2m2qg3gp4a0b4cld09aegdb&
  response_type=code&
  scope=openid+email+profile&
  redirect_uri=http://localhost:5173/&
  identity_provider=Google
```

**Token URL:**
```
https://auth.simplu.io/oauth2/token
```

## 🔍 Verificare Rapidă

### Test 1: Verifică Domain-ul

Deschide în browser:
```
https://auth.simplu.io/.well-known/jwks.json
```

Ar trebui să returneze JSON cu keys (dacă domain-ul este configurat corect).

### Test 2: Test Login Direct

Încearcă URL-ul direct (înlocuiește cu valorile tale):
```
https://auth.simplu.io/login?
  client_id=ar2m2qg3gp4a0b4cld09aegdb&
  response_type=code&
  scope=openid+email+profile&
  redirect_uri=http://localhost:5173/
```

Ar trebui să vezi pagina de login Cognito Hosted UI.

### Test 3: Test Google Sign-In Direct

```
https://auth.simplu.io/oauth2/authorize?
  client_id=ar2m2qg3gp4a0b4cld09aegdb&
  response_type=code&
  scope=openid+email+profile&
  redirect_uri=http://localhost:5173/&
  identity_provider=Google
```

Ar trebui să te redirecteze direct la Google pentru autentificare.

## ⚠️ Probleme Comune

### 1. "Invalid redirect_uri"

**Cauză**: Redirect URI nu este adăugat în Cognito App Client.

**Soluție**: 
- Adaugă `http://localhost:5173/` exact așa (cu slash!) în Allowed callback URLs

### 2. "Domain not found"

**Cauză**: Custom domain nu este configurat corect sau DNS nu este propagat.

**Soluție**:
- Verifică în Cognito Console că domain-ul este Active
- Verifică DNS records pentru `auth.simplu.io`
- Așteaptă propagarea DNS (poate dura până la 48h)

### 3. "BadRequest" la token exchange

**Cauză**: App Client are secret dar nu îl trimiți.

**Soluție**:
```env
# Adaugă în .env.local
VITE_COGNITO_CLIENT_SECRET=your-actual-secret
```

### 4. Certificate/SSL Errors

**Cauză**: Custom domain necesită certificat SSL valid.

**Soluție**:
- Verifică că ai certificat SSL configurat în AWS Certificate Manager
- Certificatul trebuie să fie pentru `auth.simplu.io`

## 📊 Checklist Configurare

- [ ] Custom domain `auth.simplu.io` este Active în Cognito
- [ ] Certificate SSL este valid și aplicat
- [ ] DNS records sunt configurate corect
- [ ] `VITE_COGNITO_DOMAIN=auth.simplu.io` în `.env.local`
- [ ] Callback URLs includ `http://localhost:5173/`
- [ ] OAuth flows sunt activate (Authorization code grant)
- [ ] Google este configurat ca Identity Provider (opțional)
- [ ] Google redirect URI include `https://auth.simplu.io/oauth2/idpresponse`
- [ ] Serverul este repornit după modificări `.env.local`

## 🎯 Next Steps

După ce ai verificat configurația:

1. **Repornește serverul**:
```bash
npm run dev
```

2. **Testează autentificarea**:
   - Accesează `http://localhost:5173`
   - Click "Continue with Google"
   - Ar trebui să mergi la `auth.simplu.io` apoi la Google

3. **Verifică în Console** (F12):
   - Ar trebui să vezi redirect la `auth.simplu.io`
   - Apoi redirect la Google
   - Apoi înapoi la localhost cu `?code=...`

## 🆘 Need Help?

Dacă întâmpini probleme:

1. Verifică **toate** punctele din checklist
2. Verifică **console logs** din browser (F12)
3. Verifică că domain-ul `auth.simplu.io` răspunde la requests
4. Verifică că certificate-ul SSL este valid

---

**Custom domain-ul face aplicația ta să arate mult mai profesional!** 🎉

