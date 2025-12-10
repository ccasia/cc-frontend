import PropTypes from 'prop-types';
import { useState, useMemo } from 'react';
import useSWR from 'swr';

import {
  Box,
  Card,
  Grid,
  Divider,
  Stack,
  Select,
  TextField,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import Iconify from 'src/components/iconify';
import { fetcher } from 'src/utils/axios';

import LogisticsList from './logistics-list';
import BulkAssignView from './bulk-assign-view';
import LogisticsCalendar from './logistics-calendar';
import LogisticsScheduledList from './logistics-scheduled-list';
import LogisticsAnalytics from './logistics-analytics';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'PENDING_ASSIGNMENT', label: 'Unassigned' },
  { value: 'SCHEDULED', label: 'Yet To Ship' },
  { value: 'SHIPPED', label: 'Shipped Out' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'ISSUE_REPORTED', label: 'Failed' },
];

export default function CampaignLogisticsView({
  campaign,
  campaignMutate,
  openBulkAssign,
  setOpenBulkAssign,
  isAdmin = false,
}) {
  const [date, setDate] = useState(new Date());
  const [filterName, setFilterName] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: logistics, mutate } = useSWR(
    campaign?.id ? `/api/logistics/campaign/${campaign?.id}` : null,
    fetcher
  );

  const safeLogistics = useMemo(() => logistics || [], [logistics]);

  const filteredLogistics = useMemo(
    () =>
      safeLogistics.filter((item) => {
        const creatorName = item.creator?.name || '';
        const matchedName = creatorName.toLowerCase().includes(filterName.toLowerCase());

        let matchedStatus = false;
        if (filterStatus === 'all') {
          matchedStatus = true;
        } else if (filterStatus === 'DELIVERED') {
          matchedStatus = ['DELIVERED', 'RECEIVED', 'COMPLETED'].includes(item.status);
        } else {
          matchedStatus = item.status === filterStatus;
        }

        return matchedName && matchedStatus;
      }),
    [safeLogistics, filterName, filterStatus]
  );

  const handleFilterName = (event) => {
    setFilterName(event.target.value);
  };

  const handleFilterStatus = (event) => {
    setFilterStatus(event.target.value);
  };

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
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          gap: 2,
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{ width: { xs: '100%', sm: 'auto' }, flexGrow: 1, justifyContent: 'space-between' }}
        >
          {/* Status Dropdown */}
          <Select
            size="small"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            IconComponent={() => (
              <Iconify
                icon="material-symbols:filter-list-rounded"
                width={20}
                sx={{
                  color: '#231F20',
                  pointerEvents: 'none', // Allows clicking through to the select
                  position: 'absolute',
                  right: 12,
                }}
              />
            )}
            sx={{
              width: { xs: 120, md: 160 },
              bgcolor: '#fff',
              borderColor: '#EBEBEB',
              borderRadius: '8px',
              color: 'text.primary',
            }}
          >
            {STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {/* </TextField> */}

          {/* Search By Name */}
          <TextField
            // fullWidth
            value={filterName}
            onChange={handleFilterName}
            placeholder="Search creator..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              maxWidth: { md: 400 },
              bgcolor: 'background.paper',
            }}
          />
        </Stack>
      </Box>
      <LogisticsList campaignId={campaign?.id} logistics={filteredLogistics} isAdmin={isAdmin} />

      {campaign && (
        <BulkAssignView
          open={openBulkAssign}
          onClose={() => setOpenBulkAssign(false)}
          campaign={campaign}
          logistics={safeLogistics}
          onUpdate={mutate}
        />
      )}
    </>
  );
}

CampaignLogisticsView.propTypes = {
  campaign: PropTypes.object,
  campaignMutate: PropTypes.func,
  openBulkAssign: PropTypes.bool,
  setOpenBulkAssign: PropTypes.func,
  isAdmin: PropTypes.bool,
};
