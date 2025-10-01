# Fix: invalid_scope Error

## 🔴 Eroarea Primită

```
/?error_description=invalid_scope&error=invalid_request
```

## 🎯 Cauza

Scope-urile cerute (`openid email profile`) **NU sunt activate** în configurația Cognito App Client-ului tău.

## ✅ Soluție: Activează Scope-urile în AWS Cognito

### Pas 1: Deschide AWS Cognito Console

1. Accesează [AWS Cognito Console](https://console.aws.amazon.com/cognito/)
2. Selectează User Pool: `eu-central-1_KUaE0MTcQ`
3. Navighează la **App integration** → **App clients**
4. Selectează app client: `ar2m2qg3gp4a0b4cld09aegdb`

### Pas 2: Editează Hosted UI Settings

1. Scroll jos la secțiunea **Hosted UI**
2. Click pe **Edit**
3. Găsește **Allowed OAuth Scopes**

### Pas 3: Bifează Scope-urile Necesare

Asigură-te că sunt bifate:

```
✅ openid
✅ email  
✅ profile
✅ aws.cognito.signin.user.admin (opțional, pentru admin)
✅ phone (opțional, dacă vrei număr telefon)
```

**MINIMUM NECESAR** pentru Google Sign-In:
```
✅ openid
✅ email
```

### Pas 4: Salvează

1. Scroll jos și click **Save changes**
2. Așteaptă câteva secunde pentru propagare

## 🔧 Alternative: Folosește Doar Scope-urile Activate

Dacă nu poți sau nu vrei să modifici configurația Cognito, specifică doar scope-urile care sunt deja activate.

### Verifică Ce Scope-uri Sunt Active

În Cognito Console, la App Client settings, vezi ce scope-uri sunt bifate.

### Configurează în `.env.local`

Dacă doar `openid` și `email` sunt active:

```env
# Adaugă în .env.local
VITE_COGNITO_SCOPES=openid email
```

Dacă toate sunt active:

```env
VITE_COGNITO_SCOPES=openid email profile
```

**IMPORTANT**: Scope-urile trebuie separate prin SPAȚIU, nu virgulă!

## 🧪 Testare

### Test 1: Verifică URL-ul Generat

După modificări, repornește serverul:
```bash
npm run dev
```

Apoi deschide Browser Console (F12) și încearcă să te autentifici. Ar trebui să vezi:
```
🚀 Redirecting to Google sign-in through Cognito
   Domain: auth.simplu.io
   Redirect URI: http://localhost:5173/
   Scopes: openid email profile
   Full URL: https://auth.simplu.io/oauth2/authorize?...
```

### Test 2: Testează Manual URL-ul

Construiește și testează URL-ul manual în browser:

```
https://auth.simplu.io/oauth2/authorize?client_id=ar2m2qg3gp4a0b4cld09aegdb&response_type=code&scope=openid+email&redirect_uri=http://localhost:5173/&identity_provider=Google
```

Încearcă cu scope-uri diferite până găsești combinația care funcționează:

**Doar openid:**
```
scope=openid
```

**Openid + email:**
```
scope=openid+email
```

**Toate (dacă sunt activate):**
```
scope=openid+email+profile
```

## 📋 Configurare Completă `.env.local`

```env
# AWS Cognito
VITE_COGNITO_USER_POOL_ID=eu-central-1_KUaE0MTcQ
VITE_COGNITO_CLIENT_ID=ar2m2qg3gp4a0b4cld09aegdb
VITE_COGNITO_REGION=eu-central-1
VITE_COGNITO_DOMAIN=auth.simplu.io

# Scopes (ajustează după ce sunt activate în Cognito)
VITE_COGNITO_SCOPES=openid email profile

# Client Secret (dacă ai)
# VITE_COGNITO_CLIENT_SECRET=your-secret

# Demo Mode
VITE_DEMO_MODE=false
```

## ⚠️ Erori Comune

### 1. "Scope-urile sunt bifate dar tot primesc eroare"

**Soluție**: 
- Așteaptă 1-2 minute după salvare
- Clear cache browser (Ctrl+Shift+Del)
- Încearcă în Incognito/Private mode
- Repornește serverul

### 2. "Nu pot găsi Hosted UI settings"

**Soluție**:
- Verifică că ești în User Pool corect
- App client trebuie să fie de tip "Public client" sau "Confidential client"
- Unele app clients vechi nu au Hosted UI - creează unul nou

### 3. "Nu văd checkbox-urile pentru scope-uri"

**Soluție**:
- La crearea/editarea app client, trebuie să activezi Hosted UI
- Bifează "Use the Cognito Hosted UI"
- Apoi vei vedea opțiunile pentru scope-uri

## 🔍 Debugging

### Verifică Exact Ce Scope-uri Sunt Permise

În AWS Console, la App Client:

```
Hosted UI Settings:
  Allowed OAuth Flows:
    ✅ Authorization code grant
    
  Allowed OAuth Scopes:
    ✅ openid          ← NECESAR
    ✅ email           ← NECESAR pentru email-ul user-ului
    ✅ profile         ← Pentru nume, poze, etc.
    ⬜ phone           ← Doar dacă vrei număr telefon
    ⬜ aws.cognito.signin.user.admin ← Pentru operații admin
```

### Verifică în Browser Console

După ce dai click pe "Continue with Google", verifică în console:
```javascript
console.log('Scopes being used:', import.meta.env.VITE_COGNITO_SCOPES || 'openid email profile')
```

## ✅ Checklist Final

- [ ] Am accesat AWS Cognito Console
- [ ] Am găsit app client-ul `ar2m2qg3gp4a0b4cld09aegdb`
- [ ] Am editat Hosted UI settings
- [ ] Am bifat cel puțin `openid` și `email`
- [ ] Am salvat modificările
- [ ] Am adăugat `VITE_COGNITO_SCOPES` în `.env.local` (opțional)
- [ ] Am repornit serverul (`npm run dev`)
- [ ] Am testat autentificarea
- [ ] Nu mai primesc eroarea `invalid_scope`

## 🎯 Scope-uri Recomandate

Pentru majoritatea aplicațiilor:

```
Minimum:
- openid
- email

Recomandat:
- openid
- email
- profile

Pentru admin/management:
- openid
- email
- profile
- aws.cognito.signin.user.admin
```

## 🚀 După Rezolvare

După ce ai activat scope-urile corecte:

1. Repornește serverul
2. Testează autentificarea cu Google
3. Ar trebui să funcționeze fără erori!

---

**TIP**: Cea mai simplă soluție este să activezi toate scope-urile în Cognito, apoi să le folosești pe toate în aplicație!

