# Demo Mode - Prevenirea Apelurilor API

## Problema

Când folosim butonul "Continue with Demo", setăm `auth-token: 'demo-jwt-token'` în localStorage, dar repository-urile și invoker-urile verificau doar `VITE_DEMO_MODE` din `.env`, care nu era setat.

Rezultat: **Se făceau cereri API în demo mode** → erori în consolă.

## Soluția

Am adăugat metode helper în toate repository-urile și invoker-urile pentru a detecta demo mode din **localStorage**.

### Metode Helper Adăugate

```javascript
// Check if we're using a demo token
isDemoToken() {
  const authToken = localStorage.getItem('auth-token');
  return authToken === 'demo-jwt-token';
}

// Check if in demo mode (combinat .env + localStorage)
isInDemoMode() {
  return import.meta.env.VITE_DEMO_MODE === 'true' || this.isDemoToken();
}
```

## Fișiere Actualizate

### 1. StatisticsDataRepository.js
**Înainte:**
```javascript
const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
// ❌ Nu detecta demo button
```

**Acum:**
```javascript
const isDemoMode = this.isInDemoMode();
// ✅ Detectează și .env și demo button
```

**Comportament:**
- În demo mode → citește din IndexedDB cache
- Dacă nu găsește cache → generează din demo data
- **NU face cereri API**

### 2. ResourceRepository.js
Adăugate metode:
- `isDemoToken()`
- `isInDemoMode()`

Înlocuite toate `import.meta.env.VITE_DEMO_MODE` cu `this.isInDemoMode()`:
- ✅ `query()` - citește din IndexedDB
- ✅ `getById()` - citește din IndexedDB
- ✅ `add()` - scrie în IndexedDB
- ✅ `update()` - actualizează IndexedDB
- ✅ `remove()` - șterge din IndexedDB
- ✅ `request()` - nu face API calls

### 3. DraftAwareResourceRepository.js
Actualizat:
- ✅ `canMakeServerRequests()` - folosește `isInDemoMode()` (moștenit din ResourceRepository)

### 4. AuthInvoker.js
Adăugate metode:
- `isDemoToken()`

**Comportament:**
```javascript
if (isDemoMode) {
  console.log('📊 Demo mode detected in AuthInvoker - skipping API call');
  throw new Error('Demo mode - no API call needed');
}
```
- Aruncă eroare **intenționat** pentru a forța folosirea datelor din cache
- AuthRepository va folosi `getDemoUserData()` ca fallback

### 5. UserRolesInvoker.js
Adăugate metode:
- `isDemoToken()`

**Comportament:**
```javascript
if (isDemoMode) {
  console.log('📊 Demo mode detected in UserRolesInvoker - skipping API call');
  throw new Error('Demo mode - no API call needed');
}
```

## Fluxul în Demo Mode

### Prima Încărcare (După Demo Button)

```
1. User click "Continue with Demo"
   └─> Set auth-token: 'demo-jwt-token'
   └─> Seed IndexedDB cu date
   └─> Reload

2. App.jsx verifică isAuthenticated()
   └─> TRUE (auth-token exists)
   └─> Apelează authService.initialize()

3. AuthInvoker.getCurrentUser()
   └─> Detectează isDemoToken() = true
   └─> Throw error (no API call)

4. AuthRepository fallback
   └─> getStoredUserData() = null
   └─> getDemoUserData() ✅

5. StatisticsDataRepository.query()
   └─> Detectează isInDemoMode() = true
   └─> Citește din IndexedDB cache ✅
   └─> Returnează statisticile generate de seedForDemo()

6. ResourceRepository.query()
   └─> Detectează isInDemoMode() = true
   └─> Citește din IndexedDB ✅
   └─> Returnează pacienți, programări, etc.
```

### Console Logs în Demo Mode

```
✅ User is authenticated, initializing...
📊 Demo mode detected in AuthInvoker - skipping API call
Could not fetch auth user data: Error: Demo mode - no API call needed
✅ Auth data stored: { userId: 'demo-user', businessCount: 1 }
✅ Business auto-selected (only 1 available): B010001

📊 Demo mode detected: Loading statistics from cache...
✅ Loaded business-statistics from cache: { totalPatients: 60, ... }

📦 Demo mode: Getting patient data from IndexedDB
✅ Demo mode: Found 60 patient items in IndexedDB

📦 Demo mode: Getting appointment data from IndexedDB
✅ Demo mode: Found 120 appointment items in IndexedDB
```

### ❌ Erori care NU ar trebui să mai apară:

- ~~"Statistics API request failed: Error: System is offline or server is down"~~
- ~~"Error fetching current user data"~~ (apar doar ca info în catch, nu ca erori)
- ~~"API request failed"~~ (în demo mode)

## Verificare Demo Mode

Toate componentele verifică acum demo mode astfel:

```javascript
// Metodă 1: .env file
VITE_DEMO_MODE=true

// Metodă 2: Demo button
localStorage.setItem('auth-token', 'demo-jwt-token')

// Ambele metode funcționează!
const isDemoMode = this.isInDemoMode()
// = import.meta.env.VITE_DEMO_MODE === 'true' || this.isDemoToken()
```

## Beneficii

1. ✅ **Zero cereri API în demo mode**
2. ✅ **Console curat** - fără erori false
3. ✅ **Performanță mai bună** - toate datele din IndexedDB
4. ✅ **Experiență offline completă**
5. ✅ **Consistență** - toate repository-urile folosesc aceeași logică

## Testare

```javascript
// 1. Click "Continue with Demo"
// Console ar trebui să arate:
// 📊 Demo mode detected in AuthInvoker - skipping API call
// 📊 Demo mode detected: Loading statistics from cache...
// ✅ Loaded business-statistics from cache
// 📦 Demo mode: Getting patient data from IndexedDB
// ✅ Demo mode: Found 60 patient items

// 2. Verifică că NU vezi:
// ❌ "Statistics API request failed"
// ❌ "Error: System is offline"
```

## Componente Actualizate

- ✅ `StatisticsDataRepository.js` - isDemoToken() + isInDemoMode()
- ✅ `ResourceRepository.js` - isDemoToken() + isInDemoMode()
- ✅ `DraftAwareResourceRepository.js` - folosește isInDemoMode() moștenit
- ✅ `AuthInvoker.js` - isDemoToken() + skip API
- ✅ `UserRolesInvoker.js` - isDemoToken() + skip API

Acum demo mode funcționează complet offline, fără cereri API! 🎉

