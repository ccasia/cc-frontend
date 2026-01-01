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
  Button,
} from '@mui/material';
import Iconify from 'src/components/iconify';
import { fetcher } from 'src/utils/axios';

import LogisticsList from './logistics-list';
import BulkAssignView from './bulk-assign-view';
import LogisticsCalendar from './logistics-calendar';
import LogisticsScheduledList from './logistics-scheduled-list';
import LogisticsAnalytics from './logistics-analytics';
import LogisticsDrawer from './logistics-drawer';

const DELIVERY_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'PENDING_ASSIGNMENT', label: 'Unassigned' },
  { value: 'SCHEDULED', label: 'Yet To Ship' },
  { value: 'SHIPPED', label: 'Shipped Out' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'ISSUE_REPORTED', label: 'Failed' },
];

const RESERVATION_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'PENDING_ASSIGNMENT', label: 'Unassigned' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ISSUE_REPORTED', label: 'Failed' },
];

export default function CampaignLogisticsView({
  campaign,
  campaignMutate,
  openBulkAssign,
  setOpenBulkAssign,
  isAdmin = false,
}) {
  const campaignLogisticsType = campaign?.logisticsType;
  const isReservation = campaignLogisticsType === 'RESERVATION';
  const statusOptions = isReservation ? RESERVATION_OPTIONS : DELIVERY_OPTIONS;

  const [date, setDate] = useState(new Date());
  const [filterName, setFilterName] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [openDrawer, setOpenDrawer] = useState(false);
  const [selectedLogisticId, setSelectedLogisticId] = useState(null);

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
        } else if (filterStatus === 'PENDING_ASSIGNMENT') {
          matchedStatus = ['PENDING_ASSIGNMENT', 'NOT_STARTED'].includes(item.status);
        } else if (filterStatus === 'DELIVERED') {
          matchedStatus = ['DELIVERED', 'RECEIVED', 'COMPLETED'].includes(item.status);
        } else {
          matchedStatus = item.status === filterStatus;
        }

        return matchedName && matchedStatus;
      }),
    [safeLogistics, filterName, filterStatus]
  );

  const selectedLogistic = useMemo(
    () => safeLogistics.find((item) => item.id === selectedLogisticId),
    [safeLogistics, selectedLogisticId]
  );

  const handleOpenDrawer = (id) => {
    setSelectedLogisticId(id);
    setOpenDrawer(true);
  };

  const handleCloseDrawer = () => {
    setOpenDrawer(false);
  };

  const handleFilterName = (event) => {
    setFilterName(event.target.value);
  };

  const handleFilterStatus = (event) => {
    setFilterStatus(event.target.value);
  };

  return (
    <>
      <Grid container spacing={2} sx={{ mb: 2 }}>
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
                isReservation={isReservation}
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
              <LogisticsScheduledList
                date={date}
                logistics={safeLogistics}
                isReservation={isReservation}
                onClick={handleOpenDrawer}
              />
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <LogisticsAnalytics logistics={safeLogistics} isReservation={isReservation} />
        </Grid>
      </Grid>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          mt: 1,
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
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
                  pointerEvents: 'none',
                  position: 'absolute',
                  right: 12,
                }}
              />
            )}
            sx={{
              width: 176,
              height: 48,
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              color: 'text.primary',
              '& .MuiSelect-select': {
                paddingTop: '12px',
                paddingRight: '12px',
                paddingBottom: '12px',
                paddingLeft: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#EBEBEB',
                borderWidth: '1px',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#EBEBEB',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#EBEBEB',
                borderWidth: '1px',
              },
            }}
          >
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>

          {/* Search By Name */}
          <TextField
            // fullWidth
            value={filterName}
            onChange={handleFilterName}
            placeholder="Search"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: 234,
              '& .MuiOutlinedInput-root': {
                height: 48,
                borderRadius: '8px',
                backgroundColor: '#FFFFFF',
                paddingTop: '6px',
                paddingRight: '100px',
                paddingBottom: '9px',
                paddingLeft: '10px',
                boxShadow: 'inset 0px -3px 0px 0px #E7E7E7',
                '& fieldset': {
                  borderColor: '#E7E7E7',
                  borderWidth: '1px',
                },
                '&:hover fieldset': {
                  borderColor: '#E7E7E7',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#E7E7E7',
                  borderWidth: '1px',
                },
              },
            }}
          />
        </Box>

        {/* Edit & Bulk Assign Button */}
        {!isReservation && (
          <Button
            variant="contained"
            size="small"
            onClick={() => setOpenBulkAssign(true)}
            sx={{
              width: 179,
              height: 43,
              borderRadius: '8px',
              color: 'white',
              backgroundColor: '#3A3A3C',
              paddingTop: '10px',
              paddingRight: '48px',
              paddingBottom: '13px',
              paddingLeft: '48px',
              boxShadow: 'inset 0px -3px 0px 0px rgba(0, 0, 0, 0.45)',
              fontWeight: 600,
              fontSize: '0.95rem',
              whiteSpace: 'nowrap',
              gap: '6px',
              '&:hover': {
                backgroundColor: '#2A2A2C',
              },
            }}
          >
            Edit & Bulk Assign
          </Button>
        )}
      </Box>
      <LogisticsList
        campaignId={campaign?.id}
        logistics={filteredLogistics}
        isAdmin={isAdmin}
        isReservation={isReservation}
        onClick={handleOpenDrawer}
      />

      <LogisticsDrawer
        open={openDrawer}
        onClose={handleCloseDrawer}
        logistic={selectedLogistic}
        onUpdate={mutate}
        campaignId={campaign?.id}
        isReservation={isReservation}
      />

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
