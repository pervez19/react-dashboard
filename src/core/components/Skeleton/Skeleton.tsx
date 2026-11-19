import { Box, Container, Skeleton as MuiSkeleton, Stack, type SkeletonProps } from '@mui/material';

export function Skeleton(props: SkeletonProps) {
  return <MuiSkeleton animation="wave" {...props} />;
}

/** Full-page placeholder shown while auth initialises or a lazy route loads. Reveals no protected content. */
export function PageSkeleton() {
  return (
    <Box role="status" aria-busy="true" aria-label="Loading" sx={{ minHeight: '100vh' }}>
      <Skeleton variant="rectangular" height={64} />
      <Container sx={{ py: 4 }}>
        <Skeleton variant="text" width="40%" height={48} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ my: 2 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="rounded" height={120} sx={{ flex: 1 }} />
          ))}
        </Stack>
        <Skeleton variant="rounded" height={240} />
      </Container>
    </Box>
  );
}
