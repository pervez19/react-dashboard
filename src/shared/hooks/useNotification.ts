import { useSyncExternalStore } from 'react';
import { notificationService } from '../../core/services/notificationService';

/** Current notifications plus the functions to raise/dismiss them. */
export function useNotification() {
  const notifications = useSyncExternalStore(notificationService.subscribe, notificationService.getSnapshot);
  return {
    notifications,
    notify: notificationService.show,
    success: notificationService.success,
    info: notificationService.info,
    warning: notificationService.warning,
    error: notificationService.error,
    dismiss: notificationService.dismiss,
  };
}
