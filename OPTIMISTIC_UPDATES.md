# Sistemul de Optimistic Updates pentru Pacienți

## Prezentare generală

Sistemul de optimistic updates permite utilizatorului să vadă imediat rezultatele acțiunilor sale înainte ca acestea să fie confirmate de server, oferind o experiență de utilizare mai fluidă și responsivă.

## Cum funcționează

### 1. Crearea unui pacient nou

Când un utilizator adaugă un pacient nou:

1. **Generare ID temporar**: Se generează un ID temporar unic (`temp_${timestamp}_${random}`)
2. **Optimistic update**: Pacientul este adăugat imediat în lista locală cu:
   - `_tempId`: ID-ul temporar generat
   - `_isOptimistic: true`: Flag pentru a indica că este o actualizare optimistă
   - `id`: Setat la ID-ul temporar pentru afișare
3. **Trimitere la server**: Se trimite cererea către server
4. **Confirmare prin WebSocket**: Când serverul confirmă crearea, se primește un mesaj WebSocket cu ID-ul real
5. **Înlocuire**: Pacientul optimist este înlocuit cu datele reale de la server

### 2. Actualizarea unui pacient

Când un utilizator editează un pacient:

1. **Optimistic update**: Pacientul este actualizat imediat în lista locală cu:
   - `_isOptimistic: true`: Flag pentru a indica că este o actualizare optimistă
   - Datele modificate sunt aplicate
2. **Trimitere la server**: Se trimite cererea de actualizare către server
3. **Confirmare prin WebSocket**: Când serverul confirmă actualizarea, se primește un mesaj WebSocket
4. **Dezactivare optimistic**: Flag-ul `_isOptimistic` este setat la `false`

### 3. Ștergerea unui pacient

Când un utilizator șterge un pacient:

1. **Optimistic update**: Pacientul este marcat pentru ștergere cu:
   - `_isOptimistic: true`: Flag pentru a indica că este o actualizare optimistă
   - `_isDeleting: true`: Flag pentru a indica că este în proces de ștergere
2. **Trimitere la server**: Se trimite cererea de ștergere către server
3. **Confirmare prin WebSocket**: Când serverul confirmă ștergerea, pacientul este eliminat din lista locală

## Implementare tehnică

### Hook-ul usePatients

```javascript
// Generare ID temporar
function generateTempId() {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Adăugare pacient cu optimistic update
const addPatient = useCallback(async (patientData) => {
  const tempId = generateTempId()
  const optimisticPatient = {
    ...patientManager.transformPatientForUI(patientData),
    _tempId: tempId,
    _isOptimistic: true,
    id: tempId
  }
  
  // Adaugă în shared state
  sharedPatients = [optimisticPatient, ...sharedPatients]
  setPatients(sharedPatients)
  notifySubscribers()
  
  // Trimitere la server
  try {
    return await patientService.addPatient(patientData)
  } catch (err) {
    // Rollback în caz de eroare
    sharedPatients = sharedPatients.filter(p => p._tempId !== tempId)
    setPatients(sharedPatients)
    notifySubscribers()
    throw err
  }
}, [])
```

### Gestionarea mesajelor WebSocket

```javascript
// Handler pentru mesaje WebSocket
const handler = async (message) => {
  const { type, data, resourceType } = message
  const operation = type?.replace('resource_', '') || 'unknown'
  const patientId = data?.id
  
  if (operation === 'created') {
    // Înlocuiește pacientul optimist cu datele reale
    const ui = patientManager.transformPatientForUI({ ...data, id: patientId, resourceId: patientId })
    
    // Caută în outbox pentru a găsi operația optimistă
    const outboxEntry = await indexedDb.outboxFindByTempId(patientId)
    
    if (outboxEntry) {
      const optimisticIndex = sharedPatients.findIndex(p => p._tempId === outboxEntry.tempId)
      if (optimisticIndex >= 0) {
        sharedPatients[optimisticIndex] = { ...ui, _isOptimistic: false }
      }
      await indexedDb.outboxDelete(outboxEntry.id)
    }
  } else if (operation === 'updated') {
    // Dezactivează flag-ul optimistic
    const existingIndex = sharedPatients.findIndex(p => p.id === patientId || p.resourceId === patientId)
    if (existingIndex >= 0) {
      sharedPatients[existingIndex] = { ...ui, _isOptimistic: false }
    }
  } else if (operation === 'deleted') {
    // Elimină pacientul din lista locală
    sharedPatients = sharedPatients.filter(p => {
      const matches = p.id === patientId || p.resourceId === patientId
      return !matches
    })
  }
}
```

### Afișarea în UI

```javascript
// Sortare cu prioritizare pentru optimistic updates
const sortedPatients = (() => {
  const baseSorted = patientManager.sortPatients(patients, sortBy, sortOrder)
  return [...baseSorted].sort((a, b) => {
    const aOpt = !!a._isOptimistic && !a._isDeleting
    const bOpt = !!b._isOptimistic && !b._isDeleting
    const aDel = !!a._isDeleting
    const bDel = !!b._isDeleting
    
    // Prioritizează optimistic updates
    if (aOpt && !bOpt) return -1
    if (!aOpt && bOpt) return 1
    
    // Pune elementele în ștergere la sfârșit
    if (aDel && !bDel) return 1
    if (!aDel && bDel) return -1
    
    return 0
  })
})()

// Afișare cu indicatori vizuali
<span className={patient._isDeleting ? 'line-through opacity-50' : ''}>
  {patient.name}
</span>
{patient._isOptimistic && !patient._isDeleting && (
  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
    <RotateCw className="h-3 w-3" />
  </span>
)}
{patient._isDeleting && (
  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-800">
    Ștergere...
  </span>
)}
```

## Avantaje

1. **Experiență de utilizare îmbunătățită**: Utilizatorul vede imediat rezultatele acțiunilor sale
2. **Feedback vizual**: Indicatorii vizuali arată starea operațiilor
3. **Rollback automat**: În caz de eroare, starea este restaurată automat
4. **Consistență**: Datele sunt sincronizate cu serverul prin WebSocket

## Limitări

1. **Complexitate**: Sistemul este mai complex decât unul sincron simplu
2. **Gestionarea erorilor**: Trebuie să se gestioneze corect rollback-ul în caz de eroare
3. **Stare temporară**: Utilizatorul poate vedea date temporare care pot fi diferite de cele finale

## Best Practices

1. **Indicatori vizuali clari**: Folosește iconuri și culori pentru a indica starea
2. **Dezactivarea acțiunilor**: Dezactivează butoanele pentru elementele în proces
3. **Sortare inteligentă**: Prioritizează elementele optimiste pentru feedback instant
4. **Rollback robust**: Gestionează corect erorile și restaurează starea
