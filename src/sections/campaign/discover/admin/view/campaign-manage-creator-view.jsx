import PropTypes from 'prop-types';
import React, { useState } from 'react';

import {
  Box,
  Tab,
  Card,
  Tabs,
  Stack,
  Button,
  Avatar,
  Container,
  Typography,
  ListItemText,
} from '@mui/material';

import { useRouter } from 'src/routes/hooks';

import useGetCreatorById from 'src/hooks/useSWR/useGetCreatorById';

import { countries } from 'src/assets/data';

import Iconify from 'src/components/iconify';

const CampaignManageCreatorView = ({ id }) => {
  const { data } = useGetCreatorById(id);
  const [currentTab, setCurrentTab] = useState('overview');
  // const { user } = data;
  const router = useRouter();

  const phoneNumberHelper = (country, phoneNumber) => {
    const prefix = countries.filter((item) => item.label === country)[0].phone;
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
        <Avatar
          src={data?.user?.photoURL}
          sx={{
            width: 100,
            height: 100,
          }}
        />
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
        mt: 2,
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

      <Box display="grid" gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2,1fr)' }}>
        {renderInformation}
        {/* {renderInformation} */}
      </Box>
      {renderTabs}
    </Container>
  );
};

export default CampaignManageCreatorView;

CampaignManageCreatorView.propTypes = {
  id: PropTypes.string,
};
