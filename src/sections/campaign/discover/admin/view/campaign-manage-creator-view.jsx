import React from 'react';
import PropTypes from 'prop-types';

import { Stack, Button, Container } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import useGetCreatorById from 'src/hooks/useSWR/useGetCreatorById';

import Iconify from 'src/components/iconify';

const CampaignManageCreatorView = ({ id }) => {
  const { data } = useGetCreatorById(id);
  const router = useRouter();

  return (
    <Container>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Button
          startIcon={<Iconify icon="material-symbols:arrow-back-ios" width={12} sx={{ ml: 1 }} />}
          onClick={() => router.push(paths.dashboard.campaign.view)}
          sx={{
            mb: 3,
          }}
        >
          Back
        </Button>
      </Stack>
      {JSON.stringify(data)}
    </Container>
  );
};

export default CampaignManageCreatorView;

CampaignManageCreatorView.propTypes = {
  id: PropTypes.string,
};
