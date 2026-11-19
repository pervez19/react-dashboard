import { render, screen, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../../features/home/components/HomePage';
import { homeService } from '../../features/home/services/homeService';
import { mockApi, storeWithSession } from '../../setupTests';

describe('HomePage', () => {
  it('shows the static guide and feature list without calling any API', () => {
    const calls = mockApi(() => ({ status: 200 }));
    render(
      <Provider store={storeWithSession(null)}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </Provider>,
    );

    const { steps, features } = homeService.getAppGuide();
    const howItWorks = screen.getByRole('region', { name: 'How it works' });
    expect(within(howItWorks).getAllByRole('listitem')).toHaveLength(steps.length);
    const featureSection = screen.getByRole('region', { name: 'Features' });
    features.forEach((f) => expect(within(featureSection).getByText(f.title)).toBeInTheDocument());
    expect(calls).toHaveLength(0);
  });
});
