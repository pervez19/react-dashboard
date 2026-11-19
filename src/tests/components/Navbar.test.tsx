import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { Navbar } from '../../core/components/Navbar/Navbar';
import { ThemeProvider } from '../../core/providers/ThemeProvider';
import { API_URLS } from '../../core/constants/apiUrls';
import { makeUser, mockApi, storeWithSession } from '../../setupTests';
import type { AppStore } from '../../store';

const renderNavbar = (store: AppStore, onMenuClick?: () => void) =>
  render(
    <Provider store={store}>
      <ThemeProvider>
        <MemoryRouter>
          <Navbar onMenuClick={onMenuClick} />
        </MemoryRouter>
      </ThemeProvider>
    </Provider>,
  );

describe('Navbar', () => {
  it('offers sign-in and registration to anonymous users', () => {
    renderNavbar(storeWithSession(null));
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Create account' })).toHaveAttribute('href', '/register');
    expect(screen.queryByRole('button', { name: 'Account menu' })).not.toBeInTheDocument();
  });

  it('shows the account menu and signs out', async () => {
    const calls = mockApi(() => ({ status: 204 }));
    const store = storeWithSession({ accessToken: 'at', user: makeUser({ name: 'Ada Lovelace' }) });
    renderNavbar(store);

    await userEvent.click(screen.getByRole('button', { name: 'Account menu' }));
    expect(screen.getByText('AL')).toBeInTheDocument();
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }));
    expect(calls.at(-1)?.url).toBe(API_URLS.AUTH.LOGOUT);
    expect(await screen.findByRole('link', { name: 'Sign in' })).toBeInTheDocument();
    expect(store.getState().auth.isAuthenticated).toBe(false);
  });

  it('renders the menu button only when a handler is provided', async () => {
    const onMenuClick = jest.fn();
    renderNavbar(storeWithSession(null), onMenuClick);
    await userEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    expect(onMenuClick).toHaveBeenCalled();
  });

  it('has a theme toggle', () => {
    renderNavbar(storeWithSession(null));
    expect(screen.getByRole('button', { name: 'Toggle colour theme' })).toBeInTheDocument();
  });
});
