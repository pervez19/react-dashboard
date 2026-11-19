import { useEffect, type ReactNode } from 'react';
import { useAppDispatch } from '../../store';
import { initializeAuth } from '../../store/authStore';

/**
 * Restores the session from the HttpOnly refresh cookie on startup / browser reload.
 * Guards render a skeleton until `authenticationInitialized` is true, so protected content never flashes.
 * StrictMode runs this effect twice; authService's single-flight refresh keeps it to one network call.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    void dispatch(initializeAuth());
  }, [dispatch]);
  return <>{children}</>;
}
