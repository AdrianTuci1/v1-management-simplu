# Configurare Mod Demo

## Activare Mod Demo

Pentru a activa modul demo cu utilizator pre-autentificat, creează un fișier `.env` în directorul rădăcină al proiectului cu următoarea configurație:

```env
# Demo Mode Configuration
VITE_DEMO_MODE=true

# API Configuration (for future use)
VITE_API_URL=http://localhost:3000/api

# App Configuration
VITE_APP_NAME="Cabinetul Dr. Popescu"
VITE_APP_VERSION="1.0.0"
```

## Funcționalități Demo

Când `VITE_DEMO_MODE=true`:

### 1. Autentificare Automată
- Utilizatorul este automat autentificat
- Credențialele demo sunt pre-completate în formularul de login
- Nu este necesară introducerea manuală a credențialelor

### 2. Selecție Automată Locație
- Prima locație accesibilă din listă este selectată automat
- Utilizatorul poate schimba locația din sidebar-ul aplicației

### 3. Credențiale Demo
- **Email:** admin@cabinet-popescu.ro
- **Parolă:** admin123

## Locații și Permisiuni

### Locații Disponibile
1. **Sediu Central** - Strada Florilor, Nr. 15, București, Sector 1
2. **Filiala Pipera** - Bulevardul Pipera, Nr. 45, București, Sector 1
3. **Centrul Medical Militari** - Strada Militari, Nr. 123, București, Sector 6

### Sistemul de Permisiuni
- **Roluri pe Locații**: Utilizatorul poate avea roluri diferite pentru locații diferite
- **Admin**: Acces la locațiile unde are rol 'admin'
- **Manager**: Acces la locațiile unde are rol 'manager'
- **User**: Fără acces - rolul 'user' pentru o locație înseamnă că nu are acces
- **Acces Refuzat**: Dacă utilizatorul nu are roluri valide pentru nicio locație

## Hot Swap Locații

În partea de jos a sidebar-ului există un selector de locații care permite:
- Schimbarea rapidă între locații
- Afișarea informațiilor despre locația curentă
- Funcționare în mod collapsed și expanded

## Dezactivare Mod Demo

Pentru a dezactiva modul demo, setează:
```env
VITE_DEMO_MODE=false
```

Sau șterge complet linia `VITE_DEMO_MODE` din fișierul `.env`.

## Note

- Modul demo este ideal pentru prezentări și demo-uri
- Toate datele sunt stocate local în localStorage
- Nu sunt necesare conexiuni la server pentru funcționarea demo
- Utilizatorii cu rol 'user' vor fi redirecționați către ecranul de acces refuzat
