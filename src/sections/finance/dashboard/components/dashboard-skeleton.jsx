import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';

// ----------------------------------------------------------------------

export default function DashboardSkeleton() {
  return (
    <>
      <Grid container spacing={2}>
        {[...Array(6)].map((_, index) => (
          <Grid key={index} item xs={12} sm={6} md={4} lg={2}>
            <Skeleton variant="rounded" height={150} sx={{ borderRadius: 2 }} />
          </Grid>
        ))}
      </Grid>

      <Skeleton variant="rounded" height={72} sx={{ borderRadius: 2, mt: 4 }} />

      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        {[...Array(4)].map((_, index) => (
          <Grid key={index} item xs={12} md={6}>
            <Skeleton variant="rounded" height={260} sx={{ borderRadius: 2 }} />
          </Grid>
        ))}
      </Grid>
    </>
  );
}
