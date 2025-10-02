class ExternalServices {
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

  // Get AI Agent URL from environment or config
  getAiAgentUrl() {
    // In production, this would come from environment variables
    return process.env.REACT_APP_AI_AGENT_URL || 'http://localhost:3003';
  }

  // ========================================
  // EXTERNAL API CONFIGURATION
  // ========================================

  // Get external API configuration for a specific service
  async getExternalApiConfig(serviceType, locationId = 'default') {
    try {
      const businessId = this.getBusinessId();
      const response = await fetch(
        `${this.getAiAgentUrl()}/external-api-config/${businessId}/${serviceType}?locationId=${locationId}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return this.getDefaultServiceConfig(serviceType);
        }
        throw new Error(`Failed to get ${serviceType} configuration: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error getting ${serviceType} configuration:`, error);
      return this.getDefaultServiceConfig(serviceType);
    }
  }

  // Save external API configuration for a specific service
  async saveExternalApiConfig(serviceType, config, locationId = 'default') {
    try {
      const businessId = this.getBusinessId();
      const response = await fetch(
        `${this.getAiAgentUrl()}/external-api-config/${businessId}/${serviceType}?locationId=${locationId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to save ${serviceType} configuration: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error saving ${serviceType} configuration:`, error);
      throw error;
    }
  }

  // Get default configuration for a service type
  getDefaultServiceConfig(serviceType) {
    const defaults = {
      sms: {
        enabled: false,
        sendOnBooking: false,
        sendReminder: false,
        reminderTiming: 'day_before',
        defaultTemplate: 'default',
        templates: [{
          id: 'default',
          name: 'Template Implicit',
          content: 'Salut {{patientName}}! Programarea ta la {{businessName}} este confirmată pentru {{appointmentDate}} la ora {{appointmentTime}}. Te așteptăm!',
          variables: ['patientName', 'businessName', 'appointmentDate', 'appointmentTime']
        }]
      },
      email: {
        enabled: false,
        sendOnBooking: false,
        sendReminder: false,
        reminderTiming: 'day_before',
        senderName: '',
        defaultTemplate: 'default',
        templates: [{
          id: 'default',
          name: 'Template Implicit Email',
          subject: 'Confirmare programare - {{businessName}}',
          content: 'Salut {{patientName}},\n\nProgramarea ta la {{businessName}} este confirmată pentru {{appointmentDate}} la ora {{appointmentTime}}.\n\nTe așteptăm!\n\nCu respect,\nEchipa {{businessName}}',
          variables: ['patientName', 'businessName', 'appointmentDate', 'appointmentTime']
        }]
      },
      voiceAgent: {
        enabled: false,
        voiceId: 'default',
        language: 'ro',
        greetingMessage: 'Salut! Sunt asistentul vocal al {{businessName}}. Cu ce vă pot ajuta?',
        settings: {
          speed: 1.0,
          pitch: 1.0,
          volume: 1.0,
          autoAnswer: false,
          recordConversations: false
        }
      },
      meta: {
        enabled: false,
        platforms: ['facebook', 'instagram'],
        autoReply: false,
        replyMessage: 'Mulțumim pentru mesaj! Vă vom răspunde în cel mai scurt timp.',
        businessHours: true
      }
    };

    return defaults[serviceType] || {};
  }

  // ========================================
  // OAUTH AND AUTHORIZATION
  // ========================================

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

  // ========================================
  // SERVICE STATUS CHECKING
  // ========================================

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

  // ========================================
  // UTILITY METHODS
  // ========================================

  // Get available locations (placeholder - would come from business service)
  getAvailableLocations() {
    // This would typically come from a business/location service
    return [
      { id: 'default', name: 'Configurație Generală' },
      // Add more locations as needed
    ];
  }
}

export const externalServices = new ExternalServices();
export default externalServices;
