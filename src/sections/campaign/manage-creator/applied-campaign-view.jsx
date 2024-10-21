import React, { useMemo } from 'react';

import { Box } from '@mui/material';

import useGetCampaigns from 'src/hooks/use-get-campaigns';

import { useAuthContext } from 'src/auth/hooks';

import EmptyContent from 'src/components/empty-content';

import CampaignItem from '../discover/creator/campaign-item';

const AppliedCampaignView = ({ searchQuery }) => {
  const { campaigns: data, isLoading } = useGetCampaigns('creator');
  const { user } = useAuthContext();

  const filteredCampaigns = useMemo(
    () =>
      !isLoading &&
      data?.filter((campaign) =>
        campaign?.pitch.some((item) => item?.userId === user?.id && item?.status === 'undecided')
      ),
    [isLoading, data, user]
  );

  const filteredData = useMemo(
    () =>
      searchQuery
        ? filteredCampaigns?.filter((campaign) =>
            campaign.name.toLowerCase()?.includes(searchQuery.toLowerCase())
          )
        : filteredCampaigns,
    [filteredCampaigns, searchQuery]
  );

  return (
    <Box mt={2}>
      {!isLoading && filteredData?.length ? (
        <Box
          gap={2}
          display="grid"
          gridTemplateColumns={{
            xs: 'repeat(1, 1fr)',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          }}
        >
          {filteredData.map((campaign) => (
            <CampaignItem
              key={campaign.id}
              campaign={campaign}
              pitchStatus={campaign.pitch.find(item => item.userId === user.id)?.status}
              user={user}
            />
          ))}
        </Box>
      ) : (
        <EmptyContent title={`No campaign ${searchQuery && searchQuery} found.`} />
      )}
    </Box>
  );
};

export default AppliedCampaignView;
