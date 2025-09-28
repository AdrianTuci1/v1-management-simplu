/**
 * Integration test for AI Assistant Services with SocketFacade
 * This test verifies that the services properly integrate with SocketFacade
 */

import { createAIAssistantService } from '../aiAssistantService.js';
import { createAIWebSocketService } from '../aiWebSocketService.js';
import { socketFacade } from '../../data/SocketFacade.js';

// Mock configuration
const mockConfig = {
  businessId: 'test-business-123',
  userId: 'test-user-456',
  locationId: 'test-location-789'
};

describe('AI Assistant Services Integration with SocketFacade', () => {
  let aiAssistantService;
  let aiWebSocketService;

  beforeEach(() => {
    // Initialize SocketFacade
    socketFacade.initialize();
    
    // Create service instances
    aiAssistantService = createAIAssistantService(
      mockConfig.businessId,
      mockConfig.userId,
      mockConfig.locationId
    );
    
    aiWebSocketService = createAIWebSocketService(
      mockConfig.businessId,
      mockConfig.userId,
      mockConfig.locationId
    );
  });

  afterEach(async () => {
    // Cleanup services
    if (aiAssistantService) {
      aiAssistantService.dispose();
    }
    
    if (aiWebSocketService) {
      await aiWebSocketService.dispose();
    }
    
    // Cleanup SocketFacade
    socketFacade.dispose();
  });

  test('AIAssistantService should have SocketFacade integration', () => {
    expect(aiAssistantService.socketFacade).toBeDefined();
    expect(aiAssistantService.socketFacade).toBe(socketFacade);
  });

  test('AIWebSocketService should have SocketFacade integration', () => {
    expect(aiWebSocketService.socketFacade).toBeDefined();
    expect(aiWebSocketService.socketFacade).toBe(socketFacade);
  });

  test('AIAssistantService should send session events via SocketFacade', async () => {
    // Mock the DataFacade methods
    const mockSessionId = 'test-session-123';
    aiAssistantService.dataFacade.loadTodayAIAssistantSession = jest.fn().mockResolvedValue({ sessionId: mockSessionId });
    aiAssistantService.dataFacade.loadAIAssistantMessageHistory = jest.fn().mockResolvedValue([]);
    
    // Mock SocketFacade methods
    const mockSendSessionLoaded = jest.fn();
    socketFacade.sendAIAssistantSessionLoaded = mockSendSessionLoaded;
    
    // Load today session
    await aiAssistantService.loadTodaySession();
    
    // Verify SocketFacade method was called
    expect(mockSendSessionLoaded).toHaveBeenCalledWith(
      mockConfig.businessId,
      mockConfig.userId,
      mockSessionId,
      mockConfig.locationId
    );
  });

  test('AIWebSocketService should connect via SocketFacade', async () => {
    // Mock SocketFacade methods
    const mockConnectResult = { success: true, status: 'connected' };
    const mockCreateResult = { isConnected: () => true };
    
    socketFacade.connectAIAssistant = jest.fn().mockResolvedValue(mockConnectResult);
    socketFacade.createAIAssistant = jest.fn().mockReturnValue(mockCreateResult);
    
    // Connect WebSocket service
    await aiWebSocketService.connect();
    
    // Verify SocketFacade methods were called
    expect(socketFacade.connectAIAssistant).toHaveBeenCalledWith(
      mockConfig.businessId,
      mockConfig.userId,
      mockConfig.locationId
    );
    
    expect(socketFacade.createAIAssistant).toHaveBeenCalledWith(
      mockConfig.businessId,
      mockConfig.userId,
      mockConfig.locationId
    );
  });

  test('AIWebSocketService should send messages via SocketFacade', async () => {
    // Mock connection
    aiWebSocketService.isConnected = true;
    
    // Mock SocketFacade method
    const mockSendResult = { success: true };
    socketFacade.sendAIAssistantMessage = jest.fn().mockResolvedValue(mockSendResult);
    
    // Send message
    const result = await aiWebSocketService.sendMessage('Test message', { context: 'test' });
    
    // Verify SocketFacade method was called
    expect(socketFacade.sendAIAssistantMessage).toHaveBeenCalledWith(
      mockConfig.businessId,
      mockConfig.userId,
      'Test message',
      { context: 'test' },
      mockConfig.locationId
    );
    
    expect(result).toBe(true);
  });

  test('Services should handle errors gracefully', async () => {
    // Mock SocketFacade to throw error
    socketFacade.connectAIAssistant = jest.fn().mockRejectedValue(new Error('Connection failed'));
    
    // Set up error handler
    const errorHandler = jest.fn();
    aiWebSocketService.onError = errorHandler;
    
    // Attempt connection
    await aiWebSocketService.connect();
    
    // Verify error handler was called
    expect(errorHandler).toHaveBeenCalled();
  });
});

// Export for use in other test files
export { mockConfig };
