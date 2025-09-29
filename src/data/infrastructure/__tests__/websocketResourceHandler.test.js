/**
 * Integration test for WebSocket Resource Handler with DataFacade
 * This test verifies that the handler properly integrates with DataFacade
 * for querying resources and creating drafts, then broadcasting results back
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebSocketResourceHandler, websocketResourceHandler } from '../websocketResourceHandler.js';
import { dataFacade } from '../../DataFacade.js';

// Mock the DataFacade
vi.mock('../../DataFacade.js', () => ({
  dataFacade: {
    getRepository: vi.fn(),
    createDraft: vi.fn(),
    updateDraft: vi.fn(),
    commitDraft: vi.fn(),
    cancelDraft: vi.fn(),
    getDraftsBySession: vi.fn(),
    getDraftsByResourceType: vi.fn(),
    sendWebSocketMessage: vi.fn(),
    getWebSocketStatus: vi.fn()
  }
}));

describe('WebSocket Resource Handler Integration with DataFacade', () => {
  let handler;
  let mockRepository;

  beforeEach(() => {
    // Create fresh handler instance
    handler = new WebSocketResourceHandler();
    
    // Mock repository
    mockRepository = {
      query: vi.fn(),
      getById: vi.fn(),
      add: vi.fn(),
      update: vi.fn(),
      remove: vi.fn()
    };
    
    // Setup DataFacade mocks
    dataFacade.getRepository.mockReturnValue(mockRepository);
    dataFacade.createDraft.mockResolvedValue({ id: 'draft-123', status: 'created' });
    dataFacade.updateDraft.mockResolvedValue({ id: 'draft-123', status: 'updated' });
    dataFacade.commitDraft.mockResolvedValue({ id: 'draft-123', status: 'committed' });
    dataFacade.cancelDraft.mockResolvedValue({ id: 'draft-123', status: 'cancelled' });
    dataFacade.getDraftsBySession.mockResolvedValue([{ id: 'draft-123', sessionId: 'session-456' }]);
    dataFacade.getDraftsByResourceType.mockResolvedValue([{ id: 'draft-123', resourceType: 'patient' }]);
    dataFacade.sendWebSocketMessage.mockResolvedValue(true);
    dataFacade.getWebSocketStatus.mockReturnValue('connected');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Resource Querying', () => {
    test('should handle get_all_resources request', async () => {
      const mockResources = [
        { id: 'patient-1', name: 'John Doe' },
        { id: 'patient-2', name: 'Jane Smith' }
      ];
      mockRepository.query.mockResolvedValue(mockResources);

      const result = await handler.handleResourceQuery(
        'business-123',
        'session-456',
        'get_all_resources',
        { resourceType: 'patient' }
      );

      expect(mockRepository.query).toHaveBeenCalledWith({ resourceType: 'patient' });
      expect(dataFacade.sendWebSocketMessage).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data.results).toEqual(mockResources);
    });

    test('should handle get_resource_by_id request', async () => {
      const mockResource = { id: 'patient-1', name: 'John Doe' };
      mockRepository.getById.mockResolvedValue(mockResource);

      const result = await handler.handleResourceQuery(
        'business-123',
        'session-456',
        'get_resource_by_id',
        { resourceType: 'patient', id: 'patient-1' }
      );

      expect(mockRepository.getById).toHaveBeenCalledWith('patient-1');
      expect(dataFacade.sendWebSocketMessage).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data.results).toEqual(mockResource);
    });

    test('should handle search_resources request', async () => {
      const mockResults = [{ id: 'patient-1', name: 'John Doe' }];
      mockRepository.query.mockResolvedValue(mockResults);

      const result = await handler.handleResourceQuery(
        'business-123',
        'session-456',
        'search_resources',
        { resourceType: 'patient', query: 'John' }
      );

      expect(mockRepository.query).toHaveBeenCalledWith({ resourceType: 'patient', query: 'John', search: 'John' });
      expect(dataFacade.sendWebSocketMessage).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data.results).toEqual(mockResults);
    });

    test('should handle get_drafts request', async () => {
      const mockDrafts = [{ id: 'draft-123', sessionId: 'session-456' }];
      dataFacade.getDraftsBySession.mockResolvedValue(mockDrafts);

      const result = await handler.handleResourceQuery(
        'business-123',
        'session-456',
        'get_drafts',
        { resourceType: 'patient' }
      );

      expect(dataFacade.getDraftsBySession).toHaveBeenCalledWith('session-456');
      expect(dataFacade.sendWebSocketMessage).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data.results).toEqual(mockDrafts);
    });
  });

  describe('Draft Operations', () => {
    test('should handle create_draft operation', async () => {
      const draftData = {
        type: 'create_draft',
        sessionId: 'session-456',
        userId: 'user-789',
        draftData: {
          resourceType: 'patient',
          data: { name: 'John Doe', email: 'john@example.com' },
          locationId: 'location-123'
        }
      };

      const result = await handler.handleDraftOperation('business-123', draftData);

      expect(dataFacade.createDraft).toHaveBeenCalledWith(
        'patient',
        { name: 'John Doe', email: 'john@example.com' },
        'session-456'
      );
      expect(dataFacade.sendWebSocketMessage).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data.type).toBe('create_draft');
    });

    test('should handle update_draft operation', async () => {
      const draftData = {
        type: 'update_draft',
        sessionId: 'session-456',
        userId: 'user-789',
        draftData: {
          draftId: 'draft-123',
          data: { name: 'John Doe Updated' }
        }
      };

      const result = await handler.handleDraftOperation('business-123', draftData);

      expect(dataFacade.updateDraft).toHaveBeenCalledWith(
        'draft-123',
        { name: 'John Doe Updated' }
      );
      expect(dataFacade.sendWebSocketMessage).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data.type).toBe('update_draft');
    });

    test('should handle commit_draft operation', async () => {
      const draftData = {
        type: 'commit_draft',
        sessionId: 'session-456',
        userId: 'user-789',
        draftData: {
          draftId: 'draft-123'
        }
      };

      const result = await handler.handleDraftOperation('business-123', draftData);

      expect(dataFacade.commitDraft).toHaveBeenCalledWith('draft-123');
      expect(dataFacade.sendWebSocketMessage).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data.type).toBe('commit_draft');
    });

    test('should handle cancel_draft operation', async () => {
      const draftData = {
        type: 'cancel_draft',
        sessionId: 'session-456',
        userId: 'user-789',
        draftData: {
          draftId: 'draft-123'
        }
      };

      const result = await handler.handleDraftOperation('business-123', draftData);

      expect(dataFacade.cancelDraft).toHaveBeenCalledWith('draft-123');
      expect(dataFacade.sendWebSocketMessage).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data.type).toBe('cancel_draft');
    });
  });

  describe('Frontend Data Requests', () => {
    test('should handle frontend data requests', async () => {
      const result = await handler.requestFrontendDataViaWebSocket(
        'business-123',
        'session-456',
        'get_patient_list',
        { limit: 10, offset: 0 }
      );

      expect(dataFacade.sendWebSocketMessage).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data.type).toBe('frontend_data_request');
      expect(result.data.requestData.requestType).toBe('get_patient_list');
    });
  });

  describe('Error Handling', () => {
    test('should handle repository errors gracefully', async () => {
      mockRepository.query.mockRejectedValue(new Error('Database connection failed'));

      const result = await handler.handleResourceQuery(
        'business-123',
        'session-456',
        'get_all_resources',
        { resourceType: 'patient' }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });

    test('should handle draft operation errors gracefully', async () => {
      dataFacade.createDraft.mockRejectedValue(new Error('Draft creation failed'));

      const draftData = {
        type: 'create_draft',
        sessionId: 'session-456',
        userId: 'user-789',
        draftData: {
          resourceType: 'patient',
          data: { name: 'John Doe' }
        }
      };

      const result = await handler.handleDraftOperation('business-123', draftData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Draft creation failed');
    });
  });

  describe('Connection Status', () => {
    test('should return connection status', () => {
      const status = handler.getConnectionStatus();

      expect(status).toHaveProperty('facade');
      expect(status).toHaveProperty('activeConnections');
      expect(status.activeConnections).toBe(0);
    });
  });

  describe('Message ID Generation', () => {
    test('should generate unique message IDs', () => {
      const id1 = handler.generateMessageId();
      const id2 = handler.generateMessageId();

      expect(id1).toMatch(/^msg_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^msg_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('Singleton Export', () => {
    test('should export singleton instance', () => {
      expect(websocketResourceHandler).toBeInstanceOf(WebSocketResourceHandler);
      expect(websocketResourceHandler.facade).toBe(dataFacade);
    });
  });
});
