import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, Send, User, X, Wifi, WifiOff, Settings, Download, Search } from 'lucide-react';
import { useAIAssistantStore } from '../stores/aiAssistantStore';
import { AIAssistant, AIAssistantHeader, AIAssistantBody, AIAssistantFooter } from './ui/ai-assistant';
import { Button } from './ui/button';
import { useAIAssistant } from '../hooks/useAIAssistant';
import { getConfig } from '../config/aiAssistantConfig';

const AIAssistantComponent = () => {
  const { isOpen, closeAIAssistant } = useAIAssistantStore();
  const [inputValue, setInputValue] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
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
    
    try {
      const sessionDate = new Date(parseInt(currentSessionId.split(':')[2]));
      return `Sesiune: ${sessionDate.toLocaleDateString('ro-RO')} - ${messages.length} mesaje`;
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

  return (
    <AIAssistant
      position="top-right"
      size="md"
      state={isOpen ? "open" : "closed"}
      className="flex flex-col rounded-lg"
    >
      <AIAssistantHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">AI Assistant</h3>
            <p className="text-sm text-muted-foreground">
              Asistent pentru dashboard business
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Connection Status Indicator */}
          <div className="flex items-center gap-1">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
          </div>
          
          {/* Settings Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={closeAIAssistant}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </AIAssistantHeader>

      {/* Session Info */}
      <div className="px-4 py-2 bg-muted/50 border-b">
        <p className="text-xs text-muted-foreground text-center">
          {getSessionInfo()}
        </p>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="px-4 py-2 bg-muted/30 border-b">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Căutare în conversație..."
              className="flex-1 text-xs px-2 py-1 rounded border"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button size="sm" variant="outline" onClick={handleSearch}>
              <Search className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="px-4 py-2 bg-muted/30 border-b">
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setShowSearch(!showSearch)}
            >
              {showSearch ? 'Ascunde' : 'Căutare'}
            </Button>
            <Button size="sm" variant="outline" onClick={handleExport}>
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
            <Button size="sm" variant="outline" onClick={handleCloseSession}>
              Închide Sesiunea
            </Button>
          </div>
        </div>
      )}

      <AIAssistantBody>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.messageId}
              className={`flex gap-3 ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.type === 'agent' && (
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {formatTimestamp(message.timestamp)}
                </p>
              </div>
              
              {message.type === 'user' && (
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="bg-muted rounded-lg px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
            placeholder="Scrieți mesajul dvs..."
            className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            rows={1}
            disabled={isLoading || !isConnected}
            maxLength={getConfig('MESSAGE.MAX_LENGTH')}
          />
          <Button
            variant="default"
            size="sm"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading || !isConnected}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </AIAssistantFooter>
    </AIAssistant>
  );
};

export default AIAssistantComponent;
