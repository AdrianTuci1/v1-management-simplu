// Manager pentru gestionarea facturilor conform standardelor românești
class InvoiceManager {
  constructor() {
    this.invoiceNumberPrefix = 'F';
    this.invoiceNumberYear = new Date().getFullYear();
  }

  // Generează numărul de factură conform standardelor românești
  generateInvoiceNumber(sequenceNumber) {
    const year = this.invoiceNumberYear;
    const paddedSequence = sequenceNumber.toString().padStart(3, '0');
    return `${this.invoiceNumberPrefix}${paddedSequence}/${year}`;
  }

  // Validează datele facturii
  validateInvoice(invoiceData) {
    const errors = [];

    // Validări obligatorii conform standardelor românești
    if (!invoiceData.clientName || invoiceData.clientName.trim() === '') {
      errors.push('Numele clientului este obligatoriu');
    }

    if (!invoiceData.clientCUI && !invoiceData.clientCNP) {
      errors.push('CUI sau CNP-ul clientului este obligatoriu');
    }

    if (!invoiceData.clientAddress || invoiceData.clientAddress.trim() === '') {
      errors.push('Adresa clientului este obligatorie');
    }

    if (!invoiceData.items || !Array.isArray(invoiceData.items) || invoiceData.items.length === 0) {
      errors.push('Factura trebuie să conțină cel puțin un produs/serviciu');
    }

    // Validează fiecare item
    invoiceData.items?.forEach((item, index) => {
      if (!item.description || item.description.trim() === '') {
        errors.push(`Descrierea produsului/serviciului ${index + 1} este obligatorie`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Cantitatea produsului/serviciului ${index + 1} trebuie să fie mai mare decât 0`);
      }
      if (!item.price || item.price <= 0) {
        errors.push(`Prețul produsului/serviciului ${index + 1} trebuie să fie mai mare decât 0`);
      }
    });

    if (!invoiceData.issueDate) {
      errors.push('Data emiterii este obligatorie');
    }

    if (!invoiceData.dueDate) {
      errors.push('Data scadenței este obligatorie');
    }

    // Validează că data scadenței este după data emiterii
    if (invoiceData.issueDate && invoiceData.dueDate) {
      const issueDate = new Date(invoiceData.issueDate);
      const dueDate = new Date(invoiceData.dueDate);
      if (dueDate <= issueDate) {
        errors.push('Data scadenței trebuie să fie după data emiterii');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Transformă datele pentru API
  transformForAPI(invoiceData) {
    return {
      ...invoiceData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // Transformă datele pentru UI
  transformForUI(invoiceData) {
    return {
      ...invoiceData,
      id: invoiceData.resourceId,
      resourceId: invoiceData.resourceId || invoiceData.id,
      // Calculează totalurile dacă nu sunt deja calculate
      subtotal: invoiceData.subtotal || this.calculateSubtotal(invoiceData.items),
      tax: invoiceData.tax || this.calculateTax(invoiceData.items, invoiceData.taxRate),
      total: invoiceData.total || this.calculateTotal(invoiceData.items, invoiceData.taxRate),
      // Formatează datele pentru afișare
      formattedIssueDate: this.formatDate(invoiceData.issueDate),
      formattedDueDate: this.formatDate(invoiceData.dueDate),
      // Status pentru UI
      status: this.determineStatus(invoiceData),
      isOverdue: this.isOverdue(invoiceData.dueDate, invoiceData.status)
    };
  }

  // Calculează subtotalul (suma prețurilor care conțin deja TVA)
  calculateSubtotal(items) {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((sum, item) => {
      const itemTotal = (item.price || 0) * (item.quantity || 0);
      return sum + itemTotal;
    }, 0);
  }

  // Calculează TVA-ul (extras din prețurile cu TVA inclus)
  calculateTax(items, taxRate = 0.19) {
    const totalWithVAT = this.calculateSubtotal(items);
    // Formula pentru extragerea TVA: Total cu TVA - (Total cu TVA / (1 + taxRate))
    const totalWithoutVAT = totalWithVAT / (1 + taxRate);
    return totalWithVAT - totalWithoutVAT;
  }

  // Calculează TVA-ul pentru items cu cote individuale
  calculateTaxWithIndividualRates(items) {
    if (!items || !Array.isArray(items)) return 0;
    
    return items.reduce((totalTax, item) => {
      const itemTotal = (item.price || 0) * (item.quantity || 0);
      const vatRate = item.vatRate || 0.19; // Fiecare item are propria cotă
      
      // Extrage TVA-ul din prețul cu TVA inclus
      const itemWithoutVAT = itemTotal / (1 + vatRate);
      const itemTax = itemTotal - itemWithoutVAT;
      
      return totalTax + itemTax;
    }, 0);
  }

  // Calculează totalul (care este egal cu subtotal-ul deoarece prețurile conțin deja TVA)
  calculateTotal(items, taxRate = 0.19) {
    // Total-ul este suma prețurilor cu TVA inclus
    return this.calculateSubtotal(items);
  }

  // Formatează data pentru afișare
  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO');
  }

  // Determină statusul facturii
  determineStatus(invoiceData) {
    if (invoiceData.paidAt) return 'paid';
    if (invoiceData.eFacturaStatus === 'sent') return 'sent';
    if (this.isOverdue(invoiceData.dueDate, invoiceData.status)) return 'overdue';
    return 'pending';
  }

  // Verifică dacă factura este restantă
  isOverdue(dueDate, status) {
    if (status === 'paid') return false;
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  }

  // Calculează statisticile
  calculateStats(invoices) {
    const stats = {
      totalInvoices: invoices.length,
      totalAmount: 0,
      paidInvoices: 0,
      pendingInvoices: 0,
      overdueInvoices: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0
    };

    invoices.forEach(invoice => {
      stats.totalAmount += invoice.total || 0;
      
      switch (invoice.status) {
        case 'paid':
          stats.paidInvoices++;
          stats.paidAmount += invoice.total || 0;
          break;
        case 'overdue':
          stats.overdueInvoices++;
          stats.overdueAmount += invoice.total || 0;
          break;
        default:
          stats.pendingInvoices++;
          stats.pendingAmount += invoice.total || 0;
          break;
      }
    });

    return stats;
  }

  // Exportă datele
  exportData(invoices, format = 'json') {
    switch (format) {
      case 'json':
        return JSON.stringify(invoices, null, 2);
      case 'csv':
        return this.exportToCSV(invoices);
      default:
        throw new Error(`Format ${format} not supported`);
    }
  }

  // Exportă în format CSV
  exportToCSV(invoices) {
    const headers = [
      'Număr Factură',
      'Client',
      'Data Emiterii',
      'Data Scadenței',
      'Total',
      'Status'
    ];

    const rows = invoices.map(invoice => [
      invoice.invoiceNumber || '',
      invoice.clientName || '',
      invoice.formattedIssueDate || '',
      invoice.formattedDueDate || '',
      invoice.total || 0,
      invoice.status || ''
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  // Filtrează facturile
  filterInvoices(invoices, filters = {}) {
    let filtered = [...invoices];

    if (filters.status) {
      filtered = filtered.filter(invoice => invoice.status === filters.status);
    }

    if (filters.clientName) {
      filtered = filtered.filter(invoice => 
        invoice.clientName?.toLowerCase().includes(filters.clientName.toLowerCase())
      );
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(invoice => 
        new Date(invoice.issueDate) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(invoice => 
        new Date(invoice.issueDate) <= new Date(filters.dateTo)
      );
    }

    return filtered;
  }

  // Sortează facturile
  sortInvoices(invoices, sortBy = 'issueDate', sortOrder = 'desc') {
    return [...invoices].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'issueDate' || sortBy === 'dueDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }
}

export const invoiceManager = new InvoiceManager();
