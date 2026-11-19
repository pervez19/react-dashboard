import { createAsyncThunk, createSlice, type Dispatch, type PayloadAction } from '@reduxjs/toolkit';
import { authService } from '../core/services/authService';
import { notificationService } from '../core/services/notificationService';
import { normalizeApiError } from '../core/interceptors/errorInterceptor';
import type { Role } from '../core/enums/RoleEnum';
import type { User } from '../core/models/User';
import type { AuthSession, LoginRequest } from '../core/models/Token';

export interface AuthState {
  user: User | null;
  /** In memory only. Never persisted: no Redux Persist, no web storage. */
  accessToken: string | null;
  isAuthenticated: boolean;
  /** A login/logout request is in progress. */
  isLoading: boolean;
  /** The startup session-restore attempt has finished (successfully or not). */
  authenticationInitialized: boolean;
  roles: Role[];
  error: string | null;
}

export const initialAuthState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  authenticationInitialized: false,
  roles: [],
  error: null,
};

// After logout the app is still initialised; the user just isn't signed in.
const signedOut = (): AuthState => ({ ...initialAuthState, authenticationInitialized: true });

const signedIn = ({ accessToken, user }: AuthSession): AuthState => ({
  ...signedOut(),
  user,
  roles: user.roles,
  accessToken,
  isAuthenticated: true,
});

export const initializeAuth = createAsyncThunk('auth/initialize', () => authService.checkAuthentication());

export const login = createAsyncThunk<AuthSession, LoginRequest, { rejectValue: string }>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      return await authService.login(credentials);
    } catch (e) {
      const error = normalizeApiError(e);
      // One message for unknown user and wrong password: no account enumeration.
      return rejectWithValue(error.status === 401 ? 'Invalid email or password.' : error.message);
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async () => {
  // Safe logout: local state is cleared even if the server call fails (offline, already revoked...).
  await authService.logout().catch(() => undefined);
});

const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    /** After a successful refresh. `user` is optional because the refresh API may omit it. */
    tokenRefreshed(state, action: PayloadAction<{ accessToken: string; user?: User }>) {
      state.accessToken = action.payload.accessToken;
      if (action.payload.user) {
        state.user = action.payload.user;
        state.roles = action.payload.user.roles;
      }
      state.isAuthenticated = true;
    },
    clearAuth: () => signedOut(),
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.fulfilled, (_s, { payload }) => (payload ? signedIn(payload) : signedOut()))
      .addCase(initializeAuth.rejected, () => signedOut())
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (_s, { payload }) => signedIn(payload))
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Login failed. Please try again.';
      })
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, () => signedOut());
  },
});

export const { tokenRefreshed, clearAuth } = authSlice.actions;
export const authReducer = authSlice.reducer;

/** The refresh token could not be used: wipe the session; AuthGuard then redirects to /login. */
export const sessionExpired = () => (dispatch: Dispatch) => {
  dispatch(clearAuth());
  notificationService.warning('Your session has expired. Please sign in again.');
};

type WithAuth = { auth: AuthState };
export const selectAuth = (s: WithAuth) => s.auth;
export const selectUser = (s: WithAuth) => s.auth.user;
export const selectRoles = (s: WithAuth) => s.auth.roles;
export const selectAccessToken = (s: WithAuth) => s.auth.accessToken;
export const selectIsAuthenticated = (s: WithAuth) => s.auth.isAuthenticated;
export const selectAuthInitialized = (s: WithAuth) => s.auth.authenticationInitialized;
