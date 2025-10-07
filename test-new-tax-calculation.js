// Test pentru noul calcul al TVA-ului (dedus din subtotal)
import { salesManager } from './src/business/salesManager.js';

// Test cu TVA 19% - subtotal cu TVA inclus
console.log('=== Test TVA 19% (dedus din subtotal) ===');
const items = [
  { price: 119, quantity: 1 }, // Preț cu TVA inclus (100 + 19% = 119)
  { price: 59.5, quantity: 2 } // Preț cu TVA inclus (50 + 19% = 59.5)
];

const result = salesManager.calculateSaleTotal(items, 0.19);
console.log('Items (prețuri cu TVA inclus):', items);
console.log('Subtotal cu TVA inclus:', items.reduce((sum, item) => sum + (item.price * item.quantity), 0), 'RON');
console.log('Subtotal fără TVA (dedus):', result.subtotal, 'RON');
console.log('TVA dedus:', result.tax, 'RON');
console.log('Total (cu TVA inclus):', result.total, 'RON');

// Verificare manuală:
// Subtotal cu TVA: 119 + (59.5 * 2) = 119 + 119 = 238 RON
// TVA dedus: 238 * (0.19 / 1.19) = 238 * 0.1597 = 38.01 RON
// Subtotal fără TVA: 238 - 38.01 = 199.99 RON

console.log('\n=== Verificare manuală ===');
const manualSubtotalWithTax = 119 + (59.5 * 2);
const manualTax = manualSubtotalWithTax * (0.19 / 1.19);
const manualSubtotalWithoutTax = manualSubtotalWithTax - manualTax;
console.log('Subtotal cu TVA (manual):', manualSubtotalWithTax, 'RON');
console.log('TVA dedus (manual):', manualTax.toFixed(2), 'RON');
console.log('Subtotal fără TVA (manual):', manualSubtotalWithoutTax.toFixed(2), 'RON');

// Test cu TVA 9%
console.log('\n=== Test TVA 9% (dedus din subtotal) ===');
const result9 = salesManager.calculateSaleTotal(items, 0.09);
console.log('Items (prețuri cu TVA inclus):', items);
console.log('Subtotal fără TVA (dedus):', result9.subtotal, 'RON');
console.log('TVA dedus (9%):', result9.tax, 'RON');
console.log('Total (cu TVA inclus):', result9.total, 'RON');

console.log('\n=== Test completat cu succes! ===');
