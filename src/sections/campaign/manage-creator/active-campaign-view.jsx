import { mutate } from 'swr';
import PropTypes from 'prop-types';
import React, { useMemo, useEffect } from 'react';

import { Box } from '@mui/material';

import useGetCampaigns from 'src/hooks/use-get-campaigns';

import { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import EmptyContent from 'src/components/empty-content';

import CampaignItem from '../discover/creator/campaign-item';

const ActiveCampaignView = ({ searchQuery }) => {
  const { campaigns: data, isLoading } = useGetCampaigns('creator');
  const { user } = useAuthContext();
  const { socket } = useSocketContext();

  const filteredCampaigns = useMemo(
    () =>
      !isLoading &&
      data?.filter(
        (campaign) =>
          campaign?.shortlisted?.some((item) => item.userId === user.id && !item.isCampaignDone) &&
          campaign.status !== 'COMPLETED'
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

  useEffect(() => {
    if (socket) {
      socket?.on('shortlisted', () => {
        mutate(endpoints.campaign.getMatchedCampaign);
      });
    }

    return () => {
      socket?.off('shortlisted');
    };
  }, [socket]);

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
            <CampaignItem key={campaign.id} campaign={campaign} user={user} />
          ))}
        </Box>
      ) : (
        <EmptyContent title={`No active campaign ${searchQuery && searchQuery} found.`} />
      )}
    </Box>
  );
};

export default ActiveCampaignView;

ActiveCampaignView.propTypes = {
  searchQuery: PropTypes.string,
};
