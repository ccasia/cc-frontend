import React from 'react';

import { Stack, Skeleton } from '@mui/material';

import { COLORS } from '../constants';

const CreatorSubmissionCardSkeleton = () => (
  <Stack spacing={2} sx={{ px: 2.5, py: 2, borderRadius: 2.5, bgcolor: COLORS.surface }}>
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <Skeleton variant="circular" width={40} height={40} />
      <Stack sx={{ flexGrow: 1 }}>
        <Skeleton width="40%" height={20} />
        <Skeleton width="30%" height={16} />
      </Stack>
      <Stack alignItems="flex-end">
        <Skeleton width={120} height={20} />
        <Skeleton width={60} height={16} />
      </Stack>
    </Stack>

    <Stack direction="row" spacing={2} sx={{ minHeight: 240 }}>
      <Skeleton variant="rounded" width={135} height={240} sx={{ flexShrink: 0 }} />
      <Stack spacing={1} sx={{ flexGrow: 1 }}>
        {[1, 2, 3].map((row) => (
          <Skeleton key={row} variant="rounded" height={60} />
        ))}
      </Stack>
    </Stack>

    <Stack sx={{ minHeight: 64 }}>
      <Skeleton width="100%" height={20} />
      <Skeleton width="70%" height={20} />
    </Stack>
  </Stack>
);

export default CreatorSubmissionCardSkeleton;
