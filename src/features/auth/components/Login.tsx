import { Link as RouterLink } from 'react-router-dom';
import { Alert, Link, Stack, Typography } from '@mui/material';
import { FormField } from '../../../shared/components/FormField/FormField';
import { Button } from '../../../shared/components/Button/Button';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useFormValidation } from '../../../shared/hooks/useFormValidation';
import { rules, type Schema } from '../../../core/services/validationService';
import { ROUTES } from '../../../core/constants/appConstants';
import type { LoginFormValues } from '../types/authTypes';

const schema: Schema<LoginFormValues> = {
  email: [rules.required('Email is required.'), rules.email()],
  password: [rules.required('Password is required.')],
};

/** After a successful login, NoAuthGuard redirects to the originally requested page (or the dashboard). */
export default function Login() {
  const { login, isLoading, error } = useAuth();
  const { values, errors, handleChange, handleSubmit } = useFormValidation<LoginFormValues>(
    { email: '', password: '' },
    schema,
  );

  const onSubmit = handleSubmit(async ({ email, password }) => {
    await login({ email: email.trim(), password });
  });

  return (
    <Stack component="form" noValidate onSubmit={onSubmit} aria-labelledby="login-title">
      <Typography id="login-title" variant="h5" component="h1" fontWeight={700}>
        Sign in
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 1 }}>
        Welcome back. Enter your details to continue.
      </Typography>

      {error && (
        <Alert severity="error" role="alert" sx={{ my: 1 }}>
          {error}
        </Alert>
      )}

      <FormField label="Email" name="email" type="email" autoComplete="email" required autoFocus
        value={values.email} onChange={handleChange} error={errors.email} />
      <FormField label="Password" name="password" type="password" autoComplete="current-password" required
        value={values.password} onChange={handleChange} error={errors.password} />

      <Button type="submit" size="large" loading={isLoading} sx={{ mt: 2 }}>
        Sign in
      </Button>
      <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
        No account?{' '}
        <Link component={RouterLink} to={ROUTES.REGISTER}>Create one</Link>
      </Typography>
    </Stack>
  );
}
