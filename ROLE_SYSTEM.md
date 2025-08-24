# Sistem de Roluri - Documentație

## Arhitectura Sistemului

Sistemul de roluri a fost implementat folosind pattern-ul Command și o arhitectură în straturi pentru o separare clară a responsabilităților, similar cu sistemul de programări.

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

- **roleService.js** - Serviciu principal pentru roluri
  - Integrează comenzi cu repository-ul
  - Gestionează validările și transformările
  - Oferă metode pentru diferite tipuri de interogări

### 4. Business Logic (`src/business/`)

- **roleManager.js** - Logică de business
  - Validări pentru roluri
  - Transformări de date (UI ↔ API)
  - Statistici și filtrare
  - Export de date
  - Generare date de test

### 5. React Hooks (`src/hooks/`)

- **useRoles.js** - Hook pentru state management
  - Loading states
  - Error handling
  - Cache pentru numărul de roluri
  - Funcții pentru CRUD operations

## Fluxul de Date

### 1. Citirea Rolurilor

```
AdminUsers → useRoles → roleService → GetCommand → ResourceRepository → API
```

### 2. Adăugarea Rolurilor

```
RoleDrawer → useRoles → roleService → roleManager (validare) → AddCommand → ResourceRepository → API
```

### 3. Actualizarea Rolurilor

```
RoleDrawer → useRoles → roleService → roleManager (validare) → UpdateCommand → ResourceRepository → API
```

## Funcționalități Implementate

### 1. Gestionarea Rolurilor
- **CRUD complet** - Create, Read, Update, Delete
- **Validări** - Verificări pentru câmpurile obligatorii
- **Status management** - Activ, Inactiv, Arhivat
- **Permisiuni** - Gestionarea permisiunilor pe resurse și acțiuni

### 2. Drawer pentru Editare
- **Formular complet** - Nume, descriere, status, permisiuni
- **Validare în timp real** - Folosind roleManager
- **Gestionare permisiuni** - Selectare/deselectare per resursă și acțiune
- **Actions multiple** - Salvare, ștergere
- **Error display** - Afișarea erorilor de validare

### 3. Sistem de Permisiuni
- **Resurse disponibile** - Programări, Pacienți, Utilizatori, etc.
- **Acțiuni disponibile** - Vizualizare, Creare, Editare, Ștergere
- **Gestionare intuitivă** - Checkbox-uri pentru fiecare combinație resursă-acțiune
- **Selectare în bloc** - Pentru toate acțiunile unei resurse

### 4. Filtrare și Sortare
- **Filtrare după status** - Activ, inactiv, arhivat
- **Filtrare după numărul de permisiuni** - Min/max permisiuni
- **Căutare text** - După nume și descriere
- **Sortare** - După nume, status, numărul de permisiuni

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
- Cache local pentru roluri
- Loading states pentru UX
- Validare eficientă

## Utilizare

### În AdminUsers.jsx

```javascript
import { useRoles } from '../../hooks/useRoles.js'

const {
  roles,
  loading,
  error,
  loadRoles,
  addRole,
  updateRole,
  deleteRole
} = useRoles()
```

### În RoleDrawer.jsx

```javascript
import { useRoles } from '../../hooks/useRoles.js'

const { addRole, updateRole, deleteRole } = useRoles()

// Pentru adăugare
await addRole(roleData)

// Pentru actualizare
await updateRole(id, roleData)

// Pentru ștergere
await deleteRole(id)
```

## Configurare IndexedDB

Sistemul folosește Dexie pentru gestionarea IndexedDB cu următoarele store-uri:

- **roles** - Rolurile cu indexuri pe `id`, `name`, `status`
- **permissions** - Permisiunile cu indexuri pe `resource`, `action`

### Instalare și Configurare

```bash
npm install dexie
```

### Utilitare pentru Testare

Fișierul `src/utils/roleUtils.js` conține funcții pentru:
- `populateTestData()` - Populează cache-ul cu date de test
- `clearAllData()` - Curăță toate datele
- `checkCacheStatus()` - Verifică starea cache-ului
- `exportCacheData()` / `importCacheData()` - Export/import date

## Configurare API

Sistemul se conectează la API-ul `/api/resources` cu header-ul `X-Resource-Type: role`.

Parametrii suportați pentru interogări:
- `status` - Filtrare după status
- `search` - Căutare text
- `sortBy` / `sortOrder` - Sortare
- `limit` / `offset` - Paginare

## Structura Permisiunilor

Fiecare rol conține un array de permisiuni cu structura:

```javascript
{
  resource: 'appointments', // Resursa (appointments, patients, users, etc.)
  action: 'view'            // Acțiunea (view, create, edit, delete)
}
```

### Resurse Disponibile
- `appointments` - Programări
- `patients` - Pacienți
- `users` - Utilizatori
- `roles` - Roluri
- `products` - Produse
- `reports` - Rapoarte
- `settings` - Setări
- `analytics` - Analize
- `financial` - Financiar

### Acțiuni Disponibile
- `view` - Vizualizare
- `create` - Creare
- `edit` - Editare
- `delete` - Ștergere

## Fallback și Cache

Când API-ul nu este disponibil, sistemul:
1. Încearcă să încarce datele din cache local
2. Afișează un mesaj de eroare informativ
3. Permite funcționarea offline cu datele din cache

## Roluri Predefinite

Sistemul include roluri predefinite pentru testare:

1. **Administrator** - Acces complet la toate funcționalitățile
2. **Manager** - Acces la gestionarea operațională și rapoarte
3. **Doctor** - Acces la programări și pacienți
4. **Asistent** - Acces limitat pentru activități de suport
5. **Recepționer** - Acces pentru activități de recepție

## Următorii Pași

1. **Implementare API backend** - Pentru a suporta operațiile CRUD
2. **Testare** - Unit tests pentru fiecare strat
3. **Optimizări** - Cache mai avansat, lazy loading
4. **Funcționalități suplimentare** - Copiere roluri, template-uri, etc.
5. **Integrare cu sistemul de utilizatori** - Aplicarea rolurilor la utilizatori
