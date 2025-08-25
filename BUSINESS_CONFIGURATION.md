# Configurare Business Dinamică

## 🎯 Prezentare Generală

Sistemul permite încărcarea dinamică a iconiței și numelui business-ului prin variabile de mediu. Aceasta permite personalizarea rapidă a aplicației pentru cabinetul stomatologic.

## ⚙️ Configurare

### 1. Fișierul .env

Creează un fișier `.env` în directorul rădăcină al proiectului:

```env
# Demo Mode Configuration
VITE_DEMO_MODE=true

# API Configuration (for future use)
VITE_API_URL=http://localhost:3000/api

# Business Configuration
VITE_BUSINESS_NAME="Cabinetul Dr. Popescu"
VITE_BUSINESS_ICON="FaTooth"
VITE_BUSINESS_TYPE="stomatologie"
VITE_BUSINESS_ADDRESS="Strada Florilor, Nr. 15, București, Sector 1"
VITE_BUSINESS_PHONE="021 123 4567"
VITE_BUSINESS_EMAIL="contact@cabinet-popescu.ro"
VITE_BUSINESS_WEBSITE="https://cabinet-popescu.ro"
VITE_BUSINESS_HOURS="Luni-Vineri 8:00-18:00"
VITE_BUSINESS_DESCRIPTION="Cabinet stomatologic modern cu tehnologii de ultimă generație"

# App Configuration
VITE_APP_VERSION="1.0.0"
```

### 2. Iconițe Disponibile

Sistemul suportă următoarea iconiță:

#### Stomatologie
- `FaTooth` - Iconița pentru cabinete stomatologice

## 🔧 Utilizare în Cod

### 1. Hook pentru Configurare

```javascript
import { useBusinessConfig } from '../config/businessConfig'

const MyComponent = () => {
  const { businessName, BusinessIcon, businessType, address, phone, email } = useBusinessConfig()
  
  return (
    <div>
      <h1>
        <BusinessIcon className="h-6 w-6" />
        {businessName}
      </h1>
      <p>{address}</p>
      <p>{phone}</p>
      <p>{email}</p>
    </div>
  )
}
```

### 2. Funcții Utilitare

```javascript
import { getBusinessIcon, getBusinessName, getBusinessConfig } from '../config/businessConfig'

// Obține iconița
const BusinessIcon = getBusinessIcon('FaHeartbeat')

// Obține numele
const name = getBusinessName()

// Obține întreaga configurație
const config = getBusinessConfig()
```

### 3. Încărcare Dinamică a Iconițelor

```javascript
import { availableIcons } from '../config/businessConfig'

// Verifică dacă o iconiță există
if (availableIcons['FaTooth']) {
  const IconComponent = availableIcons['FaTooth']
  return <IconComponent />
}
```

## 📱 Exemplu de Configurare

### Cabinet Stomatologic
```env
VITE_BUSINESS_NAME="Cabinetul Dr. Popescu"
VITE_BUSINESS_ICON="FaTooth"
VITE_BUSINESS_TYPE="stomatologie"
```

## 🚀 Implementare

### 1. În Navbar
Iconița și numele business-ului sunt afișate automat în navbar-ul aplicației.

### 2. În Titlul Paginii
Titlul paginii se actualizează automat cu numele business-ului.

### 3. În Componente
Orice componentă poate folosi hook-ul `useBusinessConfig` pentru a accesa informațiile business-ului.

## 🔄 Actualizare Dinamică

Pentru a schimba configurația:

1. Modifică variabilele din fișierul `.env`
2. Repornește aplicația cu `npm run dev`
3. Modificările vor fi vizibile imediat

## ⚠️ Note Importante

- Toate variabilele de mediu trebuie să înceapă cu `VITE_` pentru a fi accesibile în aplicație
- Sistemul folosește `FaTooth` ca iconiță pentru cabinetul stomatologic
- Configurația se încarcă la pornirea aplicației
- Pentru modificări în timpul rulării, este necesară repornirea aplicației
