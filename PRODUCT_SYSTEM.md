# Sistem de Inventar - Documentație

## Arhitectura Sistemului

Sistemul de inventar a fost implementat folosind pattern-ul Command și o arhitectură în straturi pentru o separare clară a responsabilităților, similar cu sistemul de programări.

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
├── utils/                 # Utilitare pentru testare și debugging
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

- **productService.js** - Serviciu principal pentru produse
  - Integrează comenzi cu repository-ul
  - Gestionează validările și transformările
  - Oferă metode pentru diferite tipuri de interogări

### 4. Business Logic (`src/business/`)

- **productManager.js** - Logică de business
  - Validări pentru produse
  - Transformări de date (UI ↔ API)
  - Calculul statisticilor
  - Filtrare și sortare
  - Export de date

### 5. React Hooks (`src/hooks/`)

- **useProducts.js** - Hook pentru state management
  - Loading states
  - Error handling
  - Cache pentru produse
  - Funcții pentru CRUD operations

## Fluxul de Date

### 1. Citirea Produselor

```
BusinessInventory → useProducts → productService → GetCommand → ResourceRepository → API
```

### 2. Adăugarea Produselor

```
ProductDrawer → useProducts → productService → productManager (validare) → AddCommand → ResourceRepository → API
```

### 3. Actualizarea Produselor

```
ProductDrawer → useProducts → productService → productManager (validare) → UpdateCommand → ResourceRepository → API
```

## Funcționalități Implementate

### 1. Vizualizare Produse
- **Tabel complet** - Toate informațiile despre produse
- **Statistici** - Total produse, valoare totală, stoc scăzut, fără stoc
- **Loading states** - Feedback vizual în timpul încărcării
- **Error handling** - Gestionarea erorilor de rețea

### 2. Gestionarea Produselor
- **CRUD complet** - Create, Read, Update, Delete
- **Validări** - Verificări pentru câmpurile obligatorii
- **Status management** - În stoc, stoc scăzut, fără stoc
- **Nivel de reîncărcare** - Alerte automate pentru stoc scăzut

### 3. Drawer pentru Editare
- **Formular complet** - Toate câmpurile necesare
- **Validare în timp real** - Feedback imediat
- **Actions multiple** - Salvare, ștergere
- **Error display** - Afișarea erorilor de validare

### 4. Filtrare și Sortare
- **Căutare text** - După nume și categorie
- **Filtrare după categorie** - Dropdown cu categorii predefinite
- **Filtrare după stoc scăzut** - Produse care necesită reîncărcare
- **Sortare** - După nume, preț, stoc, categorie, dată

### 5. Export și Statistici
- **Export CSV** - Pentru analiză externă
- **Statistici în timp real** - Valoarea totală a stocului
- **Indicatori vizuali** - Status-uri colorate pentru stoc

## Câmpurile Produselor

### 1. Nume Produs (productName)
- **Tip**: Text
- **Validare**: Obligatoriu, minim 2 caractere
- **Descriere**: Numele comercial al produsului

### 2. Preț (price)
- **Tip**: Număr (RON)
- **Validare**: Obligatoriu, pozitiv
- **Descriere**: Prețul unitar al produsului

### 3. Categorie (category)
- **Tip**: Select
- **Validare**: Obligatoriu
- **Opțiuni**: Medicamente, Dispozitive Medicale, Produse de Îngrijire, Echipamente, Consumabile, Altele

### 4. Stoc (stock)
- **Tip**: Număr întreg
- **Validare**: Obligatoriu, >= 0
- **Descriere**: Cantitatea disponibilă în stoc

### 5. Nivel de Reîncărcare (reorderLevel)
- **Tip**: Număr întreg
- **Validare**: Obligatoriu, >= 0
- **Descriere**: Cantitatea la care produsul este marcat ca "stoc scăzut"

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
- Cache local pentru produse
- Loading states pentru UX
- Statistici calculate în timp real

## Utilizare

### În BusinessInventory.jsx

```javascript
import { useProducts } from '../../hooks/useProducts.js'

const {
  products,
  loading,
  error,
  stats,
  searchProducts,
  loadProductsByCategory,
  loadLowStockProducts,
  exportProducts
} = useProducts()
```

### În ProductDrawer.jsx

```javascript
import { useProducts } from '../../hooks/useProducts.js'

const { addProduct, updateProduct, deleteProduct } = useProducts()

// Pentru adăugare
await addProduct(productData)

// Pentru actualizare
await updateProduct(id, productData)

// Pentru ștergere
await deleteProduct(id)
```

## Configurare IndexedDB

Sistemul folosește Dexie pentru gestionarea IndexedDB cu următoarele store-uri:

- **products** - Produsele cu indexuri pe `id`, `name`, `category`, `price`, `stock`, `reorderLevel`
- **productCounts** - Cache pentru numărul de produse per categorie

### Instalare și Configurare

```bash
npm install dexie
```

### Utilitare pentru Testare

Fișierul `src/utils/productUtils.js` conține funcții pentru:
- `populateTestData()` - Populează cache-ul cu date de test
- `clearAllData()` - Curăță toate datele
- `checkCacheStatus()` - Verifică starea cache-ului
- `exportCacheData()` / `importCacheData()` - Export/import date
- `generateRandomProducts()` - Generează produse aleatorii pentru testare

## Configurare API

Sistemul se conectează la API-ul `/api/resources` cu header-ul `X-Resource-Type: product`.

Parametrii suportați pentru interogări:
- `category` - Filtrare după categorie
- `search` - Căutare text
- `lowStock` - Filtrare produse cu stoc scăzut
- `sortBy` / `sortOrder` - Sortare
- `limit` / `offset` - Paginare

## Fallback și Cache

Când API-ul nu este disponibil, sistemul:
1. Încearcă să încarce datele din cache local
2. Afișează un mesaj de eroare informativ
3. Permite funcționarea offline cu datele din cache

## Statistici și Rapoarte

### 1. Statistici Generale
- **Total produse** - Numărul total de produse în inventar
- **Valoare totală** - Valoarea totală a stocului (stoc × preț)
- **Produse cu stoc scăzut** - Produse care au ajuns la nivelul de reîncărcare
- **Produse fără stoc** - Produse cu stoc zero

### 2. Statistici per Categorie
- Numărul de produse per categorie
- Valoarea totală per categorie
- Produse cu stoc scăzut per categorie

### 3. Export de Date
- **Format CSV** - Pentru analiză în Excel sau alte aplicații
- **Format JSON** - Pentru integrare cu alte sisteme

## Următorii Pași

1. **Implementare API backend** - Pentru a suporta operațiile CRUD
2. **Testare** - Unit tests pentru fiecare strat
3. **Optimizări** - Cache mai avansat, lazy loading
4. **Funcționalități suplimentare** - 
   - Notificări pentru stoc scăzut
   - Istoric modificări stoc
   - Coduri de bare pentru produse
   - Integrare cu furnizori
   - Rapoarte avansate
   - Backup automat

## Integrare cu Sistemul Existente

Sistemul de inventar se integrează perfect cu arhitectura existentă:

- **Reutilizează** pattern-ul Command existent
- **Extinde** baza de date IndexedDB
- **Folosește** același sistem de drawer-uri
- **Mantiene** consistența UI/UX
- **Partajează** utilitarele comune

Această abordare asigură o experiență consistentă și o mentenanță ușoară a codului.
