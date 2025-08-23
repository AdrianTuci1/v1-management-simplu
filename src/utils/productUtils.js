import { indexedDb } from '../data/infrastructure/db.js';
import { productManager } from '../business/productManager.js';

// Date de test pentru produse
const testProducts = [
  {
    id: 'prod_1',
    name: 'Paracetamol 500mg',
    price: 15.50,
    category: 'Medicamente',
    stock: 45,
    reorderLevel: 10,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'prod_2',
    name: 'Ibuprofen 400mg',
    price: 12.80,
    category: 'Medicamente',
    stock: 8,
    reorderLevel: 15,
    createdAt: '2024-01-14T14:30:00Z',
    updatedAt: '2024-01-14T14:30:00Z'
  },
  {
    id: 'prod_3',
    name: 'Periuță de dinți electrică',
    price: 89.99,
    category: 'Dispozitive Medicale',
    stock: 12,
    reorderLevel: 5,
    createdAt: '2024-01-13T09:15:00Z',
    updatedAt: '2024-01-13T09:15:00Z'
  },
  {
    id: 'prod_4',
    name: 'Pasta de dinți cu fluor',
    price: 8.50,
    category: 'Produse de Îngrijire',
    stock: 0,
    reorderLevel: 20,
    createdAt: '2024-01-12T16:45:00Z',
    updatedAt: '2024-01-12T16:45:00Z'
  },
  {
    id: 'prod_5',
    name: 'Aparat de tensiune',
    price: 245.00,
    category: 'Echipamente',
    stock: 3,
    reorderLevel: 2,
    createdAt: '2024-01-11T11:20:00Z',
    updatedAt: '2024-01-11T11:20:00Z'
  },
  {
    id: 'prod_6',
    name: 'Măști chirurgicale (pachet 50)',
    price: 25.00,
    category: 'Consumabile',
    stock: 25,
    reorderLevel: 10,
    createdAt: '2024-01-10T13:10:00Z',
    updatedAt: '2024-01-10T13:10:00Z'
  },
  {
    id: 'prod_7',
    name: 'Vitamina C 1000mg',
    price: 18.90,
    category: 'Medicamente',
    stock: 32,
    reorderLevel: 12,
    createdAt: '2024-01-09T08:30:00Z',
    updatedAt: '2024-01-09T08:30:00Z'
  },
  {
    id: 'prod_8',
    name: 'Termometru digital',
    price: 45.50,
    category: 'Echipamente',
    stock: 7,
    reorderLevel: 5,
    createdAt: '2024-01-08T15:45:00Z',
    updatedAt: '2024-01-08T15:45:00Z'
  }
];

// Populează cache-ul cu date de test
export const populateTestData = async () => {
  try {
    console.log('Populare date de test pentru produse...');
    
    // Șterge datele existente
    await indexedDb.clear('products');
    await indexedDb.clear('productCounts');
    
    // Adaugă produsele de test
    for (const product of testProducts) {
      await indexedDb.put('products', product);
    }
    
    // Calculează și salvează numărul de produse per categorie
    const categories = productManager.getCategories();
    for (const category of categories) {
      const productsInCategory = testProducts.filter(p => p.category === category);
      await indexedDb.setProductCount(category, productsInCategory.length);
    }
    
    console.log('Date de test pentru produse populate cu succes!');
    return true;
  } catch (error) {
    console.error('Eroare la popularea datelor de test pentru produse:', error);
    return false;
  }
};

// Curăță toate datele
export const clearAllData = async () => {
  try {
    console.log('Ștergerea tuturor datelor pentru produse...');
    
    await indexedDb.clear('products');
    await indexedDb.clear('productCounts');
    
    console.log('Toate datele pentru produse au fost șterse!');
    return true;
  } catch (error) {
    console.error('Eroare la ștergerea datelor pentru produse:', error);
    return false;
  }
};

// Verifică starea cache-ului
export const checkCacheStatus = async () => {
  try {
    const products = await indexedDb.getAll('products');
    const productCounts = await indexedDb.getAll('productCounts');
    
    console.log('=== Status Cache Produse ===');
    console.log(`Produse în cache: ${products.length}`);
    console.log(`Statistici categorii: ${productCounts.length}`);
    
    if (products.length > 0) {
      console.log('\nPrimele 3 produse:');
      products.slice(0, 3).forEach(product => {
        console.log(`- ${product.name} (${product.category}) - Stoc: ${product.stock}`);
      });
    }
    
    if (productCounts.length > 0) {
      console.log('\nStatistici per categorie:');
      productCounts.forEach(stat => {
        console.log(`- ${stat.category}: ${stat.count} produse`);
      });
    }
    
    return {
      productsCount: products.length,
      categoriesCount: productCounts.length,
      hasData: products.length > 0
    };
  } catch (error) {
    console.error('Eroare la verificarea statusului cache-ului pentru produse:', error);
    return {
      productsCount: 0,
      categoriesCount: 0,
      hasData: false,
      error: error.message
    };
  }
};

// Exportă datele din cache
export const exportCacheData = async (format = 'json') => {
  try {
    const products = await indexedDb.getAll('products');
    
    if (format === 'csv') {
      return productManager.exportToCSV(products);
    } else {
      return JSON.stringify(products, null, 2);
    }
  } catch (error) {
    console.error('Eroare la exportul datelor din cache pentru produse:', error);
    throw error;
  }
};

// Importă date în cache
export const importCacheData = async (data, format = 'json') => {
  try {
    let products;
    
    if (format === 'csv') {
      // Parse CSV data
      const lines = data.split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
      products = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.replace(/"/g, ''));
        const product = {};
        headers.forEach((header, index) => {
          product[header] = values[index];
        });
        return product;
      });
    } else {
      products = JSON.parse(data);
    }
    
    // Șterge datele existente
    await indexedDb.clear('products');
    await indexedDb.clear('productCounts');
    
    // Adaugă noile date
    for (const product of products) {
      await indexedDb.put('products', product);
    }
    
    // Actualizează statisticile
    const categories = productManager.getCategories();
    for (const category of categories) {
      const productsInCategory = products.filter(p => p.category === category);
      await indexedDb.setProductCount(category, productsInCategory.length);
    }
    
    console.log(`Importat ${products.length} produse cu succes!`);
    return true;
  } catch (error) {
    console.error('Eroare la importul datelor pentru produse:', error);
    throw error;
  }
};

// Generează date de test aleatorii
export const generateRandomProducts = (count = 10) => {
  const categories = productManager.getCategories();
  const productNames = [
    'Paracetamol', 'Ibuprofen', 'Vitamina C', 'Vitamina D', 'Omega 3',
    'Periuță de dinți', 'Pasta de dinți', 'Aparat de tensiune', 'Termometru',
    'Măști chirurgicale', 'Gluze medicale', 'Bandaje', 'Antiseptic',
    'Crema hidratantă', 'Șampon medicamentos', 'Pillule pentru gât',
    'Sirop pentru tuse', 'Guturi pentru ochi', 'Unguent antiinflamator',
    'Comprimate pentru dureri de cap'
  ];
  
  const products = [];
  
  for (let i = 0; i < count; i++) {
    const name = productNames[Math.floor(Math.random() * productNames.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const price = Math.round((Math.random() * 200 + 5) * 100) / 100;
    const stock = Math.floor(Math.random() * 100);
    const reorderLevel = Math.floor(Math.random() * 20);
    
    products.push({
      id: `prod_${Date.now()}_${i}`,
      name: `${name} ${Math.floor(Math.random() * 1000)}mg`,
      price,
      category,
      stock,
      reorderLevel,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  
  return products;
};

// Populează cu date aleatorii
export const populateRandomData = async (count = 20) => {
  try {
    console.log(`Generare ${count} produse aleatorii...`);
    
    const randomProducts = generateRandomProducts(count);
    
    // Șterge datele existente
    await indexedDb.clear('products');
    await indexedDb.clear('productCounts');
    
    // Adaugă produsele aleatorii
    for (const product of randomProducts) {
      await indexedDb.put('products', product);
    }
    
    // Actualizează statisticile
    const categories = productManager.getCategories();
    for (const category of categories) {
      const productsInCategory = randomProducts.filter(p => p.category === category);
      await indexedDb.setProductCount(category, productsInCategory.length);
    }
    
    console.log(`${count} produse aleatorii generate cu succes!`);
    return true;
  } catch (error) {
    console.error('Eroare la generarea produselor aleatorii:', error);
    return false;
  }
};

// Utilitare pentru debugging
export const debugProductCache = async () => {
  console.log('=== Debug Cache Produse ===');
  
  try {
    const status = await checkCacheStatus();
    console.log('Status:', status);
    
    if (status.hasData) {
      const products = await indexedDb.getAll('products');
      const lowStockProducts = products.filter(p => p.stock <= p.reorderLevel);
      
      console.log(`\nProduse cu stoc scăzut: ${lowStockProducts.length}`);
      lowStockProducts.forEach(product => {
        console.log(`- ${product.name}: ${product.stock}/${product.reorderLevel}`);
      });
      
      const totalValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);
      console.log(`\nValoarea totală a stocului: ${totalValue.toFixed(2)} RON`);
    }
  } catch (error) {
    console.error('Eroare la debugging:', error);
  }
};
