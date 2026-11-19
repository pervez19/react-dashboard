import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import type { AppGuide } from '../types/homeTypes';

/** Static content describing the app; there is no backend endpoint for it. */
const APP_GUIDE: AppGuide = {
  steps: [
    {
      title: 'Create an account',
      description: 'Register with your name, email and a strong password, then sign in.',
    },
    {
      title: 'Sign in securely',
      description:
        'Your credentials go through the API gateway to the authentication service. You receive a short-lived access token that is kept in memory only.',
    },
    {
      title: 'Work in your dashboard',
      description:
        'Every request carries your token. Pages, menus and actions adapt to your role (User, Manager, Admin or Super Admin).',
    },
    {
      title: 'Stay signed in automatically',
      description:
        'When the access token expires, the app renews it in the background and retries your request. You never see the interruption.',
    },
    {
      title: 'Sign out safely',
      description:
        'Signing out revokes your tokens on the server. If a session can no longer be renewed, you are signed out with a notice.',
    },
  ],
  features: [
    {
      icon: LockOutlinedIcon,
      title: 'Secure JWT authentication',
      description: 'Tokens live in memory only, never in localStorage or sessionStorage, which limits what an attacker can steal.',
    },
    {
      icon: AutorenewIcon,
      title: 'Automatic token refresh',
      description: 'One shared refresh for many simultaneous requests, rotating refresh tokens, and automatic retries.',
    },
    {
      icon: AdminPanelSettingsOutlinedIcon,
      title: 'Role-based access control',
      description: 'Super Admin, Admin, Manager and User roles drive which routes, menu items and actions you see.',
    },
    {
      icon: AltRouteIcon,
      title: 'Protected routing',
      description: 'Guards keep private pages private, send you back to the page you wanted after login, and show an access-denied page.',
    },
    {
      icon: HubOutlinedIcon,
      title: 'API gateway integration',
      description: 'Every request carries the gateway key, and errors (validation, conflicts, rate limits, outages) become clear messages.',
    },
    {
      icon: PaletteOutlinedIcon,
      title: 'Material Design UI',
      description: 'Light and dark themes, responsive layouts for phone to desktop, and keyboard and screen-reader support.',
    },
    {
      icon: NotificationsActiveOutlinedIcon,
      title: 'Smart notifications',
      description: 'Success, warning and error toasts, de-duplicated so that one problem shows one message.',
    },
    {
      icon: SpeedOutlinedIcon,
      title: 'Fast by design',
      description: 'Pages load on demand and skeleton placeholders appear while content loads. Protected content never flashes.',
    },
  ],
};

export const homeService = {
  getAppGuide: (): AppGuide => APP_GUIDE,
};
