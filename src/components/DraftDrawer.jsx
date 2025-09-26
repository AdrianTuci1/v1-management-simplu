/**
 * DraftDrawer - Componentă pentru gestionarea draft-urilor în UI
 * 
 * Această componentă permite:
 * - Vizualizarea draft-urilor
 * - Gestionarea sesiunilor
 * - Operațiuni batch pe draft-uri
 * - Integrare cu useDraftManager hook
 */

import React, { useState, useEffect } from 'react';
import { useDraftManager } from '../hooks/useDraftManager.js';
import { Button } from './ui/button.jsx';
import { Input } from './ui/input.jsx';
import { Label } from './ui/label.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card.jsx';
import { Badge } from './ui/badge.jsx';
import { Separator } from './ui/separator.jsx';
import { ScrollArea } from './ui/scroll-area.jsx';
import { 
  Save, 
  X, 
  Check, 
  Trash2, 
  Plus, 
  Edit, 
  Eye, 
  Clock, 
  Users, 
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

export function DraftDrawer({ 
  resourceType, 
  isOpen, 
  onClose, 
  onDraftSelect,
  onSessionSelect,
  className = "",
  ...props 
}) {
  const {
    drafts,
    sessions,
    activeSession,
    isLoading,
    error,
    statistics,
    createDraft,
    updateDraft,
    commitDraft,
    cancelDraft,
    deleteDraft,
    createSession,
    saveSession,
    closeSession,
    commitAllDraftsForSession,
    cancelAllDraftsForSession,
    getDraftsForSession,
    getActiveDrafts,
    getDraftsByOperation,
    cleanupOldDrafts
  } = useDraftManager(resourceType, {
    onDraftChange: (event, data) => {
      console.log('Draft changed:', event, data);
    },
    onSessionChange: (event, data) => {
      console.log('Session changed:', event, data);
    }
  });

  // Local state
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [showCreateDraft, setShowCreateDraft] = useState(false);
  const [newSessionData, setNewSessionData] = useState({ type: '', name: '', description: '' });
  const [newDraftData, setNewDraftData] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterOperation, setFilterOperation] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter drafts based on current filters
  const filteredDrafts = drafts.filter(draft => {
    const matchesStatus = filterStatus === 'all' || draft.status === filterStatus;
    const matchesOperation = filterOperation === 'all' || draft.operation === filterOperation;
    const matchesSearch = searchTerm === '' || 
      JSON.stringify(draft.data).toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesOperation && matchesSearch;
  });

  // Filter sessions based on search
  const filteredSessions = sessions.filter(session => 
    searchTerm === '' || 
    session.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (session.data.name && session.data.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle draft selection
  const handleDraftSelect = (draft) => {
    setSelectedDraft(draft);
    if (onDraftSelect) {
      onDraftSelect(draft);
    }
  };

  // Handle session selection
  const handleSessionSelect = (session) => {
    setSelectedSession(session);
    if (onSessionSelect) {
      onSessionSelect(session);
    }
  };

  // Handle create session
  const handleCreateSession = async () => {
    try {
      await createSession(newSessionData.type, {
        name: newSessionData.name,
        description: newSessionData.description
      });
      setShowCreateSession(false);
      setNewSessionData({ type: '', name: '', description: '' });
    } catch (err) {
      console.error('Error creating session:', err);
    }
  };

  // Handle create draft
  const handleCreateDraft = async () => {
    try {
      await createDraft(newDraftData, 'create', selectedSession?.sessionId);
      setShowCreateDraft(false);
      setNewDraftData({});
    } catch (err) {
      console.error('Error creating draft:', err);
    }
  };

  // Handle commit all drafts for session
  const handleCommitAllDrafts = async (sessionId) => {
    try {
      await commitAllDraftsForSession(sessionId);
    } catch (err) {
      console.error('Error committing all drafts:', err);
    }
  };

  // Handle cancel all drafts for session
  const handleCancelAllDrafts = async (sessionId) => {
    try {
      await cancelAllDraftsForSession(sessionId);
    } catch (err) {
      console.error('Error cancelling all drafts:', err);
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft':
        return <Edit className="h-4 w-4 text-blue-500" />;
      case 'updated':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'committed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get operation icon
  const getOperationIcon = (operation) => {
    switch (operation) {
      case 'create':
        return <Plus className="h-4 w-4 text-green-500" />;
      case 'update':
        return <Edit className="h-4 w-4 text-blue-500" />;
      case 'delete':
        return <Trash2 className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center ${className}`} {...props}>
      <div className="bg-white rounded-t-lg sm:rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Draft Manager</h2>
            <p className="text-sm text-gray-500">
              {resourceType} • {drafts.length} drafts • {sessions.length} sessions
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Sessions */}
          <div className="w-1/3 border-r bg-gray-50">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Sessions</h3>
                <Button
                  size="sm"
                  onClick={() => setShowCreateSession(true)}
                  className="h-8"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Input
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8"
              />
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                {filteredSessions.map((session) => (
                  <Card
                    key={session.id}
                    className={`cursor-pointer transition-colors ${
                      selectedSession?.id === session.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => handleSessionSelect(session)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{session.data.name || session.type}</p>
                          <p className="text-xs text-gray-500">{session.type}</p>
                        </div>
                        <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                          {session.status}
                        </Badge>
                      </div>
                      {session.data.description && (
                        <p className="text-xs text-gray-500 mt-1">{session.data.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCommitAllDrafts(session.sessionId);
                          }}
                          className="h-6 text-xs"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Commit All
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelAllDrafts(session.sessionId);
                          }}
                          className="h-6 text-xs"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancel All
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Main Content - Drafts */}
          <div className="flex-1 flex flex-col">
            {/* Filters */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="status-filter" className="text-sm">Status:</Label>
                  <select
                    id="status-filter"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="h-8 px-2 border rounded text-sm"
                  >
                    <option value="all">All</option>
                    <option value="draft">Draft</option>
                    <option value="updated">Updated</option>
                    <option value="committed">Committed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Label htmlFor="operation-filter" className="text-sm">Operation:</Label>
                  <select
                    id="operation-filter"
                    value={filterOperation}
                    onChange={(e) => setFilterOperation(e.target.value)}
                    className="h-8 px-2 border rounded text-sm"
                  >
                    <option value="all">All</option>
                    <option value="create">Create</option>
                    <option value="update">Update</option>
                    <option value="delete">Delete</option>
                  </select>
                </div>

                <div className="flex-1">
                  <Input
                    placeholder="Search drafts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8"
                  />
                </div>

                <Button
                  size="sm"
                  onClick={() => setShowCreateDraft(true)}
                  className="h-8"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New Draft
                </Button>
              </div>
            </div>

            {/* Drafts List */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {filteredDrafts.map((draft) => (
                  <Card
                    key={draft.id}
                    className={`cursor-pointer transition-colors ${
                      selectedDraft?.id === draft.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => handleDraftSelect(draft)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(draft.status)}
                            {getOperationIcon(draft.operation)}
                            <Badge variant="outline">{draft.operation}</Badge>
                            <Badge variant={draft.status === 'draft' ? 'default' : 'secondary'}>
                              {draft.status}
                            </Badge>
                          </div>
                          
                          <div className="text-sm text-gray-600 mb-2">
                            <p><strong>Session:</strong> {draft.sessionId}</p>
                            <p><strong>Created:</strong> {new Date(draft.timestamp).toLocaleString()}</p>
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            <pre className="whitespace-pre-wrap max-h-20 overflow-hidden">
                              {JSON.stringify(draft.data, null, 2)}
                            </pre>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              commitDraft(draft.id);
                            }}
                            className="h-8"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelDraft(draft.id);
                            }}
                            className="h-8"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteDraft(draft.id);
                            }}
                            className="h-8"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {filteredDrafts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No drafts found</p>
                    <p className="text-sm">Create a new draft to get started</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Statistics */}
        {statistics && (
          <div className="p-4 border-t bg-gray-50">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Total: {statistics.totalDrafts}</span>
              <span>Active: {statistics.draftsByStatus.draft || 0}</span>
              <span>Updated: {statistics.draftsByStatus.updated || 0}</span>
              <span>Committed: {statistics.draftsByStatus.committed || 0}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Create Session Modal */}
      {showCreateSession && (
        <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Create New Session</CardTitle>
              <CardDescription>Create a new session for managing drafts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="session-type">Type</Label>
                <Input
                  id="session-type"
                  value={newSessionData.type}
                  onChange={(e) => setNewSessionData(prev => ({ ...prev, type: e.target.value }))}
                  placeholder="e.g., appointment_booking"
                />
              </div>
              <div>
                <Label htmlFor="session-name">Name</Label>
                <Input
                  id="session-name"
                  value={newSessionData.name}
                  onChange={(e) => setNewSessionData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Patient Appointment Booking"
                />
              </div>
              <div>
                <Label htmlFor="session-description">Description</Label>
                <Input
                  id="session-description"
                  value={newSessionData.description}
                  onChange={(e) => setNewSessionData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateSession(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSession}>
                  Create Session
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Draft Modal */}
      {showCreateDraft && (
        <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Create New Draft</CardTitle>
              <CardDescription>Create a new draft for {resourceType}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="draft-data">Draft Data (JSON)</Label>
                <textarea
                  id="draft-data"
                  value={JSON.stringify(newDraftData, null, 2)}
                  onChange={(e) => {
                    try {
                      setNewDraftData(JSON.parse(e.target.value));
                    } catch (err) {
                      // Invalid JSON, keep current value
                    }
                  }}
                  className="w-full h-32 p-2 border rounded text-sm font-mono"
                  placeholder='{"name": "Example", "value": "Test"}'
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDraft(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateDraft}>
                  Create Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default DraftDrawer;
