// External API Service for OAuth and third-party integrations
// Based on EXTERNAL_APIS_REACT_CLIENT.md

class ExternalApiService {
  constructor() {
    // Use the same base URL pattern as other services
    this.baseUrl = 'http://localhost:3003';
  }

  // Get business and user IDs from storage (following existing patterns)
  getBusinessId() {
    const businessInfo = localStorage.getItem('business-info');
    if (businessInfo) {
      const parsed = JSON.parse(businessInfo);
      return parsed.businessId || 'B0100001';
    }
    return 'B0100001';
  }

  getUserId() {
    const savedCognitoData = localStorage.getItem('cognito-data');
    if (savedCognitoData) {
      const userData = JSON.parse(savedCognitoData);
      return userData.profile?.sub || userData.user?.id || null;
    }
    return null;
  }

  // Gmail OAuth integration
  async getGmailAuthUrl() {
    const businessId = this.getBusinessId();
    const userId = this.getUserId();
    
    if (!userId) {
      throw new Error('User ID not available for Gmail authorization');
    }

    const url = `${this.baseUrl}/external/gmail/auth-url?businessId=${encodeURIComponent(businessId)}&userId=${encodeURIComponent(userId)}`;
    
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
      const authUrl = await this.getGmailAuthUrl();
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
    const userId = this.getUserId();
    
    if (!userId) {
      throw new Error('User ID not available for Meta authorization');
    }

    const url = `${this.baseUrl}/external/meta/auth-url?businessId=${encodeURIComponent(businessId)}&userId=${encodeURIComponent(userId)}`;
    
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
    const userId = this.getUserId();
    
    if (!userId) {
      return { authorized: false, error: 'User ID not available' };
    }

    try {
      const url = `${this.baseUrl}/external/${serviceName}/status?businessId=${encodeURIComponent(businessId)}&userId=${encodeURIComponent(userId)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return { authorized: data.authorized || false, data };
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
