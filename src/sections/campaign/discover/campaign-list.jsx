import PropTypes from 'prop-types';
import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Pagination, { paginationClasses } from '@mui/material/Pagination';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import JobItem from './job-item';

// ----------------------------------------------------------------------

export default function CampaignList({ campaigns }) {
  const router = useRouter();

  const handleView = useCallback(
    (id) => {
      router.push(paths.dashboard.campaign.details(id));
    },
    [router]
  );

  const handleEdit = useCallback(
    (id) => {
      router.push(paths.dashboard.job.edit(id));
    },
    [router]
  );

  const handleDelete = useCallback((id) => {
    console.info('DELETE', id);
  }, []);

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
        {campaigns.map((campaign) => (
          <JobItem
            key={campaign.id}
            campaign={campaign}
            onView={() => handleView(campaign.id)}
            onEdit={() => handleEdit(campaign.id)}
            onDelete={() => handleDelete(campaign.id)}
          />
        ))}
      </Box>

      {campaigns.length > 8 && (
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

CampaignList.propTypes = {
  campaigns: PropTypes.array,
};
