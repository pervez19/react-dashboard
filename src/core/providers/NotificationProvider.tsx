import type { ReactNode } from 'react';
import { Stack } from '@mui/material';
import { useNotification } from '../../shared/hooks/useNotification';
import { Notification } from '../components/Notification/Notification';

/** Renders the notification stack. Anything (React or not) raises notifications via notificationService. */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const { notifications, dismiss } = useNotification();

  return (
    <>
      {children}
      <Stack spacing={1} sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: (t) => t.zIndex.snackbar }}>
        {notifications.map((n) => (
          <Notification key={n.id} notification={n} onClose={dismiss} />
        ))}
      </Stack>
    </>
  );
}
