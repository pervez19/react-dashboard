import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { store } from './store';
import { apiClient } from './core/services/apiService';
import { setupAuthInterceptor } from './core/interceptors/authInterceptor';
import { setupErrorInterceptor } from './core/interceptors/errorInterceptor';
import '../assets/styles/variables.css';
import '../assets/styles/themes.css';
import '../assets/styles/globals.css';
import '../assets/styles/utilities.css';

// Order matters: Axios runs response interceptors in registration order, so auth recovery runs first.
setupAuthInterceptor(apiClient, store);
setupErrorInterceptor(apiClient);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
