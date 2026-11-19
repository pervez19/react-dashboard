import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { login as loginThunk, logout as logoutThunk, selectAuth } from '../../store/authStore';
import { hasAllRoles, hasAnyRole, isAdmin, isSuperAdmin } from '../../core/utils/roleUtils';
import type { Role } from '../../core/enums/RoleEnum';
import type { LoginRequest } from '../../core/models/Token';

/** The one hook components use for auth: state plus role helpers bound to the current user. */
export function useAuth() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(selectAuth);

  const login = useCallback((credentials: LoginRequest) => dispatch(loginThunk(credentials)), [dispatch]);
  const logout = useCallback(() => dispatch(logoutThunk()), [dispatch]);

  return {
    user: auth.user,
    roles: auth.roles,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    initialized: auth.authenticationInitialized,
    error: auth.error,
    login,
    logout,
    hasAnyRole: (required: readonly Role[]) => hasAnyRole(auth.roles, required),
    hasAllRoles: (required: readonly Role[]) => hasAllRoles(auth.roles, required),
    isAdmin: isAdmin(auth.roles),
    isSuperAdmin: isSuperAdmin(auth.roles),
  };
}
