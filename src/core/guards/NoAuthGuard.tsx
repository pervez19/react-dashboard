import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation, type Location } from 'react-router-dom';
import { useAppSelector } from '../../store';
import { selectAuthInitialized, selectIsAuthenticated } from '../../store/authStore';
import { PageSkeleton } from '../components/Skeleton/Skeleton';
import { DEFAULT_AUTHENTICATED_ROUTE, ROUTES } from '../constants/appConstants';

/** Keeps signed-in users away from login/register. Also performs the post-login redirect. */
export function NoAuthGuard({ children }: { children?: ReactNode }) {
  const initialized = useAppSelector(selectAuthInitialized);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const location = useLocation();

  if (!initialized) return <PageSkeleton />;
  if (isAuthenticated) {
    // `from` is set by AuthGuard via router state (same-app path), so this can't become an open redirect.
    const from = (location.state as { from?: Location } | null)?.from;
    const target = from?.pathname && from.pathname !== ROUTES.LOGIN ? from : DEFAULT_AUTHENTICATED_ROUTE;
    return <Navigate to={target} replace />;
  }
  return children ?? <Outlet />;
}
