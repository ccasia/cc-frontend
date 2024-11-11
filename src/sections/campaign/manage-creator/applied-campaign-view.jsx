import PropTypes from 'prop-types';
import React, { useMemo } from 'react';

import { Box, Grid } from '@mui/material';

import { useAuthContext } from 'src/auth/hooks';

import EmptyContent from 'src/components/empty-content';

import CampaignItem from '../discover/creator/campaign-item';

const AppliedCampaignView = ({ searchQuery, campaigns }) => {
  // const { campaigns: data, isLoading } = useGetCampaigns('creator');
  const { user } = useAuthContext();

  // const filteredCampaigns = useMemo(
  //   () =>
  //     data?.filter((campaign) =>
  //       campaign?.pitch?.some(
  //         (item) =>
  //           item?.userId === user?.id &&
  //           (item?.status === 'undecided' || item?.status === 'rejected')
  //       )
  //     ),
  //   [data, user]
  // );

  const filteredData = useMemo(
    () =>
      searchQuery
        ? campaigns?.filter((elem) => elem.name.toLowerCase()?.includes(searchQuery.toLowerCase()))
        : campaigns,
    [campaigns, searchQuery]
  );

  return (
    <Box mt={2}>
      {filteredData?.length ? (
        <Grid container spacing={3}>
          {filteredData.map((campaign) => (
            <Grid item xs={12} sm={6} md={4} key={campaign.id}>
              <CampaignItem campaign={campaign} pitchStatus={campaign.pitch.status} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <EmptyContent
          title={`No pending applications ${searchQuery ? `for "${searchQuery}"` : ''} found.`}
        />
      )}
    </Box>
  );
};

export default AppliedCampaignView;

AppliedCampaignView.propTypes = {
  searchQuery: PropTypes.string,
  campaigns: PropTypes.array,
};
