// External API Service for OAuth and third-party integrations
// Based on EXTERNAL_APIS_REACT_CLIENT.md

class ExternalApiService {
  constructor() {
    // Use the same base URL pattern as other services
    this.baseUrl = 'http://localhost:3003';
  }

  // Get business and user IDs from storage (following existing patterns)
  getBusinessId() {
    const selectedBusinessId = localStorage.getItem('selected-business-id');
    return selectedBusinessId || 'B010001';
  }

  getUserId() {
    const savedCognitoData = localStorage.getItem('cognito-data');
    if (savedCognitoData) {
      const userData = JSON.parse(savedCognitoData);
      return userData.profile?.sub || userData.user?.id || null;
    }
    return null;
  }

  getLocationId() {
    const selectedLocation = localStorage.getItem('selected-location');
    if (selectedLocation) {
      try {
        const locationData = JSON.parse(selectedLocation);
        return locationData.id || 'L0100001';
      } catch (error) {
        console.error('Error parsing selected-location:', error);
        return 'L0100001';
      }
    }
    return 'L0100001';
  }

  // Gmail OAuth integration
  async getGmailAuthUrl(redirectUrl = null) {
    const businessId = this.getBusinessId();
    const locationId = this.getLocationId();
    
    if (!locationId) {
      throw new Error('Location ID not available for Gmail authorization');
    }

    // Use current window location as default redirect URL if not provided
    const defaultRedirectUrl = redirectUrl || window.location.origin + '/dashboard';
    
    const url = `${this.baseUrl}/external/gmail/auth-url?businessId=${encodeURIComponent(businessId)}&locationId=${encodeURIComponent(locationId)}&redirectUrl=${encodeURIComponent(defaultRedirectUrl)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Failed to get Gmail auth URL: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    if (!data?.url) {
      throw new Error('No auth URL returned from server');
    }

    return data.url;
  }

  async connectGmail() {
    try {
      // Pass current window location as redirect URL
      const currentUrl = window.location.href;
      const authUrl = await this.getGmailAuthUrl(currentUrl);
      // Redirect to Google OAuth
      window.location.href = authUrl;
    } catch (error) {
      console.error('Gmail connection error:', error);
      throw error;
    }
  }

  // Meta (Facebook/Instagram) OAuth integration
  async getMetaAuthUrl() {
    const businessId = this.getBusinessId();
    const locationId = this.getLocationId();
    
    if (!locationId) {
      throw new Error('Location ID not available for Meta authorization');
    }

    const url = `${this.baseUrl}/external/meta/auth-url?businessId=${encodeURIComponent(businessId)}&locationId=${encodeURIComponent(locationId)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Failed to get Meta auth URL: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    if (!data?.url) {
      throw new Error('No auth URL returned from server');
    }

    return data.url;
  }

  async connectMeta() {
    try {
      const authUrl = await this.getMetaAuthUrl();
      // Redirect to Meta OAuth
      window.location.href = authUrl;
    } catch (error) {
      console.error('Meta connection error:', error);
      throw error;
    }
  }

  // ElevenLabs Voice Agent integration
  async createElevenLabsSession() {
    const url = `${this.baseUrl}/external/voice/elevenlabs/session`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Failed to create ElevenLabs session: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    if (!data?.key) {
      throw new Error('No ephemeral key returned from server');
    }

    return data.key;
  }

  // Check service authorization status
  async checkServiceStatus(serviceName) {
    const businessId = this.getBusinessId();
    const locationId = this.getLocationId();
    
    if (!locationId) {
      return { authorized: false, error: 'Location ID not available' };
    }

    try {
      const url = `${this.baseUrl}/external/${serviceName}/status?businessId=${encodeURIComponent(businessId)}&locationId=${encodeURIComponent(locationId)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Handle both 'authorized' and 'connected' properties for different services
        const isAuthorized = data.authorized || data.connected || false;
        return { authorized: isAuthorized, data };
      } else {
        return { authorized: false, error: `Status check failed: ${response.status}` };
      }
    } catch (error) {
      console.error(`Error checking ${serviceName} status:`, error);
      return { authorized: false, error: error.message };
    }
  }

  // Check all services status
  async checkAllServicesStatus() {
    const services = ['gmail', 'meta'];
    const results = {};

    for (const service of services) {
      results[service] = await this.checkServiceStatus(service);
    }

    return results;
  }
}

export default new ExternalApiService();
