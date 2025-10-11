# Invoice PDF Generator

## Overview

The invoice PDF generation has been refactored into a reusable component using the `jsPDFInvoiceTemplate` library pattern.

## Files

- **`src/utils/invoicePdfGenerator.js`** - Contains the PDF generation logic and template
- **`src/components/drawers/InvoiceDrawer.jsx`** - Uses the PDF generator

## Usage

### Basic Usage

```javascript
import { generateInvoicePDF, OutputType } from '../../utils/invoicePdfGenerator';

generateInvoicePDF(
  {
    invoiceNumber: 'INV-2024-001',
    formData: {
      client: { /* client data */ },
      issueDate: '2024-10-11',
      dueDate: '2024-11-11',
      items: [ /* invoice items */ ],
      notes: 'Thank you for your business'
    },
    totalWithoutVAT: 100.00,
    tax: 19.00,
    total: 119.00
  },
  locationDetails, // company/location info
  OutputType.DataUrlNewWindow // or OutputType.Save, OutputType.Blob, etc.
);
```

### Output Types

The generator supports multiple output types:

- `OutputType.Save` - Saves PDF as a file
- `OutputType.DataUriString` - Returns the data URI string
- `OutputType.DataUri` - Opens the data URI in current window
- `OutputType.DataUrlNewWindow` - Opens the data URI in new window (default)
- `OutputType.Blob` - Returns blob format
- `OutputType.ArrayBuffer` - Returns ArrayBuffer format

### Data Structure

#### Invoice Data Object

```javascript
{
  invoiceNumber: string,           // Invoice number (e.g., "INV-2024-001")
  formData: {
    client: {
      clientName: string,
      clientCUI: string,             // Company tax code
      clientCNP: string,             // Personal identification number
      clientAddress: string,
      clientPhone: string,
      clientEmail: string,
      // ... other client fields
    },
    issueDate: string,               // Format: 'YYYY-MM-DD'
    dueDate: string,                 // Format: 'YYYY-MM-DD'
    items: [
      {
        id: number,
        description: string,
        quantity: number,
        price: number,                // Price including VAT
        unit: string,                 // e.g., 'buc', 'kg', 'h'
        itemType: string,             // 'service' or 'product'
        vatRate: number,              // e.g., 0.19 for 19%
      }
    ],
    notes: string                    // Additional notes
  },
  totalWithoutVAT: number,
  tax: number,                       // Total VAT amount
  total: number                      // Total with VAT
}
```

#### Location Details Object

Datele companiei sunt preluate automat din `settingsStore.locationDetails`:

```javascript
{
  name: string,                      // Numele locației
  companyName: string,               // Numele companiei pentru facturi (prioritar)
  address: string,                   // Adresa completă
  phone: string,                     // Telefon
  email: string,                     // Email
  description: string,               // Descriere (opțional)
  cif: string,                       // CIF/CUI (Cod Identificare Fiscală)
  iban: string,                      // IBAN (Cont bancar)
  banca: string                      // Nume bancă
}
```

**Notă:** Datele companiei trebuie configurate în **Setări > Program de lucru și Locație** pentru a apărea corect în PDF.

## Features

- ✅ Professional invoice layout
- ✅ Multi-page support with automatic page breaks
- ✅ Table with borders and proper formatting
- ✅ Individual VAT rates per item
- ✅ Automatic calculations (subtotal, VAT, total)
- ✅ Company and client information sections
- ✅ Bank details section
- ✅ Page numbering
- ✅ Customizable footer
- ✅ Multiple output formats

## Customization

To customize the PDF appearance, edit the `jsPDFInvoiceTemplate` function in `src/utils/invoicePdfGenerator.js`.

Key customization points:

- **Colors**: Modify `colorBlack` and `colorGray` variables
- **Font sizes**: Adjust the `pdfConfig` object
- **Table layout**: Modify the `tableHeader` array in `generateInvoicePDF`
- **Page margins**: Change values in the template function
- **Additional sections**: Add custom sections in the template

## Logo and Stamp Support

The template supports adding logos and stamps:

```javascript
generateInvoicePDF(
  invoiceData,
  locationDetails,
  OutputType.DataUrlNewWindow,
  {
    logo: {
      src: 'path/to/logo.png',
      type: 'PNG',
      width: 50,
      height: 20,
      margin: { top: 0, left: 0 }
    },
    stamp: {
      src: 'path/to/stamp.png',
      width: 50,
      height: 50,
      inAllPages: false,
      margin: { top: 0, left: 0 }
    }
  }
);
```

## Benefits of This Approach

1. **Separation of Concerns**: PDF logic is separated from UI components
2. **Reusability**: Can be used in other components or contexts
3. **Maintainability**: Easier to update PDF layout in one place
4. **Testability**: Can be tested independently
5. **Flexibility**: Supports multiple output formats

## Migration Notes

The old `generatePDF` function in `InvoiceDrawer.jsx` has been replaced with a simple wrapper that calls `generateInvoicePDF`. The new version:

- Uses the same data structure
- Provides the same output (PDF in new window)
- Offers more features and flexibility
- Follows a proven template pattern

## Troubleshooting

### Datele companiei nu apar în PDF

Dacă datele companiei nu apar corect în PDF, verificați următoarele:

1. **Verificați că datele sunt configurate în Settings:**
   - Navigați la `Setări > Program de lucru și Locație`
   - Completați toate câmpurile necesare (nume companie, CIF, adresă, IBAN, etc.)

2. **Verificați consolă pentru logging:**
   Când generați un PDF, ar trebui să vedeți în consolă:
   ```
   📄 Location Details pentru PDF: {...}
   🏢 PDF Generator - Location Details received: {...}
   🏪 PDF Generator - Business Data mapped: {...}
   ```

3. **Verificați maparea câmpurilor:**
   - `companyName` sau `name` → Numele companiei în header
   - `cif` → Apare ca "CIF: XXX" pe a doua linie
   - `iban` + `banca` → Apar ca "Banca - IBAN: XXX" pe ultima linie
   - `address`, `phone`, `email` → Apar în secțiunea business

4. **Verificați structura din localStorage:**
   ```javascript
   // În consolă browser
   JSON.parse(localStorage.getItem('settings-storage'))
   ```

### PDF-ul nu se generează

Dacă PDF-ul nu se generează deloc:

1. Verificați că `jspdf` este instalat corect
2. Verificați consolă pentru erori
3. Asigurați-vă că există cel puțin un item în factură
4. Verificați că datele clientului sunt complete

## Future Enhancements

Possible future improvements:

- [ ] Add company logo support
- [ ] Add digital signature/stamp
- [ ] Support for multiple currencies
- [ ] Customizable color themes
- [ ] PDF/A compliance for archiving
- [ ] Watermark support for draft invoices
- [ ] Multi-language support
- [ ] Email PDF directly from the app

