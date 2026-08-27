import React from 'react';

import { Box, Skeleton, Typography } from '@mui/material';

const LineChartSkeleton = () => (
  <Box
    sx={{
      flex: 1,
      minWidth: 0,
      overflow: 'hidden',
    }}
  >
    {/* Real title - not affected by skeleton */}
    <Typography
      sx={{
        fontFamily: 'Aileron',
        fontWeight: 600,
        fontSize: 24,
        color: '#000',
        mb: { xs: 2, md: 3 },
      }}
    >
      Top 5 Creators in Views
    </Typography>
    {/* Skeleton content */}
    <Box sx={{ height: 280, position: 'relative', overflow: 'hidden' }}>
      {/* Horizontal grid lines */}
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton
          key={i}
          animation="wave"
          variant="rectangular"
          sx={{
            position: 'absolute',
            left: 40,
            right: 0,
            height: 1,
            top: `${i * 25}%`,
            bgcolor: 'rgba(19, 64, 255, 0.1)',
          }}
        />
      ))}
      {/* X-axis labels */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 40,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} animation="wave" width={35} height={16} />
        ))}
      </Box>
    </Box>
    {/* Legend */}
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Skeleton
            animation="wave"
            variant="rectangular"
            width={40}
            height={24}
            sx={{ borderRadius: 1 }}
          />
          <Skeleton animation="wave" width={60} height={14} />
        </Box>
      ))}
    </Box>
  </Box>
);
export default LineChartSkeleton;
