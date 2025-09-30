import React, { useState, useEffect } from 'react';
import { FileText, Trash2, Eye, Calendar, User, Package, DollarSign, AlertCircle } from 'lucide-react';
import { dataFacade } from '../data/DataFacade';

/**
 * DraftsMenu - Component for displaying and managing drafts in the sidebar
 * 
 * Features:
 * - List all active drafts
 * - Group by resource type
 * - Quick actions (view, delete)
 * - Draft status indicators
 */
const DraftsMenu = ({ onDraftSelect, onClose }) => {
  const [drafts, setDrafts] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  // Load drafts on component mount
  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Accesează direct IndexedDB-ul local pentru draft-uri și sesiuni
      // Nu folosim dataFacade pentru a evita health check-ul
      const { db } = await import('../data/infrastructure/db.js');
      
      let allDrafts = [];
      let allSessions = [];
      
      try {
        allDrafts = await db.drafts.toArray() || [];
      } catch (err) {
        // If no drafts exist, this is normal - just set empty array
        console.log('No drafts found, this is normal for new installations');
        allDrafts = [];
      }
      
      try {
        // Sesiunile nu sunt stocate în IndexedDB în această versiune
        allSessions = [];
      } catch (err) {
        // If no sessions exist, this is normal - just set empty array
        console.log('No sessions found, this is normal for new installations');
        allSessions = [];
      }
      
      setDrafts(allDrafts);
      setSessions(allSessions);
    } catch (err) {
      console.error('Error loading drafts:', err);
      // Don't set error for normal "no data" cases
      if (err.message && 
          !err.message.includes('not found') && 
          !err.message.includes('empty')) {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Group drafts by resource type
  const groupedDrafts = drafts.reduce((groups, draft) => {
    const type = draft.resourceType || 'unknown';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(draft);
    return groups;
  }, {});

  // Get icon for resource type
  const getResourceIcon = (resourceType) => {
    const iconMap = {
      'appointment': Calendar,
      'patient': User,
      'product': Package,
      'sales': DollarSign,
      'treatment': FileText,
      'medic': User,
      'role': User
    };
    return iconMap[resourceType] || FileText;
  };

  // Get display name for resource type
  const getResourceDisplayName = (resourceType) => {
    const nameMap = {
      'appointment': 'Programări',
      'patient': 'Pacienți',
      'product': 'Produse',
      'sales': 'Vânzări',
      'treatment': 'Tratamente',
      'medic': 'Medici',
      'role': 'Roluri'
    };
    return nameMap[resourceType] || resourceType;
  };

  // Handle draft selection
  const handleDraftSelect = (draft) => {
    if (onDraftSelect) {
      onDraftSelect(draft);
    }
  };

  // Handle draft deletion
  const handleDraftDelete = async (draftId) => {
    try {
      await dataFacade.delete('draft', draftId);
      await loadDrafts(); // Reload drafts
    } catch (err) {
      console.error('Error deleting draft:', err);
      setError(err.message);
    }
  };

  // Toggle group expansion
  const toggleGroup = (resourceType) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resourceType)) {
        newSet.delete(resourceType);
      } else {
        newSet.add(resourceType);
      }
      return newSet;
    });
  };

  // Format draft timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Acum';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}z`;
    return date.toLocaleDateString('ro-RO');
  };

  // Get draft status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'text-blue-600 bg-blue-50';
      case 'updated': return 'text-amber-600 bg-amber-50';
      case 'committed': return 'text-green-600 bg-green-50';
      case 'cancelled': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Eroare la încărcarea draft-urilor: {error}</span>
        </div>
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center text-gray-500">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nu există draft-uri</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Draft-uri active</h3>
          <span className="text-xs text-gray-500">{drafts.length}</span>
        </div>

        {Object.entries(groupedDrafts).map(([resourceType, typeDrafts]) => {
          const Icon = getResourceIcon(resourceType);
          const isExpanded = expandedGroups.has(resourceType);
          
          return (
            <div key={resourceType} className="border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleGroup(resourceType)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">
                    {getResourceDisplayName(resourceType)}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {typeDrafts.length}
                  </span>
                </div>
                <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-200">
                  {typeDrafts.map((draft) => (
                    <div key={draft.id} className="p-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {draft.data?.name || draft.data?.title || `Draft ${draft.id.slice(-6)}`}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(draft.status)}`}>
                              {draft.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{formatTimestamp(draft.timestamp)}</span>
                            {draft.sessionId && (
                              <>
                                <span>•</span>
                                <span>Sesiune: {draft.sessionId.slice(-6)}</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => handleDraftSelect(draft)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Vezi draft-ul"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDraftDelete(draft.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Șterge draft-ul"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DraftsMenu;
