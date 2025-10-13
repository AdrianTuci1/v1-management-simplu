# Quick Start - Print Treatment Plan

Ghid rapid pentru integrarea și utilizarea sistemului de generare PDF pentru planuri de tratament.

## 🚀 Utilizare Rapidă

### 1. Import

```typescript
import { printTreatmentPlanPDF } from '@/utils/print-treatment-plan/app';
```

### 2. Pregătire Date

```typescript
const treatmentPlanData = {
  clinic: {
    name: "Numele Clinicii",
    address: "Adresa completă",
    city: "Orașul",
    email: "email@clinica.ro",
    phone: "+40 xxx xxx xxx",
    website: "www.clinica.ro",
    cui: "ROxxxxxxxx",
  },
  patient: {
    name: "Nume Pacient",
    dateOfBirth: "01.01.1990",
    phone: "+40 xxx xxx xxx",
    email: "pacient@email.ro",
    cnp: "1900101xxxxxx",
  },
  plan: {
    date: "20.10.2025",
    expiryDate: "20.01.2026",
    doctorName: "Dr. Nume Doctor",
    clinicLocation: "București",
  },
  treatments: [
    {
      id: "1",
      toothNumber: 16,
      title: "Coroană ceramică",
      durationMinutes: 120,
      price: 1500.00,
      notes: "Material premium",
      isFromChart: true,
    },
    // Mai multe tratamente...
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
```

### 3. Generare PDF

```typescript
// Deschide PDF-ul într-o fereastră nouă
printTreatmentPlanPDF(treatmentPlanData);
```

## 💡 Exemple Comune

### Exemplu în React Component

```typescript
import React from 'react';
import { printTreatmentPlanPDF } from '@/utils/print-treatment-plan/app';
import useSettingsStore from '@/stores/settingsStore';
import { usePatients } from '@/hooks/usePatients';

const TreatmentPlanButton = ({ patientId, treatments }) => {
  const locationDetails = useSettingsStore((state) => state.locationDetails);
  const { getPatientById } = usePatients();

  const handleGeneratePDF = async () => {
    try {
      // Obține datele pacientului
      const patient = await getPatientById(patientId);

      // Pregătește datele pentru PDF
      const treatmentPlanData = {
        clinic: {
          name: locationDetails.name,
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
        plan: {
          date: new Date().toLocaleDateString('ro-RO'),
          expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('ro-RO'),
        },
        treatments: treatments,
        labels: {
          title: "Plan de Tratament Dentar",
          // ... restul label-urilor
        }
      };

      // Generează PDF
      printTreatmentPlanPDF(treatmentPlanData);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Nu s-a putut genera PDF-ul.");
    }
  };

  return (
    <button onClick={handleGeneratePDF}>
      Generează PDF
    </button>
  );
};
```

### Exemplu cu Validări

```typescript
const handleGeneratePDF = async () => {
  // Validări
  if (!patient) {
    alert("Datele pacientului lipsesc!");
    return;
  }

  if (!treatments || treatments.length === 0) {
    alert("Nu există tratamente în plan!");
    return;
  }

  if (!locationDetails.name) {
    alert("Configurați mai întâi datele clinicii în Setări!");
    return;
  }

  // Generare PDF
  const treatmentPlanData = {
    // ... date
  };

  try {
    printTreatmentPlanPDF(treatmentPlanData);
  } catch (error) {
    console.error("PDF generation failed:", error);
    alert("Eroare la generarea PDF-ului. Verificați consola pentru detalii.");
  }
};
```

## 📋 Tipuri de Tratamente

### Tratamente pe Dinți Specifici

```typescript
{
  toothNumber: 16,  // Dinte specific (1-32 pentru permanenți, 51-85 pentru temporari)
  title: "Coroană ceramică",
  // ...
}
```

### Tratamente Generale

```typescript
{
  toothNumber: 100,  // >= 100 pentru tratamente generale (se afișează ca "General")
  title: "Detartraj complet",
  // ...
}
```

## 🎨 Customizare Labels

Poți customiza textele afișate în PDF:

```typescript
labels: {
  title: "Plan de Tratament Dentar",           // Titlu principal
  patientInfo: "Informații Pacient",           // Secțiune pacient
  planDate: "Data planului",                   // Label data
  expiryDate: "Valabilitate până la",          // Label expirare
  doctor: "Doctor",                            // Label doctor
  toothNumber: "Dinte",                        // Coloană tabel
  treatment: "Tratament",                      // Coloană tabel
  duration: "Durată",                          // Coloană tabel
  price: "Preț",                               // Coloană tabel
  notes: "Note",                               // Label note
  source: "Sursă",                             // Coloană tabel
  total: "Total",                              // Label total
  estimatedTotal: "Total Estimat",             // Label total final
  footer: "Informații Clinică",                // Footer
  fromChart: "Chart",                          // Sursă din chart
  manual: "Manual",                            // Sursă manuală
  generalTreatment: "General",                 // Pentru tratamente generale
}
```

## ⚠️ Troubleshooting

### PDF-ul nu se generează

```typescript
// Verifică console-a pentru erori
console.log("Treatment Plan Data:", treatmentPlanData);

// Verifică că toate datele necesare sunt prezente
if (!treatmentPlanData.clinic.name) {
  console.error("Clinic name is missing!");
}

if (!treatmentPlanData.patient.name) {
  console.error("Patient name is missing!");
}

if (treatmentPlanData.treatments.length === 0) {
  console.error("No treatments in plan!");
}
```

### Logo-ul nu apare

```typescript
// Verifică că fișierul SVG există
// Calea: public/img/logo.svg

// Verifică în console pentru erori de încărcare SVG
// Sistemul va continua fără logo dacă încărcarea eșuează
```

### Prețurile nu se calculează corect

```typescript
// Asigură-te că prețurile sunt numere, nu string-uri
treatments: [
  {
    price: 1500,      // ✅ Corect
    // price: "1500"  // ❌ Greșit
  }
]
```

### Paginarea nu funcționează

```typescript
// Sistemul gestionează automat paginarea
// Dacă ai probleme, verifică că tratamentele nu au note extrem de lungi

// Pentru note foarte lungi, limitează lungimea:
const truncatedNotes = notes.length > 200 
  ? notes.substring(0, 200) + "..." 
  : notes;
```

## 🔗 Resurse Utile

- **README complet**: `src/utils/print-treatment-plan/README.md`
- **Documentație implementare**: `TREATMENT_PLAN_PDF_IMPLEMENTATION.md` (root)
- **Tipuri TypeScript**: `src/utils/print-treatment-plan/print/index.d.ts`
- **Exemplu funcțional**: `src/components/dental-chart/FullscreenTreatmentPlan.tsx`

## 📞 Ajutor

Pentru mai multe detalii sau exemple avansate, consultă:
1. README-ul principal din `src/utils/print-treatment-plan/README.md`
2. Implementarea din `FullscreenTreatmentPlan.tsx`
3. Documentația completă din `TREATMENT_PLAN_PDF_IMPLEMENTATION.md`

---

**Versiune**: 1.0.0  
**Ultima actualizare**: 13 Octombrie 2025

