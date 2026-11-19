import { decodeJwt, getTokenExpiry, isTokenExpired } from '../../core/utils/jwtUtils';
import { makeJwt } from '../../setupTests';

describe('jwtUtils', () => {
  it('decodes the payload of a JWT (base64url, unicode-safe)', () => {
    const token = makeJwt(60, { name: 'Zoë' });
    expect(decodeJwt(token)).toMatchObject({ sub: 'u1', name: 'Zoë' });
  });

  it.each(['', 'not-a-jwt', 'a.b', 'a.%%%.c', `x.${btoa('[1,2]')}.y`, `x.${btoa('"str"')}.y`])(
    'returns null for malformed token %p',
    (token) => expect(decodeJwt(token)).toBeNull(),
  );

  it('reads expiry in milliseconds', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(getTokenExpiry(makeJwt(60))).toBe((now + 60) * 1000);
    expect(getTokenExpiry(`x.${btoa('{}')}.y`)).toBeNull();
  });

  it('isTokenExpired honours the skew window', () => {
    expect(isTokenExpired(makeJwt(-1))).toBe(true);
    expect(isTokenExpired(makeJwt(120))).toBe(false);
    expect(isTokenExpired(makeJwt(20), 30)).toBe(true); // expires inside the 30s window
  });

  it('treats opaque tokens as not expired (the server decides)', () => {
    expect(isTokenExpired('opaque-token')).toBe(false);
  });
});
