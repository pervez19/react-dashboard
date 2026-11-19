import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Alert, Link, Stack, Typography } from '@mui/material';
import { FormField } from '../../../shared/components/FormField/FormField';
import { Button } from '../../../shared/components/Button/Button';
import { useFormValidation } from '../../../shared/hooks/useFormValidation';
import { useNotification } from '../../../shared/hooks/useNotification';
import { authService } from '../../../core/services/authService';
import { rules, type Schema } from '../../../core/services/validationService';
import { ApiError } from '../../../core/interceptors/errorInterceptor';
import { ROUTES } from '../../../core/constants/appConstants';
import type { RegisterFormValues } from '../types/authTypes';

const schema: Schema<RegisterFormValues> = {
  name: [rules.required('Name is required.')],
  email: [rules.required('Email is required.'), rules.email()],
  password: [rules.required('Password is required.'), rules.strongPassword()],
  confirmPassword: [rules.required('Please confirm your password.'), rules.matches('password', 'Passwords do not match.')],
};

export default function Register() {
  const navigate = useNavigate();
  const { success } = useNotification();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { values, errors, setErrors, handleChange, handleSubmit } = useFormValidation<RegisterFormValues>(
    { name: '', email: '', password: '', confirmPassword: '' },
    schema,
  );

  const onSubmit = handleSubmit(async ({ name, email, password }) => {
    setSubmitting(true);
    setFormError(null);
    try {
      await authService.register({ name: name.trim(), email: email.trim(), password });
      success('Account created. You can now sign in.');
      navigate(ROUTES.LOGIN, { replace: true });
    } catch (e) {
      if (e instanceof ApiError && Object.keys(e.fieldErrors).length > 0) setErrors(e.fieldErrors);
      else setFormError(e instanceof ApiError ? e.message : 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Stack component="form" noValidate onSubmit={onSubmit} aria-labelledby="register-title">
      <Typography id="register-title" variant="h5" component="h1" fontWeight={700}>
        Create account
      </Typography>

      {formError && (
        <Alert severity="error" role="alert" sx={{ my: 1 }}>
          {formError}
        </Alert>
      )}

      <FormField label="Full name" name="name" autoComplete="name" required autoFocus
        value={values.name} onChange={handleChange} error={errors.name} />
      <FormField label="Email" name="email" type="email" autoComplete="email" required
        value={values.email} onChange={handleChange} error={errors.email} />
      <FormField label="Password" name="password" type="password" autoComplete="new-password" required
        value={values.password} onChange={handleChange} error={errors.password}
        helperText="At least 8 characters, with upper- and lower-case letters and a number." />
      <FormField label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" required
        value={values.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />

      <Button type="submit" size="large" loading={submitting} sx={{ mt: 2 }}>
        Create account
      </Button>
      <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
        Already have an account?{' '}
        <Link component={RouterLink} to={ROUTES.LOGIN}>Sign in</Link>
      </Typography>
    </Stack>
  );
}
