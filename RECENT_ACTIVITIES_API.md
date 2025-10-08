# Recent Activities API - Structura de Date

Acest document descrie structura datelor returnate de API-ul de activități recente pentru dashboard.

## Endpoint: `/api/statistics/recent-activities`

### Structura JSON Returnată

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
    },
    {
      "id": "124",
      "resourceType": "invoice",
      "resourceId": "inv-789",
      "activityType": "invoice",
      "title": "Factură",
      "description": "Factură actualizată",
      "patientName": "Maria Popescu",
      "amount": 250,
      "time": "14:30",
      "action": "Actualizat",
      "status": "paid",
      "updatedAt": "2025-10-08T14:30:00Z",
      "createdAt": "2025-10-08T14:20:00Z"
    },
    {
      "id": "125",
      "resourceType": "patient",
      "resourceId": "pat-321",
      "activityType": "patient",
      "title": "Pacient",
      "description": "Pacient nou înregistrat",
      "patientName": "George Popa",
      "action": "Creat",
      "updatedAt": "2025-10-08T09:15:00Z",
      "createdAt": "2025-10-08T09:15:00Z"
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

## Descrierea Câmpurilor

### Nivel Wrapper

| Câmp | Tip | Descriere | Exemplu |
|------|-----|-----------|---------|
| `success` | Boolean | Indicator de succes al cererii | `true` |
| `data` | Array | Array cu activitățile recente | Vezi detalii mai jos |
| `meta` | Object | Metadate despre cerere | Vezi detalii mai jos |

### Activitate (Activity Object)

#### Câmpuri Comune

| Câmp | Tip | Obligatoriu | Descriere | Exemplu |
|------|-----|-------------|-----------|---------|
| `id` | String | Da | ID-ul unic al activității | `"123"` |
| `resourceType` | String | Da | Tipul resursei (`appointment`, `invoice`, `patient`, `sale`, `product`) | `"appointment"` |
| `resourceId` | String | Da | ID-ul resursei | `"apt-456"` |
| `activityType` | String | Da | Tipul activității (folosit pentru iconițe și culori) | `"appointment"` |
| `title` | String | Da | Titlul activității | `"Programare"` |
| `description` | String | Nu | Descriere opțională | `"Programare nouă"` |
| `action` | String | Da | Acțiunea efectuată (`Creat`, `Actualizat`, `Șters`) | `"Creat"` |
| `updatedAt` | String (ISO 8601) | Da | Data ultimei actualizări | `"2025-10-08T10:30:00Z"` |
| `createdAt` | String (ISO 8601) | Da | Data creării | `"2025-10-08T10:30:00Z"` |

#### Câmpuri Specifice pentru Programări (Appointments)

| Câmp | Tip | Descriere | Exemplu |
|------|-----|-----------|---------|
| `serviceName` / `treatmentName` / `treatment` | String sau Object | Numele serviciului/tratamentului. Frontend verifică toate variantele. | `"Detartraj"` sau `{id: 1, name: "Detartraj"}` |
| `medicName` / `doctorName` | String sau Object | Numele medicului. Poate fi string sau obiect `{id, name}` | `"Dr. Popescu"` sau `{id: 5, name: "Dr. Popescu"}` |
| `patientName` | String sau Object | Numele pacientului. Poate fi string sau obiect `{id, name}` | `"Ion Ionescu"` sau `{id: 10, name: "Ion Ionescu"}` |
| `time` | String | Ora programării (HH:MM) | `"10:30"` |
| `status` | String | Statusul programării (`scheduled`, `confirmed`, `completed`, `cancelled`) | `"scheduled"` |

**Notă:** Frontend-ul gestionează automat atât format-ul string, cât și format-ul obiect pentru numele. Dacă trimiteți un obiect, va extrage automat proprietatea `name`. Pentru tratamente, puteți folosi oricare dintre câmpurile: `serviceName`, `treatmentName` sau `treatment`.

#### Câmpuri Specifice pentru Facturi (Invoices)

| Câmp | Tip | Descriere | Exemplu |
|------|-----|-----------|---------|
| `patientName` | String sau Object | Numele pacientului. Poate fi string sau obiect `{id, name}` | `"Maria Popescu"` sau `{id: 12, name: "Maria Popescu"}` |
| `amount` | Number | Suma în RON | `250` |
| `time` | String | Ora facturii (opțional) | `"14:30"` |
| `status` | String | Statusul facturii (`paid`, `unpaid`, `pending`) | `"paid"` |

#### Câmpuri Specifice pentru Pacienți (Patients)

| Câmp | Tip | Descriere | Exemplu |
|------|-----|-----------|---------|
| `patientName` | String sau Object | Numele pacientului. Poate fi string sau obiect `{id, name}` | `"George Popa"` sau `{id: 15, name: "George Popa"}` |

#### Câmpuri Specifice pentru Vânzări (Sales)

| Câmp | Tip | Descriere | Exemplu |
|------|-----|-----------|---------|
| `productName` / `product` / `itemName` | String sau Object | Numele produsului. Frontend verifică toate variantele. | `"Periuță de dinți electrică"` sau `{id: 20, name: "Periuță de dinți electrică"}` |
| `amount` | Number | Suma în RON | `150` |
| `quantity` | Number | Cantitatea vândută | `2` |

**Notă:** Pentru produse, puteți folosi oricare dintre câmpurile: `productName`, `product` sau `itemName`.

#### Câmpuri Specifice pentru Produse (Products/Inventory)

| Câmp | Tip | Descriere | Exemplu |
|------|-----|-----------|---------|
| `productName` / `product` / `itemName` | String sau Object | Numele produsului. Frontend verifică toate variantele. | `"Pastă de dinți"` sau `{id: 25, name: "Pastă de dinți"}` |
| `quantity` | Number | Cantitatea (pentru stocuri) | `50` |

**Notă:** Pentru produse, puteți folosi oricare dintre câmpurile: `productName`, `product` sau `itemName`.

### Meta Object

| Câmp | Tip | Descriere | Exemplu |
|------|-----|-----------|---------|
| `businessId` | String | ID-ul businessului | `"business-123"` |
| `locationId` | String | ID-ul locației | `"location-456"` |
| `statisticsType` | String | Tipul de statistici | `"recent-activities"` |
| `timestamp` | String (ISO 8601) | Timestamp-ul generării datelor | `"2025-10-08T10:30:00.000Z"` |
| `operation` | String | Operația efectuată | `"recent-activities"` |

## Tipuri de Activități

### 1. Appointment (Programare)

**Icon:** Calendar (📅)  
**Culoare:** Albastru (`text-blue-500`)

**Descriere construită:**
```
Creat • Pacient: Ion Ionescu • Detartraj • Dr. Popescu • Ora: 10:30 • Programat
```

**Exemplu complet:**
```json
{
  "id": "123",
  "resourceType": "appointment",
  "resourceId": "apt-456",
  "activityType": "appointment",
  "title": "Programare",
  "serviceName": "Detartraj",
  "medicName": "Dr. Popescu",
  "patientName": "Ion Ionescu",
  "time": "10:30",
  "action": "Creat",
  "status": "scheduled",
  "updatedAt": "2025-10-08T10:30:00Z",
  "createdAt": "2025-10-08T10:30:00Z"
}
```

### 2. Invoice (Factură)

**Icon:** Credit Card (💳)  
**Culoare:** Verde-smarald (`text-emerald-500`)

**Descriere construită:**
```
Actualizat • Pacient: Maria Popescu • 250 RON • Plătit
```

**Exemplu complet:**
```json
{
  "id": "124",
  "resourceType": "invoice",
  "resourceId": "inv-789",
  "activityType": "invoice",
  "title": "Factură",
  "patientName": "Maria Popescu",
  "amount": 250,
  "action": "Actualizat",
  "status": "paid",
  "updatedAt": "2025-10-08T14:30:00Z",
  "createdAt": "2025-10-08T14:20:00Z"
}
```

### 3. Patient (Pacient)

**Icon:** Users (👥)  
**Culoare:** Verde (`text-green-500`)

**Descriere construită:**
```
Creat • Pacient: George Popa
```

**Exemplu complet:**
```json
{
  "id": "125",
  "resourceType": "patient",
  "resourceId": "pat-321",
  "activityType": "patient",
  "title": "Pacient",
  "patientName": "George Popa",
  "action": "Creat",
  "updatedAt": "2025-10-08T09:15:00Z",
  "createdAt": "2025-10-08T09:15:00Z"
}
```

### 4. Sale (Vânzare)

**Icon:** Trending Up (📈)  
**Culoare:** Verde (`text-green-500`)

**Descriere construită:**
```
Creat • Periuță de dinți electrică • 2 buc • 150 RON
```

### 5. Product/Inventory (Produs/Stoc)

**Icon:** Package (📦)  
**Culoare:** Portocaliu (`text-orange-500`)

**Descriere construită:**
```
Actualizat • Pastă de dinți • 50 buc
```

## Status Labels (Traduceri)

Frontend-ul traduce automat statusurile în limba română:

| Status (EN) | Label (RO) |
|-------------|------------|
| `scheduled` | Programat |
| `confirmed` | Confirmat |
| `completed` | Finalizat |
| `cancelled` | Anulat |
| `paid` | Plătit |
| `unpaid` | Neplătit |
| `pending` | În așteptare |

## Formatare Timp

Timpul este afișat relativ față de momentul curent:

- Mai puțin de 1 minut: "Acum câteva secunde"
- Mai puțin de 1 oră: "Acum X minute"
- Mai puțin de 24 ore: "Acum X ore"
- Mai mult de 24 ore: "Acum X zile"

## Procesare în Frontend

### Extragere Date din Răspuns

```javascript
// În useStatistics.js
const response = await invoker.getRecentActivities()
const data = response?.data || response || []
setRecentActivities(data)
```

### Extragere Sigură a String-urilor

Frontend-ul include o funcție helper care gestionează automat atât format-ul string, cât și format-ul obiect:

```javascript
const extractString = (value) => {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value.name) return value.name
  if (typeof value === 'object' && value.title) return value.title
  return null
}
```

**Exemple:**
- `"Ion Popescu"` → `"Ion Popescu"`
- `{id: 10, name: "Ion Popescu"}` → `"Ion Popescu"`
- `{id: 5, title: "Detartraj"}` → `"Detartraj"`
- `null` sau `undefined` → `null`

### Construire Descriere

Frontend-ul construiește automat o descriere detaliată bazată pe câmpurile disponibile:

```javascript
const buildDescription = (activity) => {
  const parts = []
  
  if (activity.action) parts.push(activity.action)
  if (activity.patientName) parts.push(`Pacient: ${activity.patientName}`)
  if (activity.serviceName) parts.push(activity.serviceName)
  if (activity.medicName) parts.push(activity.medicName)
  if (activity.time) parts.push(`Ora: ${activity.time}`)
  if (activity.amount) parts.push(`${activity.amount} RON`)
  if (activity.status) parts.push(translateStatus(activity.status))
  
  return parts.join(' • ')
}
```

## Gestionare Erori

### Răspuns Gol

Dacă `data` este gol sau lipsește:
```javascript
return [
  {
    type: 'no-data',
    title: 'Nu există activități recente',
    description: 'Nu s-au găsit activități în ultima perioadă',
    time: '',
    icon: Activity,
    color: 'text-muted-foreground'
  }
]
```

### Eroare Backend

Frontend-ul încearcă să încarce date din cache local (IndexedDB) dacă backend-ul eșuează.

## Recomandări Backend

1. **Număr de Activități**: Returnați 10-20 cele mai recente activități
2. **Sortare**: Sortați descrescător după `updatedAt`
3. **Perioadă**: Include activități din ultimele 24-48 ore
4. **Performanță**: Implementați caching pentru a reduce încărcarea
5. **Filtrare**: Filtrați după `businessId` și `locationId`

## Exemplu Query SQL (Pseudocod)

```sql
-- Pentru appointments
SELECT 
  CONCAT('apt-', a.id) as id,
  'appointment' as resourceType,
  CONCAT('apt-', a.id) as resourceId,
  'appointment' as activityType,
  'Programare' as title,
  t.name as serviceName,
  u.name as medicName,
  p.name as patientName,
  TIME_FORMAT(a.appointment_time, '%H:%i') as time,
  'Creat' as action,
  a.status,
  a.updated_at as updatedAt,
  a.created_at as createdAt
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN users u ON a.doctor_id = u.id
JOIN treatments t ON a.treatment_id = t.id
WHERE a.business_id = ? 
  AND a.location_id = ?
  AND a.updated_at >= DATE_SUB(NOW(), INTERVAL 48 HOUR)

UNION ALL

-- Pentru invoices
SELECT 
  CONCAT('inv-', i.id) as id,
  'invoice' as resourceType,
  CONCAT('inv-', i.id) as resourceId,
  'invoice' as activityType,
  'Factură' as title,
  NULL as serviceName,
  NULL as medicName,
  p.name as patientName,
  NULL as time,
  'Actualizat' as action,
  i.payment_status as status,
  i.total_amount as amount,
  i.updated_at as updatedAt,
  i.created_at as createdAt
FROM invoices i
JOIN patients p ON i.patient_id = p.id
WHERE i.business_id = ? 
  AND i.location_id = ?
  AND i.updated_at >= DATE_SUB(NOW(), INTERVAL 48 HOUR)

ORDER BY updatedAt DESC
LIMIT 20
```

## Testare

### Test 1: Activități Multiple

**Expected:** Frontend afișează toate activitățile cu iconițe și culori corecte

### Test 2: Activități Goale

**Request:**
```json
{
  "success": true,
  "data": [],
  "meta": { ... }
}
```

**Expected:** Frontend afișează mesaj "Nu există activități recente"

### Test 3: Eroare Backend

**Expected:** Frontend încearcă să încarce din cache local

## Fișiere Modificate

- ✅ `/src/components/views/DashboardHome.jsx` - Funcție `buildDescription()` îmbunătățită
- ✅ `/src/hooks/useStatistics.js` - Extragere date din noul format
- ✅ `/RECENT_ACTIVITIES_API.md` - Acest document

## Suport

Pentru întrebări sau probleme:
- Vezi codul din `DashboardHome.jsx` pentru procesarea activităților
- Verifică `useStatistics.js` pentru încărcarea datelor
- Testează cu date de exemplu pentru a înțelege structura

