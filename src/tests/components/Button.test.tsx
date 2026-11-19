import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Link } from 'react-router-dom';
import { Button } from '../../shared/components/Button/Button';
import { ButtonType } from '../../core/enums/ButtonTypeEnum';

describe('Button', () => {
  it('handles clicks', async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Save</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it.each([
    [ButtonType.PRIMARY, 'MuiButton-contained', 'MuiButton-colorPrimary'],
    [ButtonType.SECONDARY, 'MuiButton-outlined', 'MuiButton-colorPrimary'],
    [ButtonType.DANGER, 'MuiButton-contained', 'MuiButton-colorError'],
    [ButtonType.TEXT, 'MuiButton-text', 'MuiButton-colorPrimary'],
  ])('maps %s to Material variant/colour', (kind, variant, color) => {
    render(<Button kind={kind}>Go</Button>);
    expect(screen.getByRole('button')).toHaveClass(variant, color);
  });

  it('is disabled while loading', async () => {
    const onClick = jest.fn();
    render(<Button loading onClick={onClick}>Save</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('can render as a router link', () => {
    render(
      <MemoryRouter>
        <Button component={Link} to="/dashboard">Open</Button>
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Open' })).toHaveAttribute('href', '/dashboard');
  });
});
