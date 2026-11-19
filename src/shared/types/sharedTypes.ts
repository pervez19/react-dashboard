import type { ReactNode } from 'react';
import type { Role } from '../../core/enums/RoleEnum';

/** Error body we accept from the backend. Every field is unknown because we can't trust it. */
export interface ApiErrorBody {
  message?: unknown;
  code?: unknown;
  errors?: unknown;
}

export type FieldErrors = Record<string, string>;

export type ThemeMode = 'light' | 'dark' | 'system';

/** A navigation entry; `roles` empty/undefined = visible to every signed-in user. */
export interface NavItem {
  label: string;
  to: string;
  icon?: ReactNode;
  roles?: readonly Role[];
}
