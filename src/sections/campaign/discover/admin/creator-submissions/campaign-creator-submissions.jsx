import React, { useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';

import { Box, Stack } from '@mui/material';

import EmptyContent from 'src/components/empty-content';

import { groupByCreator, filterSubmissions } from './utils';
import useGetSubmissions from './hooks/use-get-submissions';
import {
  resetCreatorSubmissions,
  useCreatorSubmissionsStore,
} from './store/useCreatorSubmissionsStore';
import CreatorSubmissionCard from './components/CreatorSubmissionCard';
import CreatorSubmissionCardSkeleton from './components/CreatorSubmissionCardSkeleton';
import CreatorSubmissionsToolbar from './components/CreatorSubmissionsToolbar';

const CampaignCreatorSubmissions = ({ campaign }) => {
  const { submissions, isPending, isError } = useGetSubmissions(campaign?.id);
  const search = useCreatorSubmissionsStore((state) => state.search);
  const statusFilter = useCreatorSubmissionsStore((state) => state.statusFilter);
  const typeFilter = useCreatorSubmissionsStore((state) => state.typeFilter);
  const isFiltering = !!search.trim() || statusFilter !== 'all' || typeFilter !== 'all';

  const creators = useMemo(
    () => groupByCreator(filterSubmissions(submissions, { search, statusFilter, typeFilter })),
    [submissions, search, statusFilter, typeFilter]
  );

  useEffect(() => () => resetCreatorSubmissions(), []);

  return (
    <Stack spacing={3}>
      <CreatorSubmissionsToolbar />
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
          title={isFiltering ? 'No matching submissions' : 'No submissions yet'}
          description={
            isFiltering
              ? 'Try a different search or filter.'
              : 'Creator submissions will show here once creators are added to the campaign.'
          }
          sx={{ py: 10 }}
        />
      )}
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          alignItems: 'start',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
        }}
      >
        {isPending &&
          [...Array(6)].map((_, index) => <CreatorSubmissionCardSkeleton key={index} />)}
        {creators.map(({ user, submissions: items }) => (
          <CreatorSubmissionCard key={user.id} creator={user} submissions={items} />
        ))}
      </Box>
    </Stack>
  );
};

export default CampaignCreatorSubmissions;

CampaignCreatorSubmissions.propTypes = {
  campaign: PropTypes.object,
};
