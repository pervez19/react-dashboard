import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TooltipPopup } from '../../core/components/TooltipPopup/TooltipPopup';

describe('TooltipPopup', () => {
  it('shows on hover and labels the trigger', async () => {
    render(
      <TooltipPopup content="Delete item">
        <button type="button">X</button>
      </TooltipPopup>,
    );
    await userEvent.hover(screen.getByRole('button'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Delete item');
    expect(screen.getByRole('button', { name: 'Delete item' })).toBeInTheDocument();
  });

  it('shows on keyboard focus', async () => {
    render(
      <TooltipPopup content="Help">
        <button type="button">?</button>
      </TooltipPopup>,
    );
    await userEvent.tab();
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Help');
  });
});
