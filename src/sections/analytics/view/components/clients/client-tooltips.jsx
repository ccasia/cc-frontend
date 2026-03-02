import React from 'react';
import PropTypes from 'prop-types'; // 1. Import PropTypes

import { Box, Typography, Stack, Divider, Avatar } from '@mui/material';
import Iconify from 'src/components/iconify';

const CHART_COLORS = { success: '#00C49F', error: '#FF8042' };

export function ClientTooltip({ itemData, series, axisValue, dataIndex }) {
  const seriesItem = itemData ? series.find((s) => s.id === itemData.seriesId) : series[0];

  if (!seriesItem) return null;

  const index = itemData ? itemData.dataIndex : dataIndex;

  const dataValue = seriesItem.data[index];
  const friendlyName = seriesItem.dataset?.[index]?.name || axisValue || 'Step';

  const lowercaseLabel = seriesItem.label?.toLowerCase() || '';

  let unit = '';
  let metric = 'Value';

  if (lowercaseLabel.includes('time') || lowercaseLabel.includes('min')) {
    unit = ' mins';
    metric = 'Duration';
  } else if (lowercaseLabel.includes('day')) {
    unit = ' days';
    metric = 'Duration';
  } else {
    metric = seriesItem.label || 'Value';
  }

  return (
    <Box
      sx={{
        bgcolor: '#1C252E',
        color: '#fff',
        p: 1.5,
        borderRadius: 1.5,
        minWidth: 180,
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 10px 20px rgba(0,0,0,0.5)',
        pointerEvents: 'none',
      }}
    >
      <Stack spacing={0.5}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {friendlyName}
        </Typography>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 0.5 }} />
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={3}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: seriesItem.color }} />
            <Typography variant="caption" sx={{ color: 'grey.400' }}>
              {metric}{' '}
            </Typography>
          </Stack>
          <Typography variant="caption" fontWeight="600">
            {dataValue}
            {unit}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}

ClientTooltip.propTypes = {
  axisValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  dataIndex: PropTypes.number,
  itemData: PropTypes.shape({
    seriesId: PropTypes.string,
    dataIndex: PropTypes.number,
  }),
  series: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      color: PropTypes.string,
      label: PropTypes.string,
      data: PropTypes.array,
      dataset: PropTypes.array,
    })
  ).isRequired,
};

export function MatrixTooltip({ itemData, series }) {
  if (!itemData || !series || !series.data) return null;

  const dataPoint = series.data[itemData.dataIndex];

  if (!dataPoint) return null;

  const { x, y, campaignName, clientName, image } = dataPoint;
  const isHighRisk = x > 24 && y > 2;
  const isWarning = x > 24 || y > 2;

  let color = '#1ABF66';
  let status = 'Healthy Cycle';

  if (isHighRisk) {
    color = '#D4321C';
    status = 'High Friction';
  } else if (isWarning) {
    color = '#FFC702';
    status = 'Moderate Friction';
  }

  return (
    <Box
      sx={{
        bgcolor: '#1C252E',
        color: '#fff',
        p: 2,
        borderRadius: 2,
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        minWidth: 240,
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <Stack direction="column" spacing={1.5} mb={2}>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {campaignName || 'Campaign'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'grey.400', display: 'block' }}>
            {clientName || 'Client'}
          </Typography>
        </Box>
        <Avatar
          src={image}
          variant="rounded"
          sx={{ width: 220, height: 140, border: '1px solid rgba(255,255,255,0.2)' }}
        >
          {clientName?.charAt(0)}
        </Avatar>
      </Stack>

      <Typography
        variant="caption"
        sx={{
          color,
          fontWeight: 700,
          mb: 1,
          display: 'block',
        }}
      >
        {status}
      </Typography>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1 }} />
      <Stack spacing={0.5}>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="caption" sx={{ color: 'grey.400' }}>
            Avg Review Time:
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {x} hrs
          </Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="caption" sx={{ color: 'grey.400' }}>
            Avg Rounds:
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {y}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}

MatrixTooltip.propTypes = {
  itemData: PropTypes.shape({
    dataIndex: PropTypes.number,
  }),
  series: PropTypes.shape({
    data: PropTypes.arrayOf(
      PropTypes.shape({
        x: PropTypes.number,
        y: PropTypes.number,
        campaignName: PropTypes.string,
        clientName: PropTypes.string,
        image: PropTypes.string,
      })
    ),
  }),
};

export function RenewalTooltip({ series, dataIndex }) {
  if (!series || dataIndex === undefined) return null;

  const total = series.reduce((sum, s) => sum + (s.data[dataIndex] || 0), 0);
  const upgrades = series.find((s) => s.label === 'Upgrades')?.data[dataIndex] || 0;
  const renewals = series.find((s) => s.label === 'Renewals')?.data[dataIndex] || 0;
  const downgrades = series.find((s) => s.label === 'Downgrades')?.data[dataIndex] || 0;
  const retentionRate =
    total > 0 ? Math.round(((upgrades + renewals + downgrades) / total) * 100) : 0;

  return (
    <Box sx={{ bgcolor: '#1C252E', color: '#fff', p: 1.5, borderRadius: 1.5, minWidth: 200 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Package Renewal{' '}
      </Typography>
      <Stack spacing={0.5}>
        {series.map((s, i) => (
          <Stack key={i} direction="row" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box sx={{ width: 8, height: 8, bgcolor: s.color, borderRadius: '50%' }} />
              <Typography variant="caption" color="grey.400">
                {s.label}
              </Typography>
            </Stack>
            <Typography variant="caption" fontWeight={600}>
              {s.data[dataIndex]}
            </Typography>
          </Stack>
        ))}
      </Stack>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1 }} />
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="caption" color="grey.400">
          Retention Rate:
        </Typography>
        <Typography variant="subtitle2" color={CHART_COLORS.success} fontWeight={800}>
          {retentionRate}%
        </Typography>
      </Stack>
    </Box>
  );
}

RenewalTooltip.propTypes = {
  dataIndex: PropTypes.number,
  series: PropTypes.arrayOf(
    PropTypes.shape({
      color: PropTypes.string,
      label: PropTypes.string,
      data: PropTypes.arrayOf(PropTypes.number),
    })
  ),
};

export function TurnaroundTooltip(props) {
  const { itemData, series } = props;

  if (!itemData || !series || !series.data) return null;

  const point = series.data[itemData.dataIndex];

  const rowPayload = point?.payload;

  if (!rowPayload) return null;

  const month = rowPayload.name || 'Month';
  const color = series.color;
  const seriesId = series.id;

  const fastestCampaign = seriesId === 'fastest';
  const slowestCampaign = seriesId === 'slowest';

  let title = '';
  let metricLabel = 'Avg Time';
  let value = 0;
  let details = null;
  let icon = '';
  let clientName = '';
  let image = '';

  if (slowestCampaign) {
    details = rowPayload.slowestCampaign;
    value = rowPayload.slowestAvg;
    title = details?.name || 'Slowest Campaign';
    clientName = details?.clientName;
    image = details?.image;
    icon = 'mdi:turtle';
  } else if (fastestCampaign) {
    details = rowPayload.fastestCampaign;
    value = rowPayload.fastestAvg;
    title = details?.name || 'Fastest Campaign';
    clientName = details?.clientName;
    image = details?.image;
    icon = 'mdi:rabbit';
  } else {
    value = rowPayload.average;
    title = 'Platform Average';
  }

  return (
    <Box
      sx={{
        bgcolor: '#1C252E',
        color: '#fff',
        p: 1.5,
        borderRadius: 1.5,
        minWidth: 200,
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 10px 20px rgba(0,0,0,0.5)',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      <Stack spacing={0.5}>
        <Typography variant="caption" sx={{ color: 'grey.400' }}>
          {month}
        </Typography>
        <Stack direction="column" spacing={1.5} mb={1}>
          <Stack direction="row" spacing={1}>
            {(slowestCampaign || fastestCampaign) && (
              <Iconify icon={icon} width={18} sx={{ color }} />
            )}
            <Typography
              variant="subtitle2"
              sx={{
                color: color,
                fontWeight: 700,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </Typography>
          </Stack>
          {(slowestCampaign || fastestCampaign) && (
            <>
              <Typography variant="caption" sx={{ color: 'grey.400', display: 'block' }}>
                {clientName || 'Client'}
              </Typography>
              <Avatar
                src={image}
                variant="rounded"
                sx={{ width: 220, height: 140, border: '1px solid rgba(255,255,255,0.2)' }}
              >
                {clientName?.charAt(0)}
              </Avatar>
            </>
          )}
        </Stack>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 0.5 }} />

        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={3}>
          <Typography variant="caption" sx={{ color: 'grey.400' }}>
            {metricLabel}:
          </Typography>
          <Typography variant="caption" fontWeight="700" color="white">
            {value} hrs
          </Typography>
        </Stack>

        {details && (
          <Box sx={{ bgcolor: 'rgba(0,0,0,0.2)', p: 1, borderRadius: 1, mt: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="caption" sx={{ color: 'grey.500' }}>
                Fastest Pitch:
              </Typography>
              <Typography variant="caption" color="grey.300">
                {details.min} hrs
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mt={0.5}>
              <Typography variant="caption" sx={{ color: 'grey.500' }}>
                Slowest Pitch:
              </Typography>
              <Typography variant="caption" color="grey.300">
                {details.max} hrs
              </Typography>
            </Stack>
          </Box>
        )}
      </Stack>
    </Box>
  );
}
