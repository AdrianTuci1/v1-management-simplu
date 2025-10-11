# Ghid de Configurare - Datele Companiei

## Cum să configurezi datele companiei pentru facturi

Pentru ca facturile generate în format PDF să conțină datele corecte ale companiei tale, trebuie să configurezi informațiile în **Setări**.

### Pași de configurare

1. **Accesează Setările**
   - Click pe butonul de setări din meniul principal
   - Sau navighează direct la secțiunea "Setări"

2. **Selectează "Program de lucru și Locație"**
   - Aici vei găsi formularul pentru detaliile locației/companiei

3. **Completează toate câmpurile necesare:**

   #### Câmpuri obligatorii:
   - **Nume Companie** - Numele oficial al companiei (ex: "Cabinet Medical Dr. Popescu SRL")
   - **CIF/CUI** - Codul de Identificare Fiscală (ex: "RO12345678")
   - **Adresă** - Adresa completă (ex: "Str. Mihai Viteazu nr. 10, București, Sector 1")
   - **Telefon** - Număr de contact (ex: "+40 21 123 4567")
   - **Email** - Email de contact (ex: "contact@cabinet.ro")

   #### Câmpuri opționale dar recomandate:
   - **IBAN** - Contul bancar pentru primirea plăților (ex: "RO49 AAAA 1B31 0075 9384 0000")
   - **Bancă** - Numele băncii (ex: "BCR" sau "Banca Transilvania")

4. **Salvează modificările**
   - Click pe butonul "Salvează" sau "Actualizează"

### Cum apar datele în factură PDF

Odată configurate, datele vor apărea astfel în factura PDF:

```
┌─────────────────────────────────────────────┐
│  CABINET MEDICAL DR. POPESCU SRL            │
│  CIF: RO12345678                            │
│  Str. Mihai Viteazu nr. 10, București       │
│  +40 21 123 4567                            │
│  contact@cabinet.ro                         │
│  BCR - IBAN: RO49 AAAA 1B31 0075 9384 0000  │
└─────────────────────────────────────────────┘
```

### Verificare

Pentru a verifica că datele sunt configurate corect:

1. Creează o factură de test
2. Click pe butonul "Download" (pictograma de download verde)
3. Se va deschide PDF-ul în tab nou
4. Verifică că toate datele companiei apar corect în header-ul facturii

### Troubleshooting

**Problema:** Datele nu apar în PDF
- **Soluție 1:** Verifică că ai salvat modificările în setări
- **Soluție 2:** Reîncarcă pagina și încearcă din nou
- **Soluție 3:** Verifică consolă (F12) pentru mesaje de eroare

**Problema:** Apar date greșite sau vechi
- **Soluție:** Șterge cache-ul browserului și reîncarcă pagina

**Problema:** Lipsesc IBAN sau CIF
- **Soluție:** Mergi înapoi în setări și completează toate câmpurile

## Structura datelor în localStorage

Datele sunt stocate local în browser folosind `localStorage`. Pentru a verifica datele salvate:

1. Deschide Console (F12)
2. Rulează comanda:
```javascript
JSON.parse(localStorage.getItem('settings-storage'))
```

3. Verifică secțiunea `state.locationDetails`:
```json
{
  "state": {
    "locationDetails": {
      "name": "Cabinet Medical",
      "companyName": "Cabinet Medical Dr. Popescu SRL",
      "address": "Str. Mihai Viteazu nr. 10, București",
      "phone": "+40 21 123 4567",
      "email": "contact@cabinet.ro",
      "description": "",
      "cif": "RO12345678",
      "iban": "RO49 AAAA 1B31 0075 9384 0000",
      "banca": "BCR"
    }
  }
}
```

## Migrare de la versiunea veche

Dacă ai folosit anterior o versiune mai veche a aplicației care stoca datele altfel:

1. Notează-ți datele vechi ale companiei
2. Șterge datele din localStorage: `localStorage.removeItem('settings-storage')`
3. Reîncarcă pagina
4. Reconfigurează datele companiei în Setări

## Securitate

**Important:** Datele companiei sunt stocate **local** în browserul tău și nu sunt trimise nicăieri. Acestea sunt folosite doar pentru generarea facturilor PDF pe dispozitivul tău local.

## Suport

Pentru asistență suplimentară, consultă:
- `INVOICE_PDF_GENERATOR.md` - Detalii tehnice despre generarea PDF
- `src/stores/settingsStore.js` - Structura datelor în store
- Console logs - Mesaje de debug când generezi PDF

---

**Ultima actualizare:** Octombrie 2024

