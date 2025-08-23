# Standardized Drawer Components

Această componentă oferă o structură standardizată pentru toate drawer-ele din aplicație, folosind CVA (Class Variance Authority) pentru stilizare consistentă.

## Componente

### Drawer
Componenta principală care înfășoară întregul drawer.

```jsx
import { Drawer } from '../ui/drawer'

<Drawer onClose={handleClose} size="default">
  {/* Conținut drawer */}
</Drawer>
```

**Props:**
- `onClose`: Funcție pentru închiderea drawer-ului
- `size`: Dimensiunea drawer-ului (`default`, `lg`, `xl`)
- `className`: Clase CSS suplimentare

### DrawerHeader
Header-ul drawer-ului cu titlu, subtitlu și buton de închidere.

```jsx
import { DrawerHeader } from '../ui/drawer'

<DrawerHeader
  title="Titlu Drawer"
  subtitle="Subtitlu opțional"
  onClose={handleClose}
  variant="default"
/>
```

**Props:**
- `title`: Titlul drawer-ului
- `subtitle`: Subtitlul opțional
- `onClose`: Funcție pentru închidere
- `variant`: Variantă de stil (`default`, `elevated`)

### DrawerNavigation
Navigația cu tab-uri pentru drawer-uri cu multiple secțiuni.

```jsx
import { DrawerNavigation } from '../ui/drawer'

const navigationItems = [
  { id: 1, label: 'Detalii', icon: User },
  { id: 2, label: 'Setări', icon: Settings, disabled: false }
]

<DrawerNavigation
  items={navigationItems}
  activeItem={currentMenu}
  onItemChange={setCurrentMenu}
  variant="default"
/>
```

**Props:**
- `items`: Array de obiecte cu `id`, `label`, `icon` (opțional), `disabled` (opțional)
- `activeItem`: ID-ul elementului activ
- `onItemChange`: Funcție pentru schimbarea elementului activ
- `variant`: Variantă de stil (`default`, `tabs`)

### DrawerContent
Zona de conținut scrollabilă.

```jsx
import { DrawerContent } from '../ui/drawer'

<DrawerContent padding="default">
  {/* Conținutul drawer-ului */}
</DrawerContent>
```

**Props:**
- `padding`: Padding-ul conținutului (`default`, `compact`, `spacious`)
- `children`: Conținutul drawer-ului

### DrawerFooter
Footer-ul cu acțiuni (butoane).

```jsx
import { DrawerFooter } from '../ui/drawer'

<DrawerFooter variant="default">
  <div className="flex gap-2">
    <button className="btn btn-outline">Anulează</button>
    <button className="btn btn-primary">Salvează</button>
  </div>
</DrawerFooter>
```

**Props:**
- `variant`: Variantă de stil (`default`, `elevated`)
- `children`: Butoanele de acțiune

## Structura Standardizată

Toate drawer-ele urmează aceeași structură:

1. **Header** - Titlu, subtitlu, buton închidere
2. **Navigation** (opțional) - Tab-uri pentru multiple secțiuni
3. **Content** - Zona scrollabilă cu formular/conținut
4. **Footer** - Butoane de acțiune (Salvează, Anulează, Șterge)

## Exemplu Complet

```jsx
import React, { useState } from 'react'
import { 
  Drawer, 
  DrawerHeader, 
  DrawerNavigation, 
  DrawerContent, 
  DrawerFooter 
} from '../ui/drawer'
import { User, Settings } from 'lucide-react'

const MyDrawer = ({ isOpen, onClose }) => {
  const [currentMenu, setCurrentMenu] = useState(1)

  const navigationItems = [
    { id: 1, label: 'Profil', icon: User },
    { id: 2, label: 'Setări', icon: Settings }
  ]

  return (
    <Drawer onClose={onClose}>
      <DrawerHeader
        title="Editare Utilizator"
        subtitle="Modifică informațiile utilizatorului"
        onClose={onClose}
      />
      
      <DrawerNavigation
        items={navigationItems}
        activeItem={currentMenu}
        onItemChange={setCurrentMenu}
      />
      
      <DrawerContent>
        {/* Conținutul formularului */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nume</label>
            <input type="text" className="input" />
          </div>
        </div>
      </DrawerContent>
      
      <DrawerFooter>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn btn-outline">
            Anulează
          </button>
          <button className="btn btn-primary">
            Salvează
          </button>
        </div>
      </DrawerFooter>
    </Drawer>
  )
}
```

## Variante CVA

Componentele folosesc CVA pentru stilizare consistentă:

- **Size**: `default`, `lg`, `xl`
- **Variant**: `default`, `elevated`, `tabs`
- **Padding**: `default`, `compact`, `spacious`

## Beneficii

1. **Consistență** - Toate drawer-ele au același aspect și comportament
2. **Mentenabilitate** - Modificările se aplică global
3. **Reutilizare** - Componente modulare și reutilizabile
4. **Accesibilitate** - Structură semantică corectă
5. **Responsive** - Adaptare automată la diferite dimensiuni de ecran
