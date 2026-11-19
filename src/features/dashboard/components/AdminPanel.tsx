import { Alert, Card, CardContent, Stack, Typography } from '@mui/material';
import { useAuth } from '../../../shared/hooks/useAuth';

/** Reachable only through RoleGuard (ADMIN / SUPER_ADMIN). Admin APIs must enforce the same rule server-side. */
export default function AdminPanel() {
  const { isSuperAdmin } = useAuth();

  return (
    <Stack spacing={3}>
      <Typography variant="h4" component="h1" fontWeight={700}>Administration</Typography>
      <Alert severity="info">
        This page is hidden from non-admins in the UI, but every admin API call is authorised by the backend.
      </Alert>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" component="h2">Your access level</Typography>
          <Typography color="text.secondary">
            {isSuperAdmin ? 'Super administrator: full system access.' : 'Administrator: organisation management.'}
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}
