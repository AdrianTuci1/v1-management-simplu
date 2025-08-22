# Dashboard Business - Ecrane Inițiale

## 🎯 Structura Generală

Dashboard-ul va avea următoarea structură de bază:
- **Navbar** - Header cu logo, notificări, profil utilizator
- **Sidebar** - Meniu principal de navigare
- **Content** - Zona principală de conținut
- **Drawer** - Panou lateral pentru detalii/adăugare

## 📱 Ecranele Principale

### 1. Dashboard Home
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🏢 Business Dashboard                    [🔔] [👤 Admin User ▼]          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 📊 OPERAȚIUNI                    │ 📈 BUSINESS                             │
│ ┌─────────────────────────────┐  │ ┌─────────────────────────────────────┐ │
│ │ 📅 Programări Astăzi: 12    │  │ │ 💰 Vânzări Luna: 45,230 RON        │ │
│ │ 👥 Clienți Activi: 89       │  │ │ 📦 Produse în Stoc: 156            │ │
│ │ 📋 Sarcini În Așteptare: 8  │  │ │ 🔄 Tranzacții Recente: 23          │ │
│ └─────────────────────────────┘  │ └─────────────────────────────────────┘ │
│                                  │                                         │
│ 💳 FINANCIAR                     │ 📊 ANALIZE                             │
│ ┌─────────────────────────────┐  │ ┌─────────────────────────────────────┐ │
│ │ 🧾 Facturi Neplătite: 15    │  │ │ 📈 Creștere Vânzări: +12%          │ │
│ │ 💰 Încasări Luna: 38,450    │  │ │ 📊 Top Produse: Obturații (23)     │ │
│ │ 📊 Profit Lunar: 12,340     │  │ │ 🎯 Obiective Atinse: 85%           │ │
│ └─────────────────────────────┘  │ └─────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Operațiuni - Planificare
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📅 Planificare › Calendar                                    [+ Programare] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ [<] Ianuarie 2024 [>]                    [📅 Zi] [📅 Săptămână] [📅 Lună] │
│                                                                             │
│ ┌─ Calendar Grid ─────────────────────────────────────────────────────────┐ │
│ │ L   M   Mi  J   V   S   D                                              │ │
│ │ 1   2   3   4   5   6   7                                              │ │
│ │ 8   9   10  11  12  13  14                                             │ │
│ │ 15  16  17  18  19  20  21                                             │ │
│ │ 22  23  24  25  26  27  28                                             │ │
│ │ 29  30  31                                                             │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─ Programări Astăzi ─────────────────────────────────────────────────────┐ │
│ │ 09:00 - Ion Marinescu - Control de rutină                    [✓] [✏️]  │ │
│ │ 11:30 - Maria Gheorghiu - Obturație                          [✓] [✏️]  │ │
│ │ 14:00 - Andrei Stoica - Detartraj                            [⏳] [✏️]  │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3. Operațiuni - Persoane
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 👥 Persoane › Clienți                                        [+ Client Nou] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 🔍 [Caută clienți...]  📊 Total: 89  [⚙️ Filtre] [📤 Export]              │
│                                                                             │
│ ┌─ Lista Clienți ─────────────────────────────────────────────────────────┐ │
│ │                                                                         │ │
│ │ 👤 Marinescu Ion                    📞 0723456789    💳 Sold: 250 RON   │ │
│ │    Ultima vizită: 12 Ian 2024  | Următoarea: 15 Ian 2024              │ │
│ │    [👁️ Vezi] [📅 Programează] [💳 Facturare] [✏️ Editează]            │ │
│ │                                                                         │ │
│ │ 👤 Gheorghiu Maria                  📞 0745123456    💳 Sold: 0 RON     │ │
│ │    Ultima vizită: 10 Ian 2024  | Următoarea: Neprogramată             │ │
│ │    [👁️ Vezi] [📅 Programează] [💳 Facturare] [✏️ Editează]            │ │
│ │                                                                         │ │
│ │ 👤 Stoica Andrei                    📞 0756789123    💳 Sold: 1200 RON  │ │
│ │    Ultima vizită: 08 Ian 2024  | Următoarea: 15 Ian 2024              │ │
│ │    [👁️ Vezi] [📅 Programează] [💳 Facturare] [✏️ Editează]            │ │
│ │                                                                         │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4. Business - Vânzări
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📈 Business › Vânzări                                      [+ Tranzacție]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 📊 Perioada: Ianuarie 2024  💰 Total: 45,230 RON  📈 +12% vs Dec          │
│                                                                             │
│ ┌─ Vânzări Recente ───────────────────────────────────────────────────────┐ │
│ │                                                                         │ │
│ │ 🦷 Obturație compusă           📅 15 Ian    👤 Marinescu I.    350 RON │ │
│ │ 🧹 Detartraj profesional       📅 15 Ian    👤 Stoica A.       180 RON │ │
│ │ 💎 Albire dentară              📅 14 Ian    👤 Radu E.         450 RON │ │
│ │ 🔧 Implanturi dentare          📅 14 Ian    👤 Dumitrescu M.  2500 RON │ │
│ │ 🦷 Control de rutină           📅 13 Ian    👤 Pop C.          120 RON │ │
│ │                                                                         │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─ Top Servicii Luna ─────────────────────────────────────────────────────┐ │
│ │ 1. 🦷 Obturații (23)           8,050 RON   ████████████░░░░ 78%        │ │
│ │ 2. 🧹 Detartraj (18)           3,240 RON   ██████░░░░░░░░░░ 31%        │ │
│ │ 3. 💎 Albire (8)               3,600 RON   █████░░░░░░░░░░░ 35%        │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5. Financiar - Facturare
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 💳 Financiar › Facturare                                     [+ Factură]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 📊 Luna: Ianuarie 2024  💰 Total: 38,450 RON  📈 +8% vs Dec               │
│                                                                             │
│ ┌─ Facturi Recente ───────────────────────────────────────────────────────┐ │
│ │                                                                         │ │
│ │ #2024-001    Marinescu Ion        📅 15 Ian    💰 350 RON    [✓] Plătit │ │
│ │ #2024-002    Stoica Andrei        📅 15 Ian    💰 180 RON    [✓] Plătit │ │
│ │ #2024-003    Radu Elena           📅 14 Ian    💰 450 RON    [⏳] În așteptare │ │
│ │ #2024-004    Dumitrescu Mihai     📅 14 Ian    💰 2500 RON   [❌] Neplătit │ │
│ │ #2024-005    Pop Constantin       📅 13 Ian    💰 120 RON    [✓] Plătit │ │
│ │                                                                         │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─ Statistici Plăți ─────────────────────────────────────────────────────┐ │
│ │ 💰 Plătite: 32,450 RON (84%)    ⏳ În așteptare: 4,500 RON (12%)       │ │
│ │ ❌ Neplătite: 1,500 RON (4%)    📈 Rata de încasare: 96%               │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6. Analize - Rapoarte
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📊 Analize › Rapoarte                                        [📤 Export]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 📅 Perioada: Ianuarie 2024  [📅 Schimbă Perioada]  [⚙️ Configurare]       │
│                                                                             │
│ ┌─ KPI Principal ─────────────────────────────────────────────────────────┐ │
│ │                                                                         │ │
│ │ 💰 Venituri Luna: 45,230 RON    📈 +12% vs Dec    🎯 95% din obiectiv  │ │
│ │ 👥 Clienți Noi: 23              📈 +8% vs Dec     🎯 110% din obiectiv │ │
│ │ 📅 Programări: 156              📈 +15% vs Dec    🎯 98% din obiectiv  │ │
│ │ ⭐ Satisfacție: 4.8/5           📈 +0.2 vs Dec    🎯 105% din obiectiv │ │
│ │                                                                         │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─ Grafice ───────────────────────────────────────────────────────────────┐ │
│ │                                                                         │ │
│ │ 📈 Evoluția Vânzărilor (Ultimele 6 luni)                               │ │
│ │ [GRAFIC LINIE]                                                          │ │
│ │                                                                         │ │
│ │ 📊 Distribuția Serviciilor (Luna curentă)                              │ │
│ │ [GRAFIC PIE]                                                            │ │
│ │                                                                         │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🎨 Design System

### Culori
- **Primary**: Albastru profesional (#2563eb)
- **Secondary**: Gri neutru (#64748b)
- **Success**: Verde (#10b981)
- **Warning**: Portocaliu (#f59e0b)
- **Error**: Roșu (#ef4444)
- **Background**: Alb (#ffffff)
- **Surface**: Gri deschis (#f8fafc)

### Tipografie
- **Heading 1**: 24px, Bold
- **Heading 2**: 20px, Semi-bold
- **Heading 3**: 18px, Medium
- **Body**: 14px, Regular
- **Caption**: 12px, Regular

### Spațiere
- **XS**: 4px
- **S**: 8px
- **M**: 16px
- **L**: 24px
- **XL**: 32px
- **XXL**: 48px

### Border Radius
- **S**: 4px
- **M**: 8px
- **L**: 12px
- **XL**: 16px

## 📱 Responsive Design

### Desktop (1200px+)
- Sidebar fixă, 260px lățime
- Content fluid
- Drawer opțional

### Tablet (768px - 1199px)
- Sidebar colapsibilă
- Content adaptat
- Drawer overlay

### Mobile (< 768px)
- Sidebar în drawer
- Content full-width
- Bottom navigation pentru acțiuni rapide
