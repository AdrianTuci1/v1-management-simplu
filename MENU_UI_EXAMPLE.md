# Structura de Meniuri - Dashboard Business

## 🎯 Structura Generală de Navigare

### Layout Principal
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🏢 Business Dashboard                    [🔔] [👤 Admin User ▼]          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 📊 OPERAȚIUNI                    │                                          │
│ ┌─────────────────────────────┐  │                                          │
│ │ 📅 Planificare              │  │                                          │
│ │ 👥 Persoane                 │  │                                          │
│ │ 📋 Activități               │  │                                          │
│ └─────────────────────────────┘  │                                          │
│                                  │                                          │
│ 💼 BUSINESS                     │                                          │
│ ┌─────────────────────────────┐  │                                          │
│ │ 📈 Vânzări                  │  │                                          │
│ │ 📦 Inventar                 │  │                                          │
│ │ 🔄 Procese                  │  │                                          │
│ └─────────────────────────────┘  │                                          │
│                                  │                                          │
│ 💳 FINANCIAR                   │                                          │
│ ┌─────────────────────────────┐  │                                          │
│ │ 🧾 Facturare                │  │                                          │
│ │ 💰 Contabilitate            │  │                                          │
│ └─────────────────────────────┘  │                                          │
│                                  │                                          │
│ 📊 ANALIZE                     │                                          │
│ ┌─────────────────────────────┐  │                                          │
│ │ 📈 Rapoarte                 │  │                                          │
│ │ 📊 Dashboard                │  │                                          │
│ └─────────────────────────────┘  │                                          │
│                                  │                                          │
│ ⚙️ ADMINISTRARE                │                                          │
│ ┌─────────────────────────────┐  │                                          │
│ │ 🛡️ Control Acces            │  │                                          │
│ │ 👤 Utilizatori              │  │                                          │
│ │ ⚙️ Setări                   │  │                                          │
│ └─────────────────────────────┘  │                                          │
│                                  │                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 📋 Detalii Meniuri

### 1. 📊 OPERAȚIUNI
**Descriere**: Gestionarea operațională zilnică

#### 📅 Planificare
- **Calendar** - Vizualizare programări
- **Programări** - Lista programărilor
- **Evenimente** - Evenimente speciale
- **Resurse** - Gestionarea resurselor

#### 👥 Persoane
- **Clienți** - Baza de date clienți
- **Personal** - Angajații companiei
- **Contacte** - Contacte externe
- **Grupuri** - Grupuri de clienți

#### 📋 Activități
- **Jurnal** - Log activități
- **Sarcini** - Task management
- **Note** - Note și observații
- **Istoric** - Istoric modificări

### 2. 💼 BUSINESS
**Descriere**: Gestionarea afacerii și vânzărilor

#### 📈 Vânzări
- **Tranzacții** - Vânzări și achiziții
- **Oferte** - Oferte comerciale
- **Contracte** - Contracte active
- **Comisioane** - Calcul comisioane

#### 📦 Inventar
- **Produse** - Catalog produse
- **Stocuri** - Gestionare stocuri
- **Categorii** - Categorii produse
- **Furnizori** - Lista furnizori

#### 🔄 Procese
- **Workflow** - Procese de business
- **Aprobări** - Sistem aprobări
- **Automatizări** - Reguli automate
- **Template-uri** - Template-uri procese

### 3. 💳 FINANCIAR
**Descriere**: Gestionarea financiară

#### 🧾 Facturare
- **Facturi** - Facturi emise
- **Plăți** - Încasări și plăți
- **Rambursări** - Rambursări asigurări
- **Raportări** - Rapoarte fiscale

#### 💰 Contabilitate
- **Conturi** - Plan de conturi
- **Tranzacții** - Mișcări contabile
- **Balanțe** - Balanțe și solduri
- **Rapoarte** - Rapoarte contabile

### 4. 📊 ANALIZE
**Descriere**: Analize și rapoarte

#### 📈 Rapoarte
- **Vânzări** - Rapoarte vânzări
- **Financiar** - Rapoarte financiare
- **Operațional** - Rapoarte operaționale
- **Personalizate** - Rapoarte custom

#### 📊 Dashboard
- **KPI** - Indicatori cheie
- **Grafice** - Vizualizări grafice
- **Tendințe** - Analiza tendințelor
- **Prognoze** - Prognoze și estimări

### 5. ⚙️ ADMINISTRARE
**Descriere**: Configurare și administrare

#### 🛡️ Control Acces
- **Roluri** - Definirea rolurilor
- **Permisiuni** - Gestionarea permisiunilor
- **Securitate** - Setări securitate
- **Audit** - Log-uri de acces

#### 👤 Utilizatori
- **Profile** - Profile utilizatori
- **Echipe** - Organizarea echipelor
- **Preferințe** - Setări personale
- **Activități** - Istoric activități

#### ⚙️ Setări
- **General** - Setări generale
- **Integrări** - Integrări externe
- **Backup** - Backup și restaurare
- **Sistem** - Informații sistem

## 🎨 Stare Meniuri

### Meniu Activ
```
📊 OPERAȚIUNI                    ← Meniu activ (highlight)
┌─────────────────────────────┐
│ 📅 Planificare              │
│ 👥 Persoane                 │ ← Submeniu activ
│ 📋 Activități               │
└─────────────────────────────┘
```

### Meniu Colapsat
```
📊 ▼                          ← Meniu colapsat
```

### Meniu Expandat
```
📊 OPERAȚIUNI                  ← Meniu expandat
┌─────────────────────────────┐
│ 📅 Planificare              │
│   ├─ Calendar               │ ← Submeniuri
│   ├─ Programări             │
│   └─ Evenimente             │
│ 👥 Persoane                 │
│   ├─ Clienți                │
│   ├─ Personal               │
│   └─ Contacte               │
│ 📋 Activități               │
└─────────────────────────────┘
```

## 📱 Responsive Behavior

### Desktop (1200px+)
- Sidebar fixă, 260px lățime
- Toate meniurile vizibile
- Hover effects pentru submeniuri

### Tablet (768px - 1199px)
- Sidebar colapsibilă
- Meniurile se expandează la click
- Overlay pentru submeniuri

### Mobile (< 768px)
- Sidebar în drawer
- Meniurile se expandează vertical
- Bottom navigation pentru acțiuni rapide

## 🔐 Control Acces pe Meniuri

### Admin Complet
```
✅ Toate meniurile și submeniurile
✅ Acces complet la toate funcționalitățile
✅ Posibilitatea de a modifica permisiuni
```

### Manager
```
✅ OPERAȚIUNI (toate)
✅ BUSINESS (toate)
✅ FINANCIAR (citire + editare limitată)
✅ ANALIZE (toate)
❌ ADMINISTRARE (fără acces)
```

### Operator
```
✅ OPERAȚIUNI (Planificare, Persoane)
✅ BUSINESS (Vânzări - citire)
❌ FINANCIAR (fără acces)
❌ ANALIZE (fără acces)
❌ ADMINISTRARE (fără acces)
```

### Vizualizator
```
✅ OPERAȚIUNI (citire)
✅ BUSINESS (citire)
✅ FINANCIAR (citire)
✅ ANALIZE (citire)
❌ ADMINISTRARE (fără acces)
```

## 🎯 Breadcrumb Navigation

### Exemplu Breadcrumb
```
🏢 Dashboard > 📊 Operațiuni > 👥 Persoane > Clienți
```

### Structura Breadcrumb
- **Nivel 1**: Meniu principal (ex: Operațiuni)
- **Nivel 2**: Submeniu (ex: Persoane)
- **Nivel 3**: Pagină specifică (ex: Clienți)
- **Nivel 4+**: Subsecțiuni (ex: Detalii client)

## 🔍 Search Global

### Funcționalități Search
- **Căutare în toate meniurile**
- **Căutare în conținut**
- **Sugestii inteligente**
- **Istoric căutări**
- **Filtre avansate**

### Exemplu Search
```
🔍 [Caută...] → Rezultate:
📅 Programare - Ion Marinescu
👥 Client - Ion Marinescu
📈 Vânzare - Ion Marinescu
```

## 📊 Indicatori Meniu

### Badge-uri pentru notificări
```
📊 OPERAȚIUNI [3]              ← 3 notificări
👥 Persoane [12]               ← 12 clienți noi
📈 Vânzări [!]                 ← Alertă importantă
```

### Tipuri de indicatori
- **[număr]** - Cantitate (ex: 5 programări noi)
- **[!]** - Alertă importantă
- **[•]** - Activitate recentă
- **[🔒]** - Necesită permisiuni speciale

## 🎨 Stilizare Meniuri

### Stare Normală
```css
.menu-item {
  color: #64748b;
  background: transparent;
  border-radius: 8px;
  padding: 12px 16px;
  margin: 2px 8px;
}
```

### Stare Hover
```css
.menu-item:hover {
  background: #f1f5f9;
  color: #1e293b;
}
```

### Stare Activă
```css
.menu-item.active {
  background: #2563eb;
  color: white;
  font-weight: 500;
}
```

### Stare Disabled
```css
.menu-item.disabled {
  color: #cbd5e1;
  cursor: not-allowed;
  opacity: 0.5;
}
```
