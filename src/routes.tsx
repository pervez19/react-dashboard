import { lazy } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { AuthGuard } from './core/guards/AuthGuard';
import { NoAuthGuard } from './core/guards/NoAuthGuard';
import { RoleGuard } from './core/guards/RoleGuard';
import { Role } from './core/enums/RoleEnum';
import { ROUTES } from './core/constants/appConstants';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Feature pages are code-split; each layout wraps its <Outlet/> in <Suspense>.
const HomePage = lazy(() => import('./features/home/components/HomePage'));
const Login = lazy(() => import('./features/auth/components/Login'));
const Register = lazy(() => import('./features/auth/components/Register'));
const DashboardPage = lazy(() => import('./features/dashboard/components/DashboardPage'));
const AdminPanel = lazy(() => import('./features/dashboard/components/AdminPanel'));
const ProjectDocsPage = lazy(() => import('./features/docs/components/ProjectDocsPage'));
const NotFound = lazy(() => import('./core/components/NotFound/NotFound'));

export const routes: RouteObject[] = [
  {
    element: <MainLayout />,
    children: [
      { path: ROUTES.HOME, element: <HomePage /> },
      {
        path: ROUTES.UNAUTHORIZED,
        element: (
          <NotFound code="403" title="Access denied" description="You don't have permission to view this page." />
        ),
      },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    element: <NoAuthGuard />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: ROUTES.LOGIN, element: <Login /> },
          { path: ROUTES.REGISTER, element: <Register /> },
        ],
      },
    ],
  },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: ROUTES.DASHBOARD, element: <DashboardPage /> },
          { path: ROUTES.DOCS, element: <ProjectDocsPage /> },
          {
            element: <RoleGuard allowedRoles={[Role.ADMIN, Role.SUPER_ADMIN]} />,
            children: [{ path: ROUTES.ADMIN, element: <AdminPanel /> }],
          },
        ],
      },
    ],
  },
];

export const createAppRouter = () => createBrowserRouter(routes);
