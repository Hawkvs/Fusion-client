/**
 * Draft Auto-Save Hook for Scholarship Forms
 * 
 * Features:
 * - Auto-save form data at regular intervals
 * - Detect and handle session timeouts
 * - Save form data on unload (browser close, navigation)
 * - Load previously saved drafts
 * - Provide visual feedback on save status
 * 
 * Usage in form component:
 * const { saveDraft, loadDraft, clearDraft, saveStatus } = useDraftAutoSave(
 *   'MCM',
 *   formData,
 *   completionPercentage
 * );
 */

import { useEffect, useRef, useCallback, useState } from 'react';

const DRAFT_API_BASE = '/api/scholarships/drafts';
const AUTO_SAVE_INTERVAL = 30000; // Auto-save every 30 seconds
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes of inactivity = timeout warning
const TIMEOUT_WARNING_TIME = 2 * 60 * 1000; // Show warning 2 minutes before actual timeout

export function useDraftAutoSave(
  draftType,
  formData,
  completionPercentage = 0,
  enabled = true
) {
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error
  const [lastSaveTime, setLastSaveTime] = useState(null);
  const [draftExists, setDraftExists] = useState(false);
  
  const autoSaveTimerRef = useRef(null);
  const inactivityTimerRef = useRef(null);
  const timeoutWarningShownRef = useRef(false);
  const lastFormDataRef = useRef(formData);

  const token = localStorage.getItem('authToken');

  /**
   * Save draft to backend
   */
  const saveDraft = useCallback(async (reason = 'manual_save', data = null) => {
    if (!enabled || !token) return false;

    try {
      setSaveStatus('saving');
      
      const payload = {
        draft_type: draftType,
        form_data: data || formData,
        completion_percentage: completionPercentage,
        interruption_reason: reason,
        interrupted: reason !== 'manual_save' && reason !== 'auto_save',
      };

      const response = await fetch(`${DRAFT_API_BASE}/save_draft/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        setSaveStatus('saved');
        setLastSaveTime(new Date());
        setDraftExists(true);
        lastFormDataRef.current = data || formData;
        
        console.log(`✓ Draft saved (${reason}):`, result.message);
        
        // Reset save status after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);
        return true;
      } else {
        setSaveStatus('error');
        console.error('Failed to save draft:', result.error);
        setTimeout(() => setSaveStatus('idle'), 2000);
        return false;
      }
    } catch (error) {
      setSaveStatus('error');
      console.error('Draft save error:', error);
      setTimeout(() => setSaveStatus('idle'), 2000);
      return false;
    }
  }, [formData, completionPercentage, draftType, token, enabled]);

  /**
   * Auto-save at intervals
   */
  useEffect(() => {
    if (!enabled || !token) return;

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
    }

    // Set up auto-save interval
    autoSaveTimerRef.current = setInterval(() => {
      if (formData !== lastFormDataRef.current) {
        saveDraft('auto_save', formData);
      }
    }, AUTO_SAVE_INTERVAL);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [formData, saveDraft, enabled, token]);

  /**
   * Detect inactivity and session timeout
   */
  useEffect(() => {
    if (!enabled || !token) return;

    const resetInactivityTimer = () => {
      // Clear existing timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      timeoutWarningShownRef.current = false;

      // Set new timer for inactivity detection
      inactivityTimerRef.current = setTimeout(() => {
        // First warning: 2 minutes before timeout
        timeoutWarningShownRef.current = true;
        
        // Show timeout warning to user
        const warningMessage = `
          ⚠️ Your session will expire in 2 minutes due to inactivity.
          \n
          Your form data will be automatically saved.
          \n
          Click anywhere on the form to stay active.
        `;
        
        // Save form data before timeout
        saveDraft('inactivity', formData);
        alert(warningMessage);

        // Second timeout: actual logout (handled by backend/session)
        // Backend will handle the actual session expiration
      }, INACTIVITY_TIMEOUT - TIMEOUT_WARNING_TIME);
    };

    // Listen for user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, resetInactivityTimer, true);
    });

    resetInactivityTimer();

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer, true);
      });
    };
  }, [enabled, token, formData, saveDraft]);

  /**
   * Save on page unload (browser close, navigation, refresh)
   */
  useEffect(() => {
    if (!enabled || !token) return;

    const handleBeforeUnload = (event) => {
      // Save draft synchronously before unload
      if (formData !== lastFormDataRef.current) {
        saveDraft('browser_close', formData);
      }
      
      // Show browser warning
      event.preventDefault();
      event.returnValue = 'Your form data will be saved. Continue?';
      return event.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [formData, saveDraft, enabled, token]);

  /**
   * Load previously saved draft
   */
  const loadDraft = useCallback(async () => {
    if (!enabled || !token) return null;

    try {
      const response = await fetch(
        `${DRAFT_API_BASE}/load_draft/?draft_type=${draftType}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Token ${token}`,
          },
        }
      );

      const result = await response.json();

      if (result.success && result.draft) {
        setDraftExists(true);
        console.log('✓ Draft loaded:', result.draft);
        return result.draft;
      }

      return null;
    } catch (error) {
      console.error('Error loading draft:', error);
      return null;
    }
  }, [draftType, token, enabled]);

  /**
   * Clear saved draft (usually after successful submission)
   */
  const clearDraft = useCallback(async () => {
    if (!enabled || !token) return false;

    try {
      const response = await fetch(`${DRAFT_API_BASE}/delete_draft/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({ draft_type: draftType }),
      });

      const result = await response.json();

      if (result.success) {
        setDraftExists(false);
        console.log('✓ Draft cleared');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error clearing draft:', error);
      return false;
    }
  }, [draftType, token, enabled]);

  /**
   * Mark draft as submitted
   */
  const markAsSubmitted = useCallback(async () => {
    if (!enabled || !token) return false;

    try {
      const response = await fetch(`${DRAFT_API_BASE}/mark_as_submitted/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({ draft_type: draftType }),
      });

      const result = await response.json();

      if (result.success) {
        setDraftExists(false);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error marking draft as submitted:', error);
      return false;
    }
  }, [draftType, token, enabled]);

  /**
   * Get list of all saved drafts
   */
  const listDrafts = useCallback(async () => {
    if (!enabled || !token) return [];

    try {
      const response = await fetch(`${DRAFT_API_BASE}/list_drafts/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        return result.drafts;
      }

      return [];
    } catch (error) {
      console.error('Error listing drafts:', error);
      return [];
    }
  }, [token, enabled]);

  /**
   * Manual save with custom notes
   */
  const saveWithNotes = useCallback(async (notes = '') => {
    if (!enabled || !token) return false;

    try {
      setSaveStatus('saving');

      const response = await fetch(`${DRAFT_API_BASE}/save_draft/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({
          draft_type: draftType,
          form_data: formData,
          completion_percentage: completionPercentage,
          notes: notes,
          interruption_reason: 'manual_save',
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSaveStatus('saved');
        setLastSaveTime(new Date());
        setDraftExists(true);
        setTimeout(() => setSaveStatus('idle'), 2000);
        return true;
      }

      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
      return false;
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
      return false;
    }
  }, [formData, completionPercentage, draftType, token, enabled]);

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    markAsSubmitted,
    listDrafts,
    saveWithNotes,
    saveStatus,
    lastSaveTime,
    draftExists,
  };
}

/**
 * Visual indicator component for draft save status
 */
export function DraftSaveIndicator({ status, lastSaveTime }) {
  if (status === 'idle') {
    return null;
  }

  const colors = {
    saving: '#FF9800',    // Orange
    saved: '#4CAF50',     // Green
    error: '#F44336',     // Red
  };

  const messages = {
    saving: '💾 Saving draft...',
    saved: '✓ Draft saved',
    error: '✗ Save failed',
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '10px 15px',
        backgroundColor: colors[status],
        color: 'white',
        borderRadius: '4px',
        fontSize: '14px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        zIndex: 1000,
        animation: 'slideIn 0.3s ease-in',
      }}
    >
      {messages[status]}
      {status === 'saved' && lastSaveTime && (
        <span style={{ fontSize: '12px', marginLeft: '10px' }}>
          {lastSaveTime.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
