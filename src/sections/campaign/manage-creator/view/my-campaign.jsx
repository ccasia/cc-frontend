import React from 'react';
import PropTypes from 'prop-types';

import { Box, TextField, InputAdornment } from '@mui/material';

import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content/empty-content';

import CampaignItem from '../campaign-item';

const MyCampaignView = ({ query, setQuery, filteredData, onClick }) => (
  <Box mt={2}>
    <TextField
      value={query}
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

    {filteredData?.length ? (
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
        {filteredData.map((campaign) => (
          <CampaignItem
            key={campaign?.id}
            campaign={campaign}
            onClick={() => onClick(campaign?.id)}
            type="my-campaign"
          />
        ))}
      </Box>
    ) : (
      <EmptyContent title={`No campaign ${query} found.`} />
    )}
  </Box>
);

export default MyCampaignView;

MyCampaignView.propTypes = {
  query: PropTypes.string,
  setQuery: PropTypes.func,
  filteredData: PropTypes.array,
  onClick: PropTypes.func,
};
