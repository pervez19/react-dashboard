import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../store';
import { selectAuth } from '../../store/authStore';
import { hasAllRoles, hasAnyRole } from '../utils/roleUtils';
import type { Role } from '../enums/RoleEnum';
import { PageSkeleton } from '../components/Skeleton/Skeleton';
import { ROUTES } from '../constants/appConstants';

interface RoleGuardProps {
  allowedRoles: readonly Role[];
  /** Require every role instead of any one of them. */
  requireAll?: boolean;
  children?: ReactNode;
}

/** UX gate only: the backend must reject the same requests for users without these roles. */
export function RoleGuard({ allowedRoles, requireAll = false, children }: RoleGuardProps) {
  const { authenticationInitialized, isAuthenticated, roles } = useAppSelector(selectAuth);
  const location = useLocation();

  if (!authenticationInitialized) return <PageSkeleton />;
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;

  const allowed = requireAll ? hasAllRoles(roles, allowedRoles) : hasAnyRole(roles, allowedRoles);
  if (!allowed) return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  return children ?? <Outlet />;
}
