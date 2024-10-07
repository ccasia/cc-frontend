import React, { useMemo, useState } from 'react';

import { Box, TextField, InputAdornment } from '@mui/material';

import useGetCampaigns from 'src/hooks/use-get-campaigns';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content';

import CampaignItem from '../discover/creator/campaign-item';

// import CampaignItem from './campaign-item';

const AppliedCampaignView = () => {
  // const { data, isLoading } = useGetCampaignPitch();
  const { campaigns: data, isLoading } = useGetCampaigns('creator');
  const [query, setQuery] = useState('');
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
      query
        ? filteredCampaigns?.filter((elem) =>
            elem.campaign.name.toLowerCase()?.includes(query.toLowerCase())
          )
        : filteredCampaigns,
    [filteredCampaigns, query]
  );

  console.log(filteredData);

  return (
    <Box mt={2}>
      <TextField
        value={query}
        placeholder="Search By Campaign Name"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="hugeicons:search-02" />
            </InputAdornment>
          ),
        }}
        sx={{
          width: 250,
        }}
        onChange={(e) => setQuery(e.target.value)}
      />
      {!isLoading && filteredData?.length ? (
        <Box
          gap={3}
          display="grid"
          mt={2}
          gridTemplateColumns={{
            xs: 'repeat(1, 1fr)',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          }}
        >
          {filteredData.map((elem) => (
            <CampaignItem
              key={elem.campaign?.id}
              campaign={elem}
              pitchStatus={elem.status}
              user={user}
              // onClick={() => onClick(campaign?.id)}
            />
          ))}
        </Box>
      ) : (
        <EmptyContent title={`No campaign ${query && query} found.`} />
      )}
    </Box>
  );
};

export default AppliedCampaignView;
