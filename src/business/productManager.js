// Manager pentru logica de business a produselor
class ProductManager {
  constructor() {
    this.defaultCategories = [
      'Medicamente',
      'Dispozitive Medicale',
      'Produse de Îngrijire',
      'Echipamente',
      'Consumabile',
      'Altele'
    ];
  }

  // Validează datele unui produs
  validateProduct(productData) {
    const errors = [];

    // Validare nume produs
    if (!productData.name || productData.name.trim().length === 0) {
      errors.push('Numele produsului este obligatoriu');
    } else if (productData.name.trim().length < 2) {
      errors.push('Numele produsului trebuie să aibă cel puțin 2 caractere');
    }

    // Validare preț
    if (!productData.price || isNaN(productData.price) || productData.price <= 0) {
      errors.push('Prețul trebuie să fie un număr pozitiv');
    }

    // Validare categorie
    if (!productData.category || productData.category.trim().length === 0) {
      errors.push('Categoria este obligatorie');
    }

    // Validare stoc
    if (!productData.stock || isNaN(productData.stock) || productData.stock < 0) {
      errors.push('Stocul trebuie să fie un număr pozitiv sau zero');
    }

    // Validare nivel de reîncărcare
    if (!productData.reorderLevel || isNaN(productData.reorderLevel) || productData.reorderLevel < 0) {
      errors.push('Nivelul de reîncărcare trebuie să fie un număr pozitiv sau zero');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Transformă datele pentru API
  transformForAPI(productData) {
    return {
      name: productData.name.trim(),
      price: parseFloat(productData.price),
      category: productData.category.trim(),
      stock: parseInt(productData.stock),
      reorderLevel: parseInt(productData.reorderLevel),
      createdAt: productData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // Transformă datele pentru UI
  transformForUI(productData) {
    return {
      id: productData.resourceId,
      name: productData.name,
      price: parseFloat(productData.price).toFixed(2),
      category: productData.category,
      stock: parseInt(productData.stock),
      reorderLevel: parseInt(productData.reorderLevel),
      isLowStock: parseInt(productData.stock) <= parseInt(productData.reorderLevel),
      createdAt: productData.createdAt,
      updatedAt: productData.updatedAt
    };
  }

  // Calculează statistici pentru produse
  calculateStats(products) {
    const stats = {
      totalProducts: products.length,
      totalValue: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      categories: {},
      averagePrice: 0
    };

    let totalPrice = 0;

    products.forEach(product => {
      const stock = parseInt(product.stock);
      const price = parseFloat(product.price);
      const reorderLevel = parseInt(product.reorderLevel);

      // Valoarea totală
      stats.totalValue += stock * price;
      totalPrice += price;

      // Produse cu stoc scăzut
      if (stock <= reorderLevel) {
        stats.lowStockCount++;
      }

      // Produse fără stoc
      if (stock === 0) {
        stats.outOfStockCount++;
      }

      // Statistici per categorie
      if (!stats.categories[product.category]) {
        stats.categories[product.category] = {
          count: 0,
          totalValue: 0,
          lowStockCount: 0
        };
      }

      stats.categories[product.category].count++;
      stats.categories[product.category].totalValue += stock * price;
      
      if (stock <= reorderLevel) {
        stats.categories[product.category].lowStockCount++;
      }
    });

    // Prețul mediu
    stats.averagePrice = products.length > 0 ? totalPrice / products.length : 0;

    return stats;
  }

  // Filtrează produsele
  filterProducts(products, filters = {}) {
    let filtered = [...products];

    // Filtrare după categorie
    if (filters.category) {
      filtered = filtered.filter(product => 
        product.category.toLowerCase().includes(filters.category.toLowerCase())
      );
    }

    // Filtrare după nume
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
      );
    }

    // Filtrare după stoc scăzut
    if (filters.lowStock) {
      filtered = filtered.filter(product => 
        parseInt(product.stock) <= parseInt(product.reorderLevel)
      );
    }

    // Filtrare după preț
    if (filters.minPrice) {
      filtered = filtered.filter(product => 
        parseFloat(product.price) >= parseFloat(filters.minPrice)
      );
    }

    if (filters.maxPrice) {
      filtered = filtered.filter(product => 
        parseFloat(product.price) <= parseFloat(filters.maxPrice)
      );
    }

    return filtered;
  }

  // Sortează produsele
  sortProducts(products, sortBy = 'name', sortOrder = 'asc') {
    const sorted = [...products];

    sorted.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = parseFloat(a.price);
          bValue = parseFloat(b.price);
          break;
        case 'stock':
          aValue = parseInt(a.stock);
          bValue = parseInt(b.stock);
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });

    return sorted;
  }

  // Exportă datele
  exportData(products, format = 'json') {
    switch (format.toLowerCase()) {
      case 'csv':
        return this.exportToCSV(products);
      case 'json':
      default:
        return JSON.stringify(products, null, 2);
    }
  }

  // Exportă în format CSV
  exportToCSV(products) {
    const headers = ['ID', 'Nume', 'Preț', 'Categorie', 'Stoc', 'Nivel Reîncărcare', 'Stoc Scăzut'];
    const rows = products.map(product => [
      product.id,
      product.name,
      product.price,
      product.category,
      product.stock,
      product.reorderLevel,
      parseInt(product.stock) <= parseInt(product.reorderLevel) ? 'Da' : 'Nu'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }

  // Generează ID unic pentru produs
  generateProductId() {
    return 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Obține categoriile disponibile
  getCategories() {
    return this.defaultCategories;
  }

  // Verifică dacă un produs trebuie reîncărcat
  needsReorder(product) {
    return parseInt(product.stock) <= parseInt(product.reorderLevel);
  }

  // Calculează valoarea totală a stocului
  calculateTotalStockValue(products) {
    return products.reduce((total, product) => {
      return total + (parseInt(product.stock) * parseFloat(product.price));
    }, 0);
  }
}

export const productManager = new ProductManager();
