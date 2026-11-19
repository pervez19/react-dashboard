import { render, screen, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { SideMenu } from '../../core/components/SideMenu/SideMenu';
import { Role } from '../../core/enums/RoleEnum';
import { makeUser, storeWithSession } from '../../setupTests';
import type { NavItem } from '../../shared/types/sharedTypes';

const items: NavItem[] = [
  { label: 'Overview', to: '/dashboard' },
  { label: 'Reports', to: '/reports', roles: [Role.MANAGER] },
  { label: 'Administration', to: '/admin', roles: [Role.ADMIN, Role.SUPER_ADMIN] },
];

const renderFor = (roles: Role[], path = '/dashboard') =>
  render(
    <Provider store={storeWithSession({ accessToken: 'at', user: makeUser({ roles }) })}>
      <MemoryRouter initialEntries={[path]}>
        <SideMenu items={items} mobileOpen={false} onClose={jest.fn()} />
      </MemoryRouter>
    </Provider>,
  );

// The permanent (desktop) drawer is the one that is always rendered and visible.
const desktopNav = () => within(screen.getAllByRole('navigation', { name: 'Dashboard', hidden: true }).at(-1)!);

describe('SideMenu', () => {
  it('shows only items the user has a role for', () => {
    renderFor([Role.USER, Role.MANAGER]);
    const nav = desktopNav();
    expect(nav.getByText('Overview')).toBeInTheDocument();
    expect(nav.getByText('Reports')).toBeInTheDocument();
    expect(nav.queryByText('Administration')).not.toBeInTheDocument();
  });

  it('shows admin items to admins', () => {
    renderFor([Role.SUPER_ADMIN]);
    expect(desktopNav().getByText('Administration')).toBeInTheDocument();
    expect(desktopNav().queryByText('Reports')).not.toBeInTheDocument();
  });

  it('marks the current route as active', () => {
    renderFor([Role.USER]);
    expect(desktopNav().getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page');
  });
});
