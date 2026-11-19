import { Link as RouterLink } from 'react-router-dom';
import { Alert, Avatar, Box, Card, CardContent, Container, Grid, Stack, Typography } from '@mui/material';
import { Button } from '../../../shared/components/Button/Button';
import { useAuth } from '../../../shared/hooks/useAuth';
import { ButtonType } from '../../../core/enums/ButtonTypeEnum';
import { ROUTES } from '../../../core/constants/appConstants';
import { homeService } from '../services/homeService';

const { steps, features } = homeService.getAppGuide();

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Container sx={{ py: { xs: 6, md: 10 } }}>
      <Stack spacing={3} alignItems="flex-start" sx={{ maxWidth: 720 }}>
        <Typography variant="h3" component="h1" fontWeight={800}>
          {isAuthenticated && user ? `Welcome back, ${user.name.split(' ')[0]}` : 'Your workspace, at a glance'}
        </Typography>
        <Typography variant="h6" color="text.secondary" fontWeight={400}>
          A secure dashboard with role-based access, built on Material Design.
        </Typography>
        <Stack direction="row" spacing={2}>
          {isAuthenticated ? (
            <Button size="large" component={RouterLink} to={ROUTES.DASHBOARD}>Open dashboard</Button>
          ) : (
            <>
              <Button size="large" component={RouterLink} to={ROUTES.REGISTER}>Get started</Button>
              <Button size="large" kind={ButtonType.SECONDARY} component={RouterLink} to={ROUTES.LOGIN}>Sign in</Button>
            </>
          )}
        </Stack>
      </Stack>

      <Box component="section" aria-labelledby="how-it-works" sx={{ mt: 10 }}>
        <Typography id="how-it-works" variant="h5" component="h2" fontWeight={700} gutterBottom>
          How it works
        </Typography>
        <Stack component="ol" spacing={2.5} sx={{ listStyle: 'none', p: 0, m: 0, mt: 3, maxWidth: 760 }}>
          {steps.map((step, i) => (
            <Stack key={step.title} component="li" direction="row" spacing={2} alignItems="flex-start">
              <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: 16, fontWeight: 700 }} aria-hidden>
                {i + 1}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" component="h3" fontWeight={700}>{step.title}</Typography>
                <Typography color="text.secondary">{step.description}</Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
        <Alert severity="info" sx={{ mt: 3, maxWidth: 760 }}>
          For security, tokens are never written to browser storage, so reloading the page asks you to sign in again.
        </Alert>
      </Box>

      <Box component="section" aria-labelledby="features" sx={{ mt: 10 }}>
        <Typography id="features" variant="h5" component="h2" fontWeight={700} gutterBottom>
          Features
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {features.map(({ icon: Icon, title, description }) => (
            <Grid key={title} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Icon color="primary" sx={{ fontSize: 32, mb: 1 }} aria-hidden />
                  <Typography variant="subtitle1" component="h3" fontWeight={700}>{title}</Typography>
                  <Typography variant="body2" color="text.secondary">{description}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}
