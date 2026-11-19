import { PASSWORD_MIN_LENGTH } from '../constants/appConstants';

// Client-side checks are for fast feedback only; the backend must validate again.

export const isBlank = (value: string): boolean => value.trim().length === 0;

// Pragmatic check (one @, a dot in the domain, no spaces); the backend does the authoritative validation.
export const isEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

/** At least PASSWORD_MIN_LENGTH chars with a lower-case letter, an upper-case letter and a digit. */
export const isStrongPassword = (value: string): boolean =>
  value.length >= PASSWORD_MIN_LENGTH && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value);
