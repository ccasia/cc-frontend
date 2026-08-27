import { Box, Skeleton } from '@mui/material';

const PlatformOverviewSkeletonMobile = () => (
  <Box sx={{ mb: 2 }}>
    {/* PostingsCard Skeleton - horizontal beams */}
    <Box sx={{ mb: 3, px: 2 }}>
      <Skeleton animation="wave" width={80} height={28} sx={{ mb: 2 }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Skeleton animation="wave" width={60} height={16} />
          <Skeleton
            animation="wave"
            variant="rounded"
            sx={{ flex: 1, height: 24, borderRadius: 100 }}
          />
          <Skeleton animation="wave" width={30} height={20} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Skeleton animation="wave" width={60} height={16} />
          <Skeleton
            animation="wave"
            variant="rounded"
            sx={{ flex: 1, height: 24, borderRadius: 100, maxWidth: '60%' }}
          />
          <Skeleton animation="wave" width={30} height={20} />
        </Box>
      </Box>
    </Box>

    {/* Metrics Row Skeleton */}
    <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 3 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Box key={i} sx={{ textAlign: 'center' }}>
          <Skeleton
            animation="wave"
            width={40}
            height={14}
            sx={{ bgcolor: 'rgba(99, 99, 102, 0.1)', mx: 'auto' }}
          />
          <Skeleton
            animation="wave"
            width={60}
            height={32}
            sx={{ bgcolor: 'rgba(19, 64, 255, 0.1)', mx: 'auto' }}
          />
        </Box>
      ))}
    </Box>

    {/* Pie Chart Skeleton */}
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
      <Skeleton
        animation="wave"
        variant="circular"
        sx={{ width: 200, height: 200, bgcolor: 'rgba(19, 64, 255, 0.08)' }}
      />
    </Box>
  </Box>
);

export default PlatformOverviewSkeletonMobile;
