// Debug script to check auth token handling
console.log('=== DEBUG AUTH TOKEN HANDLING ===');

// Simulate localStorage data
const mockLocalStorage = {
  'cognito-data': JSON.stringify({
    id_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    refresh_token: 'demo-refresh-token',
    profile: {
      email: 'demo@cabinet-popescu.ro',
      name: 'Demo User',
      sub: 'user-123'
    }
  })
};

// Mock localStorage.getItem
global.localStorage = {
  getItem: (key) => mockLocalStorage[key] || null
};

// Test current apiClient logic
function testApiClientLogic() {
  console.log('\n--- Testing apiClient logic ---');
  
  const resourceType = 'auth';
  let authToken = null;
  
  if (resourceType !== 'business-info') {
    const savedCognitoData = localStorage.getItem('cognito-data');
    console.log('savedCognitoData:', savedCognitoData);
    
    if (savedCognitoData) {
      const userData = JSON.parse(savedCognitoData);
      console.log('userData:', userData);
      authToken = userData.access_token || userData.id_token;
      console.log('authToken selected:', authToken);
    }
  }
  
  const headers = {
    "Content-Type": "application/json",
    "X-Resource-Type": resourceType,
    ...(authToken && { "Authorization": `Bearer ${authToken}` }),
  };
  
  console.log('Final headers:', headers);
  return headers;
}

// Test AuthInvoker logic
function testAuthInvokerLogic() {
  console.log('\n--- Testing AuthInvoker logic ---');
  
  const savedCognitoData = localStorage.getItem('cognito-data');
  console.log('savedCognitoData:', savedCognitoData);
  
  if (savedCognitoData) {
    const userData = JSON.parse(savedCognitoData);
    console.log('userData:', userData);
    
    const accessToken = userData.access_token || userData.id_token || null;
    console.log('accessToken from AuthInvoker:', accessToken);
    
    const userId = userData.profile?.sub || userData.user?.id || null;
    console.log('userId from AuthInvoker:', userId);
    
    return { accessToken, userId };
  }
  
  return { accessToken: null, userId: null };
}

// Run tests
const apiHeaders = testApiClientLogic();
const authData = testAuthInvokerLogic();

console.log('\n=== SUMMARY ===');
console.log('API Headers:', apiHeaders);
console.log('Auth Data:', authData);

// Check if tokens are valid JWT format
function isValidJWT(token) {
  if (!token) return false;
  const parts = token.split('.');
  return parts.length === 3;
}

console.log('\nToken validation:');
console.log('API token is valid JWT:', isValidJWT(apiHeaders.Authorization?.replace('Bearer ', '')));
console.log('AuthInvoker token is valid JWT:', isValidJWT(authData.accessToken));
