import React from 'react';
import PropTypes from 'prop-types';

import { Stack, Button, Container } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import useGetPitchDetail from 'src/hooks/use-get-pitch';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

import CampaignPitchDetail from '../campaign-pitch-detail';

const CampaignDetailsPitchCreator = ({ id }) => {
  const settings = useSettingsContext();
  const router = useRouter();
  const { data } = useGetPitchDetail(id);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Button
          startIcon={<Iconify icon="material-symbols:arrow-back-ios" width={12} sx={{ ml: 1 }} />}
          onClick={() =>
            router.push(paths.dashboard.campaign.adminCampaignDetail(data?.pitch?.campaignId))
          }
          sx={{
            mb: 3,
          }}
        >
          Back
        </Button>
      </Stack>

      {data && <CampaignPitchDetail pitch={data?.pitch} />}
    </Container>
  );
};

export default CampaignDetailsPitchCreator;

CampaignDetailsPitchCreator.propTypes = {
  id: PropTypes.string,
};
