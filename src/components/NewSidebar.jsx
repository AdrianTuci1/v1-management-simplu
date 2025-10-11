import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Home,
  Activity,
  TrendingUp,
  Package,
  RefreshCw,
  CreditCard,
  DollarSign,
  BarChart3,
  PieChart,
  Shield,
  User,
  Settings,
  Bot,
  Pill,
  Calendar,
  Users,
  ChevronDown as ChevronDownIcon,
  Eye,
  Ruler,
  FileText,
  X,
  Clock,
  Plus,
  Edit3,
  Trash2,
  Save,
  Send,
  History,
  Download,
  Search,
  Wifi,
  WifiOff,
} from "lucide-react";
import LocationSwitcher from './LocationSwitcher';
import DraftsMenu from './DraftsMenu';
import { useBusinessConfig } from '../config/businessConfig';
import { useHealthRepository } from '../hooks/useHealthRepository';
import { useAppointments } from '../hooks/useAppointments';
import { useAIAssistant } from '../hooks/useAIAssistant';
import { getConfig } from '../config/aiAssistantConfig';
import { LogOut } from "lucide-react";
import cognitoAuthService from '../services/cognitoAuthService';
import { useDrawer } from '../contexts/DrawerContext';

// Softer spring animation curve
const softSpringEasing = "cubic-bezier(0.25, 1.1, 0.4, 1)";

/* --------------------------- Types / Content Map -------------------------- */

function getSidebarContent(activeSection, currentView) {
  const contentMap = {
    dashboard: {
      title: "Dashboard",
      sections: [
        {
          title: "Overview",
          items: [
            { icon: <Home size={16} className="text-gray-700" />, label: "Dashboard", isActive: currentView === 'dashboard' },
          ],
        },
      ],
    },

    operations: {
      title: "OPERAȚIUNI",
      sections: [
        {
          title: "Planning",
          items: [
            { icon: <Calendar size={16} className="text-gray-700" />, label: "Planificare", isActive: currentView === 'operations-planning' },
            { icon: <Users size={16} className="text-gray-700" />, label: "Pacienți", isActive: currentView === 'operations-people' },
            { icon: <Pill size={16} className="text-gray-700" />, label: "Tratamente", isActive: currentView === 'operations-treatments' },
          ],
        },
        {
          title: "Activities",
          items: [
            { icon: <Activity size={16} className="text-gray-700" />, label: "Activități", isActive: currentView === 'operations-activities' },
          ],
        },
      ],
    },

    business: {
      title: "BUSINESS",
      sections: [
        {
          title: "Sales & Inventory",
          items: [
            { icon: <TrendingUp size={16} className="text-gray-700" />, label: "Vânzări", isActive: currentView === 'business-sales' },
            { icon: <Package size={16} className="text-gray-700" />, label: "Inventar", isActive: currentView === 'business-inventory' },
          ],
        },
        {
          title: "Processes",
          items: [
            { icon: <RefreshCw size={16} className="text-gray-700" />, label: "Procese", isActive: currentView === 'business-processes' },
          ],
        },
        {
          title: "Financial Management",
          items: [
            { icon: <CreditCard size={16} className="text-gray-700" />, label: "Facturare", isActive: currentView === 'financial-billing' },
            { icon: <DollarSign size={16} className="text-gray-700" />, label: "Contabilitate", isActive: currentView === 'financial-accounting' },
          ],
        },
      ],
    },

    analytics: {
      title: "ANALIZE",
      sections: [
        {
          title: "Reports & Analytics",
          items: [
            { icon: <Ruler size={16} className="text-gray-700" />, label: "Rapoarte", isActive: currentView === 'analytics-reports' },
            { icon: <PieChart size={16} className="text-gray-700" />, label: "Dashboard", isActive: currentView === 'analytics-dashboard' },
          ],
        },
      ],
    },

    admin: {
      title: "ADMINISTRARE",
      sections: [
        {
          title: "Access Control",
          items: [
            { icon: <Shield size={16} className="text-gray-700" />, label: "Control Acces", isActive: currentView === 'admin-access' },
            { icon: <User size={16} className="text-gray-700" />, label: "Medici", isActive: currentView === 'admin-users' },
            { icon: <Settings size={16} className="text-gray-700" />, label: "Setări", isActive: currentView === 'admin-settings' },
          ],
        },
      ],
    },
  };

  return contentMap[activeSection] || contentMap.dashboard;
}

/* ---------------------------- Left Icon Nav Rail -------------------------- */

function IconNavButton({
  children,
  isActive = false,
  onClick,
}) {
  return (
    <button
      type="button"
      className={`flex items-center justify-center rounded-lg size-10 min-w-10 transition-colors duration-500
        ${isActive ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100 text-gray-600 hover:text-gray-800"}`}
      style={{ transitionTimingFunction: softSpringEasing }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function IconNavigation({
  activeSection,
  onSectionChange,
  onSpecialViewChange,
  specialView,
}) {
  // Get business config and health status
  const { businessName, BusinessIcon } = useBusinessConfig();
  const { isHealthy, isOffline, isServerDown } = useHealthRepository();
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  const navItems = [
    { id: "dashboard", icon: <Home size={16} />, label: "Dashboard" },
    { id: "operations", icon: <Activity size={16} />, label: "Operațiuni" },
    { id: "business", icon: <TrendingUp size={16} />, label: "Business" },
    { id: "analytics", icon: <BarChart3 size={16} />, label: "Analize" },
    { id: "admin", icon: <Settings size={16} />, label: "Admin" },
  ];

  return (
    <aside className="bg-white/95 backdrop-blur-sm border-r border-gray-200 flex flex-col gap-2 items-center p-4 w-16 h-full shadow-lg rounded-lg">
      {/* Logo with Status */}
      <div className="mb-2 size-10 flex items-center justify-center">
        <div className="relative">
          <BusinessIcon className="h-5 w-5" />
          {/* Health indicator dot */}
          <div 
            className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
              isHealthy 
                ? 'bg-green-500' 
                : isOffline 
                  ? 'bg-gray-400' 
                  : isServerDown 
                    ? 'bg-red-500' 
                    : 'bg-yellow-500'
            }`}
            title={
              isHealthy 
                ? 'Sistem online și funcțional' 
                : isOffline 
                  ? 'Fără conexiune la internet' 
                  : isServerDown 
                    ? 'Server indisponibil' 
                    : 'Verificare în curs...'
            }
          />
        </div>
      </div>

      {/* Navigation Icons */}
      <div className="flex flex-col gap-2 w-full items-center">
        {navItems.map((item) => (
          <IconNavButton
            key={item.id}
            isActive={activeSection === item.id && !specialView}
            onClick={() => onSectionChange(item.id)}
          >
            {item.icon}
          </IconNavButton>
        ))}
      </div>

      <div className="flex-1" />

      {/* Bottom section - User Actions */}
      <div className="flex flex-col gap-2 w-full items-center">
        {/* AI Agent button - only show if not in demo mode */}
        {!isDemoMode && (
          <button
            onClick={() => onSpecialViewChange(specialView === 'ai-assistant' ? null : 'ai-assistant')}
            className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors border ${
              specialView === 'ai-assistant' 
                ? 'bg-blue-100 border-blue-300' 
                : 'bg-blue-50 hover:bg-blue-100 border-blue-200'
            }`}
            title="Deschide AI Assistant"
          >
            <Bot className="h-5 w-5 text-blue-600" />
          </button>
        )}
        
        {/* User Profile button */}
        <button
          onClick={() => onSpecialViewChange(specialView === 'user-profile' ? null : 'user-profile')}
          className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors border ${
            specialView === 'user-profile' 
              ? 'bg-gray-100 border-gray-300' 
              : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
          }`}
          title="Profil Utilizator"
        >
          <User className="h-5 w-5 text-gray-600" />
        </button>
        
        {/* Logout button */}
        <button
          onClick={async () => {
            await cognitoAuthService.signOut();
            window.location.reload();
          }}
          className="h-10 w-10 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors border border-red-200"
          title="Deconectare"
        >
          <LogOut className="h-4 w-4 text-red-600" />
        </button>
      </div>
    </aside>
  );
}

/* ------------------------------ Right Sidebar ----------------------------- */

/* --------------------- AI Assistant Content Component -------------------- */
function AIAssistantContent({ onClose }) {
  const [inputValue, setInputValue] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showSessionHistory, setShowSessionHistory] = useState(false);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [sessionHistoryLoading, setSessionHistoryLoading] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Configuration
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
      if (currentSessionId.startsWith('temp_')) {
        return `Sesiune nouă - ${messages.length} mesaje`;
      }
      
      if (currentSessionId.includes(':') && currentSessionId.split(':').length === 3) {
        const parts = currentSessionId.split(':');
        const timestamp = parseInt(parts[2]);
        if (!isNaN(timestamp)) {
          const sessionDate = new Date(timestamp);
          return `Sesiune: ${sessionDate.toLocaleDateString('ro-RO')} - ${messages.length} mesaje`;
        }
      }
      
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
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportSession('json');
      
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
    <div className="flex flex-col h-full">
      {/* Controls Bar */}
      <div className="p-2 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {isConnected ? (
            <Wifi className="h-3 w-3 text-green-500" />
          ) : (
            <WifiOff className="h-3 w-3 text-red-500" />
          )}
          <span className="text-xs text-gray-600">{getSessionInfo()}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={handleStartNewSession}
            className="h-6 w-6 rounded hover:bg-gray-100 flex items-center justify-center"
            title="Sesiune nouă"
          >
            <Plus className="h-3 w-3 text-gray-600" />
          </button>
          
          <button
            onClick={handleLoadSessionHistory}
            className="h-6 w-6 rounded hover:bg-gray-100 flex items-center justify-center"
            title="Istoric sesiuni"
          >
            <History className="h-3 w-3 text-gray-600" />
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="h-6 w-6 rounded hover:bg-gray-100 flex items-center justify-center"
            title="Setări"
          >
            <Settings className="h-3 w-3 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Session History Panel */}
      {showSessionHistory && (
        <div className="px-3 py-2 bg-gray-50 border-b max-h-40 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium">Istoric Sesiuni</h4>
            <button
              onClick={() => setShowSessionHistory(false)}
              className="h-4 w-4 rounded hover:bg-gray-200 flex items-center justify-center"
            >
              <X className="h-2 w-2" />
            </button>
          </div>
          
          {sessionHistoryLoading ? (
            <div className="text-xs text-gray-500 text-center py-2">
              Se încarcă...
            </div>
          ) : sessionHistory.length > 0 ? (
            <div className="space-y-1">
              {sessionHistory.map((session) => (
                <div 
                  key={session.sessionId}
                  className={`p-2 rounded text-xs cursor-pointer transition-colors ${
                    currentSessionId === session.sessionId 
                      ? 'bg-blue-100 border border-blue-200' 
                      : 'bg-white border border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleSwitchSession(session.sessionId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-gray-500" />
                      <span className="font-medium truncate">
                        {session.sessionId.substring(0, 8)}...
                      </span>
                    </div>
                    <div className="text-gray-500">
                      {session.status}
                    </div>
                  </div>
                  <div className="text-gray-500 mt-1">
                    {formatSessionDate(session.lastMessageAt || session.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-500 text-center py-2">
              Nu există sesiuni anterioare
            </div>
          )}
        </div>
      )}

      {/* Search Bar */}
      {showSearch && (
        <div className="px-3 py-1 bg-gray-50 border-b">
          <div className="flex gap-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Căutare..."
              className="flex-1 text-xs px-2 py-1 rounded border bg-white"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button 
              onClick={handleSearch}
              className="h-6 w-6 rounded hover:bg-gray-100 flex items-center justify-center"
            >
              <Search className="h-3 w-3 text-gray-600" />
            </button>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="px-3 py-1 bg-gray-50 border-b">
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="h-6 px-2 text-xs rounded hover:bg-gray-100 flex items-center gap-1"
            >
              <Search className="h-3 w-3" />
              {showSearch ? 'Ascunde' : 'Căutare'}
            </button>
            <button
              onClick={handleExport}
              className="h-6 px-2 text-xs rounded hover:bg-gray-100 flex items-center gap-1"
            >
              <Download className="h-3 w-3" />
              Export
            </button>
            <button
              onClick={handleCloseSession}
              className="h-6 px-2 text-xs rounded hover:bg-gray-100"
            >
              Închide Sesiune
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-2">
          {messages.map((message) => (
            <div
              key={message.messageId}
              className={`flex gap-2 ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.type === 'agent' && (
                <div className="h-5 w-5 rounded bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="h-3 w-3 text-blue-600" />
                </div>
              )}
              
              <div
                className={`max-w-[85%] rounded px-3 py-2 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100'
                }`}
              >
                <p className="text-xs whitespace-pre-wrap leading-relaxed">{message.content}</p>
                <p className={`text-xs mt-1 ${message.type === 'user' ? 'opacity-70' : 'text-gray-500'}`}>
                  {formatTimestamp(message.timestamp)}
                </p>
              </div>
              
              {message.type === 'user' && (
                <div className="h-5 w-5 rounded bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="h-3 w-3 text-blue-600" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-2 justify-start">
              <div className="h-5 w-5 rounded bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="h-3 w-3 text-blue-600" />
              </div>
              <div className="bg-gray-100 rounded px-3 py-2">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex gap-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Mesaj..."
            className="flex-1 resize-none rounded border border-gray-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            rows={1}
            disabled={isLoading || !isConnected}
            maxLength={getConfig('MESSAGE.MAX_LENGTH')}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading || !isConnected}
            className="h-6 w-6 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Send className="h-3 w-3 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* --------------------- User Profile Content Component -------------------- */
function UserProfileContent({ onClose }) {
  const { appointments, loading: appointmentsLoading } = useAppointments();
  const { openDrawer } = useDrawer();
  const [userInfo, setUserInfo] = useState(null);
  const [userNotes, setUserNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load user info and notes
  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      try {
        // Get user info from localStorage
        const savedAuthData = localStorage.getItem('auth-user-data');
        const selectedLocation = localStorage.getItem('selected-location');
        
        if (savedAuthData) {
          const authData = JSON.parse(savedAuthData);
          let userRole = 'Administrator'; // Default role
          
          // Try to get actual role from selected location
          if (selectedLocation) {
            try {
              const locationData = JSON.parse(selectedLocation);
              userRole = locationData.role || 'Administrator';
            } catch (e) {
              console.warn('Error parsing selected location:', e);
            }
          }
          
          setUserInfo({
            name: authData.user?.name || authData.user?.email?.split('@')[0] || 'Utilizator',
            email: authData.user?.email || '',
            role: userRole
          });
        }

        // Load user notes from localStorage
        const savedNotes = localStorage.getItem('user-notes');
        if (savedNotes) {
          setUserNotes(JSON.parse(savedNotes));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Get upcoming appointments (next 7 days)
  const getUpcomingAppointments = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointmentDate || appointment.startDate);
      return appointmentDate >= today && appointmentDate <= nextWeek;
    }).sort((a, b) => new Date(a.appointmentDate || a.startDate) - new Date(b.appointmentDate || b.startDate));
  };

  // Add new note
  const handleAddNote = () => {
    if (newNote.trim()) {
      const note = {
        id: Date.now().toString(),
        text: newNote.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const updatedNotes = [...userNotes, note];
      setUserNotes(updatedNotes);
      localStorage.setItem('user-notes', JSON.stringify(updatedNotes));
      setNewNote('');
      setIsAddingNote(false);
    }
  };

  // Edit note
  const handleEditNote = (noteId, newText) => {
    if (newText.trim()) {
      const updatedNotes = userNotes.map(note =>
        note.id === noteId
          ? { ...note, text: newText.trim(), updatedAt: new Date().toISOString() }
          : note
      );
      setUserNotes(updatedNotes);
      localStorage.setItem('user-notes', JSON.stringify(updatedNotes));
    }
    setEditingNote(null);
  };

  // Delete note
  const handleDeleteNote = (noteId) => {
    const updatedNotes = userNotes.filter(note => note.id !== noteId);
    setUserNotes(updatedNotes);
    localStorage.setItem('user-notes', JSON.stringify(updatedNotes));
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('ro-RO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Data necunoscută';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // HH:MM format
  };

  const upcomingAppointments = getUpcomingAppointments();

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-6">
        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{userInfo?.name || 'Utilizator'}</h3>
            <p className="text-sm text-gray-600">{userInfo?.role || 'Administrator'}</p>
            {userInfo?.email && (
              <p className="text-xs text-gray-500">{userInfo.email}</p>
            )}
          </div>
        </div>

        {/* User Notes Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-600">
              Note personale
            </div>
            <button
              onClick={() => setIsAddingNote(true)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
            >
              <Plus className="h-3 w-3" />
              Adaugă notă
            </button>
          </div>

          {/* Add new note */}
          {isAddingNote && (
            <div className="p-3 border rounded-lg bg-gray-50">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Scrie o notă personală..."
                className="w-full p-2 border rounded text-sm resize-none"
                rows={3}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="h-3 w-3" />
                  Salvează
                </button>
                <button
                  onClick={() => {
                    setIsAddingNote(false);
                    setNewNote('');
                  }}
                  className="flex items-center gap-1 px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-xs"
                >
                  <X className="h-3 w-3" />
                  Anulează
                </button>
              </div>
            </div>
          )}

          {/* Display notes */}
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {userNotes.length === 0 ? (
              <div className="text-center text-sm text-gray-500 py-4">
                Nu ai note personale
              </div>
            ) : (
              userNotes.map((note) => (
                <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                  {editingNote === note.id ? (
                    <div>
                      <textarea
                        defaultValue={note.text}
                        className="w-full p-2 border rounded text-sm resize-none"
                        rows={2}
                        ref={(el) => {
                          if (el) {
                            el.focus();
                            el.select();
                          }
                        }}
                        onBlur={(e) => {
                          if (e.target.value.trim() !== note.text) {
                            handleEditNote(note.id, e.target.value);
                          } else {
                            setEditingNote(null);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.ctrlKey) {
                            handleEditNote(note.id, e.target.value);
                          } else if (e.key === 'Escape') {
                            setEditingNote(null);
                          }
                        }}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Apasă Ctrl+Enter pentru a salva sau Escape pentru a anula
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-sm">{note.text}</div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-xs text-gray-500">
                          {formatDate(note.createdAt)}
                          {note.updatedAt !== note.createdAt && (
                            <span> (modificat)</span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingNote(note.id)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-600">
            Programări următoare (7 zile)
          </div>
          
          {appointmentsLoading ? (
            <div className="text-center text-sm text-gray-500 py-4">
              Se încarcă programările...
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="text-center text-sm text-gray-500 py-4">
              Nu ai programări în următoarele 7 zile
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {upcomingAppointments.map((appointment) => (
                <div 
                  key={appointment.id} 
                  className="p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => {
                    openDrawer({ 
                      type: 'appointment', 
                      isNew: false,
                      data: appointment 
                    })
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm">
                      {formatDate(appointment.appointmentDate || appointment.startDate)}
                    </span>
                    <Clock className="h-3 w-3 text-blue-600 ml-auto" />
                    <span className="text-xs text-blue-600">
                      {formatTime(appointment.startTime)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700">
                    {appointment.patientName || appointment.patient?.name || 'Pacient necunoscut'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {appointment.treatmentType || appointment.type || 'Consultare'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <div className="text-lg font-semibold">{appointments.length}</div>
            <div className="text-xs text-gray-600">Total programări</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <div className="text-lg font-semibold">{userNotes.length}</div>
            <div className="text-xs text-gray-600">Note personale</div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={async () => {
            await cognitoAuthService.signOut();
            window.location.reload();
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
        >
          <LogOut className="h-4 w-4" />
          <span>Deconectare</span>
        </button>
      </div>
    </div>
  );
}

function SectionTitle({
  title,
  onToggleCollapse,
  isCollapsed,
}) {
  if (isCollapsed) {
    return (
      <div className="w-full flex justify-center transition-all duration-500" style={{ transitionTimingFunction: softSpringEasing }}>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex items-center justify-center rounded-lg size-10 min-w-10 transition-all duration-500 hover:bg-gray-800 text-gray-400 hover:text-gray-300"
          style={{ transitionTimingFunction: softSpringEasing }}
          aria-label="Expand sidebar"
        >
          <span className="inline-block rotate-180">
            <ChevronDownIcon size={16} />
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden transition-all duration-500" style={{ transitionTimingFunction: softSpringEasing }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center h-10">
          <div className="px-2 py-1">
            <div className="font-['Lexend:SemiBold',_sans-serif] text-[18px] text-gray-900 leading-[27px]">
              {title}
            </div>
          </div>
        </div>
        <div className="pr-1">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex items-center justify-center rounded-lg size-10 min-w-10 transition-all duration-500 hover:bg-gray-800 text-gray-400 hover:text-gray-300"
            style={{ transitionTimingFunction: softSpringEasing }}
            aria-label="Collapse sidebar"
          >
            <ChevronDownIcon size={16} className="-rotate-90" />
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailSidebar({ activeSection, currentView, onViewChange, currentLocation, onLocationChange, specialView, onCloseSpecialView }) {
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const content = getSidebarContent(activeSection, currentView);
  
  // Get business config and health status
  const { businessName, BusinessIcon } = useBusinessConfig();
  const { isHealthy, isOffline, isServerDown } = useHealthRepository();
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  const toggleExpanded = (itemKey) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemKey)) next.delete(itemKey);
      else next.add(itemKey);
      return next;
    });
  };

  const toggleCollapse = () => setIsCollapsed((s) => !s);

  // If special view is active, show that content
  if (specialView) {
    const specialViewTitles = {
      'ai-assistant': 'AI Assistant',
      'user-profile': 'Profil Utilizator'
    };

    return (
      <aside className="bg-white/95 backdrop-blur-sm border-r border-gray-200 flex flex-col items-start transition-all duration-500 h-full shadow-lg rounded-lg w-80">
        {/* Header with close button */}
        <div className="w-full p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="font-['Lexend:SemiBold',_sans-serif] text-[18px] text-gray-900">
            {specialViewTitles[specialView]}
          </div>
          <button
            onClick={onCloseSpecialView}
            className="h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            title="Închide"
          >
            <X className="h-4 w-4 text-gray-600" />
          </button>
        </div>

        {/* Special view content */}
        <div className="flex-1 w-full overflow-hidden flex flex-col">
          {specialView === 'ai-assistant' && (
            <AIAssistantContent onClose={onCloseSpecialView} />
          )}
          {specialView === 'user-profile' && (
            <UserProfileContent onClose={onCloseSpecialView} />
          )}
        </div>
      </aside>
    );
  }

  // Normal sidebar content
  return (
    <aside
      className={`bg-white/95 backdrop-blur-sm border-r border-gray-200 flex flex-col gap-4 items-start p-4 transition-all duration-500 h-full shadow-lg rounded-lg ${
        isCollapsed ? "w-16 min-w-16 !px-0 justify-center" : "w-80"
      }`}
      style={{ transitionTimingFunction: softSpringEasing }}
    >

      <SectionTitle title={content.title} onToggleCollapse={toggleCollapse} isCollapsed={isCollapsed} />

      <div
        className={`flex flex-col w-full overflow-y-auto transition-all duration-500 ${
          isCollapsed ? "gap-2 items-center" : "gap-4 items-start"
        }`}
        style={{ transitionTimingFunction: softSpringEasing }}
      >
        {content.sections.map((section, index) => (
          <MenuSection
            key={`${activeSection}-${index}`}
            section={section}
            expandedItems={expandedItems}
            onToggleExpanded={toggleExpanded}
            isCollapsed={isCollapsed}
            onViewChange={onViewChange}
          />
        ))}

        {/* Drafts Section */}
        {!isCollapsed && (
          <div className="w-full">
            <button
              onClick={() => setShowDrafts(!showDrafts)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Draft-uri</span>
              </div>
              <div className={`transform transition-transform ${showDrafts ? 'rotate-180' : ''}`}>
                <ChevronDownIcon className="h-4 w-4 text-gray-400" />
              </div>
            </button>
            
            {showDrafts && (
              <div className="mt-2 border border-gray-200 rounded-lg">
                <DraftsMenu 
                  onDraftSelect={(draft) => {
                    // Handle draft selection - could open drawer with draft data
                    console.log('Draft selected:', draft);
                  }}
                  onClose={() => setShowDrafts(false)}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Location Switcher */}
      {!isCollapsed && (
        <div className="w-full mt-auto pt-2 border-t border-gray-200">
          <LocationSwitcher
            collapsed={isCollapsed}
            currentLocation={currentLocation}
            onLocationChange={onLocationChange}
          />
        </div>
      )}

      {!isCollapsed && (
        <div className="w-full pt-2 border-t border-gray-200">
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="font-['Lexend:Regular',_sans-serif] text-[14px] text-gray-900">v1.0.0</div>
          </div>
        </div>
      )}
    </aside>
  );
}

/* ------------------------------ Menu Elements ---------------------------- */

function MenuItem({
  item,
  isExpanded,
  onToggle,
  onItemClick,
  isCollapsed,
}) {
  const handleClick = () => {
    if (item.hasDropdown && onToggle) onToggle();
    else onItemClick?.();
  };

  return (
    <div
      className={`relative shrink-0 transition-all duration-500 ${
        isCollapsed ? "w-full flex justify-center" : "w-full"
      }`}
      style={{ transitionTimingFunction: softSpringEasing }}
    >
      <div
        className={`rounded-lg cursor-pointer transition-all duration-500 flex items-center relative ${
          item.isActive ? "bg-blue-100" : "hover:bg-gray-100"
        } ${isCollapsed ? "w-10 min-w-10 h-10 justify-center p-4" : "w-full h-10 px-4 py-2"}`}
        style={{ transitionTimingFunction: softSpringEasing }}
        onClick={handleClick}
        title={isCollapsed ? item.label : undefined}
      >
        <div className="flex items-center justify-center shrink-0">{item.icon}</div>

        <div
          className={`flex-1 relative transition-opacity duration-500 overflow-hidden ${
            isCollapsed ? "opacity-0 w-0" : "opacity-100 ml-3"
          }`}
          style={{ transitionTimingFunction: softSpringEasing }}
        >
          <div className="font-['Lexend:Regular',_sans-serif] text-[14px] text-gray-900 leading-[20px] truncate">
            {item.label}
          </div>
        </div>

        {item.hasDropdown && (
          <div
            className={`flex items-center justify-center shrink-0 transition-opacity duration-500 ${
              isCollapsed ? "opacity-0 w-0" : "opacity-100 ml-2"
            }`}
            style={{ transitionTimingFunction: softSpringEasing }}
          >
            <ChevronDownIcon
              size={16}
              className="text-gray-700 transition-transform duration-500"
              style={{
                transitionTimingFunction: softSpringEasing,
                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function SubMenuItem({ item, onItemClick }) {
  return (
    <div className="w-full pl-9 pr-1 py-[1px]">
      <div
        className="h-10 w-full rounded-lg cursor-pointer transition-colors hover:bg-gray-100 flex items-center px-3 py-1"
        onClick={onItemClick}
      >
        <div className="flex-1 min-w-0">
          <div className="font-['Lexend:Regular',_sans-serif] text-[14px] text-gray-600 leading-[18px] truncate">
            {item.label}
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuSection({
  section,
  expandedItems,
  onToggleExpanded,
  isCollapsed,
  onViewChange,
}) {
  return (
    <div className="flex flex-col w-full">
      <div
        className={`relative shrink-0 w-full transition-all duration-500 overflow-hidden ${
          isCollapsed ? "h-0 opacity-0" : "h-10 opacity-100"
        }`}
        style={{ transitionTimingFunction: softSpringEasing }}
      >
        <div className="flex items-center h-10 px-4">
          <div className="font-['Lexend:Regular',_sans-serif] text-[14px] text-gray-400">
            {section.title}
          </div>
        </div>
      </div>

      {section.items.map((item, index) => {
        const itemKey = `${section.title}-${index}`;
        const isExpanded = expandedItems.has(itemKey);
        return (
          <div key={itemKey} className="w-full flex flex-col">
            <MenuItem
              item={item}
              isExpanded={isExpanded}
              onToggle={() => onToggleExpanded(itemKey)}
              onItemClick={() => {
                if (item.isActive !== undefined) {
                  // This is a direct navigation item
                  if (item.isActive) {
                    onViewChange('dashboard');
                  } else {
                    // Map labels to view names
                    const viewMap = {
                      'Planificare': 'operations-planning',
                      'Pacienți': 'operations-people', 
                      'Tratamente': 'operations-treatments',
                      'Activități': 'operations-activities',
                      'Procese': 'business-processes',
                      'Vânzări': 'business-sales',
                      'Inventar': 'business-inventory',
                      'Facturare': 'financial-billing',
                      'Contabilitate': 'financial-accounting',
                      'Rapoarte': 'analytics-reports',
                      'Dashboard': 'analytics-dashboard',
                      'Control Acces': 'admin-access',
                      'Medici': 'admin-users',
                      'Setări': 'admin-settings'
                    };
                    const viewName = viewMap[item.label] || item.label.toLowerCase().replace(/\s+/g, '-');
                    onViewChange(viewName);
                  }
                } else {
                  console.log(`Clicked ${item.label}`);
                }
              }}
              isCollapsed={isCollapsed}
            />
            {isExpanded && item.children && !isCollapsed && (
              <div className="flex flex-col gap-1 mb-2">
                {item.children.map((child, childIndex) => (
                  <SubMenuItem
                    key={`${itemKey}-${childIndex}`}
                    item={child}
                    onItemClick={() => console.log(`Clicked ${child.label}`)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* --------------------------------- Layout -------------------------------- */

function NewSidebar({ 
  collapsed, 
  currentView, 
  onViewChange, 
  onToggle, 
  currentLocation, 
  onLocationChange 
}) {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [specialView, setSpecialView] = useState(null); // 'ai-assistant' or 'user-profile'

  // Map current view to active section
  React.useEffect(() => {
    if (currentView === 'dashboard') {
      setActiveSection('dashboard');
    } else if (currentView.startsWith('operations-') || currentView === 'operations-activities') {
      setActiveSection('operations');
    } else if (currentView.startsWith('business-') || currentView.startsWith('financial-')) {
      setActiveSection('business');
    } else if (currentView.startsWith('analytics-')) {
      setActiveSection('analytics');
    } else if (currentView.startsWith('admin-')) {
      setActiveSection('admin');
    }
  }, [currentView]);

  const handleSectionChange = (section) => {
    setActiveSection(section);
    setSpecialView(null); // Close special views when navigating to main sections
    // Set default view for each section
    const defaultViews = {
      'dashboard': 'dashboard',
      'operations': 'operations-planning',
      'business': 'business-sales',
      'analytics': 'analytics-reports',
      'admin': 'admin-access'
    };
    if (defaultViews[section]) {
      onViewChange(defaultViews[section]);
    }
  };

  const handleSpecialViewChange = (view) => {
    setSpecialView(view);
  };

  return (
    <div className="flex flex-row h-full">
      <IconNavigation 
        activeSection={activeSection} 
        onSectionChange={handleSectionChange}
        onSpecialViewChange={handleSpecialViewChange}
        specialView={specialView}
      />
      <DetailSidebar 
        activeSection={activeSection} 
        currentView={currentView}
        onViewChange={onViewChange}
        currentLocation={currentLocation}
        onLocationChange={onLocationChange}
        specialView={specialView}
        onCloseSpecialView={() => setSpecialView(null)}
      />
    </div>
  );
}

export default NewSidebar;
