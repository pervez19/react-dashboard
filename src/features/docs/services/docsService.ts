import type { DocNode } from '../types/docsTypes';

// Static documentation of this codebase. src/tests/components/ProjectDocsPage.test.tsx checks it against the
// files on disk, so a new or deleted file fails the test until this tree is updated.

const file = (name: string, summary: string, how?: string, why?: string): DocNode => ({ name, kind: 'file', summary, how, why });
const folder = (name: string, summary: string, children: DocNode[], how?: string, why?: string): DocNode => ({
  name, kind: 'folder', summary, children, how, why,
});

const PROJECT_TREE: DocNode = folder(
  'react-dashboard',
  'React 18 + TypeScript app built with Vite, Material Design (MUI), Redux Toolkit and Axios, with JWT authentication against the API gateway.',
  [
    folder('public', 'Static files served as-is at the site root, without processing.', [
      file('favicon.ico', 'Browser tab icon.'),
      file('manifest.json', 'Web-app manifest: app name, start URL and theme colour used when the app is installed or pinned.'),
    ]),
    folder('assets', 'Static resources that are imported by the code (and therefore bundled).', [
      folder('images', 'Place for images (empty for now).', []),
      folder('fonts', 'Place for self-hosted fonts (empty for now).', []),
      folder('icons', 'Place for custom SVG icons (empty for now; Material icons come from @mui/icons-material).', []),
      folder('styles', 'Global CSS. Component styling is done with the MUI theme; these files only hold app-wide additions.', [
        file('variables.css', 'Design tokens that live outside the MUI theme (focus ring, content width, transition speed).'),
        file('themes.css', 'Per-theme tweaks for non-MUI elements.', 'MUI toggles a `.light` / `.dark` class on <html>; rules here hang off those classes.'),
        file('globals.css', 'App-wide rules: visible keyboard focus outline, scrollbar colour, reduced-motion support.', undefined, 'Accessibility defaults that apply to every page.'),
        file('utilities.css', 'Small helper classes: `.sr-only` (visible to screen readers only) and `.text-truncate`.'),
      ]),
    ]),
    folder(
      'src',
      'All application source code.',
      [
        file('index.tsx', 'Application entry point.', 'Attaches the Axios interceptors (auth first, then error: order matters because Axios runs response interceptors in registration order), imports the global CSS, and renders <App/> in React StrictMode.'),
        file('App.tsx', 'Root component.', 'Creates the router once and renders it inside <AppProviders> (Redux, theme, notifications, auth restore).'),
        file('routes.tsx', 'Every route of the app in one place.', 'Pages are lazy-loaded (code-split). Three groups: public pages in MainLayout; guest-only pages (login, register) behind NoAuthGuard in AuthLayout; signed-in pages (dashboard, docs, admin) behind AuthGuard in DashboardLayout, with RoleGuard on the admin page.', 'Centralised routing makes access rules visible at a glance.'),
        file('react-app-env.d.ts', 'TypeScript types for the environment variables (`import.meta.env.VITE_*`).'),
        file('setupTests.ts', 'Shared test helpers (not a test itself).', '`mockApi` replaces only the HTTP adapter of the real Axios client, so tests run the real interceptors. Also: `makeUser`, `loginBody` (the exact backend response shape), `makeJwt`, `storeWithSession`, `signInStore`.'),

        folder(
          'core',
          'Application infrastructure: authentication, HTTP, routing guards, configuration and app-wide components.',
          [
            folder('guards', 'Route guards: components that decide whether a route may render.', [
              file('AuthGuard.tsx', 'Lets only signed-in users through.', 'While the session is being restored on startup it shows a skeleton; if nobody is signed in it redirects to /login, remembering the page you wanted (`from`).', 'Stops protected content from flashing during a reload. It is a UX gate only: the backend still authorises every API call.'),
              file('NoAuthGuard.tsx', 'Keeps signed-in users away from login and register.', 'If you are signed in, it redirects to the page you originally asked for, or /dashboard. This is also how the redirect after login happens: the Login form never navigates itself.'),
              file('RoleGuard.tsx', 'Restricts a route to certain roles.', '`allowedRoles` (any one of them, or all with `requireAll`). Users without the role are sent to /unauthorized.', 'Role checks in the UI only hide things; the backend must reject the same requests.'),
            ]),
            folder('interceptors', 'Axios interceptors: code that runs around every API request.', [
              file('authInterceptor.ts', 'Attaches the access token and renews it automatically.', 'Request: adds `Authorization: Bearer <token>` only for our own API origin, and refreshes first if the JWT expires within 30 s. Response: on 401 it runs ONE shared refresh (even if many requests fail at once), retries each request once, never refreshes for auth endpoints, and if the refresh fails it signs the user out once with a "session expired" notice.', 'Without a single shared refresh, parallel 401s would trigger parallel refreshes, which the backend treats as token reuse and revokes every session.'),
              file('errorInterceptor.ts', 'Turns every API failure into one `ApiError` with a safe, human message.', 'Maps 400/401/403/404/409/422/429/5xx (and network/timeout) to clear messages, uses server text only for 400/409/422, extracts field errors and Retry-After, and shows one de-duplicated toast. 401s, cancelled requests and calls marked `skipErrorNotification` stay silent.', 'One place for error handling; never shows stack traces or internal server messages to users.'),
            ]),
            folder('models', 'Domain data shapes shared across the app.', [
              file('User.ts', 'The signed-in user: id (backend uuid), accountId, email, name, roles, permissions.'),
              file('Token.ts', 'Auth request/response types: LoginRequest, RegisterRequest, RefreshResponse, AuthSession, and the JWT payload claims.'),
            ]),
            folder('enums', 'Fixed sets of values, so typos become compile errors.', [
              file('RoleEnum.ts', 'SUPER_ADMIN, ADMIN, MANAGER, USER, plus `isRole()` to validate role strings from the server.'),
              file('StatusEnum.ts', 'idle / loading / success / error: the lifecycle of an async operation.'),
              file('NotificationTypeEnum.ts', 'success / info / warning / error (the same values as MUI Alert severities).'),
              file('ButtonTypeEnum.ts', 'primary / secondary / danger / text: semantic button kinds mapped to Material styles.'),
            ]),
            folder('services', 'Framework-free logic. No React here, so it is easy to test and reuse.', [
              file('apiService.ts', 'The single Axios instance and typed get/post/put/patch/delete helpers.', 'Base URL and timeout from env, credentials enabled, the `gatewayKey` header on every request, and CSRF header only for our own API. `isOwnApiRequest` compares origins so tokens never leak to other hosts.', 'One HTTP configuration for the whole app; feature services must not create their own Axios instances.'),
              file('authService.ts', 'Talks to the authentication API: login, register, logout, refresh, restore session.', 'Unwraps the backend envelope `{ status, message, data }`, validates it, and maps Spring roles (`ROLE_ADMIN` → ADMIN). The refresh token is kept in sessionStorage (survives reload, cleared when the tab closes); the access token stays in memory. Refresh is single-flight.', 'Keeps API details out of UI components. The backend returns the refresh token in the body, so it must be stored somewhere; sessionStorage is the shortest-lived storage that survives a reload.'),
              file('validationService.ts', 'Form validation rules: required, email, strongPassword, matches, and `validate(values, schema)`.', 'Each field has a list of rules; the first failing rule gives the error message.', 'Client-side checks give fast feedback; the backend validates again.'),
              file('notificationService.ts', 'Toast message queue usable from anywhere.', 'A tiny publish/subscribe store with de-duplication and a maximum of 3 visible messages. React reads it through useSyncExternalStore.', 'Interceptors are not React components, yet they must be able to show messages.'),
            ]),
            folder('components', 'App-wide UI pieces (the "chrome" around pages).', [
              folder('Navbar', 'Top app bar.', [file('Navbar.tsx', 'Brand link, light/dark toggle, and either Sign in / Create account or the account menu (initials avatar, email, Dashboard, Sign out). Shows a menu button on phones to open the side menu.')]),
              folder('Footer', 'Page footer.', [file('Footer.tsx', 'Copyright line with the current year.')]),
              folder('NotFound', 'Error page.', [file('NotFound.tsx', 'Big code, title, description and a "Back to home" button. Used for 404 and, with other text, for 403 (/unauthorized).')]),
              folder('Skeleton', 'Loading placeholders.', [file('Skeleton.tsx', '`Skeleton` (MUI wrapper) and `PageSkeleton`, the full-page placeholder shown by guards while the session is restored.')]),
              folder('SideMenu', 'Dashboard navigation.', [file('SideMenu.tsx', 'Role-aware menu: items the user has no role for are not rendered. Slide-in drawer on phones, permanent on desktop; highlights the current page.')]),
              folder('Notification', 'Toast message.', [file('Notification.tsx', 'One Material Alert with a close button and auto-hide. Errors use role="alert" (announced immediately by screen readers), others role="status".')]),
              folder('TooltipPopup', 'Tooltip.', [file('TooltipPopup.tsx', 'Material tooltip with an arrow; also opens on keyboard focus, not only on hover.')]),
            ]),
            folder('constants', 'Configuration values in one place.', [
              file('apiUrls.ts', 'Backend endpoint paths, relative to VITE_API_BASE_URL.'),
              file('appConstants.ts', 'App name, ROUTES, default page after login, token-expiry margin, notification timing, CSRF and gateway header names, minimum password length.'),
              file('env.ts', 'The only file that reads `import.meta.env`.', 'Validates configuration at startup: base URL required (HTTPS in production) and gateway key required.', 'Fails fast with a clear error instead of a wall of 401s. Jest swaps this file for tests/mocks/env.ts because import.meta does not exist in Jest.'),
            ]),
            folder('utils', 'Small pure helper functions.', [
              file('commonUtils.ts', 'getInitials ("Ada Lovelace" → "AL"), formatNumber, isNonEmptyString.'),
              file('jwtUtils.ts', 'Reads the JWT payload and expiry.', 'Decodes WITHOUT checking the signature.', 'Only used to refresh before expiry (a UX decision); never for security decisions.'),
              file('validationUtils.ts', 'isBlank, isEmail, isStrongPassword: building blocks for validationService.'),
              file('roleUtils.ts', 'hasRole, hasAnyRole, hasAllRoles, isAdmin, isSuperAdmin.', 'No hidden hierarchy: SUPER_ADMIN does not automatically pass hasRole(ADMIN); use isAdmin() for "any admin".'),
            ]),
            folder('providers', 'React context providers that wrap the whole app.', [
              file('AppProviders.tsx', 'Combines all providers in the right order: Redux → Theme → Notifications → Auth.'),
              file('AuthProvider.tsx', 'Restores the session when the app starts or the page is reloaded.', 'Dispatches `initializeAuth` once; guards show a skeleton until it finishes.'),
              file('ThemeProvider.tsx', 'Material Design theme: colours, light/dark schemes, rounded corners, default component props, CssBaseline.'),
              file('NotificationProvider.tsx', 'Renders the stack of toast messages in the bottom-right corner.'),
            ]),
          ],
          undefined,
          'Features depend on core, never the other way round. That keeps the infrastructure reusable and avoids circular imports.',
        ),

        folder(
          'shared',
          'Reusable building blocks with no knowledge of specific features.',
          [
            folder('components', 'Generic UI components built on MUI.', [
              folder('Button', 'Button.', [file('Button.tsx', 'House button.', '`kind` (ButtonType) picks the Material variant and colour; `loading` disables it and shows a spinner; can render as a router link (`component={Link}`).')]),
              folder('Modal', 'Dialog.', [file('Modal.tsx', 'Accessible dialog: title, close button, Esc to close, focus trapped inside, full screen on phones.')]),
              folder('Spinner', 'Loading indicator.', [file('Spinner.tsx', 'Circular progress with role="status" and a label for screen readers.')]),
              folder('EmptyState', 'Empty or error placeholder.', [file('EmptyState.tsx', 'Icon, title, description and an optional action button for "nothing here" or "failed to load" states.')]),
              folder('FormField', 'Form input.', [file('FormField.tsx', 'Material TextField that takes an error message string and links it to the input for screen readers.')]),
            ]),
            folder('hooks', 'Reusable React hooks.', [
              file('useAuth.ts', 'Current user, roles and auth state, plus login(), logout(), hasAnyRole(), hasAllRoles(), isAdmin.', undefined, 'Components use this one hook instead of touching Redux directly.'),
              file('useFormValidation.ts', 'Form state: values, errors, handleChange, handleSubmit, and setErrors for server field errors.'),
              file('useApi.ts', 'Loads data with a status (loading/success/error), cancels on unmount, and offers reload().', undefined, 'Ready for real data endpoints; the current pages use static data.'),
              file('useTheme.ts', 'Current light/dark mode and toggle(). MUI remembers the choice (a UI preference, not auth data).'),
              file('useNotification.ts', 'Current notifications plus success(), info(), warning(), error() and dismiss().'),
            ]),
            folder('types', 'Shared TypeScript types.', [
              file('sharedTypes.ts', 'ApiErrorBody, FieldErrors, ThemeMode and NavItem (a menu entry with optional required roles).'),
              file('notificationTypes.ts', 'AppNotification: id, message, type.'),
              file('buttonTypes.ts', 'ButtonProps: MUI button props plus `kind`.'),
            ]),
          ],
        ),

        folder(
          'features',
          'One folder per business feature, each with components (UI), services (data) and types.',
          [
            folder('home', 'Public landing page.', [
              folder('components', 'UI.', [file('HomePage.tsx', 'Hero section, "How it works" steps and the feature cards.')]),
              folder('services', 'Data.', [file('homeService.ts', 'Static content for the home page; there is no backend endpoint for it.')]),
              folder('types', 'Types.', [file('homeTypes.ts', 'GuideStep, AppFeature, AppGuide.')]),
            ]),
            folder('auth', 'Sign-in and registration screens. The API calls live in core/services/authService.ts.', [
              folder('components', 'UI.', [
                file('Login.tsx', 'Sign-in form.', 'Validates email and password, dispatches login, and shows "Invalid email or password." inline on failure. After success, NoAuthGuard redirects.', 'A single generic error message avoids revealing which emails have accounts.'),
                file('Register.tsx', 'Sign-up form.', 'Checks the name, email, a strong password and that both passwords match; maps server field errors onto the inputs; on success shows a toast and goes to login.'),
              ]),
              folder('types', 'Types.', [file('authTypes.ts', 'LoginFormValues and RegisterFormValues (form field shapes).')]),
            ]),
            folder('dashboard', 'Signed-in area.', [
              folder('components', 'UI.', [
                file('DashboardPage.tsx', 'Greeting, your role chips, metric cards and recent activity.'),
                file('AdminPanel.tsx', 'Administration page shown only to ADMIN and SUPER_ADMIN (through RoleGuard).'),
              ]),
              folder('services', 'Data.', [file('dashboardService.ts', 'Static sample metrics and activity; no reporting API is called.')]),
              folder('types', 'Types.', [file('dashboardTypes.ts', 'Metric, Activity, DashboardSummary.')]),
            ]),
            folder('docs', 'This documentation page.', [
              folder('components', 'UI.', [file('ProjectDocsPage.tsx', 'Architecture overview, request lifecycle and this interactive file tree.')]),
              folder('services', 'Data.', [file('docsService.ts', 'The documentation content you are reading, as a tree.', 'A test compares it with the files on disk, so it cannot silently drift from the code.')]),
              folder('types', 'Types.', [file('docsTypes.ts', 'DocNode: a documented folder or file.')]),
            ]),
          ],
          undefined,
          'Code for one feature stays together, so a feature can be changed or removed without touching the others.',
        ),

        folder('layouts', 'Page frames shared by groups of routes.', [
          file('MainLayout.tsx', 'Public pages: navbar, content, footer.'),
          file('AuthLayout.tsx', 'Login and register: a centred card without app navigation.'),
          file('DashboardLayout.tsx', 'Signed-in pages: navbar, role-aware side menu (NAV_ITEMS), content and footer.'),
        ]),

        folder('store', 'Global state with Redux Toolkit.', [
          file('index.ts', 'Creates the store and the typed hooks useAppDispatch / useAppSelector.', 'Redux DevTools is enabled only in development, because it would expose the access token.'),
          file('authStore.ts', 'Auth state: user, accessToken, isAuthenticated, isLoading, authenticationInitialized, roles, error.', 'Thunks: initializeAuth (restore on reload), login, logout (always clears local state). Actions: tokenRefreshed, clearAuth, sessionExpired. Plus selectors.', 'The access token lives here, in memory only; it is never persisted.'),
        ]),

        folder(
          'tests',
          'Unit and integration tests (Jest + React Testing Library). Run with `npm test`.',
          [
            folder('components', 'UI tests.', [
              file('App.test.tsx', 'End-to-end app tests: session restored after reload, redirect to login and back, static dashboard, form validation, wrong credentials, admin access denied, sign out.'),
              file('Button.test.tsx', 'Clicks, kind → style mapping, loading state, rendering as a link.'),
              file('HomePage.test.tsx', 'Renders the guide and features without any API call.'),
              file('Navbar.test.tsx', 'Guest links, account menu, sign out, mobile menu button, theme toggle.'),
              file('Notification.test.tsx', 'Screen-reader roles, close button, auto-hide timing.'),
              file('ProjectDocsPage.test.tsx', 'This page works, and its file tree matches the files on disk.'),
              file('SideMenu.test.tsx', 'Items filtered by role, active page highlighted.'),
              file('TooltipPopup.test.tsx', 'Opens on hover and on keyboard focus.'),
            ]),
            folder('guards', 'Route guard tests.', [file('guards.test.tsx', 'AuthGuard (skeleton, redirect, allow), NoAuthGuard (redirect when signed in), RoleGuard (any role / all roles / denied).')]),
            folder('hooks', 'Hook tests.', [
              file('useAuth.test.ts', 'Login, logout, role helpers and the error message.'),
              file('useNotification.test.ts', 'Re-renders on notifications raised anywhere; dismiss.'),
            ]),
            folder('interceptors', 'Interceptor tests (the most critical code).', [
              file('authInterceptor.test.ts', 'Bearer header, gateway key, no token sent to other hosts, single shared refresh for concurrent 401s, failed refresh, no refresh loops, proactive refresh.'),
              file('errorInterceptor.test.ts', 'Every status code mapping, field errors, Retry-After, silent 401, de-duplicated toasts.'),
            ]),
            folder('mocks', 'Test stand-ins.', [file('env.ts', 'Static configuration used instead of core/constants/env.ts in Jest.')]),
            folder('services', 'Service tests.', [
              file('authService.test.ts', 'Response parsing, role mapping, refresh-token storage and rotation, single-flight refresh, logout.'),
              file('notificationService.test.ts', 'Types, de-duplication, maximum visible, subscribe/unsubscribe.'),
            ]),
            folder('store', 'Redux tests.', [file('authStore.test.ts', 'Initial state, session restore, login, logout (even when the server fails), token refresh, session expiry.')]),
            folder('utils', 'Utility tests.', [
              file('jwtUtils.test.ts', 'JWT decoding, malformed tokens, expiry with a safety margin.'),
              file('roleUtils.test.ts', 'Every role helper, including "no hidden hierarchy".'),
            ]),
          ],
        ),
      ],
    ),
    file('index.html', 'The HTML page the browser loads first; it starts /src/index.tsx.', undefined, 'Lives in the project root (not public/) because Vite requires it there.'),
    file('.env.example', 'Template for the local `.env`: API base URL, request timeout, gateway API key.', 'Copy it to `.env` and fill in your values. `.env` itself is git-ignored, so local URLs and keys are never committed.', 'Everything prefixed VITE_ ends up in the browser bundle, so never put secrets here.'),
    file('.env.production', 'Production configuration. The API URL must be HTTPS.'),
    file('package.json', 'Dependencies and scripts: dev, build, typecheck, lint, test.'),
    file('tsconfig.json', 'TypeScript in strict mode.'),
    file('eslint.config.js', 'Lint rules: TypeScript, React hooks, no `any`, warning on console.log (avoids leaking tokens in logs).'),
    file('vite.config.ts', 'Vite dev server (port 5173), React plugin, and vendor chunks (react / mui / state) that browsers can cache between deploys.'),
    file('jest.config.js', 'Jest setup: jsdom browser environment, TypeScript via ts-jest, and module mapping for env and CSS.'),
    file('jest.setup.ts', 'Runs before every test file: jest-dom matchers, browser polyfills (TextEncoder, Request, matchMedia), and clearing sessionStorage after each test.'),
    file('README.md', 'Setup, scripts, authentication lifecycle and the backend contract.'),
  ],
);

export const ARCHITECTURE_LAYERS = [
  { name: 'core', text: 'Infrastructure: HTTP client, interceptors, auth service, guards, providers, configuration.' },
  { name: 'shared', text: 'Reusable UI components, hooks and types with no feature knowledge.' },
  { name: 'features', text: 'Business screens (home, auth, dashboard, docs), each with components, services and types.' },
  { name: 'layouts', text: 'Page frames: public, login/register, and the signed-in dashboard.' },
  { name: 'store', text: 'Redux: the in-memory authentication state.' },
] as const;

export const REQUEST_LIFECYCLE = [
  'You sign in: authService calls /v1/auth/signin through the API gateway (with the gatewayKey header).',
  'The access token goes to Redux (memory only); the refresh token goes to sessionStorage.',
  'Every API request: the auth interceptor adds "Authorization: Bearer <token>".',
  'Token expired (401)? One shared refresh gets new tokens, then the failed requests are retried.',
  'Page reload: AuthProvider uses the stored refresh token to restore your session before any protected page renders.',
  'Refresh fails or you sign out: tokens are revoked/removed and you return to the login page.',
] as const;

/** Items of the requested structure that were intentionally not created, and why. */
export const OMITTED_FROM_REQUESTED_STRUCTURE = [
  'features/auth/components/VerifyEmail.tsx and features/auth/services/authVerificationService.ts: email verification is not required.',
  'features/auth/types/themeTypes.ts and apiTypes.ts: those types are app-wide, so they live in shared/types/sharedTypes.ts.',
  'public/index.html: Vite requires index.html in the project root.',
] as const;

export const docsService = {
  getProjectTree: (): DocNode => PROJECT_TREE,
};
