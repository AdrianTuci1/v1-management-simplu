// Manager pentru logica de business a vânzărilor
class SalesManager {
  constructor() {
    this.paymentMethods = [
      { id: 'cash', name: 'Numerar', icon: '💵' },
      { id: 'card', name: 'Card', icon: '💳' },
      { id: 'tickets', name: 'Tichete', icon: '🎫' },
      { id: 'receipt', name: 'Bon', icon: '🧾' }
    ];
    
    this.saleStatuses = [
      { id: 'completed', name: 'Completată', color: 'green' },
      { id: 'refunded', name: 'Rambursată', color: 'orange' }
    ];
  }

  // Validează datele unei vânzări
  validateSale(saleData) {
    const errors = [];

    // Validare items
    if (!saleData.items || !Array.isArray(saleData.items) || saleData.items.length === 0) {
      errors.push('Vânzarea trebuie să conțină cel puțin un produs');
    } else {
      saleData.items.forEach((item, index) => {
        if (!item.productId || !item.productName) {
          errors.push(`Produsul ${index + 1} trebuie să aibă ID și nume`);
        }
        if (!item.quantity || isNaN(item.quantity) || item.quantity <= 0) {
          errors.push(`Produsul ${index + 1} trebuie să aibă o cantitate validă`);
        }
        if (!item.price || isNaN(item.price) || item.price < 0) {
          errors.push(`Produsul ${index + 1} trebuie să aibă un preț valid`);
        }
      });
    }

    // Validare total
    if (!saleData.total || isNaN(saleData.total) || saleData.total <= 0) {
      errors.push('Totalul vânzării trebuie să fie un număr pozitiv');
    }

    // Validare metoda de plată
    if (!saleData.paymentMethod || !this.paymentMethods.find(pm => pm.id === saleData.paymentMethod)) {
      errors.push('Metoda de plată este invalidă');
    }

    // Validare status
    if (saleData.status && !this.saleStatuses.find(s => s.id === saleData.status)) {
      errors.push('Statusul vânzării este invalid');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Transformă datele pentru API
  transformForAPI(saleData) {
    return {
      saleId: saleData.saleId || this.generateSaleId(),
      date: saleData.date || new Date().toISOString().split('T')[0],
      time: saleData.time || new Date().toTimeString().split(' ')[0].substring(0, 5),
      items: saleData.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price),
        total: parseFloat(item.total || item.quantity * item.price)
      })),
      subtotal: parseFloat(saleData.subtotal || saleData.total),
      tax: parseFloat(saleData.tax || 0),
      total: parseFloat(saleData.total),
      paymentMethod: saleData.paymentMethod,
      status: saleData.status || 'completed',
      cashierName: saleData.cashierName || 'Sistem',
      notes: saleData.notes || '',
      createdAt: saleData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // Transformă datele pentru UI
  transformForUI(saleData) {
    return {
      id: saleData.resourceId || saleData.id,
      resourceId: saleData.resourceId || saleData.id,
      saleId: saleData.saleId,
      date: saleData.date,
      time: saleData.time,
      items: saleData.items || [],
      subtotal: parseFloat(saleData.subtotal || 0).toFixed(2),
      tax: parseFloat(saleData.tax || 0).toFixed(2),
      total: parseFloat(saleData.total || 0).toFixed(2),
      paymentMethod: saleData.paymentMethod,
      status: saleData.status || 'completed',
      cashierName: saleData.cashierName,
      notes: saleData.notes || '',
      createdAt: saleData.createdAt,
      updatedAt: saleData.updatedAt
    };
  }

  // Calculează statistici pentru vânzări
  calculateStats(sales) {
    const stats = {
      totalSales: 0,
      totalRevenue: 0,
      cardSales: 0,
      cashSales: 0,
      cardRevenue: 0,
      cashRevenue: 0
    };

    sales.forEach(sale => {
      // Doar vânzările completate contează
      if (sale.status === 'completed') {
        const total = parseFloat(sale.total);
        
        stats.totalSales++;
        stats.totalRevenue += total;

        // Statistici per metoda de plată
        if (sale.paymentMethod === 'card') {
          stats.cardSales++;
          stats.cardRevenue += total;
        } else if (sale.paymentMethod === 'cash') {
          stats.cashSales++;
          stats.cashRevenue += total;
        }
      }
    });

    return stats;
  }

  // Filtrează vânzările
  filterSales(sales, filters = {}) {
    let filtered = [...sales];

    // Filtrare după dată
    if (filters.date) {
      filtered = filtered.filter(sale => sale.date === filters.date);
    }

    // Filtrare după perioada de timp
    if (filters.startDate && filters.endDate) {
      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.date);
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);
        return saleDate >= startDate && saleDate <= endDate;
      });
    }

    // Filtrare după status
    if (filters.status) {
      filtered = filtered.filter(sale => sale.status === filters.status);
    }

    // Filtrare după metoda de plată
    if (filters.paymentMethod) {
      filtered = filtered.filter(sale => sale.paymentMethod === filters.paymentMethod);
    }

    // Filtrare după casier
    if (filters.cashierName) {
      filtered = filtered.filter(sale => 
        sale.cashierName.toLowerCase().includes(filters.cashierName.toLowerCase())
      );
    }

    // Filtrare după suma minimă
    if (filters.minAmount) {
      filtered = filtered.filter(sale => 
        parseFloat(sale.total) >= parseFloat(filters.minAmount)
      );
    }

    // Filtrare după suma maximă
    if (filters.maxAmount) {
      filtered = filtered.filter(sale => 
        parseFloat(sale.total) <= parseFloat(filters.maxAmount)
      );
    }

    // Filtrare după căutare
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(sale =>
        sale.saleId.toLowerCase().includes(searchTerm) ||
        sale.items.some(item => item.productName.toLowerCase().includes(searchTerm)) ||
        sale.cashierName.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  }

  // Sortează vânzările
  sortSales(sales, sortBy = 'date', sortOrder = 'desc') {
    const sorted = [...sales];

    sorted.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'time':
          aValue = a.time;
          bValue = b.time;
          break;
        case 'total':
          aValue = parseFloat(a.total);
          bValue = parseFloat(b.total);
          break;
        case 'saleId':
          aValue = a.saleId;
          bValue = b.saleId;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'cashierName':
          aValue = a.cashierName.toLowerCase();
          bValue = b.cashierName.toLowerCase();
          break;
        default:
          aValue = new Date(a.date);
          bValue = new Date(b.date);
      }

      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });

    return sorted;
  }

  // Calculează totalul unei vânzări
  calculateSaleTotal(items, taxRate = 0.19) {
    // Subtotalul este prețul total (cu TVA inclus)
    const subtotal = items.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * parseInt(item.quantity));
    }, 0);

    // Calculează TVA-ul scăzut din subtotal
    // Formula: TVA = subtotal * (taxRate / (1 + taxRate))
    const tax = subtotal * (taxRate / (1 + taxRate));
    
    // Prețul fără TVA = subtotal - TVA
    const priceWithoutTax = subtotal - tax;
    
    // Totalul final = subtotal (rămâne același)

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      total: parseFloat(subtotal.toFixed(2))
    };
  }

  // Generează ID unic pentru vânzare
  generateSaleId() {
    const now = new Date();
    const year = now.getFullYear().toString().substr(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const time = now.getTime().toString().substr(-6);
    
    return `SALE${year}${month}${day}${time}`;
  }

  // Obține metodele de plată disponibile
  getPaymentMethods() {
    return this.paymentMethods;
  }

  // Obține statusurile disponibile
  getSaleStatuses() {
    return this.saleStatuses;
  }

  // Exportă datele
  exportData(sales, format = 'json') {
    switch (format.toLowerCase()) {
      case 'csv':
        return this.exportToCSV(sales);
      case 'json':
      default:
        return JSON.stringify(sales, null, 2);
    }
  }

  // Exportă în format CSV
  exportToCSV(sales) {
    const headers = ['ID Vânzare', 'Data', 'Ora', 'Total', 'Metoda Plată', 'Status', 'Casier', 'Produse'];
    const rows = sales.map(sale => [
      sale.saleId,
      sale.date,
      sale.time,
      sale.total,
      sale.paymentMethod,
      sale.status,
      sale.cashierName,
      sale.items.map(item => `${item.productName} (${item.quantity}x${item.price})`).join('; ')
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }

  // Verifică dacă o vânzare poate fi anulată
  canCancelSale(sale) {
    return sale.status === 'completed';
  }

  // Verifică dacă o vânzare poate fi rambursată
  canRefundSale(sale) {
    return sale.status === 'completed';
  }

  // Obține eticheta pentru status
  getStatusLabel(status) {
    const statusConfig = this.saleStatuses.find(s => s.id === status);
    return statusConfig ? statusConfig.name : status;
  }

  // Obține clasa pentru status
  getStatusClass(status) {
    const statusConfig = this.saleStatuses.find(s => s.id === status);
    if (!statusConfig) return 'bg-gray-100 text-gray-800';
    
    switch (statusConfig.color) {
      case 'green':
        return 'bg-green-100 text-green-800';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800';
      case 'red':
        return 'bg-red-100 text-red-800';
      case 'orange':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // Obține eticheta pentru metoda de plată
  getPaymentMethodLabel(paymentMethod) {
    const methodConfig = this.paymentMethods.find(pm => pm.id === paymentMethod);
    return methodConfig ? methodConfig.name : paymentMethod;
  }

  // Obține iconița pentru metoda de plată
  getPaymentMethodIcon(paymentMethod) {
    const methodConfig = this.paymentMethods.find(pm => pm.id === paymentMethod);
    return methodConfig ? methodConfig.icon : '💳';
  }
}

export const salesManager = new SalesManager();
