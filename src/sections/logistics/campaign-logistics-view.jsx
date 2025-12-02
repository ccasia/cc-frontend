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
import LogisticsAnalytics from './logistics-analytics';

export default function CampaignLogisticsClient({ campaign, campaignMutate }) {
  const settings = useSettingsContext();

  const [openBulkAssign, setOpenBulkAssign] = useState(false);
  const [date, setDate] = useState(new Date());
  const [filterName, setFilterName] = useState('');

  const { data: logistics, mutate } = useSWR(
    campaign?.id ? `/api/logistics/campaign/${campaign?.id}` : null,
    fetcher
  );

  const safeLogistics = logistics || [];

  return (
    <>
      <Grid container spacing={2} sx={{ mb: 5 }}>
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
                width: { xs: '100%', md: 300 }, // Fixed width on desktop to prevent squashing
                flexShrink: 0,
              }}
            >
              <LogisticsCalendar
                date={date}
                onChange={(newDate) => setDate(newDate)}
                logistics={safeLogistics}
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
              <LogisticsScheduledList date={date} logistics={safeLogistics} />
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <LogisticsAnalytics logistics={safeLogistics} />
        </Grid>
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
          onClick={() => setOpenBulkAssign(true)}
          sx={{
            bgcolor: '#1340ff',
            '&:hover': { bgcolor: '#0e2fd6' },
          }}
        >
          Edit & Bulk Assign
        </Button>
      </Box>
      <LogisticsList campaignId={campaign?.id} logistics={safeLogistics} />

      <BulkAssignView
        open={openBulkAssign}
        onClose={() => setOpenBulkAssign(false)}
        campaign={campaign}
        logistics={safeLogistics}
        onUpdate={mutate}
      />
    </>
  );
}

CampaignLogisticsView.propTypes = {
  campaign: PropTypes.object,
  campaignMutate: PropTypes.func,
};
