/**
 * Test utility for the new search functionality
 * This file can be used to test the updated search methods
 */

import { dataFacade } from '../data/DataFacade.js';
import userService from '../services/userService.js';
import patientService from '../services/patientService.js';
import treatmentService from '../services/treatmentService.js';

/**
 * Test the new search functionality
 */
export async function testSearchFunctionality() {
  console.log('Testing new search functionality...');
  
  try {
    // Test user search
    console.log('\n--- Testing User Search ---');
    const userResults = await userService.searchUsers('test', 10);
    console.log(`Found ${userResults.length} users`);
    
    // Test patient search
    console.log('\n--- Testing Patient Search ---');
    const patientResults = await patientService.searchPatients('test', 10);
    console.log(`Found ${patientResults.length} patients`);
    
    // Test treatment search
    console.log('\n--- Testing Treatment Search ---');
    const treatmentResults = await treatmentService.searchTreatments('test', 10);
    console.log(`Found ${treatmentResults.length} treatments`);
    
    // Test direct DataFacade search
    console.log('\n--- Testing DataFacade Search ---');
    try {
      const directResults = await dataFacade.searchByField(
        'medic',
        'medicName',
        'test',
        10
      );
      console.log(`Direct search found ${directResults.length} results`);
    } catch (error) {
      console.log('Direct search failed (expected if API is not available):', error.message);
    }
    
    // Test cache functionality
    console.log('\n--- Testing Cache ---');
    const cacheStats = dataFacade.getSearchCacheStats();
    console.log('Cache stats:', cacheStats);
    
    console.log('\n✅ Search functionality test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Search functionality test failed:', error);
    return false;
  }
}

/**
 * Test fuzzy search functionality
 */
export async function testFuzzySearch() {
  console.log('Testing fuzzy search functionality...');
  
  try {
    const fuzzyResults = await dataFacade.fuzzySearch(
      'medic',
      'medicName',
      'test',
      10
    );
    console.log(`Fuzzy search found ${fuzzyResults.length} results`);
    return true;
  } catch (error) {
    console.log('Fuzzy search failed (expected if API is not available):', error.message);
    return false;
  }
}

/**
 * Test multiple field search
 */
export async function testMultipleFieldSearch() {
  console.log('Testing multiple field search...');
  
  try {
    const multiResults = await dataFacade.searchByMultipleFields(
      'medic',
      {
        medicName: 'test',
        email: 'test'
      },
      10
    );
    console.log(`Multiple field search found ${multiResults.length} results`);
    return true;
  } catch (error) {
    console.log('Multiple field search failed (expected if API is not available):', error.message);
    return false;
  }
}

// Export for use in browser console or other test files
export default {
  testSearchFunctionality,
  testFuzzySearch,
  testMultipleFieldSearch
};
