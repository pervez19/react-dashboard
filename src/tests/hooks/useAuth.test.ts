import { createElement, type ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { useAuth } from '../../shared/hooks/useAuth';
import { API_URLS } from '../../core/constants/apiUrls';
import { Role } from '../../core/enums/RoleEnum';
import { loginBody, makeUser, mockApi, storeWithSession } from '../../setupTests';
import type { AppStore } from '../../store';

const wrapperFor = (store: AppStore) => ({ children }: { children: ReactNode }) =>
  createElement(Provider, { store, children });

describe('useAuth', () => {
  it('logs in and exposes the user and role helpers', async () => {
    const user = makeUser({ roles: [Role.ADMIN, Role.MANAGER] });
    mockApi(() => ({ status: 200, data: loginBody('at', user) }));
    const store = storeWithSession(null);
    const { result } = renderHook(() => useAuth(), { wrapper: wrapperFor(store) });

    expect(result.current.isAuthenticated).toBe(false);
    await act(() => result.current.login({ email: user.email, password: 'pw' }));

    expect(result.current).toMatchObject({ isAuthenticated: true, user, isAdmin: true, isSuperAdmin: false });
    expect(result.current.hasAnyRole([Role.MANAGER])).toBe(true);
    expect(result.current.hasAllRoles([Role.ADMIN, Role.SUPER_ADMIN])).toBe(false);
    expect(store.getState().auth.accessToken).toBe('at');
  });

  it('logs out and clears the session', async () => {
    const calls = mockApi(() => ({ status: 204 }));
    const store = storeWithSession({ accessToken: 'at', user: makeUser() });
    const { result } = renderHook(() => useAuth(), { wrapper: wrapperFor(store) });

    await act(() => result.current.logout());
    expect(calls[0]?.url).toBe(API_URLS.AUTH.LOGOUT);
    expect(result.current).toMatchObject({ isAuthenticated: false, user: null, roles: [] });
    expect(store.getState().auth.accessToken).toBeNull();
  });

  it('surfaces a login error', async () => {
    mockApi(() => ({ status: 401 }));
    const { result } = renderHook(() => useAuth(), { wrapper: wrapperFor(storeWithSession(null)) });
    await act(() => result.current.login({ email: 'a@b.co', password: 'bad' }));
    expect(result.current.error).toBe('Invalid email or password.');
  });
});
