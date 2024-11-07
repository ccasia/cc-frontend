import PropTypes from 'prop-types';
import React, { useMemo } from 'react';

import { Box, Grid } from '@mui/material';

import useGetCampaigns from 'src/hooks/use-get-campaigns';

import { useAuthContext } from 'src/auth/hooks';

import EmptyContent from 'src/components/empty-content';

import CampaignItem from '../discover/creator/campaign-item';

const CompletedCampaignView = ({ searchQuery }) => {
  const { campaigns: data, isLoading } = useGetCampaigns('creator');
  const { user } = useAuthContext();

  const filteredCampaigns = useMemo(
    () =>
      !isLoading &&
      data?.filter(
        (campaign) =>
          campaign.status === 'COMPLETED' ||
          campaign?.shortlisted?.some((item) => item.userId === user.id && item.isCampaignDone)
      ),
    [isLoading, data, user]
  );

  const filteredData = useMemo(
    () =>
      searchQuery
        ? filteredCampaigns?.filter((elem) =>
            elem.name.toLowerCase()?.includes(searchQuery.toLowerCase())
          )
        : filteredCampaigns,
    [filteredCampaigns, searchQuery]
  );

  const sortedData = useMemo(
    () => filteredData?.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)),
    [filteredData]
  );

  return (
    <Box mt={2}>
      {!isLoading && sortedData?.length ? (
        <Grid container spacing={3}>
          {sortedData.map((campaign) => (
            <Grid item xs={12} sm={6} md={4} key={campaign.id}>
              <CampaignItem campaign={campaign} user={user} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <EmptyContent title={`No completed campaign ${searchQuery && searchQuery} found.`} />
      )}
    </Box>
  );
};

export default CompletedCampaignView;

CompletedCampaignView.propTypes = {
  searchQuery: PropTypes.string,
};
