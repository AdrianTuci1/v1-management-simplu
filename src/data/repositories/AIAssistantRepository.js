/**
 * AI Assistant Repository - Repository pentru gestionarea sesiunilor și mesajelor AI Assistant
 * 
 * Acest repository gestionează:
 * - Sesiunile AI Assistant
 * - Istoricul mesajelor
 * - Statisticile sesiunilor
 * - Exportul datelor
 */

import { db } from '../infrastructure/db.js';
import { aiApiRequest } from '../infrastructure/apiClient.js';
import { getConfig } from '../../config/aiAssistantConfig.js';

export class AIAssistantRepository {
  constructor() {
    this.resourceType = 'aiAssistant';
    this.store = 'aiAssistantSessions';
    this.messagesStore = 'aiAssistantMessages';
    this.isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
  }

  // ========================================
  // SESSION MANAGEMENT
  // ========================================

  /**
   * Încarcă sesiunea de astăzi
   */
  async loadTodaySession(businessId, userId, locationId = null) {
    try {
      const sessionId = this.generateSessionId(businessId, userId);
      
      if (this.isDemoMode) {
        // În modul demo, returnează date mock
        const mockSession = {
          sessionId,
          businessId,
          userId,
          locationId: locationId || getConfig('DEFAULTS.LOCATION_ID'),
          startTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          status: 'active',
          messageCount: 1
        };
        
        await db.table(this.store).put(mockSession);
        return mockSession;
      }

      // Încarcă istoricul mesajelor
      await this.loadMessageHistory(sessionId);
      
      return { sessionId };
    } catch (error) {
      console.error('Failed to load today session:', error);
      throw error;
    }
  }

  /**
   * Încarcă istoricul mesajelor pentru o sesiune
   */
  async loadMessageHistory(sessionId, limit = null, before = null) {
    try {
      if (this.isDemoMode) {
        // În modul demo, returnează mesaje mock
        const mockMessages = [
          {
            messageId: 'demo-msg-1',
            sessionId: sessionId,
            content: 'Bună! Sunt AI Assistant-ul în modul demo. Cum vă pot ajuta astăzi?',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            type: 'assistant'
          }
        ];
        
        await db.table(this.messagesStore).bulkPut(mockMessages);
        return mockMessages;
      }

      let endpoint = `${getConfig('API_ENDPOINTS.SESSIONS')}/${sessionId}/messages`;
      
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit);
      if (before) params.append('before', before);
      
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }
      
      const data = await aiApiRequest(endpoint);
      const messages = data.messages || [];
      
      // Salvează mesajele în IndexedDB
      if (messages.length > 0) {
        await db.table(this.messagesStore).bulkPut(messages);
      }
      
      return messages;
    } catch (error) {
      console.error('Failed to load message history:', error);
      throw error;
    }
  }

  /**
   * Trimite un mesaj către AI
   */
  async sendMessage(sessionId, content, context = {}, businessId, userId, locationId) {
    try {
      if (this.isDemoMode) {
        // În modul demo, returnează răspuns mock
        const mockResponse = {
          message: "Aceasta este o răspuns demo de la AI Assistant. În modul demo, toate funcționalitățile AI sunt simulate.",
          timestamp: new Date().toISOString(),
          sessionId: sessionId
        };
        
        // Simulează răspuns asincron
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              status: 'success',
              data: mockResponse
            });
          }, 1000);
        });
      }

      const messageData = {
        businessId,
        locationId,
        userId,
        message: content.trim(),
        sessionId,
        timestamp: new Date().toISOString(),
        context: context
      };

      const result = await aiApiRequest(getConfig('API_ENDPOINTS.MESSAGES'), {
        method: 'POST',
        body: JSON.stringify(messageData),
      });
      
      if (result.status === 'success') {
        // Adaugă mesajul utilizatorului în istoric
        const userMessage = {
          messageId: result.messageId || result.message?.messageId || `user_${Date.now()}`,
          sessionId,
          businessId,
          userId,
          content: content.trim(),
          type: 'user',
          timestamp: new Date().toISOString(),
          metadata: { source: 'api' }
        };
        
        await db.table(this.messagesStore).put(userMessage);
        
        return result;
      } else {
        throw new Error(result.message || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Obține sesiunea activă pentru un utilizator
   */
  async getActiveSessionForUser(businessId, userId) {
    try {
      if (this.isDemoMode) {
        return {
          sessionId: 'demo-session-1',
          businessId: businessId,
          userId: userId,
          startTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          status: 'active'
        };
      }

      const endpoint = `${getConfig('API_ENDPOINTS.SESSIONS')}/business/${businessId}/user/${userId}/active`;
      const data = await aiApiRequest(endpoint);
      
      return data.session || null;
    } catch (error) {
      console.error('Failed to get active session for user:', error);
      throw error;
    }
  }

  /**
   * Obține istoricul sesiunilor pentru un utilizator
   */
  async getUserSessionHistory(businessId, userId, limit = 20) {
    try {
      if (this.isDemoMode) {
        return {
          sessions: [
            {
              sessionId: 'demo-session-1',
              businessId: businessId,
              userId: userId,
              startTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
              endTime: null,
              status: 'active',
              messageCount: 5
            },
            {
              sessionId: 'demo-session-2',
              businessId: businessId,
              userId: userId,
              startTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
              endTime: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
              status: 'resolved',
              messageCount: 12
            }
          ],
          total: 2
        };
      }

      const endpoint = `${getConfig('API_ENDPOINTS.SESSIONS')}/business/${businessId}/user/${userId}/history?limit=${limit}`;
      const data = await aiApiRequest(endpoint);
      
      return data;
    } catch (error) {
      console.error('Failed to get user session history:', error);
      throw error;
    }
  }

  /**
   * Obține sesiunile active pentru business
   */
  async getActiveSessions(businessId) {
    try {
      if (this.isDemoMode) {
        return {
          activeSessions: [
            {
              sessionId: 'demo-session-1',
              businessId: businessId,
              userId: 'demo-user',
              startTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
              status: 'active'
            }
          ]
        };
      }

      const endpoint = `${getConfig('API_ENDPOINTS.SESSIONS')}/business/${businessId}/active`;
      const data = await aiApiRequest(endpoint);
      
      return data.activeSessions || [];
    } catch (error) {
      console.error('Failed to get active sessions:', error);
      throw error;
    }
  }

  /**
   * Obține o sesiune specifică după ID
   */
  async getSessionById(sessionId) {
    try {
      if (this.isDemoMode) {
        return {
          sessionId: sessionId,
          businessId: 'demo-business',
          userId: 'demo-user',
          startTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          endTime: null,
          status: 'active',
          messageCount: 5
        };
      }

      const endpoint = `${getConfig('API_ENDPOINTS.SESSIONS')}/${sessionId}`;
      const data = await aiApiRequest(endpoint);
      
      return data.session || null;
    } catch (error) {
      console.error('Failed to get session by ID:', error);
      throw error;
    }
  }

  /**
   * Încarcă o sesiune specifică și mesajele sale
   */
  async loadSession(sessionId) {
    try {
      // Obține informațiile sesiunii
      const session = await this.getSessionById(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Încarcă mesajele sesiunii
      const messages = await this.loadMessageHistory(sessionId);
      
      return {
        session,
        messages
      };
    } catch (error) {
      console.error('Failed to load session:', error);
      throw error;
    }
  }

  /**
   * Închide o sesiune
   */
  async closeSession(sessionId, status = 'resolved') {
    try {
      if (this.isDemoMode) {
        // În modul demo, marchează sesiunea ca închisă
        const session = await db.table(this.store).get(sessionId);
        if (session) {
          session.status = status;
          await db.table(this.store).put(session);
        }
        return true;
      }

      const url = `${getConfig('API_ENDPOINTS.SESSIONS')}/${sessionId}`;
      await aiApiRequest(url, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });

      return true;
    } catch (error) {
      console.error('Failed to close session:', error);
      throw error;
    }
  }

  /**
   * Obține statisticile sesiunilor
   */
  async getSessionStats(businessId) {
    try {
      if (this.isDemoMode) {
        return {
          totalSessions: 15,
          activeSessions: 1,
          messagesToday: 42,
          averageResponseTime: 1.2
        };
      }

      const endpoint = `${getConfig('API_ENDPOINTS.SESSIONS')}/business/${businessId}/stats`;
      const data = await aiApiRequest(endpoint);
      
      return data;
    } catch (error) {
      console.error('Failed to get session statistics:', error);
      throw error;
    }
  }

  // ========================================
  // MESSAGE SEARCH AND EXPORT
  // ========================================

  /**
   * Caută mesaje în sesiunea curentă
   */
  async searchMessages(sessionId, query, limit = 20) {
    try {
      if (this.isDemoMode) {
        console.log('Demo mode: Mock message search');
        return {
          messages: [
            {
              messageId: 'demo-msg-1',
              content: 'Exemplu de mesaj găsit în căutare',
              timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString()
            }
          ],
          totalFound: 1
        };
      }

      const url = new URL(`${getConfig('API_ENDPOINTS.SESSIONS')}/${sessionId}/search`);
      url.searchParams.append('q', query);
      url.searchParams.append('limit', limit);
      
      const data = await aiApiRequest(url.toString());
      
      return data.messages || [];
    } catch (error) {
      console.error('Failed to search messages:', error);
      throw error;
    }
  }

  /**
   * Exportă datele sesiunii
   */
  async exportSession(sessionId, format = 'json') {
    try {
      if (this.isDemoMode) {
        // În modul demo, returnează date mock
        return {
          sessionId,
          format,
          data: {
            messages: await db.table(this.messagesStore).filter(msg => msg.sessionId === sessionId).toArray(),
            sessionInfo: await db.table(this.store).get(sessionId)
          }
        };
      }

      const url = new URL(`${getConfig('API_ENDPOINTS.SESSIONS')}/${sessionId}/export`);
      url.searchParams.append('format', format);
      
      const data = await aiApiRequest(url.toString());
      
      if (format === 'json') {
        return data;
      } else {
        // Pentru formate non-JSON, returnează datele așa cum sunt
        return data;
      }
    } catch (error) {
      console.error('Failed to export session:', error);
      throw error;
    }
  }

  // ========================================
  // LOCAL DATA MANAGEMENT
  // ========================================

  /**
   * Obține mesajele din sesiunea curentă din IndexedDB
   */
  async getLocalMessages(sessionId, limit = 50) {
    try {
      const messages = await db.table(this.messagesStore)
        .filter(msg => msg.sessionId === sessionId)
        .reverse()
        .limit(limit)
        .toArray();
      
      return messages.reverse(); // Reverse back to chronological order
    } catch (error) {
      console.error('Failed to get local messages:', error);
      return [];
    }
  }

  /**
   * Adaugă un mesaj în IndexedDB
   */
  async addLocalMessage(message) {
    try {
      await db.table(this.messagesStore).put(message);
      return message;
    } catch (error) {
      console.error('Failed to add local message:', error);
      throw error;
    }
  }

  /**
   * Obține sesiunea din IndexedDB
   */
  async getLocalSession(sessionId) {
    try {
      return await db.table(this.store).get(sessionId);
    } catch (error) {
      console.error('Failed to get local session:', error);
      return null;
    }
  }

  /**
   * Salvează sesiunea în IndexedDB
   */
  async saveLocalSession(session) {
    try {
      await db.table(this.store).put(session);
      return session;
    } catch (error) {
      console.error('Failed to save local session:', error);
      throw error;
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Generează ID-ul sesiunii pentru sesiuni zilnice
   */
  generateSessionId(businessId, userId) {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return `${businessId}:${userId}:${startOfDay.getTime()}`;
  }

  /**
   * Parsează ID-ul sesiunii
   */
  parseSessionId(sessionId) {
    const parts = sessionId.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid session ID format');
    }
    
    return {
      businessId: parts[0],
      userId: parts[1],
      timestamp: parseInt(parts[2])
    };
  }

  /**
   * Verifică dacă ID-ul sesiunii este valid
   */
  isValidSessionId(sessionId) {
    try {
      this.parseSessionId(sessionId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Curăță datele vechi din IndexedDB
   */
  async cleanupOldData(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      const cutoffTimestamp = cutoffDate.getTime();

      // Șterge mesajele vechi
      const oldMessages = await db.table(this.messagesStore)
        .filter(msg => new Date(msg.timestamp).getTime() < cutoffTimestamp)
        .toArray();
      
      if (oldMessages.length > 0) {
        await db.table(this.messagesStore).bulkDelete(oldMessages.map(msg => msg.messageId));
      }

      // Șterge sesiunile vechi
      const oldSessions = await db.table(this.store)
        .filter(session => {
          const sessionTime = this.parseSessionId(session.sessionId).timestamp;
          return sessionTime < cutoffTimestamp;
        })
        .toArray();
      
      if (oldSessions.length > 0) {
        await db.table(this.store).bulkDelete(oldSessions.map(session => session.sessionId));
      }

      console.log(`Cleaned up ${oldMessages.length} old messages and ${oldSessions.length} old sessions`);
    } catch (error) {
      console.error('Failed to cleanup old data:', error);
    }
  }
}

// Export singleton instance
export const aiAssistantRepository = new AIAssistantRepository();

// Export class for custom instances
export default AIAssistantRepository;
