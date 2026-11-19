import { Box, Typography } from '@mui/material';
import { APP_NAME } from '../../constants/appConstants';

export function Footer() {
  return (
    <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
      <Typography variant="body2" color="text.secondary">
        © {new Date().getFullYear()} {APP_NAME}
      </Typography>
    </Box>
  );
}
