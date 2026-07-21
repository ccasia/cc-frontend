import useSWR from 'swr';
import dayjs from 'dayjs';
import React, { useMemo, useState } from 'react';

import { alpha } from '@mui/material/styles';
import {
  Box,
  Tab,
  Tabs,
  Card,
  Grid,
  Menu,
  Stack,
  Button,
  Typography,
  CircularProgress,
} from '@mui/material';

import { fetcher, endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';

import ClientsTab from './clients';
import CampaignsTab from './campaigns';
import CSMWorkloadTab from './csm-workload';
import BusinessDevelopmentTab from './business-development';

const SWR_OPTS = { revalidateOnFocus: false, revalidateOnReconnect: false, dedupingInterval: 120000 };

const TIME_RANGES = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
];

const TABS = [
  { value: 'bd', label: 'Business Development', icon: 'hugeicons:briefcase-01' },
  { value: 'csm', label: 'CSM workload', icon: 'hugeicons:user-group' },
  { value: 'campaigns', label: 'Campaigns', icon: 'hugeicons:megaphone-01' },
  { value: 'clients', label: 'Clients', icon: 'hugeicons:building-06' },
];

const PLATFORM_TOTALS = (stats) => [
  { label: 'ACTIVE CAMPAIGNS', value: stats.activeCampaigns || 0, color: '#1340FF' },
  { label: 'ACTIVE CLIENTS', value: stats.totalClients || 0, color: '#8A5AFE' },
  { label: 'ACTIVE CREATORS', value: stats.totalCreators || 0, color: '#1ABF66' },
  { label: 'COMPLETED CAMPAIGNS', value: stats.completedCampaigns || 0, color: '#FF3500' },
];

function getRangeForValue(value) {
  const now = dayjs();
  switch (value) {
    case 'today':
      return { startDate: now.startOf('day').toISOString(), endDate: now.endOf('day').toISOString() };
    case 'week':
      return { startDate: now.startOf('week').toISOString(), endDate: now.endOf('week').toISOString() };
    case 'month':
      return { startDate: now.startOf('month').toISOString(), endDate: now.endOf('month').toISOString() };
    default:
      return null;
  }
}

const DashboardSuperadminView = () => {
  const [tab, setTab] = useState('csm');
  const [timeRange, setTimeRange] = useState('all');
  const [customAnchor, setCustomAnchor] = useState(null);
  const [customRange, setCustomRange] = useState({ startDate: '', endDate: '' });

  const { data: dashboardStats, isLoading: statsLoading } = useSWR(endpoints.dashboard.stats, fetcher, SWR_OPTS);
  const stats = dashboardStats?.data || {};

  const dateRange = useMemo(() => {
    if (timeRange === 'custom') {
      if (!customRange.startDate || !customRange.endDate) return null;
      return {
        startDate: dayjs(customRange.startDate).startOf('day').toISOString(),
        endDate: dayjs(customRange.endDate).endOf('day').toISOString(),
      };
    }
    return getRangeForValue(timeRange);
  }, [timeRange, customRange]);

  const activeRangeLabel =
    timeRange === 'custom' && customRange.startDate && customRange.endDate
      ? `${dayjs(customRange.startDate).format('D MMM')} - ${dayjs(customRange.endDate).format('D MMM')}`
      : null;

  const platformTotals = PLATFORM_TOTALS(stats);

  return (
    <Box sx={{ py: 3, px: { xs: 1, sm: 0 }, minHeight: '100vh' }}>
      {/* Header */}
      <Typography
        sx={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: { xs: '2rem', sm: '2.6rem' },
          fontWeight: 400,
          color: '#111827',
          lineHeight: 1.2,
        }}
      >
        Super Overview
      </Typography>

      {/* Platform totals */}
      <Stack direction="row" alignItems="center" justifyContent="flex-end" sx={{ mb: 1.5 }}>
        <Stack direction="row" spacing={1}>
          {TIME_RANGES.map((range) => (
            <Button
              key={range.value}
              size="small"
              onClick={() => setTimeRange(range.value)}
              sx={{
                borderRadius: '999px',
                px: 2,
                py: 0.6,
                fontSize: '0.8rem',
                fontWeight: 600,
                textTransform: 'none',
                bgcolor: timeRange === range.value ? '#1340FF' : '#fff',
                color: timeRange === range.value ? '#fff' : '#374151',
                border: '1px solid',
                borderColor: timeRange === range.value ? '#1340FF' : '#e5e7eb',
                '&:hover': {
                  bgcolor: timeRange === range.value ? '#1340FF' : '#f9fafb',
                },
              }}
            >
              {range.label}
            </Button>
          ))}
          <Button
            size="small"
            onClick={(e) => setCustomAnchor(e.currentTarget)}
            endIcon={<Iconify icon="mingcute:down-line" width={16} />}
            sx={{
              borderRadius: '999px',
              px: 2,
              py: 0.6,
              fontSize: '0.8rem',
              fontWeight: 600,
              textTransform: 'none',
              bgcolor: timeRange === 'custom' ? '#1340FF' : '#fff',
              color: timeRange === 'custom' ? '#fff' : '#374151',
              border: '1px solid',
              borderColor: timeRange === 'custom' ? '#1340FF' : '#e5e7eb',
              '&:hover': {
                bgcolor: timeRange === 'custom' ? '#1340FF' : '#f9fafb',
              },
            }}
          >
            {activeRangeLabel || 'Custom'}
          </Button>
        </Stack>
        <Menu anchorEl={customAnchor} open={Boolean(customAnchor)} onClose={() => setCustomAnchor(null)}>
          <Box sx={{ p: 2, width: 260 }}>
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="caption" sx={{ color: '#6b7280' }}>From</Typography>
                <input
                  type="date"
                  value={customRange.startDate}
                  onChange={(e) => setCustomRange((prev) => ({ ...prev, startDate: e.target.value }))}
                  style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }}
                />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#6b7280' }}>To</Typography>
                <input
                  type="date"
                  value={customRange.endDate}
                  onChange={(e) => setCustomRange((prev) => ({ ...prev, endDate: e.target.value }))}
                  style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }}
                />
              </Box>
              <Button
                variant="contained"
                size="small"
                disabled={!customRange.startDate || !customRange.endDate}
                onClick={() => {
                  setTimeRange('custom');
                  setCustomAnchor(null);
                }}
                sx={{ bgcolor: '#111827', '&:hover': { bgcolor: '#000' } }}
              >
                Apply
              </Button>
            </Stack>
          </Box>
        </Menu>
      </Stack>

      {statsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={20} sx={{ color: '#1340FF' }} />
        </Box>
      ) : (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {platformTotals.map((item) => (
            <Grid item xs={6} md={3} key={item.label}>
              <Card
                sx={{
                  borderRadius: 2,
                  border: '1px solid #e5e7eb',
                  boxShadow: 'none',
                  p: 2.5,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "'Inter Display', Inter, sans-serif",
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    color: '#9ca3af',
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                    mb: 1.5,
                  }}
                >
                  {item.label}
                </Typography>
                <Typography sx={{ fontSize: '1.9rem', fontWeight: 700, color: item.color, lineHeight: 1 }}>
                  {item.value.toLocaleString()}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(e, value) => setTab(value)}
        TabIndicatorProps={{ style: { backgroundColor: '#1340FF', height: 2 } }}
        sx={{
          minHeight: 'auto',
          mb: 2,
          boxShadow: (theme) => `inset 0 -1px 0 0 ${alpha(theme.palette.grey[500], 0.16)}`,
          '& .MuiTab-root': {
            minHeight: 44,
            textTransform: 'none',
            fontSize: '0.9rem',
            fontWeight: 600,
            color: '#9ca3af',
            fontFamily: "'Inter Display', Inter, sans-serif",
          },
          '& .MuiTab-root.Mui-selected': { color: '#111827' },
        }}
      >
        {TABS.map((t) => (
          <Tab
            key={t.value}
            value={t.value}
            label={t.label}
            iconPosition="start"
            icon={<Iconify icon={t.icon} width={18} />}
          />
        ))}
      </Tabs>

      {tab === 'bd' && <BusinessDevelopmentTab dateRange={dateRange}/>}
      {tab === 'csm' && <CSMWorkloadTab dateRange={dateRange} />}
      {tab === 'campaigns' && <CampaignsTab />}
      {tab === 'clients' && <ClientsTab />}
    </Box>
  );
};

export default DashboardSuperadminView;
