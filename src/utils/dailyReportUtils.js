// Utilitare pentru generarea raportului zilnic de vânzări
import { salesManager } from '../business/salesManager.js';

/**
 * Calculează statisticile pentru raportul zilnic
 * @param {Array} sales - Lista de vânzări
 * @param {Array} products - Lista de produse
 * @param {Array} treatments - Lista de servicii/tratamente
 * @param {string} date - Data pentru raport (YYYY-MM-DD)
 * @returns {Object} Statistici calculate
 */
export const calculateDailyReportStats = (sales, products, treatments, date) => {
  // Filtrează vânzările pentru data specificată
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

  // Calculează totalurile generale
  const totalRevenue = dailySales.reduce((sum, sale) => sum + parseFloat(sale.total), 0);
  
  // Calculează breakdown-ul pe metode de plată
  const paymentMethodBreakdown = {
    cash: { count: 0, revenue: 0 },
    card: { count: 0, revenue: 0 },
    tickets: { count: 0, revenue: 0 },
    receipt: { count: 0, revenue: 0 }
  };

  // Calculează breakdown-ul pe servicii vs produse
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
      const isService = isItemService(item, products, treatments);
      
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
        isService: isItemService(item, products, treatments)
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
};

/**
 * Determină dacă un item este serviciu sau produs
 * @param {Object} item - Item-ul din vânzare
 * @param {Array} products - Lista de produse
 * @param {Array} treatments - Lista de servicii
 * @returns {boolean} True dacă este serviciu
 */
const isItemService = (item, products, treatments) => {
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
    // Dacă produsul are categoria 'service' sau 'serviciu', considerăm că este serviciu
    return product.category?.toLowerCase().includes('service') ||
           product.category?.toLowerCase().includes('serviciu') ||
           product.type?.toLowerCase().includes('service') ||
           product.type?.toLowerCase().includes('serviciu');
  }

  // Dacă nu găsim produsul, încercăm să determinăm din nume
  const serviceKeywords = ['consultatie', 'tratament', 'serviciu', 'interventie', 'control'];
  const itemName = item.productName?.toLowerCase() || '';
  
  return serviceKeywords.some(keyword => itemName.includes(keyword));
};

/**
 * Formatează suma pentru afișare
 * @param {number} amount - Suma de formatat
 * @returns {string} Suma formatată
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'RON'
  }).format(amount);
};

/**
 * Formatează data pentru afișare
 * @param {string} date - Data în format YYYY-MM-DD
 * @returns {string} Data formatată
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('ro-RO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Generează un ID unic pentru raport
 * @returns {string} ID-ul raportului
 */
export const generateReportId = () => {
  const now = new Date();
  const year = now.getFullYear().toString().substr(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const time = now.getTime().toString().substr(-6);
  
  return `RPT${year}${month}${day}${time}`;
};
