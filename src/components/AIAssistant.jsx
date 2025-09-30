import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, Send, User, X, Wifi, WifiOff, Settings, Download, Search, Plus, History, Calendar } from 'lucide-react';
import { useAIAssistantStore } from '../stores/aiAssistantStore';
import { AIAssistant, AIAssistantHeader, AIAssistantBody, AIAssistantFooter } from './ui/ai-assistant';
import { Button } from './ui/button';
import { useAIAssistant } from '../hooks/useAIAssistant';
import { getConfig } from '../config/aiAssistantConfig';

const AIAssistantComponent = ({ onClose }) => {
  // Nu mai folosim store-ul intern, ci props-urile primite
  const isOpen = true; // Întotdeauna deschis când este renderizat prin drawer
  const [inputValue, setInputValue] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showSessionHistory, setShowSessionHistory] = useState(false);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [sessionHistoryLoading, setSessionHistoryLoading] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Configuration - replace with actual values from your app
  const BUSINESS_ID = getConfig('DEFAULTS.BUSINESS_ID');
  const USER_ID = getConfig('DEFAULTS.USER_ID');
  const LOCATION_ID = getConfig('DEFAULTS.LOCATION_ID');

  // Use AI Assistant hook
  const {
    messages,
    isConnected,
    currentSessionId,
    isLoading,
    error,
    sendMessage,
    searchMessages,
    exportSession,
    closeSession,
    startNewSession,
    switchToSession,
    loadSessionHistory,
    clearError
  } = useAIAssistant(BUSINESS_ID, USER_ID, LOCATION_ID);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Clear errors when they occur
  useEffect(() => {
    if (error) {
      console.error('AI Assistant Error:', error);
      // Auto-clear errors after 5 seconds
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    try {
      await sendMessage(inputValue.trim());
      setInputValue('');
    } catch (error) {
      console.error('Eroare la trimiterea mesajului:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const getSessionInfo = () => {
    if (!currentSessionId) return 'Încărcare sesiune...';
    
    // Handle different session ID formats
    try {
      // Check if it's a temporary session ID
      if (currentSessionId.startsWith('temp_')) {
        return `Sesiune nouă - ${messages.length} mesaje`;
      }
      
      // Check if it's in old format (businessId:userId:timestamp)
      if (currentSessionId.includes(':') && currentSessionId.split(':').length === 3) {
        const parts = currentSessionId.split(':');
        const timestamp = parseInt(parts[2]);
        if (!isNaN(timestamp)) {
          const sessionDate = new Date(timestamp);
          return `Sesiune: ${sessionDate.toLocaleDateString('ro-RO')} - ${messages.length} mesaje`;
        }
      }
      
      // For new format session IDs, just show session info
      return `Sesiune activă - ${messages.length} mesaje`;
    } catch {
      return `Sesiune activă - ${messages.length} mesaje`;
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const results = await searchMessages(searchQuery);
      console.log('Search results:', results);
      // You can display search results in a separate UI
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportSession('json');
      
      // Create and download file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-session-${currentSessionId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleCloseSession = async () => {
    try {
      await closeSession('resolved');
    } catch (error) {
      console.error('Failed to close session:', error);
    }
  };

  const handleStartNewSession = async () => {
    try {
      await startNewSession();
      setShowSessionHistory(false);
    } catch (error) {
      console.error('Failed to start new session:', error);
    }
  };

  const handleSwitchSession = async (sessionId) => {
    try {
      await switchToSession(sessionId);
      setShowSessionHistory(false);
    } catch (error) {
      console.error('Failed to switch session:', error);
    }
  };

  const handleLoadSessionHistory = async () => {
    if (showSessionHistory) {
      setShowSessionHistory(false);
      return;
    }

    try {
      setSessionHistoryLoading(true);
      const history = await loadSessionHistory(20);
      setSessionHistory(history);
      setShowSessionHistory(true);
    } catch (error) {
      console.error('Failed to load session history:', error);
    } finally {
      setSessionHistoryLoading(false);
    }
  };

  const formatSessionDate = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleDateString('ro-RO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Data necunoscută';
    }
  };

  return (
    <AIAssistant
      position="side"
      size="md"
      state={isOpen ? "open" : "closed"}
      className="flex flex-col rounded-lg"
    >
      <AIAssistantHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground">AI Assistant</span>
            <div className="flex items-center gap-1">
              {isConnected ? (
                <div className="h-2 w-2 rounded-full bg-green-500" />
              ) : (
                <div className="h-2 w-2 rounded-full bg-red-500" />
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {/* New Session Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStartNewSession}
              className="h-6 w-6 p-0"
              title="Sesiune nouă"
            >
              <Plus className="h-3 w-3" />
            </Button>
            
            {/* Session History Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLoadSessionHistory}
              className="h-6 w-6 p-0"
              title="Istoric sesiuni"
            >
              <History className="h-3 w-3" />
            </Button>
            
            {/* Settings Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="h-6 w-6 p-0"
              title="Setări"
            >
              <Settings className="h-3 w-3" />
            </Button>
            
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
              title="Închide"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </AIAssistantHeader>

      {/* Session Info */}
      <div className="px-3 py-1 bg-muted/30 border-b">
        <p className="text-xs text-muted-foreground">
          {getSessionInfo()}
        </p>
      </div>

      {/* Session History Panel */}
      {showSessionHistory && (
        <div className="px-3 py-2 bg-muted/20 border-b max-h-40 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium text-foreground">Istoric Sesiuni</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSessionHistory(false)}
              className="h-4 w-4 p-0"
            >
              <X className="h-2 w-2" />
            </Button>
          </div>
          
          {sessionHistoryLoading ? (
            <div className="text-xs text-muted-foreground text-center py-2">
              Se încarcă...
            </div>
          ) : sessionHistory.length > 0 ? (
            <div className="space-y-1">
              {sessionHistory.map((session) => (
                <div 
                  key={session.sessionId}
                  className={`p-2 rounded text-xs cursor-pointer transition-colors ${
                    currentSessionId === session.sessionId 
                      ? 'bg-primary/10 border border-primary/20' 
                      : 'bg-background border border-border hover:bg-muted/50'
                  }`}
                  onClick={() => handleSwitchSession(session.sessionId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium truncate">
                        {session.sessionId.substring(0, 8)}...
                      </span>
                    </div>
                    <div className="text-muted-foreground">
                      {session.status}
                    </div>
                  </div>
                  <div className="text-muted-foreground mt-1">
                    {formatSessionDate(session.lastMessageAt || session.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground text-center py-2">
              Nu există sesiuni anterioare
            </div>
          )}
        </div>
      )}

      {/* Search Bar */}
      {showSearch && (
        <div className="px-3 py-1 bg-muted/20 border-b">
          <div className="flex gap-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Căutare..."
              className="flex-1 text-xs px-2 py-1 rounded border bg-background"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button size="sm" variant="ghost" onClick={handleSearch} className="h-6 w-6 p-0">
              <Search className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="px-3 py-1 bg-muted/20 border-b">
          <div className="flex gap-1 flex-wrap">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setShowSearch(!showSearch)}
              className="h-6 text-xs"
            >
              <Search className="h-3 w-3 mr-1" />
              {showSearch ? 'Ascunde' : 'Căutare'}
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleLoadSessionHistory}
              className="h-6 text-xs"
            >
              <History className="h-3 w-3 mr-1" />
              Istoric
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleStartNewSession}
              className="h-6 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Nou
            </Button>
            <Button size="sm" variant="ghost" onClick={handleExport} className="h-6 text-xs">
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCloseSession} className="h-6 text-xs">
              Închide
            </Button>
          </div>
        </div>
      )}

      <AIAssistantBody>
        <div className="space-y-2">
          {messages.map((message) => (
            <div
              key={message.messageId}
              className={`flex gap-2 ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.type === 'agent' && (
                <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="h-3 w-3 text-primary" />
                </div>
              )}
              
              <div
                className={`max-w-[85%] rounded px-3 py-2 ${
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50'
                }`}
              >
                <p className="text-xs whitespace-pre-wrap leading-relaxed">{message.content}</p>
                <p className="text-xs opacity-60 mt-1">
                  {formatTimestamp(message.timestamp)}
                </p>
              </div>
              
              {message.type === 'user' && (
                <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="h-3 w-3 text-primary" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-2 justify-start">
              <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="h-3 w-3 text-primary" />
              </div>
              <div className="bg-muted/50 rounded px-3 py-2">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          {/* Invisible element for scrolling */}
          <div ref={messagesEndRef} />
        </div>
      </AIAssistantBody>

      <AIAssistantFooter>
        <div className="flex gap-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Mesaj..."
            className="flex-1 resize-none rounded border border-input bg-background px-2 py-1 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            rows={1}
            disabled={isLoading || !isConnected}
            maxLength={getConfig('MESSAGE.MAX_LENGTH')}
          />
          <Button
            variant="default"
            size="sm"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading || !isConnected}
            className="h-6 w-6 p-0"
          >
            <Send className="h-3 w-3" />
          </Button>
        </div>
      </AIAssistantFooter>
    </AIAssistant>
  );
};

export default AIAssistantComponent;
