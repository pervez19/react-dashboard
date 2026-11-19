import { Role } from '../enums/RoleEnum';

// UI-only checks: they decide what to render, never what the user may do. The backend enforces permissions.
// No implicit hierarchy: SUPER_ADMIN does not pass hasRole(ADMIN); use isAdmin() for "any admin".

export const hasRole = (userRoles: readonly Role[], role: Role): boolean => userRoles.includes(role);

/** True when `required` is empty (no restriction) or the user has at least one of them. */
export const hasAnyRole = (userRoles: readonly Role[], required: readonly Role[]): boolean =>
  required.length === 0 || required.some((r) => userRoles.includes(r));

export const hasAllRoles = (userRoles: readonly Role[], required: readonly Role[]): boolean =>
  required.every((r) => userRoles.includes(r));

export const isSuperAdmin = (userRoles: readonly Role[]): boolean => hasRole(userRoles, Role.SUPER_ADMIN);

export const isAdmin = (userRoles: readonly Role[]): boolean =>
  hasAnyRole(userRoles, [Role.ADMIN, Role.SUPER_ADMIN]);
