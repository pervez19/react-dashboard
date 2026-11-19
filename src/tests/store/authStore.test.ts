import {
  authReducer, clearAuth, initialAuthState, initializeAuth, login, logout, sessionExpired, tokenRefreshed,
} from '../../store/authStore';
import { authService } from '../../core/services/authService';
import { notificationService } from '../../core/services/notificationService';
import { ApiError } from '../../core/interceptors/errorInterceptor';
import { Role } from '../../core/enums/RoleEnum';
import { makeStore } from '../../store';
import { makeUser } from '../../setupTests';

jest.mock('../../core/services/authService');
const mocked = jest.mocked(authService);

describe('authStore', () => {
  const user = makeUser({ roles: [Role.ADMIN] });
  const session = { accessToken: 'at', user };

  beforeEach(() => {
    jest.resetAllMocks();
    notificationService.clear();
  });

  it('starts uninitialised and signed out', () => {
    expect(authReducer(undefined, { type: '@@init' })).toEqual(initialAuthState);
    expect(initialAuthState.authenticationInitialized).toBe(false);
  });

  it('initializeAuth restores a session from the refresh cookie', async () => {
    mocked.checkAuthentication.mockResolvedValue(session);
    const store = makeStore();
    await store.dispatch(initializeAuth());
    expect(store.getState().auth).toMatchObject({
      authenticationInitialized: true, isAuthenticated: true, accessToken: 'at', user, roles: [Role.ADMIN],
    });
  });

  it('initializeAuth without a valid cookie initialises as signed out', async () => {
    mocked.checkAuthentication.mockResolvedValue(null);
    const store = makeStore();
    await store.dispatch(initializeAuth());
    expect(store.getState().auth).toMatchObject({ authenticationInitialized: true, isAuthenticated: false, accessToken: null });
  });

  it('login stores token + user in memory and tracks loading', async () => {
    let resolve!: (s: typeof session) => void;
    mocked.login.mockReturnValue(new Promise((r) => (resolve = r)));
    const store = makeStore();
    const pending = store.dispatch(login({ email: user.email, password: 'pw' }));
    expect(store.getState().auth.isLoading).toBe(true);
    resolve(session);
    await pending;
    expect(store.getState().auth).toMatchObject({ isLoading: false, isAuthenticated: true, accessToken: 'at', error: null });
  });

  it('login maps 401 to a generic credentials error (no account enumeration)', async () => {
    mocked.login.mockRejectedValue(new ApiError('x', 401, 'HTTP_401'));
    const store = makeStore();
    await store.dispatch(login({ email: 'a@b.co', password: 'bad' }));
    expect(store.getState().auth).toMatchObject({ isAuthenticated: false, isLoading: false, error: 'Invalid email or password.' });
  });

  it('logout resets all auth state, even when the server call fails', async () => {
    mocked.checkAuthentication.mockResolvedValue(session);
    mocked.logout.mockRejectedValue(new ApiError('offline', 0, 'NETWORK'));
    const store = makeStore();
    await store.dispatch(initializeAuth());
    await store.dispatch(logout());
    expect(mocked.logout).toHaveBeenCalled();
    expect(store.getState().auth).toEqual({ ...initialAuthState, authenticationInitialized: true });
  });

  it('tokenRefreshed swaps the token and keeps the user when the refresh omits it', () => {
    const state = authReducer(authReducer(undefined, initializeAuth.fulfilled(session, 'r')), tokenRefreshed({ accessToken: 'new' }));
    expect(state).toMatchObject({ accessToken: 'new', user, isAuthenticated: true });
  });

  it('sessionExpired clears state and notifies once', () => {
    const store = makeStore();
    store.dispatch(initializeAuth.fulfilled(session, 'r'));
    store.dispatch(sessionExpired());
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(notificationService.getSnapshot()).toHaveLength(1);
  });

  it('clearAuth keeps the app initialised', () => {
    expect(authReducer(undefined, clearAuth()).authenticationInitialized).toBe(true);
  });
});
