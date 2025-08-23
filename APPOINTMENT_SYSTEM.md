# Sistem de Programări - Documentație

## Arhitectura Sistemului

Sistemul de programări a fost implementat folosind pattern-ul Command și o arhitectură în straturi pentru o separare clară a responsabilităților.

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

Implementează pattern-ul Command pentru operațiile CRUD:

- **Command.js** - Clasa de bază abstractă
- **GetCommand.js** - Pentru citirea datelor
- **AddCommand.js** - Pentru adăugarea de date
- **UpdateCommand.js** - Pentru actualizarea datelor
- **DeleteCommand.js** - Pentru ștergerea datelor

### 2. Repository Pattern (`src/data/repositories/`)

- **ResourceRepository.js** - Gestionează comunicarea cu API-ul și cache-ul local

### 3. Service Layer (`src/services/`)

- **appointmentService.js** - Serviciu principal pentru programări
  - Integrează comenzi cu repository-ul
  - Gestionează validările și transformările
  - Oferă metode pentru diferite tipuri de interogări

### 4. Business Logic (`src/business/`)

- **appointmentManager.js** - Logică de business
  - Validări pentru programări
  - Transformări de date (UI ↔ API)
  - Verificare conflicte
  - Statistici și filtrare
  - Export de date

### 5. React Hooks (`src/hooks/`)

- **useAppointments.js** - Hook pentru state management
  - Loading states
  - Error handling
  - Cache pentru numărul de programări
  - Funcții pentru CRUD operations

## Fluxul de Date

### 1. Citirea Programărilor

```
OperationsPlanning → useAppointments → appointmentService → GetCommand → ResourceRepository → API
```

### 2. Adăugarea Programărilor

```
AppointmentDrawer → useAppointments → appointmentService → appointmentManager (validare) → AddCommand → ResourceRepository → API
```

### 3. Actualizarea Programărilor

```
AppointmentDrawer → useAppointments → appointmentService → appointmentManager (validare + conflicte) → UpdateCommand → ResourceRepository → API
```

## Funcționalități Implementate

### 1. Vizualizare Calendar
- **Zi/Săptămână/Lună** - Navigare între diferite perioade
- **Indicatori vizuali** - Numărul de programări per zi
- **Loading states** - Feedback vizual în timpul încărcării
- **Error handling** - Gestionarea erorilor de rețea

### 2. Gestionarea Programărilor
- **CRUD complet** - Create, Read, Update, Delete
- **Validări** - Verificări pentru câmpurile obligatorii
- **Verificare conflicte** - Previne suprapunerile de programări
- **Status management** - Programat, În curs, Completat, etc.

### 3. Drawer pentru Editare
- **Formular complet** - Toate câmpurile necesare
- **Validare în timp real** - Feedback imediat
- **Actions multiple** - Salvare, ștergere, marcare completată
- **Error display** - Afișarea erorilor de validare

### 4. Filtrare și Sortare
- **Filtrare după status** - Programat, completat, etc.
- **Filtrare după doctor/pacient** - Căutare text
- **Sortare** - După dată, oră, pacient, etc.
- **Paginare** - Încărcare progresivă

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
- Cache local pentru programări
- Loading states pentru UX
- Paginare pentru seturi mari de date

## Utilizare

### În OperationsPlanning.jsx

```javascript
import { useAppointments } from '../../hooks/useAppointments.js'

const {
  appointments,
  loading,
  error,
  loadAppointmentsByDate,
  loadAppointmentsByWeek,
  loadAppointmentsByMonth
} = useAppointments()
```

### În AppointmentDrawer.jsx

```javascript
import { useAppointments } from '../../hooks/useAppointments.js'

const { addAppointment, updateAppointment, deleteAppointment } = useAppointments()

// Pentru adăugare
await addAppointment(appointmentData)

// Pentru actualizare
await updateAppointment(id, appointmentData)

// Pentru ștergere
await deleteAppointment(id)
```

## Configurare IndexedDB

Sistemul folosește Dexie pentru gestionarea IndexedDB cu următoarele store-uri:

- **appointments** - Programările cu indexuri pe `id`, `date`, `doctor`, `patient`, `status`
- **appointmentCounts** - Cache pentru numărul de programări per dată

### Instalare și Configurare

```bash
npm install dexie
```

### Utilitare pentru Testare

Fișierul `src/utils/appointmentUtils.js` conține funcții pentru:
- `populateTestData()` - Populează cache-ul cu date de test
- `clearAllData()` - Curăță toate datele
- `checkCacheStatus()` - Verifică starea cache-ului
- `exportCacheData()` / `importCacheData()` - Export/import date

## Configurare API

Sistemul se conectează la API-ul `/api/resources` cu header-ul `X-Resource-Type: appointment`.

Parametrii suportați pentru interogări:
- `startDate` / `endDate` - Filtrare după perioadă
- `sortBy` / `sortOrder` - Sortare
- `limit` / `offset` - Paginare

## Fallback și Cache

Când API-ul nu este disponibil, sistemul:
1. Încearcă să încarce datele din cache local
2. Afișează un mesaj de eroare informativ
3. Permite funcționarea offline cu datele din cache

## Următorii Pași

1. **Implementare API backend** - Pentru a suporta operațiile CRUD
2. **Testare** - Unit tests pentru fiecare strat
3. **Optimizări** - Cache mai avansat, lazy loading
4. **Funcționalități suplimentare** - Notificări, export, etc.
