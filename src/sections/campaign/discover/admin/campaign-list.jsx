import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Pagination, { paginationClasses } from '@mui/material/Pagination';

import CampaignItem from './campaign-item';

// ----------------------------------------------------------------------

export default function CampaignLists({ tours }) {
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
        {tours.map((tour) => (
          <CampaignItem key={tour.id} tour={tour} />
        ))}
      </Box>

      {tours.length > 8 && (
        <Pagination
          count={8}
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
  tours: PropTypes.array,
};
