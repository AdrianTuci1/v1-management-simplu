# Business Statistics API - Structura de Date

Acest document descrie structura datelor returnate de API-ul de statistici pentru dashboard-ul de business.

## Endpoint: `/api/statistics/business`

### Structura JSON Returnată

```json
{
  "totalAppointments": 150,
  "totalPatients": 423,
  "appointmentStats": {
    "completed": 120,
    "cancelled": 15,
    "pending": 15,
    "absent": 47
  },
  "appointmentsToday": [
    {
      "id": 1,
      "patientName": "Ion Popescu",
      "time": "10:00",
      "status": "confirmed",
      "doctorName": "Dr. Ionescu",
      "treatment": "Consultație generală"
    },
    {
      "id": 2,
      "patientName": "Maria Ionescu",
      "time": "11:00",
      "status": "pending",
      "doctorName": "Dr. Popescu",
      "treatment": "Tratament canal"
    }
  ],
  "revenue": {
    "monthly": 12500,
    "yearly": 150000,
    "currency": "RON"
  },
  "websiteBookings": 200,
  "clinicRating": {
    "average": 4.8,
    "totalReviews": 127
  },
  "smsStats": {
    "sent": 234,
    "limit": 300,
    "percentage": 78
  },
  "occupancyRate": 85,
  "doctorProgress": [
    {
      "doctor": "Dr. Popescu",
      "progress": 75,
      "appointments": 12
    },
    {
      "doctor": "Dr. Ionescu",
      "progress": 60,
      "appointments": 8
    },
    {
      "doctor": "Dr. Georgescu",
      "progress": 85,
      "appointments": 15
    },
    {
      "doctor": "Dr. Marinescu",
      "progress": 45,
      "appointments": 6
    }
  ],
  "popularTreatments": [
    {
      "treatment": "Consultație",
      "count": 67
    },
    {
      "treatment": "Detartraj",
      "count": 45
    },
    {
      "treatment": "Obturație",
      "count": 38
    },
    {
      "treatment": "Tratament canal",
      "count": 23
    },
    {
      "treatment": "Albire dentară",
      "count": 15
    }
  ]
}
```

## Descrierea Câmpurilor

### Nivel Principal

| Câmp | Tip | Descriere | Exemplu |
|------|-----|-----------|---------|
| `totalAppointments` | Number | Numărul total de programări din luna curentă | `150` |
| `totalPatients` | Number | Numărul total de pacienți înregistrați | `423` |
| `appointmentStats` | Object | Statistici detaliate despre programări | Vezi detalii mai jos |
| `appointmentsToday` | Array | Lista programărilor pentru ziua curentă | Vezi detalii mai jos |
| `revenue` | Object | Informații despre venituri | Vezi detalii mai jos |
| `websiteBookings` | Number | Numărul de programări făcute prin website | `200` |
| `clinicRating` | Object | Rating-ul clinicii | Vezi detalii mai jos |
| `smsStats` | Object | Statistici despre SMS-urile trimise | Vezi detalii mai jos |
| `occupancyRate` | Number | Procentul de ocupare al clinicii (0-100) | `85` |
| `doctorProgress` | Array | Progresul fiecărui medic pentru ziua curentă | Vezi detalii mai jos |
| `popularTreatments` | Array | Tratamentele cele mai solicitate în luna curentă | Vezi detalii mai jos |

### appointmentStats

| Câmp | Tip | Descriere | Exemplu |
|------|-----|-----------|---------|
| `completed` | Number | Numărul de programări finalizate | `120` |
| `cancelled` | Number | Numărul de programări anulate | `15` |
| `pending` | Number | Numărul de programări în așteptare | `15` |
| `absent` | Number | Numărul de pacienți care nu s-au prezentat | `47` |

### appointmentsToday

Un array de obiecte reprezentând programările zilei:

| Câmp | Tip | Descriere | Exemplu |
|------|-----|-----------|---------|
| `id` | Number | ID-ul unic al programării | `1` |
| `patientName` | String | Numele pacientului | `"Ion Popescu"` |
| `time` | String | Ora programării (HH:MM) | `"10:00"` |
| `status` | String | Statusul programării (`confirmed`, `pending`, `completed`, `cancelled`) | `"confirmed"` |
| `doctorName` | String | Numele medicului | `"Dr. Ionescu"` |
| `treatment` | String | Tipul de tratament | `"Consultație generală"` |

### revenue

| Câmp | Tip | Descriere | Exemplu |
|------|-----|-----------|---------|
| `monthly` | Number | Venitul lunar (RON) | `12500` |
| `yearly` | Number | Venitul anual (RON) | `150000` |
| `currency` | String | Moneda folosită | `"RON"` |

### clinicRating

| Câmp | Tip | Descriere | Exemplu |
|------|-----|-----------|---------|
| `average` | Number | Rating-ul mediu (0-5) | `4.8` |
| `totalReviews` | Number | Numărul total de recenzii | `127` |

### smsStats

| Câmp | Tip | Descriere | Exemplu |
|------|-----|-----------|---------|
| `sent` | Number | Numărul de SMS-uri trimise în luna curentă | `234` |
| `limit` | Number | Limita lunară de SMS-uri | `300` |
| `percentage` | Number | Procentul de utilizare a limitei (0-100) | `78` |

### doctorProgress

Un array de obiecte reprezentând progresul fiecărui medic pentru ziua curentă:

| Câmp | Tip | Descriere | Exemplu |
|------|-----|-----------|---------|
| `doctor` | String | Numele medicului | `"Dr. Popescu"` |
| `progress` | Number | Procentul de progres (0-100) - calculat pe baza programărilor zilei | `75` |
| `appointments` | Number | Numărul de programări ale medicului pentru ziua curentă | `12` |

**Note:**
- Procentul de progres reprezintă câte programări au fost completate din totalul programărilor zilei
- Dacă un medic are 10 programări și a completat 7, progresul este 70%

### popularTreatments

Un array de obiecte reprezentând tratamentele cele mai solicitate în luna curentă:

| Câmp | Tip | Descriere | Exemplu |
|------|-----|-----------|---------|
| `treatment` | String | Numele tratamentului | `"Consultație"` |
| `count` | Number | Numărul de ori când tratamentul a fost efectuat în luna curentă | `67` |

**Note:**
- Array-ul este de obicei sortat descrescător după `count`
- Se recomandă returnarea top 5-10 tratamente pentru o vizualizare optimă
- Tratamentele duplicate sunt numărate o singură dată cu suma totală

## Gestionarea Valorilor Lipsă

Frontend-ul gestionează în mod defensiv toate valorile care ar putea lipsi:

- Toate numerele lipsă sunt tratate ca `0`
- Toate array-urile lipsă sunt tratate ca array-uri goale `[]`
- Toate obiectele nested lipsă sunt tratate cu verificări defensive (optional chaining `?.`)

## Exemplu de Răspuns Minimal

În cazul în care backend-ul nu are toate datele disponibile, poate returna o structură minimală:

```json
{
  "totalAppointments": 0,
  "totalPatients": 0,
  "appointmentStats": {
    "completed": 0,
    "cancelled": 0,
    "pending": 0,
    "absent": 0
  },
  "appointmentsToday": [],
  "revenue": {
    "monthly": 0,
    "yearly": 0
  },
  "websiteBookings": 0,
  "clinicRating": {
    "average": 0,
    "totalReviews": 0
  },
  "smsStats": {
    "sent": 0,
    "limit": 0,
    "percentage": 0
  },
  "occupancyRate": 0,
  "doctorProgress": [],
  "popularTreatments": []
}
```

## Utilizare în Frontend

În componentul `DashboardHome.jsx`, datele sunt accesate prin funcții getter defensive:

```javascript
// Exemple de utilizare
getTotalAppointments()        // returnează businessStatistics?.totalAppointments ?? 0
getTotalPatients()            // returnează businessStatistics?.totalPatients ?? 0
getCompletedAppointments()    // returnează businessStatistics?.appointmentStats?.completed ?? 0
getMonthlyRevenue()           // returnează businessStatistics?.revenue?.monthly ?? 0
getClinicRating()             // returnează { average: ..., totalReviews: ... }
getSmsStats()                 // returnează { sent: ..., limit: ..., percentage: ... }
getOccupancyRate()            // returnează businessStatistics?.occupancyRate ?? 0
getDoctorProgress()           // returnează array cu progresul medicilor (cu date default dacă lipsește)
getPopularTreatments()        // returnează array cu tratamentele populare (cu date default dacă lipsește)
```

## Note pentru Dezvoltatori

1. **Toate câmpurile sunt opționale** - frontend-ul va afișa valori default (0 sau string-uri goale) dacă datele lipsesc
2. **Format date** - Toate numerele monetare sunt în RON și sunt formatate cu `toLocaleString('ro-RO')`
3. **Perioadă** - Toate statisticile sunt calculate pentru luna curentă, dacă nu se specifică altfel
4. **Cache** - Datele sunt cache-uite local în IndexedDB pentru a funcționa offline

## Implementare Backend

Pentru a implementa acest endpoint în backend:

1. Calculați toate statisticile pe baza datelor din baza de date
2. Returnați un obiect JSON care respectă structura descrisă mai sus
3. Asigurați-vă că toate câmpurile sunt prezente (chiar dacă au valori 0)
4. Implementați caching pentru a îmbunătăți performanța

## Endpoint Related: `/api/statistics/recent-activities`

### Structura Răspuns

API-ul returnează un obiect wrapper cu următoarea structură:

```json
{
  "success": true,
  "data": [
    {
      "id": "123",
      "resourceType": "appointment",
      "resourceId": "apt-456",
      "activityType": "appointment",
      "title": "Programare",
      "description": "Programare nouă",
      "serviceName": "Detartraj",
      "medicName": "Dr. Popescu",
      "patientName": "Ion Ionescu",
      "time": "10:30",
      "action": "Creat",
      "status": "scheduled",
      "amount": 150,
      "updatedAt": "2025-10-08T10:30:00Z",
      "createdAt": "2025-10-08T10:30:00Z"
    }
  ],
  "meta": {
    "businessId": "business-123",
    "locationId": "location-456",
    "statisticsType": "recent-activities",
    "timestamp": "2025-10-08T10:30:00.000Z",
    "operation": "recent-activities"
  }
}
```

**Vezi documentația completă în `RECENT_ACTIVITIES_API.md` pentru:**
- Toate tipurile de activități suportate
- Câmpuri specifice pentru fiecare tip
- Exemple complete pentru fiecare scenariu
- Procesare în frontend și gestionare erori

