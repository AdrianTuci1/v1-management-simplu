# Sistem de Utilizatori (Medici) - Documentație

## Arhitectura Sistemului

Sistemul de utilizatori a fost implementat folosind pattern-ul Command și o arhitectură în straturi pentru o separare clară a responsabilităților, similar cu sistemul de programări.

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
├── utils/                 # Utilitare pentru cache și testare
└── components/
    ├── views/             # Componente de vizualizare
    └── drawers/           # Drawer-uri pentru editare
```

## Componente Principale

### 1. Command Pattern (`src/data/commands/`)

Folosește aceleași comenzi ca sistemul de programări, dar cu resursa "medic":

- **Command.js** - Clasa de bază abstractă
- **GetCommand.js** - Pentru citirea datelor
- **AddCommand.js** - Pentru adăugarea de date
- **UpdateCommand.js** - Pentru actualizarea datelor
- **DeleteCommand.js** - Pentru ștergerea datelor

### 2. Repository Pattern (`src/data/repositories/`)

- **ResourceRepository.js** - Gestionează comunicarea cu API-ul și cache-ul local

### 3. Service Layer (`src/services/`)

- **userService.js** - Serviciu principal pentru utilizatori
  - Integrează comenzi cu repository-ul
  - Gestionează validările și transformările
  - Oferă metode pentru diferite tipuri de interogări

### 4. Business Logic (`src/business/`)

- **userManager.js** - Logică de business
  - Validări pentru utilizatori
  - Transformări de date (UI ↔ API)
  - Verificare duplicări (email, licență)
  - Statistici și filtrare
  - Export de date

### 5. React Hooks (`src/hooks/`)

- **useUsers.js** - Hook pentru state management
  - Loading states
  - Error handling
  - Cache pentru numărul de utilizatori
  - Funcții pentru CRUD operations

### 6. Utilitare (`src/utils/`)

- **userUtils.js** - Funcții pentru testare și cache
  - Populare date de test
  - Backup și restore
  - Verificări de duplicări
  - Export/import date

## Fluxul de Date

### 1. Citirea Utilizatorilor

```
AdminUsers → useUsers → userService → GetCommand → ResourceRepository → API
```

### 2. Adăugarea Utilizatorilor

```
UserDrawer → useUsers → userService → userManager (validare) → AddCommand → ResourceRepository → API
```

### 3. Actualizarea Utilizatorilor

```
UserDrawer → useUsers → userService → userManager (validare + duplicări) → UpdateCommand → ResourceRepository → API
```

## Funcționalități Implementate

### 1. Vizualizare Listă Utilizatori
- **Tabel complet** - Toate informațiile utilizatorilor
- **Statistici** - Total, activi, inactivi, experiență medie
- **Loading states** - Feedback vizual în timpul încărcării
- **Error handling** - Gestionarea erorilor de rețea

### 2. Gestionarea Utilizatorilor
- **CRUD complet** - Create, Read, Update, Delete
- **Validări** - Verificări pentru câmpurile obligatorii
- **Verificare duplicări** - Previne email-uri și licențe duplicate
- **Status management** - Activ, Inactiv, Suspendat, Pensionat

### 3. Drawer pentru Editare
- **Formular complet** - Toate câmpurile necesare
- **Validare în timp real** - Feedback imediat
- **Actions multiple** - Salvare, ștergere
- **Error display** - Afișarea erorilor de validare

### 4. Filtrare și Sortare
- **Filtrare după status** - Activ, inactiv, etc.
- **Filtrare după specializare** - Cardiologie, dermatologie, etc.
- **Căutare text** - După nume, email, specializare, licență
- **Sortare** - După nume, specializare, experiență, status

### 5. Export și Import
- **Export JSON** - Pentru backup și transfer
- **Export CSV** - Pentru analiză în Excel
- **Backup automat** - Salvare locală
- **Restore** - Recuperare din backup

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
- Cache local pentru utilizatori
- Loading states pentru UX
- Filtrare și sortare eficientă

## Utilizare

### În AdminUsers.jsx

```javascript
import { useUsers } from '../../hooks/useUsers.js'

const {
  users,
  loading,
  error,
  stats,
  loadUsers,
  addUser,
  updateUser,
  deleteUser,
  filterUsers,
  sortUsers,
  exportUsers
} = useUsers()
```

### În UserDrawer.jsx

```javascript
import { useUsers } from '../../hooks/useUsers.js'

const { addUser, updateUser, deleteUser } = useUsers()

// Pentru adăugare
await addUser(userData)

// Pentru actualizare
await updateUser(id, userData)

// Pentru ștergere
await deleteUser(id)
```

## Configurare IndexedDB

Sistemul folosește Dexie pentru gestionarea IndexedDB cu următoarele store-uri:

- **users** - Utilizatorii cu indexuri pe `id`, `email`, `licenseNumber`, `specialization`, `status`, `role`

### Instalare și Configurare

```bash
npm install dexie
```

### Utilitare pentru Testare

Fișierul `src/utils/userUtils.js` conține funcții pentru:
- `populateTestData()` - Populează cache-ul cu date de test
- `clearAllData()` - Curăță toate datele
- `checkCacheStatus()` - Verifică starea cache-ului
- `exportCacheData()` / `importCacheData()` - Export/import date
- `backupCache()` / `restoreCache()` - Backup și restore

## Configurare API

Sistemul se conectează la API-ul `/api/resources` cu header-ul `X-Resource-Type: medic`.

Parametrii suportați pentru interogări:
- `search` - Căutare text
- `status` - Filtrare după status
- `specialization` - Filtrare după specializare
- `sortBy` / `sortOrder` - Sortare
- `limit` / `offset` - Paginare

## Fallback și Cache

Când API-ul nu este disponibil, sistemul:
1. Încearcă să încarce datele din cache local
2. Afișează un mesaj de eroare informativ
3. Permite funcționarea offline cu datele din cache

## Validări Implementate

### Câmpuri Obligatorii
- **Prenume** - Minim 2 caractere
- **Nume** - Minim 2 caractere
- **Email** - Format valid de email
- **Telefon** - Format valid de telefon
- **Specializare** - Selectată din listă
- **Număr licență** - Minim 5 caractere

### Validări Suplimentare
- **Email unic** - Verificare duplicări
- **Licență unică** - Verificare duplicări
- **Experiență** - Număr pozitiv
- **Status** - Valori valide

## Statistici Disponibile

- **Total utilizatori** - Numărul total de utilizatori
- **Utilizatori activi** - Cu status "active"
- **Utilizatori inactivi** - Cu status "inactive"
- **Experiență medie** - Media experienței în ani
- **Distribuție pe specializări** - Numărul de utilizatori per specializare
- **Distribuție pe status** - Numărul de utilizatori per status

## Funcționalități Avansate

### 1. Căutare Avansată
- Căutare în nume, email, specializare, licență
- Filtrare combinată (status + specializare)
- Sortare pe multiple câmpuri

### 2. Export Flexibil
- Export JSON pentru backup
- Export CSV pentru analiză
- Export selectiv (utilizatori selectați)

### 3. Gestionare Cache
- Backup automat
- Restore din backup
- Sincronizare cu API
- Verificare integritate

### 4. Date de Test
- Generare automată utilizatori
- Populare cache cu date realiste
- Curățare date de test

## Următorii Pași

1. **Implementare API backend** - Pentru a suporta operațiile CRUD
2. **Testare** - Unit tests pentru fiecare strat
3. **Optimizări** - Cache mai avansat, lazy loading
4. **Funcționalități suplimentare** - Notificări, audit trail, etc.
5. **Integrare cu sistemul de programări** - Asociere utilizatori cu programări

## Comparație cu Sistemul de Programări

| Aspect | Programări | Utilizatori |
|--------|------------|-------------|
| Resursă | appointment | medic |
| Cache | appointmentCounts | users |
| Validări | Conflicte orare | Duplicări email/licență |
| Statistici | Pe perioade | Pe specializări |
| Export | Calendar format | JSON/CSV |
| Hook | useAppointments | useUsers |

Ambele sisteme folosesc aceeași arhitectură de bază, dar sunt adaptate pentru specificul fiecărei resurse.
