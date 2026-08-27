import React from 'react';

import { Box, Skeleton } from '@mui/material';

const CreatorListItemSkeleton = () => (
  <Box borderRadius={1} border="2px solid #F5F5F5" sx={{ py: 1.5 }}>
    <Box px={{ xs: 1, sm: 2, lg: 3 }} display="flex" alignItems="center" gap={2}>
      {/* Avatar */}
      <Skeleton animation="wave" variant="circular" width={44} height={44} />

      {/* Name + handle */}
      <Box sx={{ minWidth: 180 }}>
        <Skeleton animation="wave" width={120} height={20} sx={{ mb: 0.5 }} />
        <Skeleton animation="wave" width={80} height={14} />
      </Box>

      {/* Metrics */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <React.Fragment key={i}>
            <Box sx={{ flex: 1 }}>
              <Skeleton
                animation="wave"
                width={60}
                height={18}
                sx={{ bgcolor: 'rgba(99, 99, 102, 0.1)' }}
              />
              <Skeleton
                animation="wave"
                width={50}
                height={32}
                sx={{ bgcolor: 'rgba(19, 64, 255, 0.1)' }}
              />
            </Box>
            {i < 3 && (
              <Skeleton
                animation="wave"
                variant="rectangular"
                width={1}
                height={40}
                sx={{ bgcolor: 'rgba(19, 64, 255, 0.15)' }}
              />
            )}
          </React.Fragment>
        ))}
      </Box>

      {/* Thumbnail */}
      <Skeleton
        animation="wave"
        variant="rounded"
        sx={{ width: 140, height: 75, borderRadius: 2, flexShrink: 0 }}
      />
    </Box>
  </Box>
);

export default CreatorListItemSkeleton;
