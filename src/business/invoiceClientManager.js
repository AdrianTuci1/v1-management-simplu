// Manager pentru gestionarea clienților de factură
class InvoiceClientManager {
  constructor() {
    this.requiredFields = ['clientName', 'clientAddress'];
  }

  // Validează datele clientului
  validateClient(clientData) {
    const errors = [];

    // Validări obligatorii
    if (!clientData.clientName || clientData.clientName.trim() === '') {
      errors.push('Numele clientului este obligatoriu');
    }

    if (!clientData.clientAddress || clientData.clientAddress.trim() === '') {
      errors.push('Adresa clientului este obligatorie');
    }

    // Validare CUI (dacă este completat)
    if (clientData.clientCUI && clientData.clientCUI.trim() !== '') {
      if (!this.isValidCUI(clientData.clientCUI)) {
        errors.push('CUI-ul nu este valid (format: RO12345678)');
      }
    }

    // Validare CNP (dacă este completat)
    if (clientData.clientCNP && clientData.clientCNP.trim() !== '') {
      if (!this.isValidCNP(clientData.clientCNP)) {
        errors.push('CNP-ul nu este valid (13 cifre)');
      }
    }

    // Validare email (dacă este completat)
    if (clientData.clientEmail && clientData.clientEmail.trim() !== '') {
      if (!this.isValidEmail(clientData.clientEmail)) {
        errors.push('Adresa de email nu este validă');
      }
    }

    // Validare telefon (dacă este completat)
    if (clientData.clientPhone && clientData.clientPhone.trim() !== '') {
      if (!this.isValidPhone(clientData.clientPhone)) {
        errors.push('Numărul de telefon nu este valid');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validează CUI-ul românesc
  isValidCUI(cui) {
    // Format: RO + 8 cifre
    const cuiRegex = /^RO\d{8}$/;
    return cuiRegex.test(cui.toUpperCase());
  }

  // Validează CNP-ul românesc
  isValidCNP(cnp) {
    // CNP trebuie să aibă exact 13 cifre
    const cnpRegex = /^\d{13}$/;
    return cnpRegex.test(cnp);
  }

  // Validează email-ul
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validează numărul de telefon
  isValidPhone(phone) {
    // Acceptă formate: +40, 0040, 0, fără prefix
    const phoneRegex = /^(\+40|0040|0)?[0-9]{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  // Transformă datele pentru API
  transformForAPI(clientData) {
    return {
      ...clientData,
      // Normalizează CUI-ul
      clientCUI: clientData.clientCUI ? clientData.clientCUI.toUpperCase() : '',
      // Normalizează CNP-ul
      clientCNP: clientData.clientCNP ? clientData.clientCNP.trim() : '',
      // Normalizează email-ul
      clientEmail: clientData.clientEmail ? clientData.clientEmail.toLowerCase().trim() : '',
      // Normalizează numărul de telefon
      clientPhone: clientData.clientPhone ? this.normalizePhone(clientData.clientPhone) : '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // Transformă datele pentru UI
  transformForUI(clientData) {
    return {
      ...clientData,
      id: clientData.id || clientData.resourceId,
      resourceId: clientData.resourceId || clientData.id,
      // Formatează numărul de telefon pentru afișare
      formattedPhone: this.formatPhone(clientData.clientPhone),
      // Generează numele de afișare
      displayName: this.generateDisplayName(clientData),
      // Verifică dacă clientul este complet
      isComplete: this.isClientComplete(clientData)
    };
  }

  // Normalizează numărul de telefon
  normalizePhone(phone) {
    // Elimină spațiile și caracterele speciale
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // Adaugă prefixul +40 dacă nu există
    if (cleaned.startsWith('0')) {
      return '+4' + cleaned;
    } else if (cleaned.startsWith('40')) {
      return '+' + cleaned;
    } else if (cleaned.startsWith('0040')) {
      return '+' + cleaned.substring(2);
    } else if (!cleaned.startsWith('+40')) {
      return '+40' + cleaned;
    }
    
    return cleaned;
  }

  // Formatează numărul de telefon pentru afișare
  formatPhone(phone) {
    if (!phone) return '';
    
    // Format: +40 XXX XXX XXX
    const cleaned = phone.replace(/[^\d]/g, '');
    if (cleaned.length === 12 && cleaned.startsWith('40')) {
      return `+${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6, 9)} ${cleaned.substring(9)}`;
    }
    
    return phone;
  }

  // Generează numele de afișare
  generateDisplayName(clientData) {
    let name = clientData.clientName || 'Client necunoscut';
    
    if (clientData.clientCUI) {
      name += ` (${clientData.clientCUI})`;
    } else if (clientData.clientCNP) {
      name += ` (CNP: ${clientData.clientCNP.substring(0, 6)}***)`;
    }
    
    return name;
  }

  // Verifică dacă clientul este complet
  isClientComplete(clientData) {
    return !!(
      clientData.clientName && 
      clientData.clientAddress && 
      (clientData.clientCUI || clientData.clientCNP)
    );
  }

  // Caută clienți după termen
  searchClients(clients, searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      return clients;
    }

    const term = searchTerm.toLowerCase().trim();
    
    return clients.filter(client => 
      client.clientName?.toLowerCase().includes(term) ||
      client.clientCUI?.toLowerCase().includes(term) ||
      client.clientCNP?.includes(term) ||
      client.clientEmail?.toLowerCase().includes(term) ||
      client.clientAddress?.toLowerCase().includes(term)
    );
  }

  // Sortează clienții
  sortClients(clients, sortBy = 'clientName', sortOrder = 'asc') {
    return [...clients].sort((a, b) => {
      let aValue = a[sortBy] || '';
      let bValue = b[sortBy] || '';

      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  }

  // Calculează statisticile
  calculateStats(clients) {
    return {
      totalClients: clients.length,
      completeClients: clients.filter(c => this.isClientComplete(c)).length,
      incompleteClients: clients.filter(c => !this.isClientComplete(c)).length,
      clientsWithCUI: clients.filter(c => c.clientCUI).length,
      clientsWithCNP: clients.filter(c => c.clientCNP).length
    };
  }

  // Exportă datele
  exportData(clients, format = 'json') {
    switch (format) {
      case 'json':
        return JSON.stringify(clients, null, 2);
      case 'csv':
        return this.exportToCSV(clients);
      default:
        throw new Error(`Format ${format} not supported`);
    }
  }

  // Exportă în format CSV
  exportToCSV(clients) {
    const headers = [
      'Nume',
      'CUI',
      'CNP',
      'Adresă',
      'Email',
      'Telefon'
    ];

    const rows = clients.map(client => [
      client.clientName || '',
      client.clientCUI || '',
      client.clientCNP || '',
      client.clientAddress || '',
      client.clientEmail || '',
      client.clientPhone || ''
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

export const invoiceClientManager = new InvoiceClientManager();
