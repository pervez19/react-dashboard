import type { JwtPayload } from '../models/Token';

/**
 * Decodes the payload WITHOUT verifying the signature. Use only for UX decisions (e.g. refresh early);
 * never for authorisation. Returns null for anything that isn't a well-formed JWT.
 */
export function decodeJwt(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[1]) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = decodeURIComponent(
      Array.from(atob(padded), (c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''),
    );
    const payload: unknown = JSON.parse(json);
    return payload && typeof payload === 'object' && !Array.isArray(payload) ? (payload as JwtPayload) : null;
  } catch {
    return null;
  }
}

/** Expiry as epoch milliseconds, or null when the token has no readable `exp`. */
export function getTokenExpiry(token: string): number | null {
  const exp = decodeJwt(token)?.exp;
  return typeof exp === 'number' ? exp * 1000 : null;
}

/**
 * True when the token expires within `skewSeconds`. Opaque/unreadable tokens return false:
 * we can't know, so we let the server decide (401 → refresh).
 */
export function isTokenExpired(token: string, skewSeconds = 0, now = Date.now()): boolean {
  const expiry = getTokenExpiry(token);
  return expiry !== null && expiry - skewSeconds * 1000 <= now;
}
