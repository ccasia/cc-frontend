import React from 'react';
import PropTypes from 'prop-types';

import { Box, Stack, Avatar, Divider, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

// --- Glassmorphism base style ---
const glassBase = {
  background: 'rgba(22, 28, 36, 0.7)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
  borderRadius: 2,
  color: '#fff',
  p: 2,
  pointerEvents: 'none',
};

const glassDivider = {
  borderColor: 'rgba(255, 255, 255, 0.06)',
  my: 1,
};

const glassLabel = {
  color: 'rgba(255, 255, 255, 0.79)',
  fontSize: '0.7rem',
  letterSpacing: 0.5,
  textTransform: 'uppercase',
};

const glassValue = {
  fontWeight: 700,
  fontSize: '0.8rem',
  color: '#fff',
};

const glassTitle = {
  fontWeight: 700,
  fontSize: '0.85rem',
  lineHeight: 1.3,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const glassDot = (color) => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  bgcolor: color,
  boxShadow: `0 0 6px ${color}80`,
  flexShrink: 0,
});

// ─────────────────────────────────────────────
// 1. ClientTooltip
// ─────────────────────────────────────────────

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
    <Box sx={{ ...glassBase, minWidth: 180 }}>
      <Typography sx={glassTitle}>{friendlyName}</Typography>
      <Divider sx={glassDivider} />
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={glassDot(seriesItem.color)} />
          <Typography sx={glassLabel}>{metric}</Typography>
        </Stack>
        <Typography sx={glassValue}>
          {dataValue}
          {unit}
        </Typography>
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

// ─────────────────────────────────────────────
// 2. MatrixTooltip
// ─────────────────────────────────────────────

export function MatrixTooltip({ itemData, series }) {
  if (!itemData || !series || !series.data) return null;

  const dataPoint = series.data[itemData.dataIndex];
  if (!dataPoint) return null;

  const { x, y, campaignName, clientName, image } = dataPoint;
  const isHighRisk = x > 24 && y > 2;
  const isWarning = x > 24 || y > 2;

  let color = '#1ABF66';
  let status = 'Healthy Cycle';
  let statusIcon = 'mdi:check-circle-outline';

  if (isHighRisk) {
    color = '#FF6B6B';
    status = 'High Friction';
    statusIcon = 'mdi:alert-circle-outline';
  } else if (isWarning) {
    color = '#FFD666';
    status = 'Moderate Friction';
    statusIcon = 'mdi:alert-outline';
  }

  return (
    <Box sx={{ ...glassBase, minWidth: 260 }}>
      {/* Header */}
      <Stack direction="column" spacing={1} mb={1.5}>
        <Typography sx={glassTitle}>{campaignName || 'Campaign'}</Typography>
        <Typography sx={{ ...glassLabel, textTransform: 'none', fontSize: '0.72rem' }}>
          {clientName || 'Client'}
        </Typography>
      </Stack>

      {/* Image */}
      <Avatar
        src={image}
        variant="rounded"
        sx={{
          width: '100%',
          height: 140,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 1.5,
          mb: 1.5,
        }}
      >
        {clientName?.charAt(0)}
      </Avatar>

      {/* Status badge */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.75}
        sx={{
          bgcolor: `${color}18`,
          border: `1px solid ${color}30`,
          borderRadius: 1,
          px: 1,
          py: 0.5,
          mb: 1,
        }}
      >
        <Iconify icon={statusIcon} width={14} sx={{ color }} />
        <Typography variant="caption" sx={{ color, fontWeight: 700, fontSize: '0.7rem' }}>
          {status}
        </Typography>
      </Stack>

      <Divider sx={glassDivider} />

      {/* Metrics */}
      <Stack spacing={0.75}>
        <Stack direction="row" justifyContent="space-between">
          <Typography sx={glassLabel}>Avg Review Time</Typography>
          <Typography sx={glassValue}>{x} hrs</Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-between">
          <Typography sx={glassLabel}>Avg Rounds</Typography>
          <Typography sx={glassValue}>{y}</Typography>
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

// ─────────────────────────────────────────────
// 3. RenewalTooltip
// ─────────────────────────────────────────────

const CHART_COLORS = { success: '#00C49F', error: '#FF8042' };

export function RenewalTooltip({ series, dataIndex }) {
  if (!series || series.length === 0) return null;

  const total = series.reduce((sum, s) => sum + (s.value || 0), 0);
  const upgrades = series.find((s) => s.label === 'Upgrades')?.value || 0;
  const renewals = series.find((s) => s.label === 'Renewals')?.value || 0;
  const downgrades = series.find((s) => s.label === 'Downgrades')?.value || 0;
  const retentionRate =
    total > 0 ? Math.round(((upgrades + renewals + downgrades) / total) * 100) : 0;

  const displaySeries = [...series].reverse();

  return (
    <Box sx={{ ...glassBase, minWidth: 210 }}>
      <Typography sx={{ ...glassTitle, mb: 0.5 }}>Package Renewal</Typography>
      <Divider sx={glassDivider} />

      <Stack spacing={0.75}>
        {displaySeries.map((s, i) => (
          <Stack key={i} direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box sx={glassDot(s.color)} />
              <Typography sx={glassLabel}>{s.label}</Typography>
            </Stack>
            <Typography sx={glassValue}>{s.value ?? 0}</Typography>
          </Stack>
        ))}
      </Stack>

      <Divider sx={glassDivider} />

      {/* Total row */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography sx={{ ...glassLabel, textTransform: 'none' }}>Total</Typography>
        <Typography sx={glassValue}>{total}</Typography>
      </Stack>

      {/* Retention badge */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{
          bgcolor: `${CHART_COLORS.success}12`,
          border: `1px solid ${CHART_COLORS.success}25`,
          borderRadius: 1,
          px: 1.25,
          py: 0.75,
        }}
      >
        <Typography sx={{ ...glassLabel, textTransform: 'none' }}>Retention Rate</Typography>
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: '0.9rem',
            color: CHART_COLORS.success,
          }}
        >
          {retentionRate}%
        </Typography>
      </Stack>
    </Box>
  );
}

RenewalTooltip.propTypes = {
  series: PropTypes.arrayOf(
    PropTypes.shape({
      color: PropTypes.string,
      label: PropTypes.string,
      data: PropTypes.arrayOf(PropTypes.number),
    })
  ),
  dataIndex: PropTypes.number, 
};

// ─────────────────────────────────────────────
// 4. TurnaroundTooltip
// ─────────────────────────────────────────────

export function TurnaroundTooltip(props) {
  const { itemData, series } = props;

  if (!itemData || !series || !series.data) return null;

  const point = series.data[itemData.dataIndex];
  const rowPayload = point?.payload;
  if (!rowPayload) return null;

  const month = rowPayload.name || 'Month';
  const { color } = series;
  const seriesId = series.id;

  const fastestCampaign = seriesId === 'fastest';
  const slowestCampaign = seriesId === 'slowest';

  let title = '';
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
    <Box sx={{ ...glassBase, minWidth: 220, zIndex: 9999 }}>
      {/* Month label */}
      <Typography sx={{ ...glassLabel, textTransform: 'none', mb: 0.5 }}>{month}</Typography>

      {/* Title row */}
      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
        {(slowestCampaign || fastestCampaign) && <Iconify icon={icon} width={18} sx={{ color }} />}
        <Typography sx={{ ...glassTitle, color }}>{title}</Typography>
      </Stack>

      {/* Campaign image */}
      {(slowestCampaign || fastestCampaign) && (
        <>
          <Typography sx={{ ...glassLabel, textTransform: 'none', mb: 1 }}>
            {clientName || 'Client'}
          </Typography>
          <Avatar
            src={image}
            variant="rounded"
            sx={{
              width: '100%',
              height: 140,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 1.5,
              mb: 1.5,
            }}
          >
            {clientName?.charAt(0)}
          </Avatar>
        </>
      )}

      <Divider sx={glassDivider} />

      {/* Main metric */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography sx={glassLabel}>Avg Time</Typography>
        <Typography sx={glassValue}>{value} hrs</Typography>
      </Stack>

      {/* Detail card */}
      {details && (
        <Box
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 1.5,
            p: 1.25,
            mt: 1.5,
          }}
        >
          <Stack spacing={0.5}>
            <Stack direction="row" justifyContent="space-between">
              <Typography sx={{ ...glassLabel, textTransform: 'none' }}>Fastest Pitch</Typography>
              <Typography sx={{ ...glassValue, fontSize: '0.75rem' }}>{details.min} hrs</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography sx={{ ...glassLabel, textTransform: 'none' }}>Slowest Pitch</Typography>
              <Typography sx={{ ...glassValue, fontSize: '0.75rem' }}>{details.max} hrs</Typography>
            </Stack>
          </Stack>
        </Box>
      )}
    </Box>
  );
}

TurnaroundTooltip.propTypes = {
  itemData: PropTypes.shape({
    dataIndex: PropTypes.number,
  }),
  series: PropTypes.shape({
    id: PropTypes.string,
    color: PropTypes.string,
    data: PropTypes.arrayOf(
      PropTypes.shape({
        x: PropTypes.number,
        y: PropTypes.number,
        payload: PropTypes.object,
      })
    ),
  }),
};

// ─────────────────────────────────────────────
// 5. PieTooltip
// ─────────────────────────────────────────────

export function PieTooltip(props) {
  const { series, itemData } = props;

  if (!series || itemData?.dataIndex === undefined) return null;

  const pieItem = series.data[itemData.dataIndex];
  if (!pieItem) return null;

  // Safely resolve in case objects leak through
  const displayLabel =
    typeof pieItem.label === 'object' && pieItem.label !== null
      ? (pieItem.label?.label ?? pieItem.label?.text ?? String(pieItem.label))
      : (pieItem.label ?? '');

  const displayValue =
    typeof pieItem.value === 'object' && pieItem.value !== null
      ? (pieItem.value?.value ?? 0)
      : (pieItem.value ?? 0);

  const displayColor =
    typeof pieItem.color === 'object' && pieItem.color !== null
      ? (pieItem.color?.value ?? '#000')
      : (pieItem.color ?? '#000');

  return (
    <Box sx={{ ...glassBase, minWidth: 170 }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
        <Box sx={glassDot(displayColor)} />
        <Typography sx={glassTitle}>{displayLabel}</Typography>
      </Stack>
      <Divider sx={glassDivider} />
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography sx={glassLabel}>Count</Typography>
        <Typography sx={{ ...glassValue, fontSize: '0.9rem' }}>{displayValue}</Typography>
      </Stack>
    </Box>
  );
}

PieTooltip.propTypes = {
  series: PropTypes.shape({
    data: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
        label: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
        color: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      })
    ),
  }),
  itemData: PropTypes.shape({
    dataIndex: PropTypes.number,
  }),
};
