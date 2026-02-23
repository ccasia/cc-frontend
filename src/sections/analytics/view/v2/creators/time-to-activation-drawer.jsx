import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';

import {
  Box,
  Stack,
  Avatar,
  Drawer,
  InputBase,
  IconButton,
  Typography,
  InputAdornment,
  CircularProgress,
} from '@mui/material';

import useGetTimeToActivationCreators from 'src/hooks/use-get-time-to-activation-creators';

import Iconify from 'src/components/iconify';

import { CHART_COLORS } from '../chart-config';
import { parseMonthStr } from '../date-filter-context';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MONTH_NAMES = {
  Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April',
  May: 'May', Jun: 'June', Jul: 'July', Aug: 'August',
  Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December',
};

const formatFullMonth = (short) => {
  if (!short) return '';
  const [abbr, yr] = short.split(' ');
  return `${MONTH_NAMES[abbr] || abbr} 20${yr}`;
};

const formatDailyLabel = (label, isoDate) => {
  if (isoDate) return dayjs(isoDate).format('MMMM D, YYYY');
  return label || '';
};

const formatDate = (d) => dayjs(d).format('MMM D, YYYY');

// Color + label based on how this creator's activation time compares to average
const getSpeedInfo = (days, avg) => {
  if (avg == null || avg === 0) return { color: '#919EAB', label: '' };
  const ratio = days / avg;
  if (ratio <= 0.6) return { color: CHART_COLORS.success, label: 'Fast' };
  if (ratio <= 1.2) return { color: CHART_COLORS.warning, label: 'Avg' };
  return { color: CHART_COLORS.error, label: 'Slow' };
};


// ---------------------------------------------------------------------------
// CreatorRow
// ---------------------------------------------------------------------------

function CreatorRow({ creator, avgDays }) {
  const days = creator.daysToActivation;
  const { color: speedColor, label: speedLabel } = getSpeedInfo(days, avgDays);

  return (
    <Box sx={{ px: 2.5, py: 0.75 }}>
      <Box
        sx={{
          bgcolor: '#FFFFFF',
          border: '1px solid #E8ECEE',
          borderRadius: '12px',
          overflow: 'hidden',
          transition: 'border-color 0.15s',
          '&:hover': { borderColor: '#C4CDD5' },
        }}
      >
        <Stack direction="row" alignItems="stretch">
          {/* Left: creator info */}
          <Stack sx={{ flex: 1, py: 1.75, pl: 2, pr: 1.5, minWidth: 0 }}>
            {/* Avatar + name */}
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <Avatar
                src={creator.photoUrl}
                sx={{
                  width: 34,
                  height: 34,
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  bgcolor: '#F4F6F8',
                  color: '#637381',
                }}
              >
                {creator.name?.[0]}
              </Avatar>
              <Typography
                sx={{
                  flex: 1,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#1A1A2E',
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0,
                }}
              >
                {creator.name}
              </Typography>
            </Stack>

            {/* Dates */}
            <Stack direction="row" spacing={2.5} sx={{ mt: 1.25, pl: 0.5 }}>
              <Stack spacing={0.25}>
                <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, color: '#919EAB', textTransform: 'uppercase', letterSpacing: '0.03em', lineHeight: 1 }}>
                  Registered On
                </Typography>
                <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#637381', lineHeight: 1.3 }}>
                  {formatDate(creator.createdAt)}
                </Typography>
              </Stack>

              <Stack spacing={0.25}>
                <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, color: CHART_COLORS.success, textTransform: 'uppercase', letterSpacing: '0.03em', lineHeight: 1 }}>
                  Activated
                </Typography>
                <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#333', lineHeight: 1.3 }}>
                  {formatDate(creator.formCompletedAt)}
                </Typography>
              </Stack>
            </Stack>
          </Stack>

          {/* Right: days badge */}
          <Stack
            alignItems="center"
            justifyContent="center"
            spacing={0.75}
            sx={{
              width: 84,
              flexShrink: 0,
              borderLeft: '1px solid #F4F6F8',
              py: 1.5,
            }}
          >
            {/* Number + unit stacked tightly */}
            <Stack alignItems="center">
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#1A1A2E', lineHeight: 1, letterSpacing: '-0.03em' }}>
                {days}
              </Typography>
              <Typography sx={{ fontSize: '0.625rem', fontWeight: 500, color: '#919EAB', lineHeight: 1, mt: 0.25 }}>
                days
              </Typography>
            </Stack>

            {/* Speed chip — separate visual element */}
            {speedLabel && (
              <Box
                sx={{
                  px: 1,
                  py: 0.375,
                  borderRadius: '6px',
                  bgcolor: `${speedColor}14`,
                  border: `1px solid ${speedColor}25`,
                }}
              >
                <Typography sx={{ fontSize: '0.5625rem', fontWeight: 700, color: speedColor, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>
                  {speedLabel}
                </Typography>
              </Box>
            )}
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}

CreatorRow.propTypes = {
  creator: PropTypes.object.isRequired,
  avgDays: PropTypes.number,
};

// ---------------------------------------------------------------------------
// Main Drawer
// ---------------------------------------------------------------------------

export default function TimeToActivationDrawer({
  selectedPoint,
  points,
  data,
  isDaily,
  onClose,
  onNavigate,
}) {
  const { startDate, endDate, displayTitle } = useMemo(() => {
    if (!selectedPoint) return { startDate: null, endDate: null, displayTitle: '' };

    if (isDaily) {
      const idx = points.indexOf(selectedPoint);
      const item = idx >= 0 && data[idx] ? data[idx] : null;
      const iso = item?.isoDate;
      if (iso) {
        const d = new Date(iso);
        const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
        const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
        return { startDate: start, endDate: end, displayTitle: formatDailyLabel(selectedPoint, iso) };
      }
      return { startDate: null, endDate: null, displayTitle: selectedPoint };
    }

    const d = parseMonthStr(selectedPoint);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    return { startDate: start, endDate: end, displayTitle: formatFullMonth(selectedPoint) };
  }, [selectedPoint, isDaily, points, data]);

  const { creators, avgDays, count, isLoading } = useGetTimeToActivationCreators(
    startDate && endDate ? { startDate, endDate } : {}
  );

  // Find fastest / slowest
  const fastest = useMemo(
    () => (creators.length > 0 ? creators.reduce((a, b) => (a.daysToActivation <= b.daysToActivation ? a : b)) : null),
    [creators]
  );
  const slowest = useMemo(
    () => (creators.length > 0 ? creators.reduce((a, b) => (a.daysToActivation >= b.daysToActivation ? a : b)) : null),
    [creators]
  );

  // Navigation
  const currentIndex = points.indexOf(selectedPoint);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < points.length - 1;
  const handlePrev = () => { if (hasPrev) { setSearch(''); onNavigate(points[currentIndex - 1]); } };
  const handleNext = () => { if (hasNext) { setSearch(''); onNavigate(points[currentIndex + 1]); } };

  const [search, setSearch] = useState('');

  const filteredCreators = useMemo(() => {
    if (!search.trim()) return creators;
    const q = search.trim().toLowerCase();
    return creators.filter((c) => c.name?.toLowerCase().includes(q));
  }, [creators, search]);

  const hasData = !isLoading && creators.length > 0;

  return (
    <Drawer
      open={!!selectedPoint}
      onClose={onClose}
      anchor="right"
      slotProps={{ backdrop: { invisible: true } }}
      PaperProps={{
        sx: {
          width: { xs: 1, sm: 480 },
          borderTopLeftRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#F4F4F4',
          boxShadow: '-12px 0 40px -4px rgba(145, 158, 171, 0.24)',
          borderLeft: '1px solid #919EAB3D',
        },
      }}
    >
      {/* ── Sticky Header ── */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 2,
          bgcolor: '#FFFFFF',
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ pt: 2.5, px: 2.5 }}>
          <Stack>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{displayTitle}</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#919EAB', mt: 0.5, lineHeight: 1.5 }}>
              Avg days from <Typography component="span" sx={{ fontWeight: 700, color: '#637381', fontSize: 'inherit' }}>account creation</Typography> to <Typography component="span" sx={{ fontWeight: 700, color: '#637381', fontSize: 'inherit' }}>payment form completion</Typography>
            </Typography>
          </Stack>
          <IconButton onClick={onClose} sx={{ mt: -1 }}>
            <Iconify icon="eva:close-fill" sx={{ height: 22, width: 22 }} />
          </IconButton>
        </Stack>

        {/* Hero stats row — only when we have data */}
        {hasData && (
          <Stack
            direction="row"
            spacing={0}
            sx={{
              mt: 1.5,
              mx: 2.5,
              mb: 2,
              borderRadius: '10px',
              border: '1px solid #E8ECEE',
              overflow: 'hidden',
            }}
          >
            {/* Creators */}
            <Stack alignItems="center" sx={{ flex: 1, py: 1.5 }}>
              <Typography sx={{ fontSize: '1.375rem', fontWeight: 700, color: '#1A1A2E', lineHeight: 1, letterSpacing: '-0.02em' }}>
                {count}
              </Typography>
              <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, color: '#919EAB', textTransform: 'uppercase', letterSpacing: '0.05em', mt: 0.5 }}>
                Creators
              </Typography>
            </Stack>

            <Box sx={{ width: '1px', bgcolor: '#E8ECEE', my: 1 }} />

            {/* Average */}
            <Stack alignItems="center" sx={{ flex: 1, py: 1.5 }}>
              <Typography sx={{ fontSize: '1.375rem', fontWeight: 700, color: '#1A1A2E', lineHeight: 1, letterSpacing: '-0.02em' }}>
                {avgDays != null ? avgDays : '—'}
                <Typography component="span" sx={{ fontSize: '0.6875rem', fontWeight: 500, color: '#919EAB', ml: 0.25 }}>days</Typography>
              </Typography>
              <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, color: '#919EAB', textTransform: 'uppercase', letterSpacing: '0.05em', mt: 0.5 }}>
                Average
              </Typography>
            </Stack>

            <Box sx={{ width: '1px', bgcolor: '#E8ECEE', my: 1 }} />

            {/* Fastest */}
            <Stack alignItems="center" sx={{ flex: 1, py: 1.5 }}>
              <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: CHART_COLORS.success, lineHeight: 1, letterSpacing: '-0.02em' }}>
                {fastest ? fastest.daysToActivation : '—'}
                <Typography component="span" sx={{ fontSize: '0.6875rem', fontWeight: 500, color: '#919EAB', ml: 0.25 }}>days</Typography>
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.375} sx={{ mt: 0.5 }}>
                <Iconify icon="mdi:rabbit" width={11} sx={{ color: CHART_COLORS.success }} />
                <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, color: '#919EAB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Fastest
                </Typography>
              </Stack>
            </Stack>

            <Box sx={{ width: '1px', bgcolor: '#E8ECEE', my: 1 }} />

            {/* Slowest */}
            <Stack alignItems="center" sx={{ flex: 1, py: 1.5 }}>
              <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: CHART_COLORS.error, lineHeight: 1, letterSpacing: '-0.02em' }}>
                {slowest ? slowest.daysToActivation : '—'}
                <Typography component="span" sx={{ fontSize: '0.6875rem', fontWeight: 500, color: '#919EAB', ml: 0.25 }}>days</Typography>
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.375} sx={{ mt: 0.5 }}>
                <Iconify icon="mdi:turtle" width={11} sx={{ color: CHART_COLORS.error }} />
                <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, color: '#919EAB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Slowest
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        )}

        {!hasData && <Box sx={{ pb: 2 }} />}

        {/* Search */}
        {hasData && (
          <Box sx={{ px: 2.5, pb: 2 }}>
            <InputBase
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search creator..."
              startAdornment={
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" width={18} sx={{ color: '#C4CDD5' }} />
                </InputAdornment>
              }
              sx={{
                width: 1,
                height: 38,
                px: 1.5,
                fontSize: '0.8125rem',
                bgcolor: '#F9FAFB',
                borderRadius: '10px',
                border: '1px solid #E8ECEE',
                transition: 'border-color 0.15s',
                '&.Mui-focused': { borderColor: '#C4CDD5' },
              }}
            />
          </Box>
        )}
      </Box>

      {/* ── Scrollable Content ── */}
      <Box sx={{ flex: 1, overflow: 'auto', bgcolor: '#F4F4F4' }}>
        {isLoading && (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 10 }}>
            <CircularProgress size={28} thickness={4} sx={{ color: CHART_COLORS.warning }} />
          </Stack>
        )}

        {!isLoading && creators.length === 0 && (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 10, px: 3 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                bgcolor: '#F4F6F8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1.5,
              }}
            >
              <Iconify icon="solar:user-cross-rounded-linear" width={24} sx={{ color: '#C4CDD5' }} />
            </Box>
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#637381' }}>
              No creators activated
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: '#919EAB', mt: 0.25 }}>
              No form completions recorded in this period
            </Typography>
          </Stack>
        )}

        {hasData && (
          <Box sx={{ pt: 0.75, pb: 1 }}>
            {filteredCreators.length === 0 && (
              <Stack alignItems="center" sx={{ py: 5 }}>
                <Typography sx={{ fontSize: '0.8125rem', color: '#919EAB' }}>
                  No creators matching &ldquo;{search}&rdquo;
                </Typography>
              </Stack>
            )}
            {filteredCreators.map((creator) => (
              <CreatorRow
                key={creator.userId}
                creator={creator}
                avgDays={avgDays}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* ── Sticky Footer — prev/next navigation ── */}
      <Box
        sx={{
          flexShrink: 0,
          px: 2.5,
          py: 1.25,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: '#FFFFFF',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <IconButton
            onClick={handlePrev}
            disabled={!hasPrev}
            size="small"
            sx={{
              border: '1px solid',
              borderColor: hasPrev ? '#E7E7E7' : 'action.disabledBackground',
              borderRadius: 1,
            }}
          >
            <Iconify icon="eva:arrow-back-fill" width={16} />
          </IconButton>
          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#637381' }}>{displayTitle}</Typography>
          <IconButton
            onClick={handleNext}
            disabled={!hasNext}
            size="small"
            sx={{
              border: '1px solid',
              borderColor: hasNext ? '#E7E7E7' : 'action.disabledBackground',
              borderRadius: 1,
            }}
          >
            <Iconify icon="eva:arrow-forward-fill" width={16} />
          </IconButton>
        </Stack>
      </Box>
    </Drawer>
  );
}

TimeToActivationDrawer.propTypes = {
  selectedPoint: PropTypes.string,
  points: PropTypes.array.isRequired,
  data: PropTypes.array.isRequired,
  isDaily: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired,
};
