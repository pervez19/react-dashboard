import { Role } from '../../core/enums/RoleEnum';
import { hasAllRoles, hasAnyRole, hasRole, isAdmin, isSuperAdmin } from '../../core/utils/roleUtils';

describe('roleUtils', () => {
  const manager = [Role.USER, Role.MANAGER];

  it('hasRole checks a single role', () => {
    expect(hasRole(manager, Role.MANAGER)).toBe(true);
    expect(hasRole(manager, Role.ADMIN)).toBe(false);
  });

  it('hasAnyRole passes with one match and treats an empty requirement as unrestricted', () => {
    expect(hasAnyRole(manager, [Role.ADMIN, Role.MANAGER])).toBe(true);
    expect(hasAnyRole(manager, [Role.ADMIN, Role.SUPER_ADMIN])).toBe(false);
    expect(hasAnyRole([], [])).toBe(true);
    expect(hasAnyRole([], [Role.USER])).toBe(false);
  });

  it('hasAllRoles requires every role', () => {
    expect(hasAllRoles(manager, [Role.USER, Role.MANAGER])).toBe(true);
    expect(hasAllRoles(manager, [Role.USER, Role.ADMIN])).toBe(false);
  });

  it('isAdmin covers ADMIN and SUPER_ADMIN; isSuperAdmin only SUPER_ADMIN', () => {
    expect(isAdmin([Role.ADMIN])).toBe(true);
    expect(isAdmin([Role.SUPER_ADMIN])).toBe(true);
    expect(isAdmin(manager)).toBe(false);
    expect(isSuperAdmin([Role.SUPER_ADMIN])).toBe(true);
    expect(isSuperAdmin([Role.ADMIN])).toBe(false);
  });

  it('has no implicit hierarchy: SUPER_ADMIN does not pass hasRole(ADMIN)', () => {
    expect(hasRole([Role.SUPER_ADMIN], Role.ADMIN)).toBe(false);
  });
});
