import React, { useState, useEffect } from 'react';
import { Trash2, Save, FileText, AlertCircle } from 'lucide-react';
import { useDraftManager } from '../../hooks/useDraftManager';
import { dataFacade } from '../../data/DataFacade';

/**
 * DraftAwareDrawer - Wrapper component that adds draft functionality to any drawer
 * 
 * Features:
 * - Draft identifier badge
 * - Delete draft button
 * - Auto-save functionality
 * - Draft status indicators
 */
const DraftAwareDrawer = ({ 
  children, 
  drawerType, 
  drawerData, 
  onClose,
  isNew = false,
  resourceType = null,
  ...props 
}) => {
  const [draftId, setDraftId] = useState(null);
  const [isDraft, setIsDraft] = useState(false);
  const [draftStatus, setDraftStatus] = useState('active');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Initialize draft manager for the specific resource type
  const { 
    createDraft, 
    updateDraft, 
    deleteDraft, 
    commitDraft,
    isLoading: draftLoading,
    error: draftError 
  } = useDraftManager(resourceType || drawerType);

  // Draft-urile sunt create doar de AI, nu automat când se deschide drawer-ul
  // useEffect pentru crearea automată de draft-uri a fost eliminat

  // Handle draft deletion
  const handleDeleteDraft = async () => {
    if (!draftId) return;
    
    try {
      await deleteDraft(draftId);
      setDraftId(null);
      setIsDraft(false);
      setShowDeleteConfirm(false);
      onClose?.();
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  };

  // Handle draft commit (save as final)
  const handleCommitDraft = async () => {
    if (!draftId) return;
    
    try {
      await commitDraft(draftId);
      setIsDraft(false);
      setDraftStatus('committed');
    } catch (error) {
      console.error('Error committing draft:', error);
    }
  };

  // Handle draft update
  const handleUpdateDraft = async (updatedData) => {
    if (!draftId) return;
    
    try {
      await updateDraft(draftId, updatedData);
      setDraftStatus('updated');
    } catch (error) {
      console.error('Error updating draft:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Draft Header */}
      {isDraft && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">
              Draft {draftStatus === 'updated' ? '(modificat)' : ''}
            </span>
            {draftStatus === 'updated' && (
              <AlertCircle className="h-4 w-4 text-amber-600" />
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleCommitDraft}
              disabled={draftLoading}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-md transition-colors disabled:opacity-50"
            >
              <Save className="h-3 w-3" />
              Salvează
            </button>
            
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              Șterge
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {React.cloneElement(children, {
          ...props,
          draftId,
          isDraft,
          onDraftUpdate: handleUpdateDraft,
          onDraftCommit: handleCommitDraft,
          onDraftDelete: handleDeleteDraft
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Șterge draft-ul
                </h3>
                <p className="text-sm text-gray-500">
                  Această acțiune nu poate fi anulată.
                </p>
              </div>
            </div>
            
            <p className="text-sm text-gray-700 mb-6">
              Ești sigur că vrei să ștergi acest draft? Toate modificările vor fi pierdute.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Anulează
              </button>
              <button
                onClick={handleDeleteDraft}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                Șterge draft-ul
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {draftError && (
        <div className="bg-red-50 border-t border-red-200 px-4 py-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-800">
              Eroare la gestionarea draft-ului: {draftError}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DraftAwareDrawer;
