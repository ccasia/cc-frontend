import useSWR from 'swr';
import React, { useMemo, useState } from 'react';

import {
  Box,
  Card,
  Grid,
  Stack,
  Avatar,
  Typography,
  OutlinedInput,
  InputAdornment,
  LinearProgress,
  CircularProgress,
} from '@mui/material';

import { fetcher, endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';

const SWR_OPTS = { revalidateOnFocus: false, revalidateOnReconnect: false, dedupingInterval: 60000 };

const MINI_STATS = (csm) => [
  { label: 'ACTIVE CAMPAIGNS', value: csm.activeCampaigns, icon: 'hugeicons:megaphone-01' },
  { label: 'ACTIVE CLIENTS', value: csm.activeClients, icon: 'hugeicons:building-06' },
  { label: 'ACTIVE CREATORS', value: csm.activeCreators, icon: 'hugeicons:user-group' },
  { label: 'COMPLETED', value: csm.completedCampaigns, icon: 'hugeicons:checkmark-circle-01' },
];

const CSMWorkloadTab = ({ dateRange }) => {
  const [search, setSearch] = useState('');

  const query = dateRange
    ? `${endpoints.analytics.csmWorkload}?startDate=${encodeURIComponent(dateRange.startDate)}&endDate=${encodeURIComponent(dateRange.endDate)}`
    : endpoints.analytics.csmWorkload;

  const { data, isLoading } = useSWR(query, fetcher, SWR_OPTS);
  const csAdmins = useMemo(() => data?.data?.csAdmins || [], [data]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return csAdmins;
    return csAdmins.filter(
      (csm) =>
        csm.name?.toLowerCase().includes(term) ||
        csm.email?.toLowerCase().includes(term) ||
        csm.role?.toLowerCase().includes(term)
    );
  }, [csAdmins, search]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={20} sx={{ color: '#1340FF' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="flex-end" spacing={2} sx={{ mb: 2.5 }}>

        <OutlinedInput
          size="small"
          placeholder="Search CSMs by name, email, or role"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startAdornment={
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" width={18} sx={{ color: '#9ca3af' }} />
            </InputAdornment>
          }
          sx={{
            width: { xs: '100%', sm: 320 },
            borderRadius: '10px',
            bgcolor: '#fff',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e5e7eb' },
          }}
        />
      </Stack>

      {filtered.length === 0 ? (
        <Card sx={{ p: 4, borderRadius: 2, border: '1px solid #e5e7eb', boxShadow: 'none', textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#9ca3af' }}>
            No CSMs found
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((csm) => {
            const { total, pending, utilised } = csm.creditCapacity;
            const pct = total > 0 ? Math.min(100, Math.round((utilised / total) * 100)) : 0;
            return (
              <Grid item xs={12} sm={6} md={3} key={csm.adminUserId || csm.email}>
                <Card
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid #e5e7eb',
                    boxShadow: 'none',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease',
                    '&:hover': { borderColor: '#1340FF' },
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                    <Avatar
                      src={csm.photo}
                      sx={{ width: 40, height: 40, bgcolor: '#e5e7eb', color: '#374151', fontWeight: 700 }}
                    >
                      {csm.name?.charAt(0)?.toUpperCase() || 'C'}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        noWrap
                        sx={{ fontWeight: 700, color: '#111827', fontSize: '0.9rem' }}
                        title={csm.name}
                      >
                        {csm.name || 'Unnamed'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                        {csm.role === 'CSL' ? 'Customer Success Lead' : 'Customer Success'}
                      </Typography>
                    </Box>
                  </Stack>

                  <Grid container spacing={1.5} sx={{ mb: 2 }}>
                    {MINI_STATS(csm).map((stat) => (
                      <Grid item xs={6} key={stat.label}>
                        <Stack direction="row" spacing={0.8} alignItems="center">
                          <Iconify icon={stat.icon} width={14} sx={{ color: '#9ca3af', flexShrink: 0 }} />
                          <Typography
                            sx={{
                              fontSize: '0.6rem',
                              fontWeight: 600,
                              color: '#9ca3af',
                              textTransform: 'uppercase',
                              letterSpacing: '0.02em',
                            }}
                          >
                            {stat.label}
                          </Typography>
                        </Stack>
                        <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', ml: 2.7 }}>
                          {(stat.value || 0).toLocaleString()}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>

                  <Box sx={{ borderTop: '1px solid #f3f4f6', pt: 1.5 }}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.6 }}>
                      <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>
                        Credit Capacity
                      </Typography>
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#111827' }}>
                        {utilised} / {total}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      sx={{
                        height: 6,
                        borderRadius: '999px',
                        bgcolor: '#f3f4f6',
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(90deg, #111827 0%, #7c3aed 100%)',
                          borderRadius: '999px',
                        },
                      }}
                    />
                    <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.6 }}>
                      <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                        Pending: {pending}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                        Utilised: {utilised}
                      </Typography>
                    </Stack>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default CSMWorkloadTab;
