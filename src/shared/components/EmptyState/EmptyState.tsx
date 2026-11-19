import type { ReactNode } from 'react';
import { Stack, Typography } from '@mui/material';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <Stack alignItems="center" spacing={1.5} sx={{ py: 6, px: 2, textAlign: 'center', color: 'text.secondary' }}>
      <Stack aria-hidden sx={{ fontSize: 56, '& svg': { fontSize: 'inherit' } }}>
        {icon ?? <InboxOutlinedIcon />}
      </Stack>
      <Typography variant="h6" component="h2" color="text.primary">
        {title}
      </Typography>
      {description && <Typography sx={{ maxWidth: 420 }}>{description}</Typography>}
      {action}
    </Stack>
  );
}
