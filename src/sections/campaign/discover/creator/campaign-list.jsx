import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Pagination, { paginationClasses } from '@mui/material/Pagination';

import { useAuthContext } from 'src/auth/hooks';

import CampaignItem from './campaign-item';
import { useState } from 'react';

// ----------------------------------------------------------------------

export default function CampaignLists({ campaigns }) {
  const { user } = useAuthContext();

  const [page, setPage] = useState(1);
  const MAX_ITEM = 9;

  const handleChange = (event, value) => {
    setPage(value);
  };

  const indexOfLastItem = page * MAX_ITEM;
  const indexOfFirstItem = indexOfLastItem - MAX_ITEM;

  return (
    <>
      <Box
        gap={3}
        display="grid"
        gridTemplateColumns={{
          xs: 'repeat(1, 1fr)',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
        }}
      >
        {campaigns?.slice(indexOfFirstItem, indexOfLastItem)?.map((campaign) => (
          <CampaignItem key={campaign.id} campaign={campaign} user={user} />
        ))}
        {/* {campaigns.map((campaign) => (
          <CampaignItem key={campaign.id} campaign={campaign} user={user} />
        ))} */}
      </Box>

      {campaigns?.length > 9 && (
        <Pagination
          count={Math.ceil(campaigns.length / MAX_ITEM)}
          page={page}
          onChange={handleChange}
          sx={{
            mt: 8,
            [`& .${paginationClasses.ul}`]: {
              justifyContent: 'center',
            },
          }}
        />
      )}
    </>
  );
}

CampaignLists.propTypes = {
  campaigns: PropTypes.array,
};
