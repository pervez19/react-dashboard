import { Suspense } from 'react';
import { Link as RouterLink, Outlet } from 'react-router-dom';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { Spinner } from '../shared/components/Spinner/Spinner';
import { APP_NAME, ROUTES } from '../core/constants/appConstants';

/** Login / register: centred card, no app navigation. */
export default function AuthLayout() {
  return (
    <Box
      component="main"
      sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2, bgcolor: 'background.default' }}
    >
      <Box sx={{ width: '100%', maxWidth: 440 }}>
        <Typography
          variant="h5"
          component={RouterLink}
          to={ROUTES.HOME}
          sx={{ display: 'block', textAlign: 'center', mb: 3, fontWeight: 800, color: 'primary.main', textDecoration: 'none' }}
        >
          {APP_NAME}
        </Typography>
        <Card variant="outlined">
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Suspense fallback={<Spinner />}>
              <Outlet />
            </Suspense>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
