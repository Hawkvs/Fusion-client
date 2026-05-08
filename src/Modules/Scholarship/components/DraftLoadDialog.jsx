/**
 * Draft Load Dialog Component
 * 
 * Shows when a saved draft is found for the current form.
 * Allows student to either resume from draft or start fresh.
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Group,
  Stack,
  Text,
  Badge,
  Divider,
  Alert,
} from '@mantine/core';
import { IconAlertCircle, IconClock } from '@tabler/icons-react';

export function DraftLoadDialog({
  opened,
  onClose,
  draft,
  onLoadDraft,
  onStartFresh,
  loading = false,
}) {
  if (!draft) return null;

  const completionPercentage = draft.completion_percentage || 0;
  const updatedTime = new Date(draft.updated_at);
  const timeSinceUpdate = getTimeDifference(updatedTime);

  const getCompletionColor = (percentage) => {
    if (percentage >= 75) return 'green';
    if (percentage >= 50) return 'blue';
    if (percentage >= 25) return 'orange';
    return 'red';
  };

  const handleLoadDraft = async () => {
    if (onLoadDraft) {
      await onLoadDraft(draft);
    }
    onClose();
  };

  const handleStartFresh = () => {
    if (onStartFresh) {
      onStartFresh();
    }
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Saved Draft Found"
      centered
      size="md"
      closeButtonProps={{ 'aria-label': 'Close modal' }}
    >
      <Stack gap="md">
        {draft.interrupted && (
          <Alert
            icon={<IconAlertCircle />}
            color="orange"
            title="This draft was saved unexpectedly"
          >
            Your form data was saved due to {draft.interruption_reason === 'session_timeout' ? 'session timeout' : 'inactivity'}. You can resume from where you left off.
          </Alert>
        )}

        <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '4px' }}>
          <Stack gap="sm">
            <Group justify="space-between">
              <Text weight={500}>Award Type</Text>
              <Badge>{draft.draft_type}</Badge>
            </Group>

            <Group justify="space-between">
              <Text weight={500}>Completion</Text>
              <Group gap="xs">
                <div
                  style={{
                    width: '120px',
                    height: '8px',
                    backgroundColor: '#e0e0e0',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${completionPercentage}%`,
                      height: '100%',
                      backgroundColor:
                        completionPercentage >= 75
                          ? '#4CAF50'
                          : completionPercentage >= 50
                          ? '#2196F3'
                          : completionPercentage >= 25
                          ? '#FF9800'
                          : '#F44336',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <Badge color={getCompletionColor(completionPercentage)}>
                  {completionPercentage}%
                </Badge>
              </Group>
            </Group>

            <Group justify="space-between">
              <Text weight={500}>Saved</Text>
              <Group gap="xs">
                <IconClock size={16} />
                <Text size="sm">{timeSinceUpdate}</Text>
              </Group>
            </Group>

            {draft.notes && (
              <>
                <Divider />
                <div>
                  <Text weight={500} size="sm" mb="xs">
                    Notes
                  </Text>
                  <Text size="sm" color="dimmed">
                    {draft.notes}
                  </Text>
                </div>
              </>
            )}

            {draft.fields_count > 0 && (
              <Text size="sm" color="dimmed">
                💾 {draft.fields_count} fields saved
                {draft.files_count > 0 && ` • ${draft.files_count} file(s) uploaded`}
              </Text>
            )}
          </Stack>
        </div>

        <div>
          <Text size="sm" color="dimmed" mb="md">
            Would you like to continue from this draft or start fresh?
          </Text>
        </div>

        <Group justify="flex-end" grow>
          <Button
            variant="default"
            onClick={handleStartFresh}
            disabled={loading}
          >
            Start Fresh
          </Button>
          <Button
            onClick={handleLoadDraft}
            loading={loading}
            color="green"
          >
            Resume Draft
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export function TimeoutWarningDialog({ opened, onClose, onSave, onLogout }) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="⚠️ Session About to Expire"
      centered
      size="sm"
      closeButtonProps={{ 'aria-label': 'Close modal' }}
    >
      <Stack gap="md">
        <Text>
          Your session will expire in 2 minutes due to inactivity. Your form data will be saved automatically.
        </Text>

        <Alert icon={<IconAlertCircle />} color="yellow">
          Click anywhere on the form to continue working.
        </Alert>

        <Group justify="flex-end">
          <Button variant="default" onClick={onLogout}>
            Logout
          </Button>
          <Button onClick={onSave} color="green">
            Stay Active
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

/**
 * Utility function to format time difference
 */
function getTimeDifference(date) {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
}

/**
 * Hook to manage draft loading state
 */
export function useDraftLoadDialog() {
  const [opened, setOpened] = useState(false);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(false);

  const openDialog = (draftData) => {
    setDraft(draftData);
    setOpened(true);
  };

  const closeDialog = () => {
    setOpened(false);
    setDraft(null);
  };

  return {
    opened,
    draft,
    loading,
    openDialog,
    closeDialog,
    setLoading,
  };
}
