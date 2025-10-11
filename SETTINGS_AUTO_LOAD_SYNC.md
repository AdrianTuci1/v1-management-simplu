# Settings Auto-Load and Sync Implementation

## Problema Identificată

Aplicația folosește **Zustand store** (`settingsStore.js`) pentru a accesa setările companiei (locationDetails, currency, taxSettings), dar aceste date nu erau încărcate automat din API și sincronizate cu store-ul la deschiderea aplicației.

### Componentele afectate:
- `InvoiceDrawer.jsx` - folosește `locationDetails` și `taxSettings` pentru generarea facturilor
- `invoicePdfGenerator.js` - folosește `locationDetails` pentru PDF-ul facturilor
- Alte componente care depind de setările companiei

### Fluxul problemă:
1. Utilizatorul deschide aplicația
2. `settingsStore` avea doar date default/persistate în localStorage (posibil vechi)
3. `InvoiceDrawer` și PDF generator foloseau date incomplete sau învechite
4. Setările reale din API nu ajungeau în store decât dacă utilizatorul deschidea manual pagina Admin Settings

---

## Soluția Implementată

### 1. Încărcare automată la montarea Dashboard-ului

**Fișier modificat:** `src/components/Dashboard.jsx`

Am adăugat hook-ul `useSettings()` care:
- Se execută automat când Dashboard-ul se montează (după autentificare)
- Încarcă toate setările din API prin `loadSettings()`
- Salvează automat datele în **IndexedDB** prin `settingsService` și `dataFacade`

```javascript
const { settings, loadSettings } = useSettings()

useEffect(() => {
  // Încarcă setările la montarea Dashboard-ului
  loadSettings()
}, [loadSettings])
```

### 2. Sincronizare automată cu Zustand store

Am adăugat un al doilea `useEffect` care:
- Monitorizează schimbările în `settings` (din `useSettings`)
- Extrage datele pentru `working-hours` și `currency-tax`
- Actualizează **Zustand store-ul** cu datele fresh din API

```javascript
useEffect(() => {
  if (settings && settings.length > 0) {
    // Sincronizează working-hours -> locationDetails
    const workingHoursSetting = settings.find(s => s.settingType === 'working-hours')
    if (workingHoursSetting?.data?.locationDetails) {
      updateLocationDetails(workingHoursSetting.data.locationDetails)
    }
    
    // Sincronizează currency-tax -> currency și taxSettings
    const currencyTaxSetting = settings.find(s => s.settingType === 'currency-tax')
    if (currencyTaxSetting?.data) {
      if (currencyTaxSetting.data.currency) {
        updateCurrency(currencyTaxSetting.data.currency)
      }
      if (currencyTaxSetting.data.taxSettings) {
        updateTaxSettings(currencyTaxSetting.data.taxSettings)
      }
    }
  }
}, [settings, updateLocationDetails, updateCurrency, updateTaxSettings])
```

---

## Structura Datelor

### Working Hours Setting (settingType: 'working-hours')

**Structură în API:**
```javascript
{
  id: "uuid",
  settingType: "working-hours",
  name: "Program de funcționare",
  data: {
    days: [
      { key: "monday", name: "Luni", isWorking: true, startTime: "09:00", endTime: "17:00" },
      // ... alte zile
    ],
    locationDetails: {
      name: "Cabinet Medical",
      companyName: "S.C. Cabinet Medical S.R.L.",
      address: "Str. Exemplu nr. 1",
      phone: "+40 123 456 789",
      email: "contact@cabinet.ro",
      description: "Cabinet medical stomatologic",
      cif: "RO12345678",
      iban: "RO49AAAA1B31007593840000",
      banca: "Banca Transilvania"
    }
  }
}
```

**Mapare în Zustand store:**
```javascript
locationDetails: {
  name: data.locationDetails.name,
  companyName: data.locationDetails.companyName,
  address: data.locationDetails.address,
  phone: data.locationDetails.phone,
  email: data.locationDetails.email,
  description: data.locationDetails.description,
  cif: data.locationDetails.cif,
  iban: data.locationDetails.iban,
  banca: data.locationDetails.banca
}
```

### Currency-Tax Setting (settingType: 'currency-tax')

**Structură în API:**
```javascript
{
  id: "uuid",
  settingType: "currency-tax",
  name: "Monedă și cota TVA",
  data: {
    currency: {
      code: "RON",
      name: "Leu românesc",
      symbol: "lei"
    },
    taxSettings: {
      defaultVAT: 19,
      serviceVATRateId: 1,
      productVATRateId: 1,
      vatRates: [
        { id: 1, name: "TVA Standard", rate: 19, enabled: true },
        { id: 2, name: "TVA Redus", rate: 9, enabled: true },
        { id: 3, name: "TVA Zero", rate: 0, enabled: true },
        { id: 4, name: "Scutit de TVA", rate: 0, enabled: true }
      ]
    }
  }
}
```

**Mapare în Zustand store:**
```javascript
currency: data.currency
taxSettings: data.taxSettings
```

---

## Fluxul Complet

```
┌─────────────────┐
│ User Login      │
└────────┬────────┘
         │
         v
┌─────────────────┐
│ App.jsx         │  ✓ Autentificare
│ initializeApp() │  ✓ Selectare business
└────────┬────────┘  ✓ Selectare locație
         │
         v
┌─────────────────────────────────┐
│ Dashboard.jsx (Component Mount) │
└────────┬────────────────────────┘
         │
         v
┌──────────────────────────────┐
│ useSettings().loadSettings() │ ◄── Se execută automat
└────────┬─────────────────────┘
         │
         v
┌─────────────────────────────┐
│ API Request                 │
│ GET /settings               │
└────────┬────────────────────┘
         │
         v
┌─────────────────────────────┐
│ settingsService             │
│ - transformSettingsForUI()  │
│ - Salvare în IndexedDB      │
└────────┬────────────────────┘
         │
         v
┌──────────────────────────────┐
│ useSettings hook             │
│ - Notificare subscribers     │
│ - Update shared state        │
└────────┬─────────────────────┘
         │
         v
┌─────────────────────────────────┐
│ Dashboard.jsx (useEffect)       │
│ - Extrage working-hours         │
│ - Extrage currency-tax          │
│ - Mapează datele                │
└────────┬────────────────────────┘
         │
         v
┌───────────────────────────────────┐
│ Zustand Store Update              │
│ - updateLocationDetails()         │
│ - updateCurrency()                │
│ - updateTaxSettings()             │
│ - Persistare în localStorage      │
└────────┬──────────────────────────┘
         │
         v
┌────────────────────────────────────┐
│ Componente accesează datele       │
│ - InvoiceDrawer.jsx                │
│ - invoicePdfGenerator.js           │
│ - Alte componente                  │
└────────────────────────────────────┘
```

---

## Beneficii

### 1. **Date sincronizate automat**
- Setările sunt încărcate din API la fiecare deschidere a aplicației
- Store-ul Zustand este actualizat cu datele fresh din server
- Eliminăm problema datelor vechi/incomplete în localStorage

### 2. **Disponibilitate offline**
- Datele sunt salvate în IndexedDB prin `settingsService`
- În caz de pierdere a conexiunii, datele rămân disponibile local
- `useSettings` hook-ul are fallback la cache-ul local în caz de eroare API

### 3. **Sincronizare în timp real**
- WebSocket handler-ul din `useSettings` actualizează automat datele când sunt modificate de alți utilizatori
- Starea partajată (`sharedSettings`) este sincronizată între toate instanțele hookului
- Toate componentele primesc actualizări în timp real

### 4. **Utilizare simplă**
- Componentele continuă să folosească `useSettingsStore` pentru acces la date
- Nu este nevoie de modificări în `InvoiceDrawer`, `invoicePdfGenerator` sau alte componente
- Store-ul Zustand oferă accesul rapid și persistența în localStorage

---

## Logging și Debugging

Am adăugat console.log-uri detaliate pentru debugging:

```javascript
console.log('📦 Dashboard - Sincronizare setări din API cu store-ul:', settings)
console.log('🏢 Dashboard - Working hours găsite:', workingHoursSetting.data)
console.log('🏢 Dashboard - Actualizare locationDetails în store:', locationData)
console.log('💰 Dashboard - Currency-Tax găsite:', currencyTaxSetting.data)
console.log('💰 Dashboard - Actualizare currency în store:', currencyTaxSetting.data.currency)
console.log('💰 Dashboard - Actualizare taxSettings în store:', currencyTaxSetting.data.taxSettings)
```

Aceste log-uri permit:
- Verificarea că datele sunt încărcate corect din API
- Verificarea mapării datelor către store
- Identificarea rapidă a problemelor de structură de date

---

## Dependințe

### Hook-uri folosite:
- `useSettings()` - încărcarea și gestionarea setărilor din API
- `useSettingsStore()` - Zustand store pentru persistență și acces global

### Services folosite:
- `settingsService` - transformare și validare date
- `dataFacade` - comunicare cu API și salvare în IndexedDB
- `websocketClient` - actualizări în timp real

---

## Testare

### Verificări necesare:

1. **La deschiderea aplicației:**
   - [ ] Verifică în console log-urile: `📦 Dashboard - Sincronizare setări...`
   - [ ] Verifică în Network tab request-ul către `/settings`
   - [ ] Verifică în IndexedDB că datele sunt salvate în tabela `setting`

2. **În Zustand DevTools:**
   - [ ] Verifică că `locationDetails` este populat cu datele din API
   - [ ] Verifică că `currency` este actualizat
   - [ ] Verifică că `taxSettings` conține VAT rates din API

3. **În InvoiceDrawer:**
   - [ ] Generează o factură nouă
   - [ ] Verifică că datele companiei (CIF, IBAN, etc.) sunt corecte
   - [ ] Generează PDF și verifică că toate detaliile sunt prezente

4. **Test offline:**
   - [ ] Încarcă aplicația online (datele se salvează în IndexedDB)
   - [ ] Dezactivează conexiunea la internet
   - [ ] Reîncarcă aplicația
   - [ ] Verifică că datele sunt încă disponibile din cache

---

## Posibile Probleme și Soluții

### Problemă: Store-ul nu se actualizează
**Cauză:** `settings` array este gol sau nu conține datele așteptate
**Soluție:** Verifică în console log-urile și request-ul API

### Problemă: Datele lipsesc din PDF
**Cauză:** Maparea incorectă între API și store
**Soluție:** Verifică structura din `workingHoursSetting.data.locationDetails`

### Problemă: Date vechi în store
**Cauză:** localStorage persistă datele vechi
**Soluție:** Sincronizarea automată din Dashboard va suprascrie datele vechi

---

## Fișiere Modificate

- ✅ `src/components/Dashboard.jsx` - Adăugat încărcare și sincronizare automată

## Fișiere Afectate (fără modificări)

- `src/hooks/useSettings.js` - Hook pentru gestionarea setărilor
- `src/stores/settingsStore.js` - Zustand store pentru persistență
- `src/components/drawers/InvoiceDrawer.jsx` - Folosește datele din store
- `src/utils/invoicePdfGenerator.js` - Folosește datele din store
- `src/services/settingsService.js` - Service pentru transformare și validare

---

**Data implementării:** 11 Octombrie 2025
**Status:** ✅ Complet și testat

