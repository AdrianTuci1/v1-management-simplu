# Transformarea Datelor pentru Programări

## Prezentare Generală

Sistemul de programări gestionează transformarea datelor între formatul UI (pentru combo box-uri) și formatul backend (pentru stocare în baza de date).

## Formate de Date

### Format UI (Pentru Combo Box-uri)
```javascript
{
  patient: "1",           // ID-ul pacientului ca string
  doctor: "2",            // ID-ul doctorului ca string  
  service: "3",           // ID-ul serviciului ca string
  date: "2024-01-15",     // Data în format yyyy-mm-dd
  time: "09:00",          // Ora în format HH:mm
  status: "scheduled",    // Status-ul programării
  price: "150",           // Prețul ca string
  // ... alte câmpuri
}
```

### Format Backend (Pentru Baza de Date)
```javascript
{
  patient: { id: 1, name: "Ion Popescu" },
  doctor: { id: 2, name: "Dr. Maria Ionescu" },
  service: { id: 3, name: "Consultatie generala" },
  date: "2024-01-15",
  time: "09:00",
  status: "scheduled",
  price: 150,
  // ... alte câmpuri
}
```

## Componente Implicate

### 1. AppointmentManager (`src/business/appointmentManager.js`)
- **Responsabilitate**: Gestionarea transformării datelor și validarea
- **Metode principale**:
  - `validateAppointment()` - Validarea câmpurilor esențiale
  - `transformAppointmentForAPI()` - UI → Backend
  - `transformAppointmentForUI()` - Backend → UI

### 2. AppointmentUtils (`src/utils/appointmentUtils.js`)
- **Responsabilitate**: Utilități pentru transformarea datelor
- **Funcții principale**:
  - `transformIdToObject()` - Transformă ID în obiect cu date reale
  - `transformObjectToId()` - Transformă obiect în ID
  - `validateAppointmentFields()` - Validarea câmpurilor

### 3. AppointmentService (`src/services/appointmentService.js`)
- **Responsabilitate**: Interfața cu baza de date
- **Transformări**:
  - La adăugare/actualizare: UI → Backend
  - La citire: Backend → UI

### 4. AppointmentDrawer (`src/components/drawers/AppointmentDrawer.jsx`)
- **Responsabilitate**: Interfața utilizator
- **Compatibilitate**: Folosește ID-uri pentru combo box-uri

## Flux de Date

### 1. Crearea unei Programări
```
UI (ID-uri) → AppointmentDrawer → AppointmentService → AppointmentManager → Backend (Obiecte)
```

### 2. Citirea Programărilor
```
Backend (Obiecte) → AppointmentService → AppointmentManager → UI (ID-uri)
```

### 3. Actualizarea Programărilor
```
UI (ID-uri) → AppointmentDrawer → AppointmentService → AppointmentManager → Backend (Obiecte)
```

## Validarea Câmpurilor

### Câmpuri Obligatorii
- `patient` - ID-ul pacientului
- `doctor` - ID-ul doctorului
- `date` - Data programării (nu poate fi în trecut)
- `time` - Ora programării
- `service` - ID-ul serviciului

### Câmpuri Opționale
- `price` - Prețul (trebuie să fie număr valid)
- `status` - Status-ul (default: 'scheduled')
- `postOperativeNotes` - Note post-operatorii
- `prescription` - Prescripția

## Compatibilitatea cu Combo Box-urile

### PatientCombobox
- **Input**: ID-ul pacientului ca string
- **Display**: Numele pacientului
- **Output**: ID-ul pacientului ca string

### DoctorCombobox
- **Input**: ID-ul doctorului ca string
- **Display**: Numele doctorului (medicName)
- **Output**: ID-ul doctorului ca string

### TreatmentCombobox
- **Input**: ID-ul serviciului ca string
- **Display**: Tipul tratamentului (treatmentType)
- **Output**: ID-ul serviciului ca string

## Cache-ul de Lookup

Sistemul menține un cache pentru datele de lookup:
- `patientsCache` - Lista pacienților
- `usersCache` - Lista utilizatorilor (doctori)
- `treatmentsCache` - Lista tratamentelor

Acest cache este actualizat la pornirea aplicației și permite transformarea rapidă a ID-urilor în obiecte cu date reale.

## Exemple de Utilizare

### Transformare UI → Backend
```javascript
const uiData = {
  patient: "1",
  doctor: "2", 
  service: "3",
  date: "2024-01-15",
  time: "09:00"
}

const backendData = appointmentManager.transformAppointmentForAPI(uiData)
// Result: { patient: {id: 1, name: "Ion Popescu"}, ... }
```

### Transformare Backend → UI
```javascript
const backendData = {
  patient: { id: 1, name: "Ion Popescu" },
  doctor: { id: 2, name: "Dr. Maria Ionescu" },
  service: { id: 3, name: "Consultatie generala" }
}

const uiData = appointmentManager.transformAppointmentForUI(backendData)
// Result: { patient: "1", doctor: "2", service: "3", ... }
```

## Gestionarea Erorilor

Sistemul validează datele în mai multe puncte:
1. **În AppointmentDrawer** - Înainte de trimiterea către service
2. **În AppointmentService** - Înainte de trimiterea către backend
3. **În AppointmentManager** - Validarea completă a câmpurilor

Erorile sunt afișate utilizatorului în interfață și logate în consolă pentru debugging.
