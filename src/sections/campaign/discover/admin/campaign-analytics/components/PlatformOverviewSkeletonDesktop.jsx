import { Box, Grid, Stack, Skeleton } from '@mui/material';

const PlatformOverviewSkeletonDesktop = () => (
  <Grid container spacing={2} sx={{ mb: 2 }}>
    {/* PostingsCard Skeleton - beams */}
    <Grid item xs={12} md={2.5}>
      <Box sx={{ textAlign: 'center', px: 3, py: 2 }}>
        <Skeleton animation="wave" width={80} height={28} sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', gap: 4, justifyContent: 'center', alignItems: 'flex-end' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Skeleton animation="wave" width={30} height={20} sx={{ mb: 1 }} />
            <Skeleton
              animation="wave"
              variant="rounded"
              sx={{ width: 54, height: 120, borderRadius: 100 }}
            />
            <Skeleton animation="wave" width={60} height={16} sx={{ mt: 1 }} />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Skeleton animation="wave" width={30} height={20} sx={{ mb: 1 }} />
            <Skeleton
              animation="wave"
              variant="rounded"
              sx={{ width: 54, height: 80, borderRadius: 100 }}
            />
            <Skeleton animation="wave" width={50} height={16} sx={{ mt: 1 }} />
          </Box>
        </Box>
      </Box>
    </Grid>

    {/* Pie Chart Skeleton */}
    <Grid item xs={12} md={5}>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <Skeleton
          animation="wave"
          variant="circular"
          sx={{ width: 240, height: 240, bgcolor: 'rgba(19, 64, 255, 0.08)' }}
        />
      </Box>
    </Grid>

    {/* Metrics Grid Skeleton */}
    <Grid item xs={12} md={2}>
      <Stack spacing={2}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Box key={i}>
            <Skeleton
              animation="wave"
              width={40}
              height={14}
              sx={{ bgcolor: 'rgba(99, 99, 102, 0.1)' }}
            />
            <Skeleton
              animation="wave"
              width={80}
              height={40}
              sx={{ bgcolor: 'rgba(19, 64, 255, 0.1)' }}
            />
          </Box>
        ))}
      </Stack>
    </Grid>

    {/* TopEngagementCard Skeleton */}
    <Grid item xs={12} md={2.5}>
      <Box sx={{ p: 2 }}>
        <Skeleton
          animation="wave"
          width={100}
          height={80}
          sx={{ bgcolor: 'rgba(19, 64, 255, 0.1)', mb: 2 }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Skeleton animation="wave" variant="circular" width={45} height={45} />
          <Skeleton animation="wave" width={80} height={16} />
        </Box>
        <Skeleton
          animation="wave"
          variant="rounded"
          sx={{ width: '100%', height: 120, borderRadius: 2 }}
        />
      </Box>
    </Grid>
  </Grid>
);

export default PlatformOverviewSkeletonDesktop;
