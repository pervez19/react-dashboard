import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../store';
import { selectAuthInitialized, selectIsAuthenticated } from '../../store/authStore';
import { PageSkeleton } from '../components/Skeleton/Skeleton';
import { ROUTES } from '../constants/appConstants';

/** UX gate only: the backend must still authorise every API call. */
export function AuthGuard({ children }: { children?: ReactNode }) {
  const initialized = useAppSelector(selectAuthInitialized);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const location = useLocation();

  if (!initialized) return <PageSkeleton />;
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  return children ?? <Outlet />;
}
