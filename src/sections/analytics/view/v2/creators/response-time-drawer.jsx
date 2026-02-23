import PropTypes from 'prop-types';

import { Box, Stack, Avatar, Drawer, IconButton, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

import { CHART_COLORS } from '../chart-config';
import { MOCK_RESPONSE_TIME_DETAILS } from '../mock-data';

const MONTH_NAMES = {
  Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April',
  May: 'May', Jun: 'June', Jul: 'July', Aug: 'August',
  Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December',
};

// "Feb 25" → "February 2025"
const formatFullMonth = (short) => {
  if (!short) return '';
  const [abbr, yr] = short.split(' ');
  return `${MONTH_NAMES[abbr] || abbr} 20${yr}`;
};

const METRICS = [
  { key: 'agreement', label: 'Agreement Response', color: CHART_COLORS.primary },
  { key: 'firstCampaign', label: 'Time to 1st Accepted Campaign', color: CHART_COLORS.warning },
  { key: 'submission', label: 'Submission Response', color: CHART_COLORS.success },
];

function MetricCard({ data, label, color }) {
  if (!data) return null;

  const { avg, slowest, fastest } = data;

  const range = slowest.time - fastest.time;
  const avgPercent = range > 0 ? ((avg - fastest.time) / range) * 100 : 50;
  const avgDays = Math.round((avg / 24) * 10) / 10;

  return (
    <Box
      sx={{
        border: '1px solid #E5E8EB',
        borderRadius: '12px',
        overflow: 'hidden',
        bgcolor: 'white',
      }}
    >
      {/* Metric label */}
      <Box sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#333' }}>
          {label}
        </Typography>
      </Box>

      {/* Hero average */}
      <Stack alignItems="center" sx={{ pb: 2 }}>
        <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#1A1A2E', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          {avg} <Typography component="span" sx={{ fontSize: '1rem', fontWeight: 500, color: '#919EAB' }}>hrs</Typography>
        </Typography>
        {avg >= 24 && (
          <Typography variant="caption" sx={{ color: '#919EAB', fontWeight: 500, mt: 0.25 }}>
            ({avgDays} days)
          </Typography>
        )}
        <Typography variant="caption" sx={{ color: '#919EAB', fontWeight: 500, mt: 0.25 }}>
          average
        </Typography>
      </Stack>

      {/* Range bar */}
      <Box sx={{ px: 2.5 }}>
        <Box sx={{ position: 'relative', mb: 0.5 }}>
          <Box
            sx={{
              height: 4,
              borderRadius: 2,
              background: `linear-gradient(to right, ${color}35, ${color}12)`,
            }}
          />
          {/* Average position marker */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: `${avgPercent}%`,
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: color,
              border: '2px solid white',
              boxShadow: `0 0 0 1px ${color}30`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        </Box>

        {/* Range labels with fastest/slowest creators */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Iconify icon="mdi:rabbit" width={14} sx={{ color: '#10B981' }} />
            <Typography sx={{ fontSize: '0.65rem', color: '#919EAB', fontWeight: 500 }}>
              Fastest — {fastest.time}h
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography sx={{ fontSize: '0.65rem', color: '#919EAB', fontWeight: 500 }}>
              Slowest — {slowest.time}h
            </Typography>
            <Iconify icon="mdi:turtle" width={14} sx={{ color: '#EF4444' }} />
          </Stack>
        </Stack>
      </Box>

      {/* Divider between range and creators */}
      <Box sx={{ borderTop: '1px solid #F0F2F4' }} />

      {/* Creator rows */}
      <Stack>
        {/* Fastest */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ px: 2, py: 1.25 }}
        >
          <Avatar src={fastest.avatar} sx={{ width: 28, height: 28 }} />
          <Stack sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                color: '#333',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {fastest.name}
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: '#919EAB' }}>
              {fastest.campaign}
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#10B981', flexShrink: 0 }}>
            {fastest.time} hrs
          </Typography>
        </Stack>

        {/* Row divider */}
        <Box sx={{ mx: 2, borderTop: '1px solid #F0F2F4' }} />

        {/* Slowest */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ px: 2, py: 1.25 }}
        >
          <Avatar src={slowest.avatar} sx={{ width: 28, height: 28 }} />
          <Stack sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                color: '#333',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {slowest.name}
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: '#919EAB' }}>
              {slowest.campaign}
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#EF4444', flexShrink: 0 }}>
            {slowest.time} hrs
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}

MetricCard.propTypes = {
  data: PropTypes.object,
  label: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
};

export default function ResponseTimeDrawer({ selectedMonth, months, onClose, onNavigate }) {
  const details = selectedMonth ? MOCK_RESPONSE_TIME_DETAILS[selectedMonth] : null;

  const currentIndex = months.indexOf(selectedMonth);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < months.length - 1;
  const handlePrev = () => hasPrev && onNavigate(months[currentIndex - 1]);
  const handleNext = () => hasNext && onNavigate(months[currentIndex + 1]);

  return (
    <Drawer
      open={!!selectedMonth}
      onClose={onClose}
      anchor="right"
      slotProps={{ backdrop: { invisible: true } }}
      PaperProps={{
        sx: {
          width: { xs: 1, sm: 480 },
          borderTopLeftRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-12px 0 40px -4px rgba(145, 158, 171, 0.24)',
          borderLeft: '1px solid #919EAB3D',
        },
      }}
    >
      {/* Sticky Header */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ pt: 2, px: 2.5 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{formatFullMonth(selectedMonth)}</Typography>
          <IconButton onClick={onClose}>
            <Iconify icon="eva:close-fill" sx={{ height: 24, width: 24 }} />
          </IconButton>
        </Stack>
        <Box sx={{ px: 2.5, pb: 2 }}>
          <Typography variant="body2" sx={{ color: '#919EAB' }}>Response Time Breakdown</Typography>
        </Box>
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 2 }}>
        <Stack spacing={2.5}>
          {METRICS.map((m) => (
            <MetricCard
              key={m.key}
              data={details?.[m.key]}
              label={m.label}
              color={m.color}
            />
          ))}
        </Stack>
      </Box>

      {/* Sticky Footer — prev/next navigation */}
      <Box
        sx={{
          position: 'sticky',
          bottom: 0,
          px: 3,
          py: 1.5,
          borderTop: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
          bgcolor: 'background.paper',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <IconButton
            onClick={handlePrev}
            disabled={!hasPrev}
            sx={{
              border: '1px solid',
              borderColor: hasPrev ? '#E7E7E7' : 'action.disabledBackground',
              borderRadius: 1,
            }}
          >
            <Iconify icon="eva:arrow-back-fill" width={18} />
          </IconButton>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatFullMonth(selectedMonth)}</Typography>
          <IconButton
            onClick={handleNext}
            disabled={!hasNext}
            sx={{
              border: '1px solid',
              borderColor: hasNext ? '#E7E7E7' : 'action.disabledBackground',
              borderRadius: 1,
            }}
          >
            <Iconify icon="eva:arrow-forward-fill" width={18} />
          </IconButton>
        </Stack>
      </Box>
    </Drawer>
  );
}

ResponseTimeDrawer.propTypes = {
  selectedMonth: PropTypes.string,
  months: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired,
};
