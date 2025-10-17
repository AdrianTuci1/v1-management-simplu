class ExternalServices {
  constructor() {
    // Use the same base URL pattern as other services
    this.baseUrl = 'http://localhost:3003';
  }

  // Get business and user IDs from storage (following existing patterns)
  getBusinessId() {
    const selectedBusinessId = localStorage.getItem('selected-business-id');
    return selectedBusinessId || 'B010001';
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
  async getExternalApiConfig(serviceType) {
    try {
      const businessId = this.getBusinessId();
      const locationId = this.getLocationId();
      
      // Ensure locationId is properly encoded
      const encodedLocationId = encodeURIComponent(locationId);
      const response = await fetch(
        `${this.getAiAgentUrl()}/external-api-config/${businessId}?locationId=${encodedLocationId}`,
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

      const fullConfig = await response.json();
      
      // Extract the specific service configuration from the full config
      if (serviceType === 'sms' && fullConfig.sms) {
        return fullConfig.sms;
      } else if (serviceType === 'email' && fullConfig.email) {
        return fullConfig.email;
      } else {
        return this.getDefaultServiceConfig(serviceType);
      }
    } catch (error) {
      console.error(`Error getting ${serviceType} configuration:`, error);
      return this.getDefaultServiceConfig(serviceType);
    }
  }

  // Save external API configuration for a specific service
  async saveExternalApiConfig(serviceType, config) {
    try {
      const businessId = this.getBusinessId();
      const locationId = this.getLocationId();
      
      // First, get the current full configuration
      const currentConfig = await this.getFullExternalApiConfig(businessId);
      
      // Update only the specific service configuration
      const updatePayload = {
        [serviceType]: config
      };

      // Ensure locationId is properly encoded
      const encodedLocationId = encodeURIComponent(locationId);
      const response = await fetch(
        `${this.getAiAgentUrl()}/external-api-config/${businessId}?locationId=${encodedLocationId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to save ${serviceType} configuration: ${response.status}`);
      }

      const fullConfig = await response.json();
      return fullConfig[serviceType] || config;
    } catch (error) {
      console.error(`Error saving ${serviceType} configuration:`, error);
      throw error;
    }
  }

  // Get full external API configuration (helper method)
  async getFullExternalApiConfig(businessId) {
    try {
      const locationId = this.getLocationId();
      
      // Ensure locationId is properly encoded
      const encodedLocationId = encodeURIComponent(locationId);
      const response = await fetch(
        `${this.getAiAgentUrl()}/external-api-config/${businessId}?locationId=${encodedLocationId}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.ok) {
        return await response.json();
      } else if (response.status === 404) {
        // Return default full configuration
        return {
          businessId,
          locationId,
          sms: this.getDefaultServiceConfig('sms'),
          email: this.getDefaultServiceConfig('email'),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1
        };
      } else {
        throw new Error(`Failed to get full configuration: ${response.status}`);
      }
    } catch (error) {
      console.error('Error getting full external API configuration:', error);
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

    // Get current app URL for redirect after OAuth
    const redirectUri = window.location.origin;
    
    const url = `${this.baseUrl}/external/meta/auth-url?businessId=${encodeURIComponent(businessId)}&locationId=${encodeURIComponent(locationId)}&redirectUri=${encodeURIComponent(redirectUri)}`;
    
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
      // Backend will handle the callback and redirect back to the app
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

  // ========================================
  // TOGGLE METHODS FOR SMS/EMAIL
  // ========================================

  // Toggle SMS service enabled/disabled
  async toggleSMSService(enabled) {
    try {
      const locationId = this.getLocationId();
      console.log(`Toggling SMS service to ${enabled} for locationId: ${locationId}`);
      const currentConfig = await this.getExternalApiConfig('sms');
      const updatedConfig = { ...currentConfig, enabled };
      const result = await this.saveExternalApiConfig('sms', updatedConfig);
      console.log('SMS toggle result:', result);
      return result;
    } catch (error) {
      console.error('Error toggling SMS service:', error);
      throw error;
    }
  }

  // Toggle Email service enabled/disabled
  async toggleEmailService(enabled) {
    try {
      const locationId = this.getLocationId();
      console.log(`Toggling Email service to ${enabled} for locationId: ${locationId}`);
      const currentConfig = await this.getExternalApiConfig('email');
      const updatedConfig = { ...currentConfig, enabled };
      const result = await this.saveExternalApiConfig('email', updatedConfig);
      console.log('Email toggle result:', result);
      return result;
    } catch (error) {
      console.error('Error toggling Email service:', error);
      throw error;
    }
  }

  // ========================================
  // TEMPLATE MANAGEMENT
  // ========================================

  // Add SMS template
  async addSmsTemplate(template) {
    try {
      const businessId = this.getBusinessId();
      const locationId = this.getLocationId();
      const encodedLocationId = encodeURIComponent(locationId);

      const response = await fetch(
        `${this.getAiAgentUrl()}/external-api-config/${businessId}/sms/templates?locationId=${encodedLocationId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(template)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to add SMS template: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding SMS template:', error);
      throw error;
    }
  }

  // Add Email template
  async addEmailTemplate(template) {
    try {
      const businessId = this.getBusinessId();
      const locationId = this.getLocationId();
      const encodedLocationId = encodeURIComponent(locationId);

      const response = await fetch(
        `${this.getAiAgentUrl()}/external-api-config/${businessId}/email/templates?locationId=${encodedLocationId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(template)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to add Email template: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding Email template:', error);
      throw error;
    }
  }

  // Update SMS template
  async updateSmsTemplate(templateId, template) {
    try {
      const businessId = this.getBusinessId();
      const locationId = this.getLocationId();
      const encodedLocationId = encodeURIComponent(locationId);

      const response = await fetch(
        `${this.getAiAgentUrl()}/external-api-config/${businessId}/sms/templates/${templateId}?locationId=${encodedLocationId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(template)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update SMS template: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating SMS template:', error);
      throw error;
    }
  }

  // Update Email template
  async updateEmailTemplate(templateId, template) {
    try {
      const businessId = this.getBusinessId();
      const locationId = this.getLocationId();
      const encodedLocationId = encodeURIComponent(locationId);

      const response = await fetch(
        `${this.getAiAgentUrl()}/external-api-config/${businessId}/email/templates/${templateId}?locationId=${encodedLocationId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(template)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update Email template: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating Email template:', error);
      throw error;
    }
  }

  // Delete SMS template
  async deleteSmsTemplate(templateId) {
    try {
      const businessId = this.getBusinessId();
      const locationId = this.getLocationId();
      const encodedLocationId = encodeURIComponent(locationId);

      const response = await fetch(
        `${this.getAiAgentUrl()}/external-api-config/${businessId}/sms/templates/${templateId}?locationId=${encodedLocationId}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete SMS template: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting SMS template:', error);
      throw error;
    }
  }

  // Delete Email template
  async deleteEmailTemplate(templateId) {
    try {
      const businessId = this.getBusinessId();
      const locationId = this.getLocationId();
      const encodedLocationId = encodeURIComponent(locationId);

      const response = await fetch(
        `${this.getAiAgentUrl()}/external-api-config/${businessId}/email/templates/${templateId}?locationId=${encodedLocationId}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete Email template: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting Email template:', error);
      throw error;
    }
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
