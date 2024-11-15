import { mutate } from 'swr';
import PropTypes from 'prop-types';
import React, { useMemo, useEffect } from 'react';

import { Box, Typography } from '@mui/material';

import { endpoints } from 'src/utils/axios';

import useSocketContext from 'src/socket/hooks/useSocketContext';

import CampaignItem from './campaign-item';

const ActiveCampaignView = ({ searchQuery, campaigns }) => {
  // const { campaigns: data, isLoading } = useGetCampaigns('creator');
  // const { user } = useAuthContext();
  const { socket } = useSocketContext();

  // const filteredCampaigns = useMemo(
  //   () =>
  //     campaigns?.filter(
  //       (campaign) =>
  //         campaign?.shortlisted?.some((item) => item.userId === user.id && !item.isCampaignDone) &&
  //         campaign.status !== 'COMPLETED'
  //     ),
  //   [campaigns, user]
  // );

  const filteredData = useMemo(
    () =>
      searchQuery
        ? campaigns?.filter((elem) => elem.name.toLowerCase()?.includes(searchQuery.toLowerCase()))
        : campaigns,
    [searchQuery, campaigns]
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
      {filteredData?.length ? (
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
            <CampaignItem key={campaign.id} campaign={campaign} />
          ))}
        </Box>
      ) : (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          height="100%"
          textAlign="center"
          mt={20}
        >
          <Box
            style={{
              width: '80px',
              height: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              backgroundColor: '#f5f5f5',
              borderRadius: '50%',
              marginBottom: '16px',
            }}
          >
            😿
          </Box>
          <Typography variant="h3" style={{ fontFamily: 'Instrument Serif', fontWeight: 550 }}>
            No campaigns to show
          </Typography>
          <Typography variant="body1" color="#636366">
            Get that bag by working on some campaigns!
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ActiveCampaignView;

ActiveCampaignView.propTypes = {
  searchQuery: PropTypes.string,
  campaigns: PropTypes.array,
};
