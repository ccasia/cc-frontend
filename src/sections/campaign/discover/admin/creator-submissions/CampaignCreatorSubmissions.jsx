import PropTypes from 'prop-types';
import { MotionConfig } from 'framer-motion';
import React, { useMemo, useEffect } from 'react';

import { Box, Stack } from '@mui/material';

import { campaignHasClient } from 'src/utils/campaign-flow';

import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import EmptyContent from 'src/components/empty-content';

import { MIN_CARD_WIDTH } from './utils/constants';
import useGetSubmissions from './hooks/use-get-submissions';
import SubmissionViewer from './submission-viewer/SubmissionViewer';
import CreatorSubmissionGrid from './components/CreatorSubmissionGrid';
import CreatorSubmissionsToolbar from './components/CreatorSubmissionsToolbar';
import { groupByCreator, getFilterCounts, filterSubmissions } from './utils/utils';
import CreatorSubmissionCardSkeleton from './components/CreatorSubmissionCardSkeleton';
import useV4SubmissionListSocket from '../submissions/v4/shared/use-v4-submission-list-socket';
import {
  setCampaign,
  resetCreatorSubmissions,
  useCreatorSubmissionsStore,
} from './store/use-creator-submissions-store';

const CampaignCreatorSubmissions = ({ campaign }) => {
  const { submissions, isPending, isError, mutateSubmissions } = useGetSubmissions(campaign?.id);
  const { user } = useAuthContext();
  const { socket } = useSocketContext();
  const search = useCreatorSubmissionsStore((state) => state.search);
  const statusFilter = useCreatorSubmissionsStore((state) => state.statusFilter);
  const typeFilter = useCreatorSubmissionsStore((state) => state.typeFilter);
  const isFiltering = !!search.trim() || statusFilter !== 'all' || typeFilter !== 'all';
  // eslint-disable-next-line no-nested-ternary
  const emptyTitle = search.trim()
    ? `No creators match "${search.trim()}"`
    : isFiltering
      ? 'No submissions match these filters'
      : 'No submissions yet';

  const creators = useMemo(
    () => groupByCreator(filterSubmissions(submissions, { search, statusFilter, typeFilter })),
    [submissions, search, statusFilter, typeFilter]
  );

  const filterCounts = useMemo(
    () => getFilterCounts(submissions, { search, statusFilter, typeFilter }),
    [submissions, search, statusFilter, typeFilter]
  );

  // The viewer reads the campaign from the store, so cards can open it without props
  const hasClient = campaignHasClient(campaign);
  useEffect(() => {
    setCampaign({ id: campaign?.id, hasClient });
  }, [campaign?.id, hasClient]);

  useEffect(() => () => resetCreatorSubmissions(), []);

  useV4SubmissionListSocket({
    socket,
    campaignId: campaign?.id,
    onUpdate: mutateSubmissions,
    userId: user?.id,
  });

  return (
    // Reduced motion keeps fades but drops movement, for the cards and the viewer
    <MotionConfig reducedMotion="user">
      <Stack spacing={3}>
        <CreatorSubmissionsToolbar counts={filterCounts} />

        <SubmissionViewer />

        {isError && (
          <EmptyContent
            filled
            title="Could not load submissions"
            description="Please refresh the page to try again."
            sx={{ py: 10 }}
          />
        )}

        {!isPending && !isError && !creators.length && (
          <EmptyContent
            filled
            title={emptyTitle}
            description={
              isFiltering
                ? 'Try a different search or filter.'
                : 'Creator submissions will show here once their agreement is approved.'
            }
            sx={{ py: 10, '& .MuiTypography-root': { overflowWrap: 'anywhere' } }}
          />
        )}

        {isPending ? (
          <Box
            sx={{
              display: 'grid',
              gap: 3,
              alignItems: 'start',
              gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${MIN_CARD_WIDTH}px), 1fr))`,
            }}
          >
            {[...Array(6)].map((_, index) => (
              <CreatorSubmissionCardSkeleton key={index} />
            ))}
          </Box>
        ) : (
          <CreatorSubmissionGrid creators={creators} fadeKey={`${statusFilter}|${typeFilter}`} />
        )}
      </Stack>
    </MotionConfig>
  );
};

export default CampaignCreatorSubmissions;

CampaignCreatorSubmissions.propTypes = {
  campaign: PropTypes.object,
};
