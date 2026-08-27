import { Box, Grid, Skeleton } from '@mui/material';

const CoreMetricsSkeleton = () => (
  <Box sx={{ mb: 3 }}>
    <Grid container spacing={{ xs: 1, sm: 2 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Grid item xs={6} sm={6} md={3} key={i}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 2,
              height: { xs: 100, sm: 116 },
              background: '#F5F5F5',
              boxShadow: '0px 4px 4px rgba(142, 142, 147, 0.25)',
              borderRadius: '20px',
            }}
          >
            <Box>
              <Skeleton
                animation="wave"
                width={80}
                height={24}
                sx={{ bgcolor: 'rgba(99, 99, 102, 0.1)' }}
              />
              <Skeleton
                animation="wave"
                width={100}
                height={16}
                sx={{ bgcolor: 'rgba(99, 99, 102, 0.1)', mt: 1 }}
              />
            </Box>
            <Skeleton
              animation="wave"
              variant="rounded"
              sx={{
                width: { xs: 60, sm: 70, md: 79 },
                height: { xs: 60, sm: 70, md: 79 },
                borderRadius: '8px',
                bgcolor: 'rgba(19, 64, 255, 0.15)',
              }}
            />
          </Box>
        </Grid>
      ))}
    </Grid>
  </Box>
);
export default CoreMetricsSkeleton;
