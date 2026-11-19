import type { ReactNode } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import type { AppStore } from '../../store';
import { ThemeProvider } from './ThemeProvider';
import { NotificationProvider } from './NotificationProvider';
import { AuthProvider } from './AuthProvider';

export function AppProviders({ store, children }: { store: AppStore; children: ReactNode }) {
  return (
    <ReduxProvider store={store}>
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>{children}</AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ReduxProvider>
  );
}
