import { printPDF } from './print/app';

const OutputType = {
  Save: "save",
  DataUriString: "datauristring",
  DataUri: "datauri",
  DataUrlNewWindow: "dataurlnewwindow",
  Blob: "blob",
  ArrayBuffer: "arraybuffer",
};

/**
 * Generează un PDF pentru factură folosind librăria @print/
 * @param {Object} invoiceData - Datele facturii
 * @param {Object} locationDetails - Detaliile locației/companiei
 * @param {string} outputType - Tipul de output (default: 'dataurlnewwindow')
 * @returns {void} - Declanșează descărcarea PDF-ului
 */
export const generateInvoicePDF = (invoiceData, locationDetails, outputType = OutputType.DataUrlNewWindow) => {
  const { formData, totalWithoutVAT, tax, total } = invoiceData;
  
  console.log('🏢 PDF Generator - Location Details received:', locationDetails);
  console.log('📊 PDF Generator - Invoice Data received:', invoiceData);

  // Mapare items pentru tabelul PDF
  const items = {};
  formData.items.forEach((item, index) => {
    const itemTotalWithVAT = (item.price || 0) * (item.quantity || 0);
    const itemVATRate = item.vatRate || 0.19;
    const itemTotalWithoutVAT = itemTotalWithVAT / (1 + itemVATRate);
    
    items[index] = {
      title: item.description || '',
      description: `UM: ${item.unit || 'buc'} | Cota TVA: ${(itemVATRate * 100).toFixed(0)}%`,
      amount: `${(item.price || 0).toFixed(2)} RON`,
      qty: (item.quantity || 0).toString(),
      total: `${itemTotalWithVAT.toFixed(2)} RON`
    };
  });

  // Configurare date pentru PrintData
  const printData = {
    addressSender: {
      person: locationDetails?.companyName || locationDetails?.name || "Compania Mea SRL",
      street: locationDetails?.address || "",
      city: "", // Poate fi extras din address dacă e nevoie
      email: locationDetails?.email || "",
      phone: locationDetails?.phone || ""
    },
    
    address: {
      company: formData.client?.clientName || "Client",
      person: formData.client?.clientCUI 
        ? `CIF: ${formData.client.clientCUI}` 
        : formData.client?.clientCNP 
          ? `CNP: ${formData.client.clientCNP}` 
          : "",
      street: formData.client?.clientAddress || "",
      city: "" // Poate fi extras din clientAddress dacă e nevoie
    },
    
    personalInfo: {
      website: locationDetails?.website || "",
      bank: {
        person: locationDetails?.companyName || locationDetails?.name || "",
        name: locationDetails?.banca || "",
        IBAN: locationDetails?.iban || ""
      },
      taxoffice: {
        name: locationDetails?.cif ? "CIF" : "",
        number: locationDetails?.cif || ""
      }
    },
    
    label: {
      invoicenumber: "Factură nr: ",
      invoice: "Factură",
      tableItems: "Denumire produs/serviciu",
      tableQty: "Cant.",
      tableSinglePrice: "Preț unitar",
      tableSingleTotal: "Total",
      totalGrand: "TOTAL DE PLATĂ",
      contact: "Contact",
      bank: "Informații bancare",
      taxinfo: "Informații fiscale"
    },
    
    invoice: {
      number: invoiceData.invoiceNumber || "DRAFT",
      date: formData.issueDate || "",
      subject: formData.notes || "Mulțumim pentru colaborare!",
      total: `${total.toFixed(2)} RON`,
      text: `Total fără TVA: ${totalWithoutVAT.toFixed(2)} RON\nTotal TVA: ${tax.toFixed(2)} RON\n\nData scadenței: ${formData.dueDate || ''}`
    },
    
    items: items
  };

  console.log('📋 PDF Generator - PrintData mapped:', printData);

  // Generează PDF-ul folosind librăria @print/
  printPDF(printData);
};

export { OutputType };

