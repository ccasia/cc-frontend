import React from 'react';
import PropTypes from 'prop-types';

import { Stack, Button, Container } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import useGetPitchDetail from 'src/hooks/use-get-pitch';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

import CampaignPitchDetail from '../campaign-pitch-detail';

const CampaignDetailsPitchCreator = ({ id }) => {
  const settings = useSettingsContext();
  const router = useRouter();
  const { user } = useAuthContext();
  const { data } = useGetPitchDetail(id);
  
  const isClient = user?.role === 'Client' || user?.admin?.role?.name === 'Client';

  const handleBack = () => {
    if (isClient) {
      // For client users, go to campaign details page
      router.push(paths.dashboard.campaign.details(data?.pitch?.campaignId));
    } else {
      // For admin users, go to admin campaign detail page
      router.push(paths.dashboard.campaign.adminCampaignDetail(data?.pitch?.campaignId));
    }
  };

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Button
          startIcon={<Iconify icon="material-symbols:arrow-back-ios" width={12} sx={{ ml: 1 }} />}
          onClick={handleBack}
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
