import React from 'react';

import { Box, Skeleton, Typography } from '@mui/material';

const HeatmapSkeleton = () => (
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
      Engagement Rate Heatmap
    </Typography>
    {/* Skeleton content */}
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'auto repeat(6, 1fr)',
        gap: 0.5,
        overflow: 'hidden',
      }}
    >
      {Array.from({ length: 7 }).map((_, row) => (
        <React.Fragment key={row}>
          <Skeleton animation="wave" width={30} height={28} />
          {Array.from({ length: 6 }).map((__, col) => (
            <Skeleton
              key={col}
              animation="wave"
              variant="rectangular"
              sx={{ minWidth: 40, height: 28, bgcolor: 'rgba(19, 64, 255, 0.08)' }}
            />
          ))}
        </React.Fragment>
      ))}
    </Box>
  </Box>
);

export default HeatmapSkeleton;
