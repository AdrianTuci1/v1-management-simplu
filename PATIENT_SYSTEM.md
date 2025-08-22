# Sistem de Pacienți - Documentație

## Arhitectura Sistemului

Sistemul de pacienți a fost implementat folosind pattern-ul Command și o arhitectură în straturi pentru o separare clară a responsabilităților, similar cu sistemul de programări.

### Structura Directoarelor

```
src/
├── data/
│   ├── commands/           # Pattern Command pentru operații CRUD
│   ├── repositories/       # Acces la date și API
│   └── invoker/           # Executor pentru comenzi
├── services/              # Servicii de business logic
├── business/              # Logică de business și validări
├── hooks/                 # Hook-uri React pentru state management
└── components/
    ├── views/             # Componente de vizualizare
    └── drawers/           # Drawer-uri pentru editare
```

## Componente Principale

### 1. Command Pattern (`src/data/commands/`)

Reutilizează pattern-ul Command existent pentru operațiile CRUD:

- **Command.js** - Clasa de bază abstractă
- **GetCommand.js** - Pentru citirea datelor
- **AddCommand.js** - Pentru adăugarea de date
- **UpdateCommand.js** - Pentru actualizarea datelor
- **DeleteCommand.js** - Pentru ștergerea datelor

### 2. Repository Pattern (`src/data/repositories/`)

- **ResourceRepository.js** - Gestionează comunicarea cu API-ul și cache-ul local

### 3. Service Layer (`src/services/`)

- **patientService.js** - Serviciu principal pentru pacienți
  - Integrează comenzi cu repository-ul
  - Gestionează validările și transformările
  - Oferă metode pentru diferite tipuri de interogări
  - Statistici și export de date

### 4. Business Logic (`src/business/`)

- **patientManager.js** - Logică de business
  - Validări pentru pacienți (nume, email, telefon, CNP, etc.)
  - Transformări de date (UI ↔ API)
  - Calculul vârstei și formatarea adreselor
  - Filtrare și sortare
  - Export de date în CSV
  - Generarea statisticilor

### 5. React Hooks (`src/hooks/`)

- **usePatients.js** - Hook pentru state management
  - Loading states
  - Error handling
  - Cache pentru pacienți
  - Funcții pentru CRUD operations
  - Căutare și filtrare
  - Statistici

## Fluxul de Date

### 1. Citirea Pacienților

```
OperationsPeople → usePatients → patientService → GetCommand → ResourceRepository → API
```

### 2. Adăugarea Pacienților

```
PatientDrawer → usePatients → patientService → patientManager (validare) → AddCommand → ResourceRepository → API
```

### 3. Actualizarea Pacienților

```
PatientDrawer → usePatients → patientService → patientManager (validare) → UpdateCommand → ResourceRepository → API
```

## Funcționalități Implementate

### 1. Vizualizare Listă Pacienți
- **Tabel complet** - Toate informațiile relevante despre pacienți
- **Statistici** - Numărul total, activi, inactivi, noi luna aceasta
- **Loading states** - Feedback vizual în timpul încărcării
- **Error handling** - Gestionarea erorilor de rețea

### 2. Gestionarea Pacienților
- **CRUD complet** - Create, Read, Update, Delete
- **Validări** - Verificări pentru câmpurile obligatorii
- **Status management** - Activ, Inactiv, Arhivat
- **Informații complete** - Date personale, contact, medicale, asigurare

### 3. Drawer pentru Editare
- **Formular cu 4 secțiuni** - Informații personale, adresa, medical, asigurare
- **Validare în timp real** - Feedback imediat
- **Actions multiple** - Salvare, ștergere
- **Error display** - Afișarea erorilor de validare

### 4. Căutare și Filtrare
- **Căutare text** - După nume, email, telefon, CNP
- **Filtrare după status** - Activ, inactiv, arhivat
- **Sortare** - După nume, vârstă, status, data creării
- **Paginare** - Încărcare progresivă

### 5. Export și Statistici
- **Export CSV** - Toate datele pacienților
- **Statistici** - Numărul de pacienți pe categorii
- **Cache local** - Funcționare offline

## Avantajele Arhitecturii

### 1. Separarea Responsabilităților
- **Commands** - Operații atomice
- **Services** - Logică de business
- **Hooks** - State management
- **Components** - UI și interacțiune

### 2. Testabilitate
- Fiecare strat poate fi testat independent
- Mock-uri ușor de implementat
- Validări izolate

### 3. Extensibilitate
- Ușor de adăugat noi tipuri de comenzi
- Logică de business modulară
- Hook-uri reutilizabile

### 4. Performance
- Cache local pentru pacienți
- Loading states pentru UX
- Paginare pentru seturi mari de date

## Utilizare

### În OperationsPeople.jsx

```javascript
import { usePatients } from '../../hooks/usePatients.js'

const {
  patients,
  loading,
  error,
  stats,
  loadPatientsByPage,
  searchPatients,
  deletePatient,
  exportPatients
} = usePatients()
```

### În PatientDrawer.jsx

```javascript
import { usePatients } from '../../hooks/usePatients.js'

const { addPatient, updatePatient, deletePatient } = usePatients()

// Pentru adăugare
await addPatient(patientData)

// Pentru actualizare
await updatePatient(id, patientData)

// Pentru ștergere
await deletePatient(id)
```

## Configurare IndexedDB

Sistemul folosește Dexie pentru gestionarea IndexedDB cu următoarele store-uri:

- **patients** - Pacienții cu indexuri pe `id`, `name`, `email`, `phone`, `status`, `city`, `county`

### Instalare și Configurare

```bash
npm install dexie
```

### Utilitare pentru Testare

Fișierul `src/utils/patientUtils.js` conține funcții pentru:
- `populateTestPatients()` - Populează cache-ul cu date de test
- `clearAllPatientData()` - Curăță toate datele
- `checkPatientCacheStatus()` - Verifică starea cache-ului
- `exportPatientCacheData()` / `importPatientCacheData()` - Export/import date

## Configurare API

Sistemul se conectează la API-ul `/api/resources` cu header-ul `X-Resource-Type: patient`.

Parametrii suportați pentru interogări:
- `search` - Căutare text
- `status` - Filtrare după status
- `city` - Filtrare după oraș
- `sortBy` / `sortOrder` - Sortare
- `limit` / `offset` - Paginare

## Fallback și Cache

Când API-ul nu este disponibil, sistemul:
1. Încearcă să încarce datele din cache local
2. Afișează un mesaj de eroare informativ
3. Permite funcționarea offline cu datele din cache

## Validări Implementate

### Câmpuri Obligatorii
- **Nume** - Minim 2 caractere
- **Email** - Format valid de email
- **Telefon** - Format valid de telefon românesc

### Câmpuri Opționale cu Validare
- **Data nașterii** - Nu poate fi în viitor, vârsta maximă 120 ani
- **CNP** - Exact 13 cifre
- **Cod poștal** - 6 cifre

### Transformări de Date
- **Email** - Convertit la lowercase și trim
- **Telefon** - Trim și formatare
- **CNP** - Trim și validare
- **Adrese** - Trim și formatare

## Statistici Disponibile

### Statistici de Bază
- **Total pacienți** - Numărul total de pacienți
- **Pacienți activi** - Cu status "active"
- **Pacienți inactivi** - Cu status "inactive"
- **Pacienți arhivați** - Cu status "archived"
- **Pacienți cu asigurare** - Cu asigurător specificat
- **Pacienți noi luna aceasta** - Creați în luna curentă

### Statistici Avansate
- **Distribuția pe vârste** - Grupe de vârstă (0-18, 19-30, 31-50, 51-70, 70+)
- **Top orașe** - Cele mai multe pacienți per oraș
- **Distribuția pe asigurători** - Numărul de pacienți per asigurător

## Export de Date

### Format CSV
Exportul include toate câmpurile relevante:
- Informații personale (nume, email, telefon, CNP, data nașterii)
- Adresa completă (adresa, oraș, județ, cod poștal)
- Contact de urgență
- Informații medicale (istoric, alergii, medicamente)
- Asigurare (asigurător, număr asigurare)
- Status și note
- Date de creare

### Utilizare
```javascript
const csvData = await exportPatients('csv')
// Descarcă automat fișierul CSV
```

## Următorii Pași

1. **Implementare API backend** - Pentru a suporta operațiile CRUD
2. **Testare** - Unit tests pentru fiecare strat
3. **Optimizări** - Cache mai avansat, lazy loading
4. **Funcționalități suplimentare** - 
   - Import de date din CSV
   - Sincronizare cu sisteme externe
   - Notificări pentru pacienți
   - Istoric complet al modificărilor
   - Backup și restore automat

## Integrare cu Sistemul de Programări

Sistemul de pacienți este integrat cu sistemul de programări:
- **Referințe** - Programările referențiază pacienții după ID
- **Căutare** - Căutarea pacienților din programări
- **Statistici** - Statistici combinate pacienți-programări
- **Export** - Export combinat cu programările

## Securitate și Confidențialitate

### Date Sensibile
- **CNP** - Validat și stocat securizat
- **Informații medicale** - Acces restricționat
- **Contact de urgență** - Protejat

### Acces și Permisiuni
- **Vizualizare** - Toți utilizatorii autentificați
- **Editare** - Doar utilizatorii cu permisiuni
- **Ștergere** - Doar administratorii
- **Export** - Doar utilizatorii cu permisiuni de export
