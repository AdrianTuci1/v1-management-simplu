# Testing Business Selection Flow

## Înțelegerea Fluxului

### Când se setează fiecare valoare în localStorage?

#### 1. `auth-user-data` ✅ Întotdeauna la autentificare
**Moment:** Imediat după răspunsul API-ului `/auth/me`
**Conține:** Lista completă a tuturor business-urilor utilizatorului
**De ce:** Este necesar pentru a ști ce opțiuni are utilizatorul

```javascript
// Se setează în authRepository.storeUserData()
{
  "success": true,
  "user": {
    "userId": "demo-user",
    "userName": "Demo User",
    "email": "demo@cabinet-popescu.ro",
    "businesses": [/* array cu toate businesses */]
  }
}
```

#### 2. `selected-business-id` ✅ Condiționat
**Moment:** Depinde de numărul de business-uri

**Caz A: UN singur business**
```javascript
// AUTO-SELECT în authService.initialize()
if (authUserData.user.businesses.length === 1) {
  authRepository.setSelectedBusiness(authUserData.user.businesses[0].businessId)
  console.log('✅ Business auto-selected (only 1 available):', businessId)
}
```
✅ Se setează AUTOMAT pentru UX mai bun

**Caz B: MULTIPLE businesses**
```javascript
// MANUAL SELECT în App.jsx -> handleBusinessSelect()
if (businesses.length > 1 && !isBusinessSelected) {
  setShowBusinessSelector(true)
  return  // STOP - NU setează location încă!
}
```
❌ NU se setează automat - utilizatorul TREBUIE să aleagă

#### 3. `selected-location` ✅ Doar după business selectat
**Moment:** După ce avem `selected-business-id` valid
**De ce:** Locația depinde de business-ul selectat

```javascript
// Se setează în App.jsx după verificarea business-ului
const defaultLocation = authService.getDefaultLocation()
localStorage.setItem('selected-location', JSON.stringify(defaultLocation))
```

## Fluxul Vizual

### Scenariu 1: Utilizator cu 1 Business

```
┌─────────────────────┐
│   User Login        │
│   (AuthScreen)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ API Call /auth/me   │
│ Returns 1 business  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ ✅ Set auth-user-data                   │
│ ✅ Set selected-business-id (AUTO)      │  ← AUTOMAT
│ ✅ Set selected-location (AUTO)         │  ← AUTOMAT
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────┐
│  Dashboard Shows    │
│  (No selection UI)  │
└─────────────────────┘
```

### Scenariu 2: Utilizator cu Multiple Businesses

```
┌─────────────────────┐
│   User Login        │
│   (AuthScreen)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ API Call /auth/me   │
│ Returns 3 businesses│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ ✅ Set auth-user-data                   │
│ ❌ NO selected-business-id              │  ← NU se setează
│ ❌ NO selected-location                 │  ← NU se setează
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────┐
│ BusinessSelector    │  ← TREBUIE să aleagă
│ Shows 3 options     │
└──────────┬──────────┘
           │
           ▼ User selects Business #2
┌─────────────────────────────────────────┐
│ ✅ Set selected-business-id = B010002   │
│ 🔄 Reload page                          │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ ✅ Set selected-location (AUTO)         │  ← AUTOMAT după reload
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────┐
│  Dashboard Shows    │
└─────────────────────┘
```

## Testare în Demo Mode

### Test 1: Un singur business (Default)

```javascript
// În browser console:
localStorage.clear()
// Clear IndexedDB too
const { indexedDb } = await import('./src/data/infrastructure/db.js')
await indexedDb.clearAllData()
window.location.reload()

// Observă în console:
// ✅ Auth data stored: { userId: 'demo-user', businessCount: 1 }
// ✅ Business auto-selected (only 1 available): B010001
// ✅ Set default location: Premier Central
```

**SAU** folosește butonul "Mod Demo" din AuthScreen care face automat:
- Curăță localStorage
- Curăță IndexedDB
- Populează IndexedDB cu date demo
- Reload la pagină

### Test 2: Multiple businesses

```javascript
// În browser console:
localStorage.clear()
localStorage.setItem('demo-multiple-businesses', 'true')
window.location.reload()

// Observă în console:
// ✅ Auth data stored: { userId: 'demo-user', businessCount: 3 }
// ⏸️  Multiple businesses found, user will need to select: ['Cabinetul Dr. Popescu', 'Clinica Stomatologică Elite', 'Cabinet Medical Dr. Ionescu']
// 🔄 Showing BusinessSelector - user needs to choose

// Apoi vei vedea BusinessSelector UI cu 3 opțiuni
```

### Test 3: Reset la single business

```javascript
// În browser console:
localStorage.clear()
// Nu seta 'demo-multiple-businesses'
window.location.reload()

// Se revine la 1 business
```

## Console Logs - Ce să cauți

### La autentificare reușită:

```
✅ Auth data stored: { userId: '...', businessCount: N }
```

### Dacă are 1 business:

```
✅ Business auto-selected (only 1 available): B010001
📊 Business selection check: { businessCount: 1, isBusinessSelected: true, needsSelection: false }
✅ Set default location: Premier Central
```

### Dacă are multiple businesses:

```
⏸️  Multiple businesses found, user will need to select: ['Business 1', 'Business 2', 'Business 3']
📊 Business selection check: { businessCount: 3, isBusinessSelected: false, needsSelection: true }
🔄 Showing BusinessSelector - user needs to choose
```

### După selectarea unui business:

```
✅ Set default location: [Nume Locație]
```

## Debugging

### Verifică localStorage

```javascript
// În browser console:
console.log('Auth Data:', JSON.parse(localStorage.getItem('auth-user-data')))
console.log('Selected Business:', localStorage.getItem('selected-business-id'))
console.log('Selected Location:', JSON.parse(localStorage.getItem('selected-location')))
```

### Verifică starea curentă

```javascript
// În browser console:
const authRepo = await import('./src/data/repositories/AuthRepository.js')
console.log('Businesses:', authRepo.default.getBusinesses())
console.log('Selected:', authRepo.default.getSelectedBusiness())
console.log('Accessible Locations:', authRepo.default.getAccessibleLocations())
```

## Common Issues

### Issue: "Se setează totul automat"
**Cauză:** Ești în demo mode cu 1 singur business
**Soluție:** Activează demo cu multiple businesses

### Issue: "Nu se afișează BusinessSelector"
**Verifică:**
1. Ești în demo mode?
2. Ai setat `demo-multiple-businesses`?
3. Verifică console logs pentru `needsSelection`

### Issue: "Eroare la selectarea business-ului"
**Verifică:**
1. Business-ul selectat are locații?
2. Utilizatorul are roluri valide pentru locații?
3. Verifică console pentru erori

## Testare cu Backend Real

Când backend-ul returnează noul format:

```javascript
// Răspunsul de la /auth/me ar trebui să fie:
{
  "success": true,
  "user": {
    "userId": "real-user-id",
    "userName": "John Doe",
    "email": "john@example.com",
    "businesses": [
      {
        "businessId": "B010001",
        "businessName": "My Business",
        "locations": [
          {
            "locationId": "L010001",
            "locationName": "Main Location",
            "role": "admin"
          }
        ]
      }
    ]
  }
}
```

## Rezumat

✅ **auth-user-data** - Întotdeauna la autentificare
✅ **selected-business-id** - Auto pentru 1 business, manual pentru multiple
✅ **selected-location** - După ce avem business selectat

Fluxul este optimizat pentru UX:
- Dacă ai 1 business → sari direct la dashboard
- Dacă ai multiple → alegi care te interesează

