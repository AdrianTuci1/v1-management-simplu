# Sistemul de Stacking pentru Drawere

## Descriere

Sistemul permite deschiderea drawerelor unul peste altul (stacking) cu un indicator vizual care arată toate drawerele deschise.

## Funcționalități

### 1. Stacking de Drawere
- Drawerele se deschid unul peste altul
- Când închizi un drawer, se revine la cel anterior
- Indicatorul arată toate drawerele din stivă

### 2. Indicator Vizual
- Afișează numărul de drawere deschise
- Lista cu toate drawerele din stivă
- Butoane pentru închiderea ultimului drawer sau a tuturor

### 3. Gestionare prin Zustand
- Stiva de drawere este gestionată prin Zustand store
- State-ul este persistent și reactiv
- Funcții pentru manipularea stivei

## Utilizare

### Deschiderea Drawerelor în Stivă

```javascript
import { useDrawer } from './contexts/DrawerContext'

function MyComponent() {
  const { openDrawer, openTreatmentDrawer, openAIAssistantDrawer } = useDrawer()
  
  const handleOpenMultipleDrawers = () => {
    // Deschide primul drawer
    openDrawer({ type: 'treatment', isNew: true })
    
    // Deschide al doilea drawer (se va stiva peste primul)
    openDrawer({ type: 'ai-assistant' })
    
    // Deschide al treilea drawer
    openDrawer({ type: 'user' })
  }
  
  return (
    <button onClick={handleOpenMultipleDrawers}>
      Deschide mai multe drawere
    </button>
  )
}
```

### Verificarea Stivei

```javascript
import { useDrawer } from './contexts/DrawerContext'

function MyComponent() {
  const { getStackInfo, getStackSize, hasDrawers } = useDrawer()
  
  const stackInfo = getStackInfo()
  
  return (
    <div>
      <p>Drawere deschise: {getStackSize()}</p>
      <p>Are drawere: {hasDrawers() ? 'Da' : 'Nu'}</p>
      <p>Drawer curent: {stackInfo.currentDrawer?.type}</p>
    </div>
  )
}
```

### Gestionarea Directă a Stivei

```javascript
import { useDrawerStackStore } from './stores/drawerStackStore'

function MyComponent() {
  const { 
    drawerStack, 
    getStackSize, 
    clearStack, 
    removeDrawer 
  } = useDrawerStackStore()
  
  const handleClearAll = () => {
    clearStack()
  }
  
  const handleRemoveSpecific = (id) => {
    removeDrawer(id)
  }
  
  return (
    <div>
      <p>Stiva are {getStackSize()} drawere</p>
      <button onClick={handleClearAll}>Șterge toate</button>
      
      {drawerStack.map(drawer => (
        <div key={drawer.id}>
          {drawer.type}
          <button onClick={() => handleRemoveSpecific(drawer.id)}>
            Șterge
          </button>
        </div>
      ))}
    </div>
  )
}
```

## Comportament

### Deschiderea Drawerelor
1. Când deschizi un drawer, se adaugă în stivă
2. Drawer-ul devine activ (vizibil)
3. Drawerele anterioare rămân în stivă

### Închiderea Drawerelor
1. Când închizi un drawer, se elimină din stivă
2. Se revine la drawer-ul anterior (dacă există)
3. Dacă nu mai există drawere, se închide complet

### Indicatorul de Stivă
- Apare în colțul din dreapta sus
- Afișează numărul de drawere
- Lista cu toate drawerele din stivă
- Butoane pentru gestionarea stivei

## Tipuri de Drawere Suportate

- `user` - Informații utilizator
- `quick-actions` - Acțiuni rapide
- `appointment` - Programări
- `new-person` - Pacient nou
- `edit-person` - Editare pacient
- `product` - Produse
- `medic` - Medici
- `treatment` - Tratamente
- `role` - Roluri
- `new-sale` - Vânzare nouă
- `working-hours` - Ore de lucru
- `currency-tax` - Monedă și taxe
- `language` - Limba
- `cash-register` - Casa de marcat
- `data-download` - Descărcare date
- `stripe-payment` - Plata Stripe
- `ai-assistant` - AI Assistant

## Avantaje

1. **Experiență utilizator îmbunătățită**: Utilizatorul poate deschide mai multe drawere
2. **Navigare intuitivă**: Închiderea unui drawer revine la cel anterior
3. **Vizibilitate**: Indicatorul arată toate drawerele deschise
4. **Control**: Utilizatorul poate gestiona stiva de drawere
5. **Performanță**: Zustand oferă gestionare eficientă a state-ului

## Testare

Pentru a testa funcționalitatea:

1. Deschide mai multe drawere folosind `openDrawer()`
2. Verifică indicatorul din colțul din dreapta sus
3. Închide drawerele unul câte unul
4. Observă cum se revine la drawer-ul anterior
5. Testează butoanele din indicator pentru gestionarea stivei
