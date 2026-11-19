import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import { Navbar } from '../core/components/Navbar/Navbar';
import { Footer } from '../core/components/Footer/Footer';
import { Spinner } from '../shared/components/Spinner/Spinner';

/** Public pages: home, 404, unauthorized. */
export default function MainLayout() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <Box component="main" id="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Suspense fallback={<Spinner fullArea />}>
          <Outlet />
        </Suspense>
      </Box>
      <Footer />
    </Box>
  );
}
