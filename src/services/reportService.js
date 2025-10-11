import { dataFacade } from '../data/DataFacade.js';
import { ResourceRepository } from '../data/repositories/ResourceRepository.js';
import { salesManager } from '../business/salesManager.js';
import { formatCurrency, formatDate, generateReportId } from '../utils/dailyReportUtils.js';

// Serviciu pentru rapoarte folosind DataFacade
class ReportService {
  constructor() {
    this.repository = new ResourceRepository('report', 'report');
    this.dataFacade = dataFacade;
  }

  // Încarcă toate rapoartele
  async loadReports(filters = {}) {
    try {
      const reports = await this.dataFacade.getAll('report', filters);
      
      // Transformă datele pentru UI
      return reports.map(report => this.transformForUI(report));
    } catch (error) {
      console.error('Error loading reports:', error);
      return [];
    }
  }

  // Încarcă rapoartele după dată
  async loadReportsByDate(date) {
    try {
      const reports = await this.dataFacade.getAll('report', { date });
      
      return reports.map(report => this.transformForUI(report));
    } catch (error) {
      console.error('Error loading reports by date:', error);
      return [];
    }
  }

  // Încarcă rapoartele pentru o perioadă
  async loadReportsByDateRange(startDate, endDate) {
    try {
      const reports = await this.dataFacade.getAll('report', { 
        startDate, 
        endDate 
      });
      
      return reports.map(report => this.transformForUI(report));
    } catch (error) {
      console.error('Error loading reports by date range:', error);
      return [];
    }
  }

  // Generează un raport zilnic
  async generateDailyReport(date, salesData = null, productsData = null, treatmentsData = null) {
    try {
      // Încarcă datele necesare pentru ziua respectivă
      // Dacă nu sunt furnizate, le încarcă din DataFacade (cu fallback la IndexedDB)
      let sales, products, treatments;
      
      if (salesData && productsData && treatmentsData) {
        // Folosește datele furnizate
        sales = salesData;
        products = productsData;
        treatments = treatmentsData;
      } else {
        // Încarcă datele din DataFacade - va folosi automat IndexedDB dacă serverul nu răspunde
        console.log(`📊 Încărcare date pentru raportul zilnic din ${date}`);
        
        try {
          // Încearcă să încarce toate datele în paralel
          [sales, products, treatments] = await Promise.all([
            salesManager.loadSales(), // Folosește salesManager pentru a obține vânzările
            this.dataFacade.getAll('product'),
            this.dataFacade.getAll('treatment')
          ]);
          
          console.log(`✅ Date încărcate: ${sales.length} vânzări, ${products.length} produse, ${treatments.length} servicii`);
        } catch (loadError) {
          console.warn('⚠️ Eroare la încărcarea datelor pentru raport:', loadError);
          // Dacă încărcarea eșuează complet, folosește array-uri goale
          sales = [];
          products = [];
          treatments = [];
        }
      }
      
      // Filtrează vânzările doar pentru ziua respectivă
      const dailySales = sales.filter(sale => {
        if (!sale.date) return false;
        // Normalizează data pentru comparație
        const saleDate = sale.date.split('T')[0]; // Ia doar partea de dată (YYYY-MM-DD)
        const reportDate = date.split('T')[0];
        return saleDate === reportDate;
      });
      
      console.log(`📈 Găsite ${dailySales.length} vânzări pentru ${date}`);
      
      // Calculează statisticile
      const stats = this.calculateReportStats(dailySales, products, treatments, date);
      
      // Generează PDF-ul
      const pdfBlob = await this.generatePDF(stats, date);
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Creează obiectul raportului pentru API
      const reportData = {
        reportId: generateReportId(),
        title: `Raport Zilnic - ${formatDate(date)}`,
        description: `Raport detaliat pentru ${formatDate(date)}`,
        date: date,
        type: 'daily_sales',
        status: 'completed',
        generatedAt: new Date().toISOString(),
        generatedBy: 'Sistem',
        pdfUrl: pdfUrl,
        stats: stats,
        fileSize: pdfBlob.size
      };
      
      // Creează raportul prin DataFacade (va folosi IndexedDB în demo mode)
      const report = await this.dataFacade.create('report', reportData);
      
      return this.transformForUI(report);
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  // Calculează statisticile pentru raport
  calculateReportStats(sales, products, treatments, date) {
    // Filtrează doar vânzările completate (filtrarea pe dată se face deja în generateDailyReport)
    const dailySales = sales.filter(sale => sale.status === 'completed');
    
    if (dailySales.length === 0) {
      return {
        date,
        totalSales: 0,
        totalRevenue: 0,
        servicesRevenue: 0,
        productsRevenue: 0,
        vatBreakdown: {},
        paymentMethodBreakdown: {},
        paymentVatBreakdown: {},
        servicesList: [],
        productsList: []
      };
    }

    const totalRevenue = dailySales.reduce((sum, sale) => sum + parseFloat(sale.total || 0), 0);
    
    // Breakdown pe cote TVA
    const vatBreakdown = {}; // { '19': { base: 0, vat: 0, total: 0 }, ... }
    
    // Breakdown pe metode de plată
    const paymentMethodBreakdown = {}; // { 'cash': { count: 0, revenue: 0 }, ... }
    
    // Breakdown pe metode de plată și cote TVA
    const paymentVatBreakdown = {}; // { 'cash': { '19': { base: 0, vat: 0, total: 0 } }, ... }
    
    // Liste complete de servicii și produse vândute
    const servicesMap = new Map(); // Pentru agregare servicii
    const productsMap = new Map(); // Pentru agregare produse

    let servicesRevenue = 0;
    let productsRevenue = 0;

    dailySales.forEach(sale => {
      const paymentMethod = sale.paymentMethod || 'cash';
      const saleTotal = parseFloat(sale.total || 0);
      
      // Inițializează breakdown-ul pe metode de plată
      if (!paymentMethodBreakdown[paymentMethod]) {
        paymentMethodBreakdown[paymentMethod] = { count: 0, revenue: 0 };
      }
      paymentMethodBreakdown[paymentMethod].count++;
      paymentMethodBreakdown[paymentMethod].revenue += saleTotal;

      // Procesează fiecare item din vânzare
      (sale.items || []).forEach(item => {
        const quantity = parseInt(item.quantity || 1);
        const price = parseFloat(item.price || 0);
        const itemTotal = parseFloat(item.total || quantity * price);
        const vatRate = parseFloat(item.vatRate || item.vat || 19); // Default 19%
        
        // Calculează baza și TVA-ul
        const base = itemTotal / (1 + vatRate / 100);
        const vat = itemTotal - base;
        
        // Determină dacă este serviciu sau produs
        const isService = this.isItemService(item, products, treatments);
        
        // Actualizează breakdown pe cote TVA
        if (!vatBreakdown[vatRate]) {
          vatBreakdown[vatRate] = { base: 0, vat: 0, total: 0 };
        }
        vatBreakdown[vatRate].base += base;
        vatBreakdown[vatRate].vat += vat;
        vatBreakdown[vatRate].total += itemTotal;
        
        // Actualizează breakdown pe metode de plată și cote TVA
        if (!paymentVatBreakdown[paymentMethod]) {
          paymentVatBreakdown[paymentMethod] = {};
        }
        if (!paymentVatBreakdown[paymentMethod][vatRate]) {
          paymentVatBreakdown[paymentMethod][vatRate] = { base: 0, vat: 0, total: 0 };
        }
        paymentVatBreakdown[paymentMethod][vatRate].base += base;
        paymentVatBreakdown[paymentMethod][vatRate].vat += vat;
        paymentVatBreakdown[paymentMethod][vatRate].total += itemTotal;
        
        // Agregare servicii/produse
        const itemKey = item.productId || item.productName;
        if (isService) {
          servicesRevenue += itemTotal;
          if (servicesMap.has(itemKey)) {
            const existing = servicesMap.get(itemKey);
            existing.quantity += quantity;
            existing.total += itemTotal;
          } else {
            servicesMap.set(itemKey, {
              name: item.productName,
              quantity: quantity,
              unitPrice: price,
              vatRate: vatRate,
              total: itemTotal
            });
          }
        } else {
          productsRevenue += itemTotal;
          if (productsMap.has(itemKey)) {
            const existing = productsMap.get(itemKey);
            existing.quantity += quantity;
            existing.total += itemTotal;
          } else {
            productsMap.set(itemKey, {
              name: item.productName,
              quantity: quantity,
              unitPrice: price,
              vatRate: vatRate,
              total: itemTotal
            });
          }
        }
      });
    });

    return {
      date,
      totalSales: dailySales.length,
      totalRevenue,
      servicesRevenue,
      productsRevenue,
      vatBreakdown,
      paymentMethodBreakdown,
      paymentVatBreakdown,
      servicesList: Array.from(servicesMap.values()),
      productsList: Array.from(productsMap.values())
    };
  }

  // Determină dacă un item este serviciu sau produs
  isItemService(item, products, treatments) {
    // Caută în lista de servicii/tratamente
    const isInTreatments = treatments.some(treatment => 
      treatment.id === item.productId || 
      treatment.resourceId === item.productId ||
      treatment.treatmentType?.toLowerCase().includes(item.productName?.toLowerCase())
    );

    if (isInTreatments) return true;

    // Caută în lista de produse
    const product = products.find(p => 
      p.id === item.productId || 
      p.resourceId === item.productId
    );

    if (product) {
      return product.category?.toLowerCase().includes('service') ||
             product.category?.toLowerCase().includes('serviciu') ||
             product.type?.toLowerCase().includes('service') ||
             product.type?.toLowerCase().includes('serviciu');
    }

    // Dacă nu găsim produsul, încercăm să determinăm din nume
    const serviceKeywords = ['consultatie', 'tratament', 'serviciu', 'interventie', 'control'];
    const itemName = item.productName?.toLowerCase() || '';
    
    return serviceKeywords.some(keyword => itemName.includes(keyword));
  }

  // Generează PDF-ul pentru raport
  async generatePDF(stats, date) {
    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;
    
    const doc = new jsPDF();
    
    // ====================
    // HEADER - Data și Total Vânzări
    // ====================
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('RAPORT ZILNIC DE VÂNZĂRI', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text(`Data: ${formatDate(date)}`, 105, 30, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 102, 204);
    doc.text(`Total Vânzări: ${formatCurrency(stats.totalRevenue)}`, 105, 40, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    
    let yPosition = 55;

    // ====================
    // SECȚIUNEA 1: Vânzări Mărfuri și Servicii
    // ====================
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('1. VÂNZĂRI MĂRFURI ȘI SERVICII', 20, yPosition);
    yPosition += 8;

    const goodsServicesData = [
      ['Servicii', formatCurrency(stats.servicesRevenue)],
      ['Mărfuri (Produse)', formatCurrency(stats.productsRevenue)],
      ['TOTAL', formatCurrency(stats.totalRevenue)]
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Categorie', 'Valoare']],
      body: goodsServicesData,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], fontStyle: 'bold' },
      styles: { fontSize: 10 },
      columnStyles: {
        1: { halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 20, right: 20 }
    });

    yPosition = doc.lastAutoTable.finalY + 12;

    // ====================
    // SECȚIUNEA 2: Vânzări pe Cote TVA
    // ====================
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('2. VÂNZĂRI PE COTE TVA', 20, yPosition);
    yPosition += 8;

    const vatData = [];
    let totalBase = 0;
    let totalVat = 0;
    let totalWithVat = 0;

    Object.keys(stats.vatBreakdown).sort((a, b) => parseFloat(b) - parseFloat(a)).forEach(vatRate => {
      const vat = stats.vatBreakdown[vatRate];
      totalBase += vat.base;
      totalVat += vat.vat;
      totalWithVat += vat.total;
      
      vatData.push([
        `Cotă TVA ${vatRate}%`,
        formatCurrency(vat.base),
        formatCurrency(vat.vat),
        formatCurrency(vat.total)
      ]);
    });

    vatData.push([
      'TOTAL',
      formatCurrency(totalBase),
      formatCurrency(totalVat),
      formatCurrency(totalWithVat)
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Cotă TVA', 'Bază impozabilă', 'TVA', 'Total cu TVA']],
      body: vatData,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], fontStyle: 'bold' },
      styles: { fontSize: 10 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 20, right: 20 }
    });

    yPosition = doc.lastAutoTable.finalY + 12;

    // ====================
    // SECȚIUNEA 3: Vânzări pe Modalități de Plată și Cote TVA
    // ====================
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('3. VÂNZĂRI PE MODALITĂȚI DE PLATĂ ȘI COTE TVA', 20, yPosition);
    yPosition += 8;

    const paymentVatData = [];
    const paymentMethodNames = {
      'cash': 'Numerar',
      'card': 'Card',
      'tickets': 'Tichete',
      'receipt': 'Bon'
    };

    Object.keys(stats.paymentVatBreakdown).forEach(paymentMethod => {
      const methodName = paymentMethodNames[paymentMethod] || paymentMethod;
      const vatRates = stats.paymentVatBreakdown[paymentMethod];
      
      Object.keys(vatRates).sort((a, b) => parseFloat(b) - parseFloat(a)).forEach(vatRate => {
        const vat = vatRates[vatRate];
        paymentVatData.push([
          methodName,
          `TVA ${vatRate}%`,
          formatCurrency(vat.base),
          formatCurrency(vat.vat),
          formatCurrency(vat.total)
        ]);
      });
    });

    autoTable(doc, {
      startY: yPosition,
      head: [['Modalitate Plată', 'Cotă TVA', 'Bază', 'TVA', 'Total']],
      body: paymentVatData,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], fontStyle: 'bold' },
      styles: { fontSize: 9 },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 20, right: 20 }
    });

    yPosition = doc.lastAutoTable.finalY + 12;

    // ====================
    // SECȚIUNEA 4: Liste Detaliate Servicii și Produse
    // ====================
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('4. DETALII SERVICII ȘI PRODUSE VÂNDUTE', 20, yPosition);
    yPosition += 8;

    // SERVICII
    if (stats.servicesList.length > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Servicii:', 20, yPosition);
      yPosition += 6;

      const servicesData = stats.servicesList.map(service => [
        service.name,
        String(service.quantity),
        formatCurrency(service.unitPrice),
        `${service.vatRate}%`,
        formatCurrency(service.total)
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Serviciu', 'Cantitate', 'Preț unitar', 'TVA', 'Total']],
        body: servicesData,
        theme: 'grid',
        headStyles: { fillColor: [46, 204, 113], fontStyle: 'bold' },
        styles: { fontSize: 9 },
        columnStyles: {
          1: { halign: 'center' },
          2: { halign: 'right' },
          3: { halign: 'center' },
          4: { halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: 20, right: 20 }
      });

      yPosition = doc.lastAutoTable.finalY + 10;
    }

    // PRODUSE
    if (stats.productsList.length > 0) {
      if (yPosition > 220) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Produse:', 20, yPosition);
      yPosition += 6;

      const productsData = stats.productsList.map(product => [
        product.name,
        String(product.quantity),
        formatCurrency(product.unitPrice),
        `${product.vatRate}%`,
        formatCurrency(product.total)
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Produs', 'Cantitate', 'Preț unitar', 'TVA', 'Total']],
        body: productsData,
        theme: 'grid',
        headStyles: { fillColor: [230, 126, 34], fontStyle: 'bold' },
        styles: { fontSize: 9 },
        columnStyles: {
          1: { halign: 'center' },
          2: { halign: 'right' },
          3: { halign: 'center' },
          4: { halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: 20, right: 20 }
      });
    }

    // ====================
    // FOOTER
    // ====================
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(128, 128, 128);
      doc.text(`Pagina ${i} din ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
      doc.text(`Generat: ${new Date().toLocaleString('ro-RO')}`, 20, doc.internal.pageSize.height - 10);
      doc.text('Sistem Management Cabinet', doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10, { align: 'right' });
    }

    return doc.output('blob');
  }

  // Actualizează un raport
  async updateReport(id, reportData) {
    try {
      const result = await this.dataFacade.update('report', id, reportData);
      return this.transformForUI(result);
    } catch (error) {
      console.error('Error updating report:', error);
      throw error;
    }
  }

  // Șterge un raport
  async deleteReport(id) {
    try {
      await this.dataFacade.delete('report', id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  }

  // Obține un raport după ID
  async getReportById(id) {
    try {
      const report = await this.dataFacade.getById('report', id);
      return report ? this.transformForUI(report) : null;
    } catch (error) {
      console.error('Error getting report by ID:', error);
      return null;
    }
  }

  // Transformă datele pentru UI
  transformForUI(reportData) {
    return {
      id: reportData.resourceId || reportData.id,
      resourceId: reportData.resourceId || reportData.id,
      reportId: reportData.reportId,
      title: reportData.title,
      description: reportData.description,
      date: reportData.date,
      type: reportData.type,
      status: reportData.status,
      generatedAt: reportData.generatedAt,
      generatedBy: reportData.generatedBy,
      pdfUrl: reportData.pdfUrl,
      stats: reportData.stats,
      fileSize: reportData.fileSize,
      createdAt: reportData.createdAt,
      updatedAt: reportData.updatedAt
    };
  }

  // Transformă datele pentru API
  transformForAPI(reportData) {
    return {
      reportId: reportData.reportId || generateReportId(),
      title: reportData.title,
      description: reportData.description,
      date: reportData.date,
      type: reportData.type || 'daily_sales',
      status: reportData.status || 'completed',
      generatedAt: reportData.generatedAt || new Date().toISOString(),
      generatedBy: reportData.generatedBy || 'Sistem',
      pdfUrl: reportData.pdfUrl,
      stats: reportData.stats,
      fileSize: reportData.fileSize,
      createdAt: reportData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // Exportă rapoartele
  async exportReports(format = 'json', filters = {}) {
    try {
      const reports = await this.loadReports(filters);
      return this.exportData(reports, format);
    } catch (error) {
      console.error('Error exporting reports:', error);
      throw error;
    }
  }

  // Exportă datele în format specificat
  exportData(reports, format = 'json') {
    switch (format.toLowerCase()) {
      case 'csv':
        return this.exportToCSV(reports);
      case 'json':
      default:
        return JSON.stringify(reports, null, 2);
    }
  }

  // Exportă în format CSV
  exportToCSV(reports) {
    const headers = ['ID', 'Titlu', 'Data', 'Tip', 'Status', 'Generat de', 'Mărime fișier'];
    const rows = reports.map(report => [
      report.reportId,
      report.title,
      report.date,
      report.type,
      report.status,
      report.generatedBy,
      report.fileSize ? `${(report.fileSize / 1024).toFixed(2)} KB` : 'N/A'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }
}

export const reportService = new ReportService();