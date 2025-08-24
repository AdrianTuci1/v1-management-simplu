import React, { useState } from 'react';
import { Bot, Send, User, X } from 'lucide-react';
import { useAIAssistantStore } from '../stores/aiAssistantStore';
import { AIAssistant, AIAssistantHeader, AIAssistantBody, AIAssistantFooter } from './ui/ai-assistant';
import { Button } from './ui/button';

const AIAssistantComponent = () => {
  const { isOpen, closeAIAssistant } = useAIAssistantStore();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: 'Bună! Sunt asistentul AI al dashboard-ului de business. Cum vă pot ajuta astăzi?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: generateAIResponse(inputValue),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const generateAIResponse = (userInput) => {
    const input = userInput.toLowerCase();
    
    if (input.includes('salut') || input.includes('bună') || input.includes('hello')) {
      return 'Bună! Sunt aici să vă ajut cu dashboard-ul de business. Ce informații aveți nevoie?';
    }
    
    if (input.includes('programări') || input.includes('appointment')) {
      return 'Pentru programări, puteți accesa secțiunea "Planificare" din meniu. Acolo puteți gestiona programările, pacienții și tratamentele.';
    }
    
    if (input.includes('pacienți') || input.includes('patients')) {
      return 'Pacienții se pot gestiona din secțiunea "Persoane" din meniu. Puteți adăuga, edita și vizualiza toate informațiile despre pacienți.';
    }
    
    if (input.includes('vânzări') || input.includes('sales')) {
      return 'Rapoartele de vânzări se află în secțiunea "Vânzări" din meniu. Acolo puteți vedea statistici și analize despre performanța comercială.';
    }
    
    if (input.includes('inventar') || input.includes('inventory')) {
      return 'Gestionarea inventarului se face din secțiunea "Inventar" din meniu. Puteți urmări stocul și gestiona produsele.';
    }
    
    if (input.includes('facturare') || input.includes('billing')) {
      return 'Facturarea se gestionează din secțiunea "Facturare" din meniu. Puteți crea facturi și urmări plățile.';
    }
    
    if (input.includes('ajutor') || input.includes('help')) {
      return 'Vă pot ajuta cu:\n• Gestionarea programărilor\n• Administrarea pacienților\n• Rapoartele de vânzări\n• Gestionarea inventarului\n• Facturarea\n• Setările sistemului\n\nCe doriți să știți?';
    }
    
    return 'Îmi pare rău, nu am înțeles întrebarea. Puteți încerca să întrebați despre programări, pacienți, vânzări, inventar, facturare sau să scrieți "ajutor" pentru mai multe opțiuni.';
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
        <Button
          variant="ghost"
          size="sm"
          onClick={closeAIAssistant}
        >
          <X className="h-5 w-5" />
        </Button>
      </AIAssistantHeader>

      <AIAssistantBody>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.type === 'ai' && (
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
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
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
            disabled={isLoading}
          />
          <Button
            variant="default"
            size="sm"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
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
