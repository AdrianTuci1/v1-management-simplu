# 🚀 Google Authentication - Quick Start

Configurare rapidă în 5 pași pentru autentificarea cu Google!

## ⚡ Configurare Rapidă

### Pas 1: Obține Google Client ID (5 minute)

1. Accesează [Google Cloud Console](https://console.cloud.google.com/)
2. Creează un proiect nou sau selectează unul existent
3. Navighează la **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Selectează **Web application**
6. Adaugă la **Authorized JavaScript origins**:
   ```
   http://localhost:5173
   ```
7. Copiază **Client ID** (arată ca: `xxxxx.apps.googleusercontent.com`)

### Pas 2: Configurează Aplicația

Creează fișierul `.env.local` în root-ul proiectului:

```bash
# .env.local
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
VITE_DEMO_MODE=false
```

**Înlocuiește** `YOUR_CLIENT_ID_HERE` cu Client ID-ul tău de la Google!

### Pas 3: Repornește Serverul

```bash
npm run dev
```

### Pas 4: Testează

1. Accesează `http://localhost:5173`
2. Click pe **"Continue with Google"**
3. Selectează contul Google
4. Autentificare completă! 🎉

## 📋 Checklist Configurare

- [ ] Am creat credentials în Google Cloud Console
- [ ] Am adăugat `http://localhost:5173` la authorized origins
- [ ] Am copiat Client ID
- [ ] Am creat fișierul `.env.local`
- [ ] Am adăugat `VITE_GOOGLE_CLIENT_ID` în `.env.local`
- [ ] Am reporni serverul de development
- [ ] Pot să mă autentific cu Google

## 🎯 Rezultat Așteptat

După configurare, vei vedea:
- ✅ Butonul "Continue with Google" activ
- ✅ Popup Google OAuth la click
- ✅ Autentificare reușită
- ✅ Dashboard încărcat cu datele tale

## ❌ Probleme Comune

### "Autentificarea cu Google nu este configurată"

**Cauză**: `VITE_GOOGLE_CLIENT_ID` nu este setat

**Soluție**:
1. Verifică că ai creat fișierul `.env.local`
2. Verifică că ai adăugat `VITE_GOOGLE_CLIENT_ID=...`
3. Repornește serverul (`npm run dev`)

### "Origin not authorized"

**Cauză**: URL-ul nu este adăugat în Google Cloud Console

**Soluție**:
1. Deschide [Google Cloud Console](https://console.cloud.google.com/)
2. Mergi la **APIs & Services** > **Credentials**
3. Click pe OAuth client ID creat
4. Adaugă `http://localhost:5173` la **Authorized JavaScript origins**
5. Salvează și așteaptă 1-2 minute

### "Popup blocked"

**Cauză**: Browser-ul blochează popup-uri

**Soluție**:
1. Click pe iconița de popup blocat în address bar
2. Permite popup-uri pentru site

## 🔒 Securitate

### Development
- Folosește `http://localhost:5173`
- OK pentru testare locală

### Production
- **OBLIGATORIU**: Folosește HTTPS
- Adaugă doar domeniul tău de production la authorized origins
- Elimină URL-urile de development

## 📖 Documentație Completă

Pentru configurare detaliată și troubleshooting avansat, vezi:
- [`GOOGLE_AUTH_SETUP.md`](./GOOGLE_AUTH_SETUP.md) - Documentație completă
- [`AUTHENTICATION_QUICK_START.md`](./AUTHENTICATION_QUICK_START.md) - Overview autentificare

## 🎨 Personalizare

### Schimbă textul butonului

În `src/components/AuthScreen.jsx`:

```javascript
<button onClick={handleGoogleSignIn} className="...">
  <GoogleIcon />
  Textul tău personalizat
</button>
```

### Adaugă mai multe scopes

În `src/components/AuthScreen.jsx`:

```javascript
const googleLogin = useGoogleLogin({
  scope: 'email profile openid https://www.googleapis.com/auth/calendar',
  onSuccess: async (tokenResponse) => {
    // ...
  }
})
```

## 🧪 Testare

### Test Manual

1. **Sign-In cu Google**
   ```
   1. Click "Continue with Google"
   2. Selectează cont
   3. Verifică că dashboard se încarcă
   ```

2. **Sign-Out**
   ```
   1. Click pe iconița user (dreapta sus)
   2. Click "Deconectare"
   3. Verifică redirect la sign-in page
   ```

3. **Session Persistence**
   ```
   1. Autentifică-te cu Google
   2. Închide tab-ul
   3. Deschide din nou aplicația
   4. Verifică că ești încă autentificat
   ```

### Verificare în Console

```javascript
// Deschide Browser Console (F12)
console.log('Auth Provider:', localStorage.getItem('auth-provider'))
// Ar trebui să fie: "google"

console.log('User Email:', localStorage.getItem('user-email'))
// Ar trebui să fie: email-ul tău de Google
```

## 📊 Monitorizare

### Check Status Autentificare

```javascript
import cognitoAuthService from '@/services/cognitoAuthService'

// Verifică dacă e autentificat
console.log('Is Authenticated:', cognitoAuthService.isAuthenticated())

// Verifică dacă e Google auth
console.log('Is Google Auth:', cognitoAuthService.isGoogleAuth())
```

## 🚀 Deployment Production

### Înainte de deployment:

1. **Actualizează Google Cloud Console**
   ```
   Authorized JavaScript origins:
   https://your-domain.com
   ```

2. **Actualizează .env pentru production**
   ```env
   VITE_GOOGLE_CLIENT_ID=your-production-client-id
   VITE_DEMO_MODE=false
   ```

3. **Build aplicația**
   ```bash
   npm run build
   ```

4. **Deploy**
   ```bash
   # Deployment specific la platforma ta
   ```

## 💡 Tips

- **Development**: Folosește același Client ID pentru local și staging
- **Production**: Creează un Client ID separat pentru production
- **Testing**: Poți folosi multiple conturi Google pentru testare
- **Debug**: Verifică întotdeauna browser console pentru erori detaliate

## 🆘 Ajutor

Dacă întâmpini probleme:

1. ✅ Verifică că ai urmat toți pașii
2. ✅ Verifică browser console pentru erori
3. ✅ Verifică că Client ID este corect în `.env.local`
4. ✅ Verifică că ai repornit serverul
5. ✅ Consultă [`GOOGLE_AUTH_SETUP.md`](./GOOGLE_AUTH_SETUP.md) pentru detalii

## ✨ Gata!

Acum ai autentificare funcțională cu:
- ✅ Email/Password (Cognito)
- ✅ Google Sign-In
- ✅ Session management
- ✅ Sign-out

**Enjoy! 🎉**

---

**Timp estimat pentru setup**: 5-10 minute  
**Dificultate**: Ușor  
**Suport**: Documentație completă disponibilă

