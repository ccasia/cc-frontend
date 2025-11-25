import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';
import useSWR from 'swr';

import {
  Box,
  Card,
  Grid,
  Button,
  Divider,
  Container,
  Typography,
  TextField,
  InputAdornment,
} from '@mui/material';
import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import { fetcher } from 'src/utils/axios';

import LogisticsList from './logistics-list';
import BulkAssignView from './bulk-assign-view';
import LogisticsCalendar from './logistics-calendar';
import LogisticsScheduledList from './logistics-scheduled-list';

export default function CampaignLogisticsView({ campaign, campaignMutate }) {
  const settings = useSettingsContext();

  const [isBulkAssigning, setIsBulkAssigning] = useState(false);

  const handleOpenBulkAssign = useCallback(() => {
    setIsBulkAssigning(true);
  }, []);

  const handleCloseBulkAssign = useCallback(() => {
    setIsBulkAssigning(false);
    campaignMutate();
  }, [campaignMutate]);

  if (isBulkAssigning) {
    return <BulkAssignView campaign={campaign} onBack={handleCloseBulkAssign} />;
  }

  const safeLogistics = logistics || [];

  return (
    <>
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} md={9}>
          <Card
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              height: '100%',
            }}
          >
            <Box
              sx={{
                width: { xs: '100%', md: 320 }, // Fixed width on desktop to prevent squashing
                flexShrink: 0,
              }}
            >
              <LogisticsCalendar
                date={date}
                onChange={(newDate) => setDate(newDate)}
                logistics={mockLogistics}
              />
            </Box>
            {/* Vertical Divider (Desktop) */}
            <Divider
              orientation="vertical"
              flexItem
              sx={{
                display: { xs: 'none', md: 'block' },
              }}
            />

            {/* Horizontal Divider (Mobile) */}
            <Divider sx={{ display: { xs: 'block', md: 'none' } }} />
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <LogisticsScheduledList date={date} logistics={mockLogistics} />
            </Box>
          </Card>
        </Grid>
        {/* <Grid item xs={12} md={3}>
          <LogisticsAnalytics logistics={safeLogistics} />
        </Grid> */}
      </Grid>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Button
          variant="contained"
          startIcon={<Iconify icon="eva:edit-2-fill" />}
          onClick={handleOpenBulkAssign}
          sx={{
            bgcolor: '#1340ff',
            '&:hover': { bgcolor: '#0e2fd6' },
          }}
        >
          Edit & Bulk Assign
        </Button>
      </Box>
      <LogisticsList campaignId={campaign?.id} />
    </>
  );
}

CampaignLogisticsView.propTypes = {
  campaign: PropTypes.object,
  campaignMutate: PropTypes.func,
};
