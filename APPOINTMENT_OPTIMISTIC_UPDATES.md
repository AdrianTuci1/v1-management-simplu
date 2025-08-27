# Sistemul de Optimistic Updates pentru Programări

## Prezentare generală

Sistemul de optimistic updates pentru programări permite utilizatorului să vadă imediat rezultatele acțiunilor sale înainte ca acestea să fie confirmate de server, oferind o experiență de utilizare mai fluidă și responsivă. Implementarea urmează exact același pattern ca cel folosit pentru pacienți.

## Cum funcționează

### 1. Crearea unei programări noi

Când un utilizator adaugă o programare nouă:

1. **Validare**: Se validează datele folosind `appointmentManager.validateAppointment()`
2. **Transformare**: Datele sunt transformate pentru API folosind `appointmentManager.transformAppointmentForAPI()`
3. **Generare ID temporar**: Se generează un ID temporar unic (`temp_${timestamp}_${random}`)
4. **Optimistic update**: Programarea este adăugată imediat în `sharedAppointments` cu:
   - `_tempId`: ID-ul temporar generat
   - `_isOptimistic: true`: Flag pentru a indica că este o actualizare optimistă
   - `id`: Setat la ID-ul temporar pentru afișare
5. **Notificare subscribers**: Toți subscriberii sunt notificați pentru actualizare imediată
6. **Trimitere la server**: Se trimite cererea către server prin `appointmentService.addAppointment()`
7. **ResourceRepository**: Gestionează automat optimistic entries în IndexedDB și outbox
8. **Confirmare prin WebSocket**: Când serverul confirmă crearea, se primește un mesaj WebSocket
9. **Reconciliere**: Programarea optimistă este înlocuită cu datele reale de la server

### 2. Actualizarea unei programări

Când un utilizator editează o programare:

1. **Validare**: Se validează datele folosind `appointmentManager.validateAppointment()`
2. **Transformare**: Datele sunt transformate pentru API
3. **Optimistic update**: Programarea este actualizată imediat în `sharedAppointments` cu:
   - `_isOptimistic: true`: Flag pentru a indica că este o actualizare optimistă
   - Datele modificate sunt aplicate
4. **Notificare subscribers**: Toți subscriberii sunt notificați
5. **Trimitere la server**: Se trimite cererea de actualizare către server
6. **ResourceRepository**: Gestionează optimistic entries automat
7. **Confirmare prin WebSocket**: Când serverul confirmă actualizarea, se primește un mesaj WebSocket
8. **Dezactivare optimistic**: Flag-ul `_isOptimistic` este setat la `false`

### 3. Ștergerea unei programări

Când un utilizator șterge o programare:

1. **Optimistic update**: Programarea este marcată pentru ștergere cu:
   - `_isOptimistic: true`: Flag pentru a indica că este o actualizare optimistă
   - `_isDeleting: true`: Flag pentru a indica că este în proces de ștergere
2. **Notificare subscribers**: Toți subscriberii sunt notificați
3. **Trimitere la server**: Se trimite cererea de ștergere către server
4. **ResourceRepository**: Gestionează optimistic entries automat
5. **Confirmare prin WebSocket**: Când serverul confirmă ștergerea, programarea este eliminată din `sharedAppointments`

## Implementare tehnică

### Shared State și Subscribers

```javascript
// Shared state pentru toate instanțele
let sharedAppointments = []
let sharedAppointmentsCount = {}
let subscribers = new Set()

// Funcție pentru notificarea subscriberilor
function notifySubscribers() {
  console.log('Notifying appointment subscribers. Count:', subscribers.size, 'Appointments count:', sharedAppointments.length)
  subscribers.forEach(cb => cb([...sharedAppointments]))
}
```

### Hook-ul useAppointments

```javascript
export const useAppointments = () => {
  const [appointments, setAppointments] = useState(sharedAppointments)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [appointmentsCount, setAppointmentsCount] = useState(sharedAppointmentsCount)

  // Subscribe la actualizări
  useEffect(() => {
    // Initialize from shared state and subscribe to updates
    setAppointments([...sharedAppointments])
    setAppointmentsCount(sharedAppointmentsCount)
    
    // Adaugă subscriber pentru actualizări
    const subscriber = (newAppointments) => {
      console.log('Appointment subscriber called with appointments count:', newAppointments.length)
      setAppointments(newAppointments)
    }
    subscribers.add(subscriber)
    const unsub = () => subscribers.delete(subscriber)
    
    // Subscribe la actualizări prin websocket
    const handler = async (message) => {
      // ... handler logic
    }
    
    const unsubPlural = onResourceMessage('appointments', handler)
    const unsubSingular = onResourceMessage('appointment', handler)
    
    return () => { 
      unsubPlural(); 
      unsubSingular(); 
      unsub() 
    }
  }, [])
}
```

### Adăugare programare cu optimistic update

```javascript
const addAppointment = useCallback(async (appointmentData) => {
  setError(null)
  
  // Validare
  appointmentManager.validateAppointment(appointmentData)
  
  // Transformare pentru API
  const apiData = appointmentManager.transformAppointmentForAPI(appointmentData)
  
  // Generare ID temporar pentru optimistic update
  const tempId = generateTempId()
  const optimisticAppointment = {
    ...appointmentManager.transformAppointmentForUI(apiData),
    _tempId: tempId,
    _isOptimistic: true,
    id: tempId // Folosim tempId ca ID pentru optimistic update
  }
  
  // Adaugă programarea optimistă în shared state
  sharedAppointments = [optimisticAppointment, ...sharedAppointments]
  setAppointments([...sharedAppointments])
  notifySubscribers()
  
  try {
    const newAppointment = await appointmentService.addAppointment(apiData)
    return newAppointment
  } catch (err) {
    // În caz de eroare, elimină programarea optimistă
    sharedAppointments = sharedAppointments.filter(a => a._tempId !== tempId)
    setAppointments([...sharedAppointments])
    notifySubscribers()
    
    setError(err.message)
    console.error('Error adding appointment:', err)
    throw err
  }
}, [])
```

### Gestionarea mesajelor WebSocket

```javascript
const handler = async (message) => {
  const { type, data, resourceType } = message
  
  console.log('WebSocket message received:', { type, resourceType, data })
  
  // Verifică dacă este pentru programări
  if (resourceType !== 'appointment') return
  
  // Extrage operația din tipul mesajului
  const operation = type?.replace('resource_', '') || 'unknown'
  const appointmentId = data?.id
  
  console.log('Processing appointment operation:', { operation, appointmentId })
  
  if (!appointmentId) return
  
  // Procesează operația
  if (operation === 'created') {
    const ui = appointmentManager.transformAppointmentForUI({ ...data, id: appointmentId, resourceId: appointmentId })
    
    // Actualizează IndexedDB cu datele reale
    await indexedDb.put('appointments', { ...ui, _isOptimistic: false })
    
    // Caută în outbox pentru a găsi operația optimistă
    const outboxEntry = await indexedDb.outboxFindByTempId(appointmentId)
    
    if (outboxEntry) {
      // Găsește programarea optimistă în shared state prin tempId
      const optimisticIndex = sharedAppointments.findIndex(a => a._tempId === outboxEntry.tempId)
      
      if (optimisticIndex >= 0) {
        // Înlocuiește programarea optimistă cu datele reale
        sharedAppointments[optimisticIndex] = { ...ui, _isOptimistic: false }
        console.log('Replaced optimistic appointment with real data from outbox')
      }
      
      // Șterge din outbox
      await indexedDb.outboxDelete(outboxEntry.id)
    } else {
      // Dacă nu găsește în outbox, caută prin ID normal
      const existingIndex = sharedAppointments.findIndex(a => a.id === appointmentId || a.resourceId === appointmentId)
      
      if (existingIndex >= 0) {
        // Actualizează programarea existentă
        sharedAppointments[existingIndex] = { ...ui, _isOptimistic: false }
      } else {
        // Adaugă programarea nouă
        sharedAppointments = [{ ...ui, _isOptimistic: false }, ...sharedAppointments]
      }
    }
    
    // Actualizează starea locală și notifică toți subscriberii
    console.log('Updating appointments state after CREATED operation. Current count:', sharedAppointments.length)
    setAppointments([...sharedAppointments])
    notifySubscribers()
  }
  // ... similar pentru 'updated' și 'deleted'
}
```

### Afișarea în UI

```javascript
// Sortare cu prioritizare pentru optimistic updates
const getSortedAppointments = useCallback((sortBy = 'date', sortOrder = 'asc') => {
  const baseSorted = appointmentManager.sortAppointments(sharedAppointments, sortBy, sortOrder)
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
}, [])

// Afișare cu indicatori vizuali
<div 
  key={appointment.id || appointment._tempId || index} 
  className={`flex items-center justify-between p-3 border rounded-lg ${
    appointment._isDeleting ? 'opacity-50' : ''
  }`}
>
  <div className={`font-medium ${appointment._isDeleting ? 'line-through' : ''}`}>
    {appointment.patient?.name || 'Pacient necunoscut'}
  </div>
  
  {/* Indicator pentru optimistic updates */}
  {appointment._isOptimistic && !appointment._isDeleting && (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
      <RotateCw className="h-3 w-3 mr-1 animate-spin" />
      Salvare...
    </span>
  )}
  
  {appointment._isDeleting && (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-800">
      <Trash2 className="h-3 w-3 mr-1" />
      Ștergere...
    </span>
  )}
  
  <button 
    onClick={() => openDrawer({ type: 'appointment', data: appointment })}
    className="btn btn-ghost btn-sm"
    disabled={appointment._isOptimistic}
  >
    <Edit className="h-4 w-4" />
  </button>
</div>
```

## Integrare cu ResourceRepository

`appointmentService` folosește `ResourceRepository` care oferă automat:

1. **Fallback optimist**: Pentru răspunsuri 201/202 fără body util
2. **Outbox management**: Salvare automată în outbox pentru reconciliere
3. **IndexedDB persistence**: Salvare automată în cache local
4. **Clear optimistic entries**: Curățare automată a intrărilor optimiste când sosesc date reale

## Avantaje

1. **Experiență de utilizare îmbunătățită**: Utilizatorul vede imediat rezultatele acțiunilor sale
2. **Feedback vizual**: Indicatorii vizuali arată starea operațiilor
3. **Rollback automat**: În caz de eroare, starea este restaurată automat
4. **Consistență**: Datele sunt sincronizate cu serverul prin WebSocket
5. **Sortare inteligentă**: Elementele optimiste sunt prioritizate pentru feedback instant
6. **Shared state**: Toate instanțele hook-ului sunt sincronizate automat
7. **Integrare completă**: Folosește același pattern ca pacienții pentru consistență

## Limitări

1. **Complexitate**: Sistemul este mai complex decât unul sincron simplu
2. **Gestionarea erorilor**: Trebuie să se gestioneze corect rollback-ul în caz de eroare
3. **Stare temporară**: Utilizatorul poate vedea date temporare care pot fi diferite de cele finale

## Best Practices

1. **Indicatori vizuali clari**: Folosește iconuri și culori pentru a indica starea
2. **Dezactivarea acțiunilor**: Dezactivează butoanele pentru elementele în proces
3. **Sortare inteligentă**: Prioritizează elementele optimiste pentru feedback instant
4. **Rollback robust**: Gestionează corect erorile și restaurează starea
5. **Validare înainte de optimistic update**: Validează datele înainte de a aplica optimistic updates
6. **Shared state management**: Folosește shared state pentru sincronizare între componente

## Diferențe față de sistemul pentru pacienți

1. **Transformare de date**: Programările folosesc `appointmentManager` pentru transformarea datelor
2. **Validare specifică**: Validarea programărilor include verificări pentru conflicte de programare
3. **Cache complex**: Programările au un sistem de cache mai complex cu date de lookup
4. **Sortare temporală**: Prioritizarea se face pe baza timpului, nu doar pe starea optimistă
5. **Integrare ResourceRepository**: Beneficiază de optimistic updates automat prin ResourceRepository

## Flux complet cap-coadă

1. **Drawer** (ex. `AppointmentDrawer`) apelează `addAppointment`/`updateAppointment`/`deleteAppointment`
2. **appointmentService** → **ResourceRepository**:
   - Dacă API-ul nu întoarce încă payload util, se creează intrare optimistă cu `resourceId` temporar și se scrie în IndexedDB
3. **useAppointments**:
   - Actualizează `sharedAppointments` optimist și notifică toți abonații → `OperationsPlanning.jsx` re-render imediat
4. La următorul `get/query` sau `getById`, `ResourceRepository` scrie date reale și curăță intrările temporare
5. La evenimente WebSocket (create/update/delete), `useAppointments` înlocuiește intrarea temporară cu cea finală (după `tempId` sau euristic), scrie în IndexedDB și notifică abonații
