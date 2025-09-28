/**
 * AI Assistant Command - Comandă pentru operațiuni AI Assistant
 * 
 * Această comandă gestionează operațiunile specifice AI Assistant:
 * - Trimiterea mesajelor
 * - Gestionarea sesiunilor
 * - Căutarea în mesaje
 * - Exportul sesiunilor
 */

import { Command } from './Command.js';
import { createWebSocketAIAssistant } from '../infrastructure/websocketAiAssistant.js';

export class AIAssistantCommand extends Command {
  constructor(operation, data = {}) {
    super();
    this.operation = operation;
    this.data = data;
    this.result = null;
    this.error = null;
  }

  /**
   * Execută comanda AI Assistant
   */
  async execute() {
    try {
      const { businessId, userId, locationId } = this.data;
      
      if (!businessId || !userId) {
        throw new Error('BusinessId and UserId are required');
      }

      // Creează instanța WebSocket AI Assistant
      const aiAssistant = createWebSocketAIAssistant(businessId, userId, locationId);

      // Execută operațiunea specifică
      switch (this.operation) {
        case 'send_message':
          this.result = await this.sendMessage(aiAssistant);
          break;
          
        case 'connect':
          this.result = await this.connect(aiAssistant);
          break;
          
        case 'disconnect':
          this.result = await this.disconnect(aiAssistant);
          break;
          
        case 'set_session':
          this.result = await this.setSession(aiAssistant);
          break;
          
        case 'get_status':
          this.result = await this.getStatus(aiAssistant);
          break;
          
        case 'generate_session_id':
          this.result = await this.generateSessionId(aiAssistant);
          break;
          
        default:
          throw new Error(`Unknown AI Assistant operation: ${this.operation}`);
      }

      return this.result;
    } catch (error) {
      this.error = error;
      throw error;
    }
  }

  // ========================================
  // OPERATION IMPLEMENTATIONS
  // ========================================

  /**
   * Trimite un mesaj prin AI Assistant
   */
  async sendMessage(aiAssistant) {
    const { content, context = {} } = this.data;
    
    if (!content) {
      throw new Error('Message content is required');
    }

    // Setează callback-urile pentru mesaje
    aiAssistant.onMessageReceived = (messages) => {
      console.log('AI Assistant message received:', messages);
    };

    aiAssistant.onError = (error, details) => {
      console.error('AI Assistant error:', error, details);
    };

    // Conectează dacă nu este conectat
    if (!aiAssistant.isConnected()) {
      await aiAssistant.connect();
    }

    // Trimite mesajul
    const success = aiAssistant.sendMessage(content, context);
    
    return {
      success,
      message: content,
      context,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Conectează AI Assistant
   */
  async connect(aiAssistant) {
    // Setează callback-urile
    aiAssistant.onConnectionChange = (isConnected) => {
      console.log('AI Assistant connection changed:', isConnected);
    };

    aiAssistant.onError = (error, details) => {
      console.error('AI Assistant connection error:', error, details);
    };

    await aiAssistant.connect();
    
    return {
      success: true,
      status: aiAssistant.getConnectionStatus(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Deconectează AI Assistant
   */
  async disconnect(aiAssistant) {
    aiAssistant.disconnect();
    
    return {
      success: true,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Setează sesiunea curentă
   */
  async setSession(aiAssistant) {
    const { sessionId } = this.data;
    
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    aiAssistant.setCurrentSessionId(sessionId);
    
    return {
      success: true,
      sessionId,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Obține statusul conexiunii
   */
  async getStatus(aiAssistant) {
    const status = aiAssistant.getConnectionStatus();
    
    return {
      success: true,
      status,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generează ID-ul sesiunii
   */
  async generateSessionId(aiAssistant) {
    const sessionId = aiAssistant.generateSessionId();
    
    return {
      success: true,
      sessionId,
      timestamp: new Date().toISOString()
    };
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Obține rezultatul comenzii
   */
  getResult() {
    return this.result;
  }

  /**
   * Obține eroarea comenzii
   */
  getError() {
    return this.error;
  }

  /**
   * Verifică dacă comanda a reușit
   */
  isSuccess() {
    return this.error === null && this.result !== null;
  }

  /**
   * Obține tipul operațiunii
   */
  getOperation() {
    return this.operation;
  }

  /**
   * Obține datele comenzii
   */
  getData() {
    return this.data;
  }
}

// Export class for custom instances
export default AIAssistantCommand;
