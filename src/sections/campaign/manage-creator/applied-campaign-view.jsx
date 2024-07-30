import React, { useMemo, useState } from 'react';

import { Box, TextField, InputAdornment } from '@mui/material';

import useGetCampaignPitch from 'src/hooks/use-get-campaign-pitch';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content';

import CampaignItem from '../discover/creator/campaign-item';

// import CampaignItem from './campaign-item';

const AppliedCampaignView = () => {
  const { data, isLoading } = useGetCampaignPitch();
  const [query, setQuery] = useState();
  const { user } = useAuthContext();

  const filteredData = useMemo(
    () =>
      query
        ? data?.filter((elem) => elem.campaign.name.toLowerCase()?.includes(query.toLowerCase()))
        : data,
    [data, query]
  );

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
      {!isLoading && filteredData.length ? (
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
              campaign={elem.campaign}
              pitchStatus={elem.status}
              user={user}
              // onClick={() => onClick(campaign?.id)}
            />
          ))}
        </Box>
      ) : (
        <EmptyContent title={`No campaign ${query} found.`} />
      )}
    </Box>
  );
};

export default AppliedCampaignView;
