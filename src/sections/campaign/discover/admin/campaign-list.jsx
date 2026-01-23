import PropTypes from 'prop-types';

import Box from '@mui/material/Box';

import CampaignItem from './campaign-item';

// ----------------------------------------------------------------------

export default function CampaignLists({ campaigns }) {
  return (
    <Box
      gap={2}
      display="grid"
      gridTemplateColumns={{
        xs: 'repeat(1, 1fr)',
        sm: 'repeat(2, 1fr)',
        md: 'repeat(3, 1fr)',
      }}
    >
      {campaigns?.map((campaign, index) => (
        <CampaignItem key={campaign?.id} campaign={campaign} status={campaign?.status} />
      ))}
    </Box>
  );
}

CampaignLists.propTypes = {
  campaigns: PropTypes.array,
};
