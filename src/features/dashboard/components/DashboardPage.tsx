import { useMemo } from 'react';
import { Alert, Card, CardContent, Chip, Grid, List, ListItem, ListItemText, Stack, Typography } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { useAuth } from '../../../shared/hooks/useAuth';
import { formatNumber } from '../../../core/utils/commonUtils';
import { dashboardService } from '../services/dashboardService';

export default function DashboardPage() {
  const { user, roles, isAdmin } = useAuth();
  const { metrics, recentActivity } = useMemo(() => dashboardService.getSummary(), []);
  const dateFormat = useMemo(() => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }), []);

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} justifyContent="space-between">
        <Typography variant="h4" component="h1" fontWeight={700}>
          Hello, {user?.name}
        </Typography>
        <Stack direction="row" spacing={1} aria-label="Your roles">
          {roles.map((r) => (
            <Chip key={r} label={r.replace('_', ' ')} size="small" color={isAdmin ? 'secondary' : 'default'} />
          ))}
        </Stack>
      </Stack>

      <Alert severity="info">Sample data: these figures are placeholders until a reporting API is available.</Alert>

      <Grid container spacing={2}>
        {metrics.map((m) => (
          <Grid key={m.key} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>{m.label}</Typography>
                <Typography variant="h4" component="p" fontWeight={700}>{formatNumber(m.value)}</Typography>
                {m.change !== undefined && (
                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: m.change >= 0 ? 'success.main' : 'error.main' }}>
                    {m.change >= 0 ? <TrendingUpIcon fontSize="small" aria-hidden /> : <TrendingDownIcon fontSize="small" aria-hidden />}
                    <Typography variant="body2">{m.change >= 0 ? '+' : ''}{m.change}% vs last period</Typography>
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" component="h2">Recent activity</Typography>
          <List>
            {recentActivity.map((a) => (
              <ListItem key={a.id} divider>
                <ListItemText primary={a.description} secondary={dateFormat.format(new Date(a.occurredAt))} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Stack>
  );
}
