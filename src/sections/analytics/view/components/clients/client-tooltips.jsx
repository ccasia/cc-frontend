import React from 'react';
import { Box, Typography, Stack, Divider } from '@mui/material';

const CHART_COLORS = { success: '#00C49F', error: '#FF8042' };

export const ClientTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <Box sx={{ bgcolor: '#1C252E', color: '#fff', p: 1.5, borderRadius: 1.5, boxShadow: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
          {payload[0].payload.name || payload[0].name}
        </Typography>
        <Typography variant="h6" sx={{ color: payload[0].fill || '#fff', fontSize: '1rem' }}>
          {payload[0].value}
        </Typography>
      </Box>
    );
  }
  return null;
};

export const MatrixTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isHighRisk = data.y > 4 || data.x > 10;
    return (
      <Box
        sx={{
          bgcolor: '#1C252E',
          color: '#fff',
          p: 1.5,
          borderRadius: 1.5,
          boxShadow: 3,
          minWidth: 180,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Client Submission
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: isHighRisk ? CHART_COLORS.error : CHART_COLORS.success,
            fontWeight: 700,
            mb: 1,
            display: 'block',
          }}
        >
          {isHighRisk ? 'High Friction' : 'Healthy Cycle'}
        </Typography>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1 }} />
        <Stack spacing={0.5}>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="caption" sx={{ color: 'grey.400' }}>
              Review Time:
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {data.x} hrs
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="caption" sx={{ color: 'grey.400' }}>
              Rounds:
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {data.y}
            </Typography>
          </Stack>
        </Stack>
      </Box>
    );
  }
  return null;
};

export const RenewalTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum, entry) => sum + entry.value, 0);
    const retentionRate =
      total > 0
        ? Math.round(
            (((payload.find((p) => p.dataKey === 'Upgrades')?.value || 0) +
              (payload.find((p) => p.dataKey === 'Renewals')?.value || 0)) /
              total) *
              100
          )
        : 0;

    return (
      <Box
        sx={{
          bgcolor: '#1C252E',
          color: '#fff',
          p: 1.5,
          borderRadius: 1.5,
          boxShadow: 3,
          minWidth: 200,
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {label || 'Cohort'} Renewals
        </Typography>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 1 }} />
        <Stack spacing={0.5}>
          {payload.map((entry, index) => (
            <Stack key={index} direction="row" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ width: 8, height: 8, bgcolor: entry.color, borderRadius: '50%' }} />
                <Typography variant="caption" sx={{ color: 'grey.400' }}>
                  {entry.name}
                </Typography>
              </Stack>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {entry.value}
              </Typography>
            </Stack>
          ))}
        </Stack>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1 }} />
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="caption" sx={{ color: 'grey.400' }}>
            Total Retention:
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: CHART_COLORS.success }}>
            {retentionRate}%
          </Typography>
        </Stack>
      </Box>
    );
  }
  return null;
};
