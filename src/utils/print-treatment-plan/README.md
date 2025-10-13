# Print Treatment Plan - Sistem Profesional de Generare PDF

Această bibliotecă oferă un sistem profesional de generare PDF pentru planurile de tratament dentar, similar cu sistemul existent de facturare din `@/utils/print`.

## Structură

```
print-treatment-plan/
├── app.js                    # Export principal
├── app.d.ts                  # Declarații TypeScript
├── README.md                 # Acest fișier
└── print/
    ├── index.js              # Funcția principală de generare PDF
    ├── index.d.ts            # Declarații TypeScript pentru funcția principală
    ├── partials/             # Componente modulare pentru PDF
    │   ├── header.js         # Header cu titlu și informații plan
    │   ├── patientInfo.js    # Informații pacient
    │   ├── treatmentTable.js # Tabel cu tratamente
    │   ├── summary.js        # Sumar cu total estimativ
    │   └── footer.js         # Footer cu informații clinică
    └── utils/                # Utilitare
        ├── fetchSvg.js       # Încărcare SVG pentru logo și background
        └── newPage.js        # Gestionare paginare automată
```

## Caracteristici

### ✨ Funcționalități
- **Layout profesional**: Design curat și structurat pentru planuri de tratament
- **Informații complete**: Include date despre pacient, clinică și tratamente
- **Paginare automată**: Gestionează automat crearea de noi pagini când este necesar
- **Suport imagini multiple**: Logo în format SVG, PNG, JPG, WEBP
- **Încărcare automată logo**: Încearcă automat multiple surse (logo.svg, logo.png, logo.jpg, 3dark.webp)
- **Fonturi custom**: Folosește Work Sans pentru un aspect modern
- **Total estimativ**: Calculează automat totalul tratamentelor cu prețuri
- **Surse tratamente**: Diferențiază între tratamente din chart și cele adăugate manual
- **Durată și preț**: Afișează estimări pentru fiecare tratament
- **Note**: Suport pentru note suplimentare la fiecare tratament

### 🎨 Elemente de Design
- Header cu logo clinică (centrat)
- Titlu plan de tratament (bold, centrat)
- Informații pacient (nume, CNP, telefon, email, data nașterii)
- Tabel tratamente (ordine, dinte, tratament, durată, preț, sursă)
- Sumar cu total estimativ (bold, subliniat dublu)
- Footer cu informații clinică (contact, locație, CUI)
- Numerotare pagini (pentru planuri lungi)

## Utilizare

### Import

```typescript
import { printTreatmentPlanPDF } from '@/utils/print-treatment-plan/app';
```

### Exemplu de Utilizare

```typescript
const treatmentPlanData = {
  clinic: {
    name: "Clinica Dentară Smile",
    address: "Str. Primăverii nr. 10",
    city: "București",
    email: "contact@smile.ro",
    phone: "+40 21 123 4567",
    website: "www.smile.ro",
    cui: "RO12345678",
  },
  patient: {
    name: "Ion Popescu",
    dateOfBirth: "15.05.1985",
    phone: "+40 722 123 456",
    email: "ion.popescu@email.com",
    cnp: "1850515123456",
  },
  plan: {
    date: "20.10.2025",
    expiryDate: "20.01.2026",
    doctorName: "Dr. Maria Ionescu",
    clinicLocation: "București",
  },
  treatments: [
    {
      id: "1",
      toothNumber: 16,
      title: "Coroană ceramică",
      durationMinutes: 120,
      price: 1500,
      notes: "Material premium",
      isFromChart: true,
    },
    {
      id: "2",
      toothNumber: 100, // Număr >= 100 pentru tratamente generale
      title: "Detartraj complet",
      durationMinutes: 60,
      price: 250,
      notes: "",
      isFromChart: false,
    },
  ],
  labels: {
    title: "Plan de Tratament Dentar",
    patientInfo: "Informații Pacient",
    planDate: "Data planului",
    expiryDate: "Valabilitate până la",
    doctor: "Doctor",
    toothNumber: "Dinte",
    treatment: "Tratament",
    duration: "Durată",
    price: "Preț",
    notes: "Note",
    source: "Sursă",
    total: "Total",
    estimatedTotal: "Total Estimat",
    footer: "Informații Clinică",
    fromChart: "Chart",
    manual: "Manual",
    generalTreatment: "General",
  }
};

// Generează și deschide PDF-ul într-o fereastră nouă
printTreatmentPlanPDF(treatmentPlanData);
```

## Integrare în FullscreenTreatmentPlan

Funcționalitatea este deja integrată în componenta `FullscreenTreatmentPlan.tsx`:

```typescript
import { printTreatmentPlanPDF } from "@/utils/print-treatment-plan/app";
import useSettingsStore from "@/stores/settingsStore";
import { usePatients } from "@/hooks/usePatients";

// În componentă
const locationDetails = useSettingsStore((state) => state.locationDetails);
const { getPatientById } = usePatients();

// La click pe butonul "Previzualizează PDF"
const handlePreviewPdf = async () => {
  const patient = await getPatientById(patientId);
  
  const treatmentPlanData = {
    clinic: {
      name: locationDetails.name || "Clinica Dentară",
      address: locationDetails.address,
      email: locationDetails.email,
      phone: locationDetails.phone,
      website: locationDetails.website,
      cui: locationDetails.cif,
    },
    patient: {
      name: patient.name,
      dateOfBirth: patient.dateOfBirth,
      phone: patient.phone,
      email: patient.email,
      cnp: patient.cnp,
    },
    // ... restul datelor
  };
  
  printTreatmentPlanPDF(treatmentPlanData);
};
```

## Dependențe

- `jspdf` - Generare PDF
- `svg2pdf.js` - Suport pentru SVG în PDF
- `@/utils/print/fonts/WorkSans-*` - Fonturi custom (shared cu sistemul de facturare)

## Suport pentru Imagini

Sistemul suportă următoarele formate de imagini pentru logo:
- **SVG** - Vector graphics (recomandат pentru calitate)
- **PNG** - Cu transparență (recomandat)
- **JPG/JPEG** - Fără transparență
- **WEBP** - Format modern

### Încărcare Automată Logo

Sistemul încearcă automat să încarce logo-ul din următoarele surse (în ordine):
1. `public/img/logo.svg`
2. `public/img/logo.png`
3. `public/img/logo.jpg`
4. `public/3dark.webp`

Primul logo găsit va fi utilizat. Dacă niciun logo nu este găsit, PDF-ul se generează fără logo.

### Adăugare Logo Personalizat

Pentru a adăuga un logo personalizat:

1. **Plasează imaginea** în folderul `public/img/` cu numele `logo.svg`, `logo.png` sau `logo.jpg`
2. **Dimensiuni recomandate**: 
   - Lățime maximă: 150px (se scalează automat)
   - Raport de aspect: păstrează proporțiile originale
   - Format recomandat: PNG cu transparență sau SVG

3. **Exemplu**:
   ```
   public/
   └── img/
       └── logo.png  (150x50px, transparent background)
   ```

## Note Tehnice

### Tratamente Generale vs. Specifice Dinților
- **Tratamente specifice**: `toothNumber` între 1-32 (dinți permanenți) sau 51-85 (dinți temporari)
- **Tratamente generale**: `toothNumber` >= 100 (ex: detartraj complet, consultație)

### Paginare
Sistemul gestionează automat paginarea când conținutul depășește dimensiunea unei pagini:
- Verifică spațiul disponibil înainte de a adăuga fiecare element
- Creează pagini noi când este necesar
- Păstrează background-ul și footer-ul pe fiecare pagină
- Adaugă numerotare pagini pentru planuri lungi

### Fonturi
Folosește aceleași fonturi Work Sans ca sistemul de facturare:
- `WorkSans-normal` - Text normal
- `WorkSans-bold` - Text bold (titluri, sume)

### Culori
- **Albastru (#2980B9)**: Header, separator principal, footer
- **Gri închis (#333)**: Text principal
- **Gri mediu (#666)**: Text secundar (note, sursă)
- **Gri deschis (#CCC)**: Separatori secundari

## Dezvoltare Viitoare

### Îmbunătățiri Potențiale
- [ ] Export în mai multe formate (PNG, JPG)
- [ ] Suport pentru multiple limbi
- [ ] Template-uri personalizabile
- [ ] Semnătură digitală
- [ ] QR code pentru verificare online
- [ ] Previzualizare înainte de generare
- [ ] Salvare în cloud
- [ ] Trimitere automată prin email

## Autor

Creat ca parte a sistemului Dashboard Business pentru clinici dentare.

## Licență

Acest cod face parte din aplicația Dashboard Business și urmează aceeași licență.

