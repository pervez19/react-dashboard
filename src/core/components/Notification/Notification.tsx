import { useEffect } from 'react';
import { Alert } from '@mui/material';
import { NotificationType } from '../../enums/NotificationTypeEnum';
import { NOTIFICATION_AUTO_HIDE_MS } from '../../constants/appConstants';
import type { AppNotification } from '../../../shared/types/notificationTypes';

interface NotificationProps {
  notification: AppNotification;
  onClose: (id: string) => void;
  /** 0 disables auto-hide. */
  autoHideMs?: number;
}

export function Notification({ notification, onClose, autoHideMs = NOTIFICATION_AUTO_HIDE_MS }: NotificationProps) {
  const { id, message, type } = notification;

  useEffect(() => {
    if (!autoHideMs) return;
    const t = setTimeout(() => onClose(id), autoHideMs);
    return () => clearTimeout(t);
  }, [id, onClose, autoHideMs]);

  return (
    <Alert
      variant="filled"
      severity={type}
      onClose={() => onClose(id)}
      // Errors interrupt screen readers; everything else is announced politely.
      role={type === NotificationType.ERROR ? 'alert' : 'status'}
      sx={{ minWidth: 280, maxWidth: 420, boxShadow: 3 }}
    >
      {message}
    </Alert>
  );
}
