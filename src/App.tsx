import { RouterProvider } from 'react-router-dom';
import { AppProviders } from './core/providers/AppProviders';
import { createAppRouter } from './routes';
import { store } from './store';

const router = createAppRouter();

export default function App() {
  return (
    <AppProviders store={store}>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
