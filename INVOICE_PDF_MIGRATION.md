# Migrare completă la librăria @print/ pentru generarea PDF-urilor

## 📋 Rezumat

Am migrat cu succes de la template-ul custom `jsPDFInvoiceTemplate` la librăria profesională `@print/` pentru generarea facturilor PDF.

## 🎯 Modificări efectuate

### 1. **Refactorizare `invoicePdfGenerator.js`**
- ✅ Înlocuit import de la `jspdf` cu `@print/`
- ✅ Șters codul vechi al template-ului `jsPDFInvoiceTemplate` (~570 linii)
- ✅ Implementat maparea datelor la formatul `PrintData`
- ✅ Cod redus de la 677 linii la 107 linii (84% reducere)

### 2. **Actualizare `InvoiceDrawer.jsx`**
- ✅ Înlocuit cele 2 butoane (Print și Download) cu un singur buton "Previzualizare PDF"
- ✅ Actualizat importurile de iconițe (eliminat `Printer` și `Download`)
- ✅ Redenumit funcția de la `generatePDF` la `openPDFPreview`

### 3. **Modificare comportament librărie `@print/`**
- ✅ Schimbat de la `doc.save()` la `doc.output('dataurlnewwindow')`
- ✅ Acum deschide fereastra de previzualizare în loc să descarce automat

### 4. **Resurse SVG create**
Am creat 3 fișiere SVG în `/public/img/`:
- ✅ `logo.svg` - Logo pentru header-ul facturii
- ✅ `background.svg` - Fundal decorativ subtil
- ✅ `address-bar.svg` - Bară decorativă pentru secțiunea de adrese

## 🎨 Avantaje noi

### Design profesional
- ✅ **Fonturi custom** (WorkSans) pentru aspect mai plăcut
- ✅ **Layout modular** cu componente separate
- ✅ **Background decorativ** subtil și elegant
- ✅ **Fold marks** pentru printare fizică

### Arhitectură îmbunătățită
- ✅ **Cod mai curat** și mai ușor de întreținut
- ✅ **Componente reutilizabile** (table, totals, heading, footer)
- ✅ **Gestionare automată** a paginilor noi
- ✅ **Suport SVG** pentru logo și grafică

### Experiență utilizator
- ✅ **Previzualizare înainte de print/download**
- ✅ **Un singur buton** în loc de 2 (UI mai curat)
- ✅ **Control complet** din browser (print, download, zoom)

## 📦 Dependențe

Toate dependențele necesare sunt deja instalate:
```json
{
  "jspdf": "3.0.2",
  "svg2pdf.js": "2.6.0"
}
```

## 🔧 Structura datelor

### Format vechi (jsPDFInvoiceTemplate)
```javascript
{
  business: { name, address, phone, email, email_1, website },
  contact: { label, name, address, phone, email, otherInfo },
  invoice: { label, num, invDate, invGenDate, header, table, additionalRows }
}
```

### Format nou (@print/)
```javascript
{
  addressSender: { person, street, city, email, phone },
  address: { company, person, street, city },
  personalInfo: { website, bank: {}, taxoffice: {} },
  label: { invoicenumber, invoice, table*, totalGrand, contact, bank, taxinfo },
  invoice: { number, date, subject, total, text },
  items: { [index]: { title, description, amount, qty, total } }
}
```

## 🎯 Utilizare

### În InvoiceDrawer
```jsx
// Doar pentru modul de vizualizare (isViewMode)
<button onClick={openPDFPreview}>
  <FilePdf className="h-4 w-4" />
  Previzualizare PDF
</button>
```

### Flow complet
1. Utilizatorul deschide factura în modul de vizualizare
2. Apasă pe "Previzualizare PDF"
3. Se deschide o fereastră nouă cu PDF-ul
4. Din browser poate: Print (Ctrl+P) sau Download

## 📂 Fișiere modificate

1. `src/utils/invoicePdfGenerator.js` - Refactorizare completă
2. `src/components/drawers/InvoiceDrawer.jsx` - Simplificat UI
3. `src/utils/print/print/index.js` - Schimbat output type
4. `public/img/logo.svg` - Creat
5. `public/img/background.svg` - Creat
6. `public/img/address-bar.svg` - Creat

## ✅ Testare

Pentru a testa integrarea:
1. Deschide aplicația în browser
2. Navighează la o factură existentă
3. Click pe "Previzualizare PDF"
4. Verifică că se deschide fereastra nouă cu PDF-ul
5. Testează funcțiile Print și Download din browser

## 🚀 Îmbunătățiri viitoare

- [ ] Personalizare culori și stiluri din settings
- [ ] Opțiuni pentru logo custom din settings
- [ ] Template-uri multiple (simplu, detaliat, minim)
- [ ] Export în alte formate (Excel, CSV)
- [ ] Semnătură digitală pe PDF

## 📝 Note

- Fonturile WorkSans sunt embedded în librărie (WorkSans-normal.js și WorkSans-bold.js)
- SVG-urile sunt încărcate asincron din `/public/img/`
- Librăria gestionează automat paginarea pentru facturi lungi
- Background-ul este opțional și poate fi dezactivat prin eliminarea fișierului SVG

---

**Data migrării:** 11 octombrie 2025  
**Versiune librărie @print/:** Custom (bazată pe jsPDF 3.0.2)

