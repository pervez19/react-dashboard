import { Link as RouterLink } from 'react-router-dom';
import { Stack, Typography } from '@mui/material';
import { Button } from '../../../shared/components/Button/Button';
import { ROUTES } from '../../constants/appConstants';

interface NotFoundProps {
  code?: string;
  title?: string;
  description?: string;
}

/** Error page used for 404 and, with different text, for /unauthorized (403). */
export default function NotFound({
  code = '404',
  title = 'Page not found',
  description = "The page you're looking for doesn't exist or has been moved.",
}: NotFoundProps) {
  return (
    <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ py: 10, px: 2, textAlign: 'center', flex: 1 }}>
      <Typography variant="h1" component="p" color="primary" fontWeight={800} aria-hidden>
        {code}
      </Typography>
      <Typography variant="h4" component="h1">{title}</Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 480 }}>{description}</Typography>
      <Button component={RouterLink} to={ROUTES.HOME}>Back to home</Button>
    </Stack>
  );
}
