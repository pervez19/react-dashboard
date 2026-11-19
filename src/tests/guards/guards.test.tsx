import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createMemoryRouter, RouterProvider, useLocation, type RouteObject } from 'react-router-dom';
import { AuthGuard } from '../../core/guards/AuthGuard';
import { NoAuthGuard } from '../../core/guards/NoAuthGuard';
import { RoleGuard } from '../../core/guards/RoleGuard';
import { Role } from '../../core/enums/RoleEnum';
import { makeUser, storeWithSession } from '../../setupTests';
import type { AppStore } from '../../store';

function Where() {
  const { pathname } = useLocation();
  return <p>at {pathname}</p>;
}

const routes: RouteObject[] = [
  { path: '/login', element: <NoAuthGuard><Where /></NoAuthGuard> },
  { path: '/unauthorized', element: <Where /> },
  {
    element: <AuthGuard />,
    children: [
      { path: '/dashboard', element: <Where /> },
      {
        element: <RoleGuard allowedRoles={[Role.ADMIN, Role.SUPER_ADMIN]} />,
        children: [{ path: '/admin', element: <Where /> }],
      },
      {
        element: <RoleGuard allowedRoles={[Role.ADMIN, Role.MANAGER]} requireAll />,
        children: [{ path: '/ops', element: <Where /> }],
      },
    ],
  },
];

const renderAt = (path: string, store: AppStore) =>
  render(
    <Provider store={store}>
      <RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />
    </Provider>,
  );

const session = (...roles: Role[]) => ({ accessToken: 'at', user: makeUser({ roles }) });

describe('AuthGuard', () => {
  it('shows a skeleton (and no protected content) while auth initialises', () => {
    renderAt('/dashboard', storeWithSession());
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    expect(screen.queryByText('at /dashboard')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated users to login', () => {
    renderAt('/dashboard', storeWithSession(null));
    expect(screen.getByText('at /login')).toBeInTheDocument();
  });

  it('renders protected content for authenticated users', () => {
    renderAt('/dashboard', storeWithSession(session(Role.USER)));
    expect(screen.getByText('at /dashboard')).toBeInTheDocument();
  });
});

describe('NoAuthGuard', () => {
  it('lets anonymous users see the login page', () => {
    renderAt('/login', storeWithSession(null));
    expect(screen.getByText('at /login')).toBeInTheDocument();
  });

  it('sends authenticated users to the dashboard', () => {
    renderAt('/login', storeWithSession(session(Role.USER)));
    expect(screen.getByText('at /dashboard')).toBeInTheDocument();
  });
});

describe('RoleGuard', () => {
  it('allows any of the listed roles', () => {
    renderAt('/admin', storeWithSession(session(Role.SUPER_ADMIN)));
    expect(screen.getByText('at /admin')).toBeInTheDocument();
  });

  it('redirects users without a required role to /unauthorized', () => {
    renderAt('/admin', storeWithSession(session(Role.USER, Role.MANAGER)));
    expect(screen.getByText('at /unauthorized')).toBeInTheDocument();
  });

  it('requireAll needs every role', () => {
    renderAt('/ops', storeWithSession(session(Role.ADMIN)));
    expect(screen.getByText('at /unauthorized')).toBeInTheDocument();
  });

  it('requireAll passes when the user has every role', () => {
    renderAt('/ops', storeWithSession(session(Role.ADMIN, Role.MANAGER)));
    expect(screen.getByText('at /ops')).toBeInTheDocument();
  });
});
