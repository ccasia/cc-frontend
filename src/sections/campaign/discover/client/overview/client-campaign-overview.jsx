import { useMemo } from 'react';
import PropTypes from 'prop-types';

import { Box, Stack, Button, Skeleton, Typography } from '@mui/material';

import TopVideos from './top-videos';
import StageCards from './stage-cards';
import { buildStages } from './stages';
import LatestUpdates from './latest-updates';
import PerformanceCard from './performance-card';
import { useFeaturedVideos, useClientCampaignOverview } from './api';

const EMPTY = [];

export default function ClientCampaignOverview({ campaignId, viewerRole = 'client' }) {
  const { data, isLoading, isError, refetch } = useClientCampaignOverview(campaignId);
  const { data: videos = EMPTY } = useFeaturedVideos(campaignId);



  const stages = useMemo(() => (data ? buildStages(data) : []), [data]);

  if (isError) {
    return (
      <Stack direction="row" alignItems="center" spacing={2} sx={{ py: 4 }}>
        <Typography sx={{ color: 'text.secondary' }}>The overview couldn&apos;t load.</Typography>
        <Button size="small" variant="outlined" onClick={() => refetch()}>
          Try again
        </Button>
      </Stack>
    );
  }

  if (isLoading) {
    return (
      <Stack spacing={3} sx={{ pb: 5 }}>
        <Skeleton variant="rounded" height={210} sx={{ borderRadius: '14px' }} />
        <Skeleton variant="rounded" height={420} sx={{ borderRadius: '14px' }} />
      </Stack>
    );
  }

  return (
    <Stack spacing={3} sx={{ pb: 5 }}>
      <StageCards stages={stages} viewerRole={viewerRole} />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1.5fr) minmax(0, 1fr)' },
          gap: 3,
          alignItems: 'start',
        }}
      >
        <TopVideos videos={videos} />
        <Stack spacing={3}>
          <LatestUpdates updates={data.updates || EMPTY} />
          <PerformanceCard performance={data.performance} />
        </Stack>
      </Box>
    </Stack>
  );
}

ClientCampaignOverview.propTypes = {
  campaignId: PropTypes.string,
  viewerRole: PropTypes.oneOf(['client', 'admin']),
};
