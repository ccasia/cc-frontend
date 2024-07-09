import PropTypes from 'prop-types';
import React, { useState } from 'react';

import {
  Box,
  Tab,
  Card,
  Tabs,
  Chip,
  Stack,
  Button,
  Avatar,
  Container,
  Typography,
  ListItemText,
} from '@mui/material';

import { useRouter } from 'src/routes/hooks';

import useGetFirstDraft from 'src/hooks/use-get-first-draft';
import useGetCreatorById from 'src/hooks/useSWR/useGetCreatorById';

import { countries } from 'src/assets/data';

import Iconify from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';

const CampaignManageCreatorView = ({ id, campaignId }) => {
  const { data, isLoading } = useGetCreatorById(id);
  const [currentTab, setCurrentTab] = useState('overview');
  const { firstDraft } = useGetFirstDraft(id, campaignId);
  console.log(firstDraft);
  const router = useRouter();

  const phoneNumberHelper = (country, phoneNumber) => {
    if (!phoneNumber) {
      return;
    }
    const prefix = countries.filter((item) => item.label === country)[0].phone;
    // eslint-disable-next-line consistent-return
    return `+${prefix} ${phoneNumber}`;
  };

  const renderInformation = (
    <Box component={Card} p={3}>
      <Typography variant="h5">Creator Information</Typography>
      <Stack
        mt={2}
        direction={{ sm: 'column', md: 'row' }}
        gap={3}
        alignItems={{ xs: 'center', md: 'start' }}
      >
        <Stack alignItems="center" gap={2}>
          <Avatar
            src={data?.user?.photoURL}
            sx={{
              width: 100,
              height: 100,
            }}
          />
          <Chip label={data?.user?.status} size="small" variant="outlined" color="success" />
        </Stack>
        <Box display="grid" gridTemplateColumns="repeat(2,1fr)" gap={1.5}>
          <ListItemText primary="Name" secondary={data?.user?.name} />
          <ListItemText primary="Email" secondary={data?.user?.email} />
          <ListItemText primary="Country" secondary={data?.user?.country} />
          <ListItemText
            primary="Phone Number"
            secondary={phoneNumberHelper(data?.user?.country, data?.user?.phoneNumber)}
          />
          <ListItemText primary="Pronouce" secondary={data?.user?.creator?.pronounce} />
          <ListItemText primary="Instagram" secondary={data?.user?.creator?.instagram} />
          <ListItemText primary="Tiktok" secondary={data?.user?.creator?.tiktok} />
        </Box>
      </Stack>
    </Box>
  );

  const renderTabs = (
    <Tabs
      value={currentTab}
      onChange={(a, val) => setCurrentTab(val)}
      sx={{
        my: 2,
      }}
    >
      <Tab value="overview" label="Overview" />
      <Tab value="draft" label="Draft" />
      <Tab value="agreement" label="Agreement" />
      <Tab value="logistics" label="Logistics" />
      <Tab value="timeline" label="Timeline" />
      <Tab value="reminder" label="Reminder" />
    </Tabs>
  );

  const renderOverview = (
    <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={2}>
      <Box
        sx={{
          height: 150,
          p: 3,
        }}
        component={Card}
      >
        <Typography variant="h3">Draft</Typography>
      </Box>
      <Box
        sx={{
          height: 150,
        }}
        component={Card}
      />
    </Box>
  );

  const renderDraft = <>{firstDraft.length < 1 && <Typography>No draft</Typography>}</>;

  return (
    <Container>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Button
          startIcon={<Iconify icon="material-symbols:arrow-back-ios" width={12} sx={{ ml: 1 }} />}
          onClick={() => router.back()}
          sx={{
            mb: 3,
          }}
        >
          Back
        </Button>
      </Stack>

      {isLoading && <LoadingScreen />}

      <Box display="grid" gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2,1fr)' }}>
        {renderInformation}
      </Box>
      {renderTabs}
      {currentTab === 'overview' && renderOverview}
      {currentTab === 'draft' && renderDraft}
    </Container>
  );
};

export default CampaignManageCreatorView;

CampaignManageCreatorView.propTypes = {
  id: PropTypes.string,
  campaignId: PropTypes.string,
};
