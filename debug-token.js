// Debug script to check token validity
console.log('=== DEBUG TOKEN VALIDITY ===');

// Check localStorage data
const savedCognitoData = localStorage.getItem('cognito-data');
console.log('Stored cognito-data:', savedCognitoData);

if (savedCognitoData) {
  try {
    const userData = JSON.parse(savedCognitoData);
    console.log('Parsed user data:', userData);
    
    const authToken = userData.id_token || userData.access_token;
    console.log('Auth token:', authToken);
    
    if (authToken) {
      // Decode JWT token to check expiration
      try {
        const payload = JSON.parse(atob(authToken.split('.')[1]));
        console.log('Token payload:', payload);
        
        const expiration = payload.exp * 1000; // Convert to milliseconds
        const now = Date.now();
        const isExpired = now >= expiration;
        const timeUntilExpiry = expiration - now;
        
        console.log('Token expiration:', new Date(expiration));
        console.log('Current time:', new Date(now));
        console.log('Is expired:', isExpired);
        console.log('Time until expiry (minutes):', Math.round(timeUntilExpiry / 60000));
        
        if (isExpired) {
          console.log('❌ Token is expired!');
        } else if (timeUntilExpiry < 300000) { // 5 minutes
          console.log('⚠️ Token expires soon (within 5 minutes)');
        } else {
          console.log('✅ Token is valid');
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    } else {
      console.log('❌ No auth token found');
    }
  } catch (error) {
    console.error('Error parsing cognito-data:', error);
  }
} else {
  console.log('❌ No cognito-data found in localStorage');
}

// Check other auth-related localStorage items
console.log('\n=== OTHER AUTH DATA ===');
console.log('auth-token:', localStorage.getItem('auth-token'));
console.log('user-email:', localStorage.getItem('user-email'));
console.log('auth-provider:', localStorage.getItem('auth-provider'));
console.log('remember-me:', localStorage.getItem('remember-me'));
console.log('session-timestamp:', localStorage.getItem('session-timestamp'));
