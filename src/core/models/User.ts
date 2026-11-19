import type { Role } from '../enums/RoleEnum';

export interface User {
  /** Backend `uuid`. */
  id: string;
  accountId?: string;
  email: string;
  name: string;
  /** Backend sends Spring authorities ("ROLE_ADMIN"); mapped to Role.ADMIN. */
  roles: Role[];
  permissions: string[];
}
