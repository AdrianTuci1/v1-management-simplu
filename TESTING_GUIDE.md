# 🧪 Ghid de Testare - Statistics API

Acest ghid îți arată cum să testezi răspunsurile serverului pentru endpoint-urile de statistici.

## Metoda 1: Browser DevTools (Recomandat ⭐)

### Pasul 1: Deschide DevTools
- **Windows/Linux:** `F12` sau `Ctrl + Shift + I`
- **Mac:** `Cmd + Option + I`

### Pasul 2: Mergi la Network Tab
1. Click pe tab-ul **Network** în DevTools
2. Bifează "Preserve log" (pentru a păstra istoricul)
3. (Opțional) Filtrează după "Fetch/XHR"

### Pasul 3: Reîmprospătează Pagina
- Apasă `F5` sau `Cmd + R` (Mac) / `Ctrl + R` (Windows)

### Pasul 4: Caută Cererile
În lista de network requests, caută:
- `business-statistics` sau `business`
- `recent-activities` sau `activities`

### Pasul 5: Inspectează Răspunsul
1. Click pe cererea care te interesează
2. Tab-uri disponibile:
   - **Headers** - Vezi URL, status code, headers
   - **Preview** - Vezi datele formatate frumos (JSON)
   - **Response** - Vezi raw JSON
   - **Timing** - Vezi cât a durat cererea

### Ce să verifici:
```
✅ Status Code: 200 OK
✅ Response Type: application/json
✅ Content-Length: > 0
✅ Response Time: < 1000ms (preferabil)
```

## Metoda 2: Console Log în Cod

Am adăugat deja console.log în `useStatistics.js`. 

### Cum să folosești:
1. Deschide Console (F12 → Console)
2. Reîmprospătează pagina
3. Vei vedea:

```javascript
📊 Statistics Response
  Raw statsResponse: {...}
  Processed statsData: {...}

📋 Activities Response
  Raw activitiesResponse: {...}
  Processed activitiesData: [...]
  Number of activities: 15
```

### Verifică datele:
```javascript
// În console, poți expanda obiectele și verifica:
- totalAppointments: 150 ✅
- totalPatients: 423 ✅
- revenue.monthly: 12500 ✅
- doctorProgress: Array(4) ✅
- popularTreatments: Array(5) ✅
```

## Metoda 3: Script de Test HTML

Am creat un fișier `test-statistics-api.html` pentru testare ușoară!

### Cum să folosești:
1. Deschide `test-statistics-api.html` în browser
2. Configurează:
   - **API Base URL:** `http://localhost:3000/api` (sau URL-ul tău)
   - **Authorization Token:** token-ul tău (dacă e necesar)
3. Click pe butoane:
   - **Test Business Statistics** - testează statistici
   - **Test Recent Activities** - testează activități
   - **Test All Endpoints** - testează tot

### Features:
- ✅ Afișare JSON formatat cu syntax highlighting
- ✅ Rezumat vizual al statisticilor
- ✅ Erori clare și detaliate
- ✅ Contor activități pe tipuri
- ✅ Design modern și ușor de folosit

## Metoda 4: Browser Console Direct

Deschide Console (F12 → Console) și scrie:

```javascript
// Test Business Statistics
fetch('http://localhost:3000/api/statistics/business', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => {
  console.log('📊 Business Statistics:', data)
  console.table(data.data || data)
})
.catch(err => console.error('❌ Error:', err))

// Test Recent Activities
fetch('http://localhost:3000/api/statistics/recent-activities', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => {
  console.log('📋 Recent Activities:', data)
  console.log('Total activities:', (data.data || data).length)
  console.table(data.data || data)
})
.catch(err => console.error('❌ Error:', err))
```

## Metoda 5: cURL (Terminal/CMD)

### Test Business Statistics:
```bash
curl -X GET "http://localhost:3000/api/statistics/business" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" | json_pp
```

### Test Recent Activities:
```bash
curl -X GET "http://localhost:3000/api/statistics/recent-activities" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" | json_pp
```

**Note:**
- Înlocuiește `YOUR_TOKEN` cu token-ul tău
- `json_pp` formatează JSON-ul (optional, dar mai lizibil)
- Pe Windows, folosește `curl.exe` sau PowerShell

## Metoda 6: Postman (Profesional)

### Setup:
1. Deschide Postman
2. New Request → GET
3. URL: `http://localhost:3000/api/statistics/business`
4. Headers:
   - `Authorization: Bearer YOUR_TOKEN`
   - `Content-Type: application/json`
5. Send

### Features Postman:
- Salvează requests pentru refolosire
- Organizează în colecții
- Environment variables pentru URL-uri
- Testează automat (Tests tab)
- Export/Import pentru echipă

## Ce să Verifici în Răspunsuri

### Business Statistics
```javascript
{
  "success": true,  // ✅ Trebuie să fie true
  "data": {
    // Verifică că toate câmpurile există:
    "totalAppointments": 150,      // ✅ Number
    "totalPatients": 423,           // ✅ Number
    "appointmentStats": {
      "completed": 120,             // ✅ Number
      "cancelled": 15,              // ✅ Number
      "pending": 15,                // ✅ Number
      "absent": 47                  // ✅ Number
    },
    "revenue": {
      "monthly": 12500,             // ✅ Number
      "yearly": 150000              // ✅ Number (optional)
    },
    "websiteBookings": 200,         // ✅ Number
    "clinicRating": {
      "average": 4.8,               // ✅ Number (0-5)
      "totalReviews": 127           // ✅ Number
    },
    "smsStats": {
      "sent": 234,                  // ✅ Number
      "limit": 300,                 // ✅ Number
      "percentage": 78              // ✅ Number (0-100)
    },
    "occupancyRate": 85,            // ✅ Number (0-100)
    "doctorProgress": [             // ✅ Array
      {
        "doctor": "Dr. Popescu",    // ✅ String sau {id, name}
        "progress": 75,             // ✅ Number (0-100)
        "appointments": 12          // ✅ Number
      }
    ],
    "popularTreatments": [          // ✅ Array
      {
        "treatment": "Detartraj",   // ✅ String sau {id, name}
        "count": 45                 // ✅ Number
      }
    ]
  },
  "meta": {                         // ✅ Optional
    "businessId": "business-123",
    "timestamp": "2025-10-08T10:30:00.000Z"
  }
}
```

### Recent Activities
```javascript
{
  "success": true,  // ✅ Trebuie să fie true
  "data": [         // ✅ Array cu activități
    {
      "id": "123",                     // ✅ String
      "activityType": "appointment",   // ✅ appointment, patient, invoice, etc.
      "title": "Programare",           // ✅ String
      "description": "...",            // Optional
      "patientName": "Ion Ionescu",    // String sau {id, name}
      "serviceName": "Detartraj",      // String sau {id, name}
      "medicName": "Dr. Popescu",      // String sau {id, name}
      "time": "10:30",                 // String (HH:MM)
      "action": "Creat",               // ✅ Creat, Actualizat, Șters
      "status": "scheduled",           // ✅ String
      "amount": 150,                   // Number (optional)
      "updatedAt": "2025-10-08T10:30:00Z",  // ✅ ISO 8601
      "createdAt": "2025-10-08T10:30:00Z"   // ✅ ISO 8601
    }
  ],
  "meta": {          // ✅ Optional
    "businessId": "business-123",
    "statisticsType": "recent-activities",
    "timestamp": "2025-10-08T10:30:00.000Z"
  }
}
```

## Erori Comune și Soluții

### 1. 401 Unauthorized
```
❌ Error: HTTP 401
✅ Soluție: Verifică token-ul de autentificare
```

### 2. 404 Not Found
```
❌ Error: HTTP 404
✅ Soluție: Verifică URL-ul endpoint-ului
```

### 3. 500 Internal Server Error
```
❌ Error: HTTP 500
✅ Soluție: Verifică logs-urile serverului
```

### 4. CORS Error
```
❌ Error: CORS policy blocked
✅ Soluție: Configurează CORS în backend
```

### 5. Network Error
```
❌ Error: Failed to fetch
✅ Soluție: Verifică că serverul rulează
```

## Checklist de Testare

### Business Statistics ✅
- [ ] Request se trimite cu succes
- [ ] Status code: 200
- [ ] Response conține `success: true`
- [ ] Toate câmpurile numerice sunt Number (nu String)
- [ ] Arrays sunt Arrays (nu null/undefined)
- [ ] Valorile par realiste (nu toate 0)
- [ ] `doctorProgress` conține medici
- [ ] `popularTreatments` conține tratamente

### Recent Activities ✅
- [ ] Request se trimite cu succes
- [ ] Status code: 200
- [ ] Response conține `success: true`
- [ ] `data` este un Array
- [ ] Fiecare activitate are `id`, `activityType`, `action`
- [ ] Timestamp-uri sunt în format ISO 8601
- [ ] Numele (pacient, medic, produs) sunt String sau Object
- [ ] Activitățile sunt sortate după `updatedAt` (cel mai recent primul)

### Frontend Display ✅
- [ ] Dashboard se încarcă fără erori
- [ ] KPI-urile afișează numerele corecte
- [ ] Chart-urile se afișează corect
- [ ] Activitățile recente se afișează
- [ ] Timpul relativ e calculat corect ("Acum X minute")
- [ ] Nu apar obiecte renderizate în JSX

## Tips & Tricks

### 1. Salvează Token-ul în localStorage
```javascript
// Salvează token-ul pentru teste rapide
localStorage.setItem('test_token', 'YOUR_TOKEN')

// Folosește în requests
fetch(url, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('test_token')}`
  }
})
```

### 2. Folosește Template-uri în Console
```javascript
// Crează funcții helper în console
function testStats() {
  return fetch('http://localhost:3000/api/statistics/business', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('test_token')}`,
      'Content-Type': 'application/json'
    }
  }).then(r => r.json())
}

// Apoi doar: testStats().then(console.log)
```

### 3. Monitorizează în timp real
```javascript
// Auto-refresh la fiecare 5 secunde
setInterval(() => {
  testStats().then(data => {
    console.clear()
    console.log('📊 Latest Statistics:', new Date().toLocaleTimeString())
    console.table(data.data)
  })
}, 5000)
```

## Resurse Utile

- 📄 **BUSINESS_STATISTICS_API.md** - Documentație completă API
- 📄 **RECENT_ACTIVITIES_API.md** - Structură activități
- 🧪 **test-statistics-api.html** - Tool interactiv de testare
- 🔧 **Browser DevTools** - F12

## Suport

Dacă întâmpini probleme:
1. Verifică Network tab pentru detalii
2. Verifică Console pentru erori JavaScript
3. Verifică logs-urile serverului
4. Citește documentația API

Testare plăcută! 🚀

