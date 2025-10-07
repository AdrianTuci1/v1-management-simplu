import { dataFacade } from '../data/DataFacade.js';
import { ResourceRepository } from '../data/repositories/ResourceRepository.js';
import { salesManager } from '../business/salesManager.js';
import { formatCurrency, formatDate, generateReportId } from '../utils/dailyReportUtils.js';

// Serviciu pentru rapoarte folosind DataFacade
class ReportService {
  constructor() {
    this.repository = new ResourceRepository('report', 'reports');
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
  async generateDailyReport(sales, products, treatments, date) {
    try {
      // Calculează statisticile
      const stats = this.calculateReportStats(sales, products, treatments, date);
      
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
      
      // Creează raportul prin DataFacade
      const report = await this.dataFacade.create('report', reportData);
      
      return this.transformForUI(report);
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  // Calculează statisticile pentru raport
  calculateReportStats(sales, products, treatments, date) {
    const dailySales = sales.filter(sale => sale.date === date && sale.status === 'completed');
    
    if (dailySales.length === 0) {
      return {
        date,
        totalSales: 0,
        totalRevenue: 0,
        cashRevenue: 0,
        cardRevenue: 0,
        servicesRevenue: 0,
        productsRevenue: 0,
        servicesCount: 0,
        productsCount: 0,
        salesBreakdown: [],
        paymentMethodBreakdown: {
          cash: { count: 0, revenue: 0 },
          card: { count: 0, revenue: 0 },
          tickets: { count: 0, revenue: 0 },
          receipt: { count: 0, revenue: 0 }
        }
      };
    }

    const totalRevenue = dailySales.reduce((sum, sale) => sum + parseFloat(sale.total), 0);
    
    const paymentMethodBreakdown = {
      cash: { count: 0, revenue: 0 },
      card: { count: 0, revenue: 0 },
      tickets: { count: 0, revenue: 0 },
      receipt: { count: 0, revenue: 0 }
    };

    let servicesRevenue = 0;
    let productsRevenue = 0;
    let servicesCount = 0;
    let productsCount = 0;
    const salesBreakdown = [];

    dailySales.forEach(sale => {
      const saleTotal = parseFloat(sale.total);
      
      // Actualizează breakdown-ul pe metode de plată
      if (paymentMethodBreakdown[sale.paymentMethod]) {
        paymentMethodBreakdown[sale.paymentMethod].count++;
        paymentMethodBreakdown[sale.paymentMethod].revenue += saleTotal;
      }

      // Analizează fiecare item din vânzare
      let saleServicesRevenue = 0;
      let saleProductsRevenue = 0;
      let saleServicesCount = 0;
      let saleProductsCount = 0;

      sale.items.forEach(item => {
        const itemTotal = parseFloat(item.total || item.quantity * item.price);
        
        // Determină dacă este serviciu sau produs
        const isService = this.isItemService(item, products, treatments);
        
        if (isService) {
          saleServicesRevenue += itemTotal;
          saleServicesCount += parseInt(item.quantity);
        } else {
          saleProductsRevenue += itemTotal;
          saleProductsCount += parseInt(item.quantity);
        }
      });

      // Dacă nu am putut determina tipul, considerăm că sunt produse
      if (saleServicesRevenue === 0 && saleProductsRevenue === 0) {
        saleProductsRevenue = saleTotal;
        saleProductsCount = 1;
      }

      servicesRevenue += saleServicesRevenue;
      productsRevenue += saleProductsRevenue;
      servicesCount += saleServicesCount;
      productsCount += saleProductsCount;

      // Adaugă la breakdown-ul vânzărilor
      salesBreakdown.push({
        saleId: sale.saleId,
        time: sale.time,
        total: saleTotal,
        paymentMethod: sale.paymentMethod,
        servicesRevenue: saleServicesRevenue,
        productsRevenue: saleProductsRevenue,
        items: sale.items.map(item => ({
          name: item.productName,
          quantity: item.quantity,
          price: item.price,
          total: parseFloat(item.total || item.quantity * item.price),
          isService: this.isItemService(item, products, treatments)
        }))
      });
    });

    return {
      date,
      totalSales: dailySales.length,
      totalRevenue,
      cashRevenue: paymentMethodBreakdown.cash.revenue,
      cardRevenue: paymentMethodBreakdown.card.revenue,
      servicesRevenue,
      productsRevenue,
      servicesCount,
      productsCount,
      salesBreakdown,
      paymentMethodBreakdown
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
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('RAPORT ZILNIC DE VÂNZĂRI', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Data: ${formatDate(date)}`, 105, 30, { align: 'center' });
    doc.text(`Generat la: ${new Date().toLocaleString('ro-RO')}`, 105, 35, { align: 'center' });
    
    let yPosition = 50;

    // Statistici generale
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('STATISTICI GENERALE', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const generalStats = [
      ['Total vânzări:', stats.totalSales],
      ['Venit total:', formatCurrency(stats.totalRevenue)],
      ['Venit servicii:', formatCurrency(stats.servicesRevenue)],
      ['Venit produse:', formatCurrency(stats.productsRevenue)],
      ['Încasări cash:', formatCurrency(stats.cashRevenue)],
      ['Încasări card:', formatCurrency(stats.cardRevenue)]
    ];

    generalStats.forEach(([label, value]) => {
      doc.text(label, 20, yPosition);
      doc.text(value, 120, yPosition);
      yPosition += 6;
    });

    yPosition += 10;

    // Breakdown pe metode de plată
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('METODE DE PLATĂ', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const paymentData = [
      ['Metodă', 'Număr vânzări', 'Venit'],
      ['Cash', stats.paymentMethodBreakdown.cash.count, formatCurrency(stats.paymentMethodBreakdown.cash.revenue)],
      ['Card', stats.paymentMethodBreakdown.card.count, formatCurrency(stats.paymentMethodBreakdown.card.revenue)],
      ['Tichete', stats.paymentMethodBreakdown.tickets.count, formatCurrency(stats.paymentMethodBreakdown.tickets.revenue)],
      ['Bon', stats.paymentMethodBreakdown.receipt.count, formatCurrency(stats.paymentMethodBreakdown.receipt.revenue)]
    ];

    doc.autoTable({
      startY: yPosition,
      head: [paymentData[0]],
      body: paymentData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 9 }
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Detalii vânzări
    if (stats.salesBreakdown.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALII VÂNZĂRI', 20, yPosition);
      yPosition += 10;

      const salesData = stats.salesBreakdown.map(sale => [
        sale.saleId,
        sale.time,
        formatCurrency(sale.total),
        sale.paymentMethod,
        formatCurrency(sale.servicesRevenue),
        formatCurrency(sale.productsRevenue)
      ]);

      doc.autoTable({
        startY: yPosition,
        head: [['ID Vânzare', 'Ora', 'Total', 'Plată', 'Servicii', 'Produse']],
        body: salesData,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202] },
        styles: { fontSize: 8 },
        columnStyles: {
          2: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' }
        }
      });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Pagina ${i} din ${pageCount}`, 20, doc.internal.pageSize.height - 10);
      doc.text('Generat de Sistem de Management Cabinet', doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10, { align: 'right' });
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