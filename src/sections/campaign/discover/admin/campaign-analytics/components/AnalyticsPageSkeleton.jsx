import React from 'react';
import { m } from 'framer-motion';

import { Box, Stack, Typography } from '@mui/material';

import { useResponsive } from 'src/hooks/use-responsive';

import HeatmapSkeleton from './HeatmapSkeleton';
import LineChartSkeleton from './LineChartSkeleton';
import CoreMetricsSkeleton from './CoreMetricsSkeleton';
import CreatorListItemSkeleton from './CreatorListItemSkeleton';
import PlatformOverviewSkeletonMobile from './PlatformOverviewSkeletonMobile';
import PlatformOverviewSkeletonDesktop from './PlatformOverviewSkeletonDesktop';

const STAGGER_CONFIG = {
  container: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  },
  item: {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  },
};

const AnalyticsPageSkeleton = () => {
  const lgUp = useResponsive('up', 'lg');

  return (
    <Box
      component={m.div}
      variants={STAGGER_CONFIG.container}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      {/* Section 1: Core Metrics */}
      <Box component={m.div} variants={STAGGER_CONFIG.item}>
        <CoreMetricsSkeleton />
      </Box>

      {/* Section 2: Platform Overview */}
      <Box component={m.div} variants={STAGGER_CONFIG.item}>
        {lgUp ? <PlatformOverviewSkeletonDesktop /> : <PlatformOverviewSkeletonMobile />}
      </Box>

      {/* Section 3: Trend Charts */}
      <Stack
        component={m.div}
        variants={STAGGER_CONFIG.item}
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ mb: 3, overflow: 'hidden' }}
      >
        <HeatmapSkeleton />
        <LineChartSkeleton />
      </Stack>

      {/* Section 4: Creator List */}
      <Box component={m.div} variants={STAGGER_CONFIG.item}>
        {/* Real title - not affected by skeleton */}
        <Typography fontSize={24} fontWeight={600} fontFamily="Aileron" sx={{ mb: 1 }}>
          Creator List
        </Typography>
        <Stack spacing={1}>
          {Array.from({ length: 5 }).map((_, i) => (
            <CreatorListItemSkeleton key={i} />
          ))}
        </Stack>
      </Box>
    </Box>
  );
};
export default AnalyticsPageSkeleton;
