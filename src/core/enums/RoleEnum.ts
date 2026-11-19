export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER',
}

const KNOWN_ROLES = new Set<string>(Object.values(Role));

export const isRole = (value: unknown): value is Role =>
  typeof value === 'string' && KNOWN_ROLES.has(value);
