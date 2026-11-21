# React Dashboard

React 18 + TypeScript + Vite app with Material Design (MUI), Redux Toolkit, and JWT authentication:
the access token is kept in memory and the refresh token in an HttpOnly cookie.

## Scripts

| Command             | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Dev server on http://localhost:5173   |
| `npm run build`     | Type-check + production build         |
| `npm run typecheck` | `tsc` in strict mode                  |
| `npm run lint`      | ESLint                                |
| `npm test`          | Jest + React Testing Library          |

Copy `.env.example` to `.env`, then configure the API in `.env` / `.env.production` (`VITE_API_BASE_URL`, must be HTTPS in production).
Everything prefixed `VITE_` ships to the browser: never put secrets there.

## Authentication lifecycle

| Step | What happens |
| ---- | ------------ |
| **Startup / reload** | `AuthProvider` tries to restore the session; guards show a skeleton until it settles. On reload it calls `/v1/auth/refresh-token` with the stored refresh token, so the user stays signed in. |
| **Login** | `POST /v1/auth/signin` → `{ status, message, data: { uuid, name, email, token, refreshToken, roles: ["ROLE_ADMIN"], ... } }`. The access token and user go to Redux (memory). The refresh token is kept in `sessionStorage` (survives reloads, cleared when the tab closes); never localStorage. `NoAuthGuard` redirects to the page the user asked for, or `/dashboard`. |
| **API call** | The auth interceptor adds `Authorization: Bearer <token>`, only for our own API origin. A JWT that is about to expire is refreshed first. |
| **401** | One shared refresh (single-flight in `authService.refreshAccessToken`); every concurrent 401 waits on it, then each request is retried once (`_retry`). Auth endpoints use `skipAuthRefresh`, so a refresh never triggers another refresh. |
| **Refresh fails** | Auth state is cleared once, a "session expired" notice is shown, and `AuthGuard` redirects to `/login`. |
| **Logout** | `POST /v1/auth/logout` with the bearer token and `{ refreshToken }`, so the server revokes both. Local state is cleared even if that call fails. |

## Current backend (authentication-services)

| Endpoint | Request | Response `data` |
| -------- | ------- | --------------- |
| `POST /v1/auth/signin` | `{ email, password }` | LoginResponseDTO (`token`, `refreshToken`, user fields, `roles`) |
| `POST /v1/auth/refresh-token` | `{ refreshToken }` | LoginResponseDTO (rotated pair) |
| `POST /v1/auth/logout` | Bearer + `{ refreshToken }` | `null` |
| `POST /v1/auth/signup` | `{ name, email, password }` | UserDTO |

All responses are wrapped in `{ status: "success", message, data }`. Roles arrive as Spring authorities (`ROLE_ADMIN`) and are mapped to `Role.ADMIN`.
Every request also carries the gateway key header `gatewayKey` (`VITE_GATEWAY_API_KEY`).

**Trade-off:** the backend returns the refresh token in the JSON body, so the frontend must store it. It lives in
`sessionStorage`, which an injected script (XSS) could read. A strict Content-Security-Policy reduces that risk; an
HttpOnly cookie set by the backend would remove it (see the `shortcut:` note in `authService`).

### What the backend must do (the frontend cannot enforce these)

- Refresh cookie: `HttpOnly; Secure; SameSite=Strict` (or `Lax`), scoped with `Path=/api/auth`.
- **Rotation + reuse detection**: if an already-used refresh token is presented, revoke the whole family.
  This requires server-side state, so the overall lifecycle is not fully stateless even though access tokens are.
- CSRF (double-submit): set a readable `XSRF-TOKEN` cookie; check that the `X-XSRF-TOKEN` header matches it on `/auth/refresh` and `/auth/logout`. Axios sends the header automatically, only to our API origin.
- CORS: an exact `Access-Control-Allow-Origin` (never `*`) with `Access-Control-Allow-Credentials: true`.
- Authorise **every** endpoint by role. Frontend guards and hidden menu items are UX only.
- Short access-token TTL (5–15 min). Rate-limit login and refresh (the UI handles 429 with `Retry-After`).
- Serve over HTTPS with a strict Content-Security-Policy (`script-src 'self'`): in-memory tokens are safe from storage theft, but not from XSS.

## Structure

```
|-- public
|   |-- favicon.ico
|   `-- manifest.json
|-- src
|   |-- core
|   |   |-- guards
|   |   |   |-- AuthGuard.tsx
|   |   |   |-- NoAuthGuard.tsx
|   |   |   `-- RoleGuard.tsx
|   |   |-- interceptors
|   |   |   |-- authInterceptor.ts
|   |   |   `-- errorInterceptor.ts
|   |   |-- models
|   |   |   |-- User.ts
|   |   |   `-- Token.ts
|   |   |-- enums
|   |   |   |-- RoleEnum.ts
|   |   |   |-- StatusEnum.ts
|   |   |   |-- NotificationTypeEnum.ts
|   |   |   `-- ButtonTypeEnum.ts
|   |   |-- services
|   |   |   |-- apiService.ts
|   |   |   |-- authService.ts
|   |   |   |-- validationService.ts
|   |   |   `-- notificationService.ts
|   |   |-- components
|   |   |   |-- Navbar
|   |   |   |   `-- Navbar.tsx
|   |   |   |-- Footer
|   |   |   |   `-- Footer.tsx
|   |   |   |-- NotFound
|   |   |   |   `-- NotFound.tsx
|   |   |   |-- Skeleton
|   |   |   |   `-- Skeleton.tsx
|   |   |   |-- SideMenu
|   |   |   |   `-- SideMenu.tsx
|   |   |   |-- Notification
|   |   |   |   `-- Notification.tsx
|   |   |   `-- TooltipPopup
|   |   |       `-- TooltipPopup.tsx
|   |   |-- constants
|   |   |   |-- apiUrls.ts
|   |   |   |-- appConstants.ts
|   |   |   `-- env.ts                  # the only file that reads import.meta.env
|   |   |-- utils
|   |   |   |-- commonUtils.ts
|   |   |   |-- jwtUtils.ts
|   |   |   |-- validationUtils.ts
|   |   |   `-- roleUtils.ts
|   |   `-- providers
|   |       |-- AuthProvider.tsx
|   |       |-- AppProviders.tsx
|   |       |-- ThemeProvider.tsx
|   |       `-- NotificationProvider.tsx
|   |-- shared
|   |   |-- components
|   |   |   |-- Button
|   |   |   |   `-- Button.tsx
|   |   |   |-- Modal
|   |   |   |   `-- Modal.tsx
|   |   |   |-- Spinner
|   |   |   |   `-- Spinner.tsx
|   |   |   |-- EmptyState
|   |   |   |   `-- EmptyState.tsx
|   |   |   `-- FormField
|   |   |       `-- FormField.tsx
|   |   |-- hooks
|   |   |   |-- useAuth.ts
|   |   |   |-- useFormValidation.ts
|   |   |   |-- useApi.ts
|   |   |   |-- useTheme.ts
|   |   |   `-- useNotification.ts
|   |   `-- types
|   |       |-- sharedTypes.ts
|   |       |-- notificationTypes.ts
|   |       `-- buttonTypes.ts
|   |-- features
|   |   |-- home
|   |   |   |-- components
|   |   |   |   `-- HomePage.tsx
|   |   |   |-- services
|   |   |   |   `-- homeService.ts
|   |   |   `-- types
|   |   |       `-- homeTypes.ts
|   |   |-- auth
|   |   |   |-- components
|   |   |   |   |-- Login.tsx
|   |   |   |   `-- Register.tsx
|   |   |   `-- types
|   |   |       `-- authTypes.ts
|   |   |-- dashboard
|   |   |   |-- components
|   |   |   |   |-- DashboardPage.tsx
|   |   |   |   `-- AdminPanel.tsx      # ADMIN / SUPER_ADMIN only (RoleGuard)
|   |   |   |-- services
|   |   |   |   `-- dashboardService.ts
|   |   |   `-- types
|   |   |       `-- dashboardTypes.ts
|   |   `-- docs                        # in-app "Project docs" page
|   |       |-- components
|   |       |   `-- ProjectDocsPage.tsx
|   |       |-- services
|   |       |   `-- docsService.ts
|   |       `-- types
|   |           `-- docsTypes.ts
|   |-- layouts
|   |   |-- MainLayout.tsx
|   |   |-- AuthLayout.tsx
|   |   `-- DashboardLayout.tsx
|   |-- store
|   |   |-- index.ts
|   |   `-- authStore.ts
|   |-- tests
|   |   |-- components
|   |   |   |-- App.test.tsx            # integration: login, reload, guards, sign out
|   |   |   |-- Button.test.tsx
|   |   |   |-- HomePage.test.tsx
|   |   |   |-- Navbar.test.tsx
|   |   |   |-- Notification.test.tsx
|   |   |   |-- ProjectDocsPage.test.tsx
|   |   |   |-- SideMenu.test.tsx
|   |   |   `-- TooltipPopup.test.tsx
|   |   |-- guards
|   |   |   `-- guards.test.tsx
|   |   |-- hooks
|   |   |   |-- useAuth.test.ts
|   |   |   `-- useNotification.test.ts
|   |   |-- interceptors
|   |   |   |-- authInterceptor.test.ts
|   |   |   `-- errorInterceptor.test.ts
|   |   |-- mocks
|   |   |   `-- env.ts                  # replaces core/constants/env.ts in Jest
|   |   |-- services
|   |   |   |-- authService.test.ts
|   |   |   `-- notificationService.test.ts
|   |   |-- store
|   |   |   `-- authStore.test.ts
|   |   `-- utils
|   |       |-- jwtUtils.test.ts
|   |       `-- roleUtils.test.ts
|   |-- App.tsx
|   |-- index.tsx
|   |-- react-app-env.d.ts
|   |-- routes.tsx
|   `-- setupTests.ts                   # shared test helpers (mockApi, loginBody, ...)
|-- assets
|   |-- images
|   |-- fonts
|   |-- icons
|   `-- styles
|       |-- globals.css
|       |-- variables.css
|       |-- utilities.css
|       `-- themes.css
|-- .env.example                        # copy to .env (git-ignored)
|-- .env.production
|-- index.html                          # Vite requires it in the project root
|-- package.json
|-- tsconfig.json
|-- eslint.config.js
|-- vite.config.ts
|-- jest.config.js
|-- jest.setup.ts
`-- README.md
```

Differences from the originally requested structure:

- `VerifyEmail.tsx` and `authVerificationService.ts` are not included, because email verification is not required.
- `themeTypes.ts` and `apiTypes.ts` are not under `features/auth/types`. Those types are app-wide, so they live in `shared/types/sharedTypes.ts`.
- `index.html` is in the project root, not `public/`, because Vite requires it there.
- Added: `core/constants/env.ts`, the `dashboard/AdminPanel.tsx` admin page, the `features/docs` page, and extra test folders (`guards`, `interceptors`, `store`, `mocks`).

### Layers

```
src/core        infrastructure: guards, interceptors, services, models, enums, constants, utils, providers, app-chrome components
src/shared      reusable UI (Button, Modal, Spinner, EmptyState, FormField), hooks, types
src/features    home / auth / dashboard / docs: components, services, types
src/layouts     MainLayout, AuthLayout, DashboardLayout
src/store       Redux store + auth slice
src/tests       unit + integration tests (HTTP faked at the Axios adapter; real interceptors)
assets/styles   global CSS (MUI's theme handles component styling)
```

**Per-file documentation:** sign in and open **Project docs** in the side menu (`/dashboard/docs`). It shows what
every folder and file does and why. The content lives in `src/features/docs/services/docsService.ts`, and
`ProjectDocsPage.test.tsx` fails if a file in `src`, `public` or `assets` is added or removed without updating it.

Notifications live in `notificationService`, a small framework-free queue. Interceptors can notify without React,
and React reads the queue with `useSyncExternalStore`.
