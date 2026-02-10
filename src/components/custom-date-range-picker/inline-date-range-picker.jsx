import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { useRef, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';

import { useResponsive } from 'src/hooks/use-responsive';

import RangeDay from './range-day';
import { shortDateLabel } from './utils';

// ----------------------------------------------------------------------

const BRAND_BLUE = '#1340FF';

const PRESETS = [
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'last30', label: 'Last 30 Days' },
];

function getPresetRange(key) {
  const today = dayjs();
  switch (key) {
    case 'week':
      return { start: today.startOf('week'), end: today.endOf('week') };
    case 'month':
      return { start: today.startOf('month'), end: today.endOf('month') };
    case 'last30':
      return { start: today.subtract(30, 'day'), end: today };
    default:
      return null;
  }
}

// ----------------------------------------------------------------------

function InlineDateRangePicker({ anchorEl, open, onClose, startDate, endDate, onApply, onClear }) {
  const mdUp = useResponsive('up', 'md');

  // Local state for interaction — only commits on Apply
  const [localStart, setLocalStart] = useState(startDate ? dayjs(startDate) : null);
  const [localEnd, setLocalEnd] = useState(endDate ? dayjs(endDate) : null);
  const [selectingEnd, setSelectingEnd] = useState(false);
  const [hoverDay, setHoverDay] = useState(null);
  const [activePreset, setActivePreset] = useState(null);
  const [leftMonth, setLeftMonth] = useState(dayjs());
  const [calendarKey, setCalendarKey] = useState(0);
  const viewRef = useRef('day');

  // Reset local state when popover opens
  const handleEnter = useCallback(() => {
    setLocalStart(startDate ? dayjs(startDate) : null);
    setLocalEnd(endDate ? dayjs(endDate) : null);
    setSelectingEnd(!!(startDate && !endDate));
    setHoverDay(null);
    setActivePreset(null);
    setLeftMonth(startDate ? dayjs(startDate) : dayjs());
    setCalendarKey((k) => k + 1);
  }, [startDate, endDate]);

  const handleDayClick = useCallback(
    (newDay) => {
      const d = dayjs(newDay);
      setActivePreset(null);

      if (!localStart || (localStart && localEnd) || d.isBefore(localStart, 'day')) {
        // Start new selection
        setLocalStart(d);
        setLocalEnd(null);
        setSelectingEnd(true);
        setHoverDay(null);
      } else {
        // Complete the range
        setLocalEnd(d);
        setSelectingEnd(false);
        setHoverDay(null);
      }
    },
    [localStart, localEnd]
  );

  const handleDayHover = useCallback(
    (newDay) => {
      if (selectingEnd && localStart) {
        const d = dayjs(newDay);
        if (d.isAfter(localStart, 'day')) {
          setHoverDay(d);
        }
      }
    },
    [selectingEnd, localStart]
  );

  const handlePreset = useCallback((key) => {
    const range = getPresetRange(key);
    if (range) {
      setLocalStart(range.start);
      setLocalEnd(range.end);
      setSelectingEnd(false);
      setHoverDay(null);
      setActivePreset(key);
      setLeftMonth(range.start);
      setCalendarKey((k) => k + 1);
    }
  }, []);

  const handleApply = useCallback(() => {
    if (localStart && localEnd) {
      const presetLabel = activePreset
        ? PRESETS.find((p) => p.key === activePreset)?.label || null
        : null;
      onApply(localStart.toDate(), localEnd.toDate(), presetLabel);
    }
    onClose();
  }, [localStart, localEnd, activePreset, onApply, onClose]);

  const handleClear = useCallback(() => {
    setLocalStart(null);
    setLocalEnd(null);
    setSelectingEnd(false);
    setHoverDay(null);
    setActivePreset(null);
    onClear();
    onClose();
  }, [onClear, onClose]);

  // Summary label
  const summaryLabel =
    localStart && localEnd ? shortDateLabel(localStart.toDate(), localEnd.toDate()) : null;

  const calendarSlots = { day: RangeDay };

  const calendarSlotProps = {
    day: {
      rangeStart: localStart?.toDate() || null,
      rangeEnd: localEnd?.toDate() || null,
      hoverDay: hoverDay?.toDate() || null,
      selectingEnd,
      onDayHover: handleDayHover,
    },
  };

  const calendarSx = {
    width: 296,
    height: 320,
    '& .MuiDayCalendar-header, & .MuiDayCalendar-weekContainer': {
      justifyContent: 'space-around',
    },
    '& .MuiDayCalendar-weekContainer': {
      overflow: 'hidden',
    },
    '& .MuiDayCalendar-weekDayLabel': {
      fontSize: '0.75rem',
      color: 'text.disabled',
      fontWeight: 600,
      width: 36,
      height: 36,
    },
    '& .MuiPickersCalendarHeader-root': {
      pl: 2.5,
      pr: 1.5,
      mt: 1,
      mb: 0.5,
    },
    '& .MuiPickersCalendarHeader-label': {
      fontSize: '0.875rem',
      fontWeight: 700,
    },
  };

  const presetChips = (
    <Stack direction="row" spacing={0.75} sx={{ px: 2, pt: 2, pb: 0.5 }}>
      {PRESETS.map((preset) => (
        <Chip
          key={preset.key}
          label={preset.label}
          size="small"
          variant={activePreset === preset.key ? 'filled' : 'outlined'}
          onClick={() => handlePreset(preset.key)}
          sx={{
            fontWeight: 600,
            fontSize: '0.75rem',
            height: 28,
            borderRadius: 0.75,
            ...(activePreset === preset.key
              ? {
                  bgcolor: BRAND_BLUE,
                  color: '#fff',
                  borderColor: BRAND_BLUE,
                  '&:hover': { bgcolor: BRAND_BLUE },
                }
              : {
                  borderColor: 'divider',
                  color: 'text.secondary',
                  '&:hover': { borderColor: BRAND_BLUE, color: BRAND_BLUE },
                }),
          }}
        />
      ))}
    </Stack>
  );

  const footer = (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{
        px: 2,
        py: 1.5,
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
        {summaryLabel || 'Select a date range'}
      </Typography>
      <Stack direction="row" spacing={1}>
        <Button
          size="small"
          color="inherit"
          onClick={handleClear}
          sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}
        >
          Clear
        </Button>
        <Button
          size="small"
          variant="contained"
          disabled={!localStart || !localEnd}
          onClick={handleApply}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.8rem',
            bgcolor: BRAND_BLUE,
            '&:hover': { bgcolor: '#0f33d6' },
          }}
        >
          Apply
        </Button>
      </Stack>
    </Stack>
  );

  // Desktop: Popover with single calendar
  if (mdUp) {
    return (
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        TransitionProps={{ onEnter: handleEnter }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              borderRadius: 1.5,
              boxShadow: (theme) => theme.shadows[20],
              overflow: 'hidden',
            },
          },
        }}
      >
        {presetChips}

        <Box sx={{ display: 'flex', justifyContent: 'center', px: 0.5 }}>
          <DateCalendar
            key={calendarKey}
            value={null}
            views={['year', 'month', 'day']}
            referenceDate={leftMonth.toDate()}
            onViewChange={(view) => { viewRef.current = view; }}
            onChange={(val) => {
              if (viewRef.current === 'day') handleDayClick(val);
            }}
            showDaysOutsideCurrentMonth
            fixedWeekNumber={6}
            slots={calendarSlots}
            slotProps={calendarSlotProps}
            sx={calendarSx}
          />
        </Box>

        {footer}
      </Popover>
    );
  }

  // Mobile: Bottom dialog with single calendar
  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionProps={{ onEnter: handleEnter }}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          position: 'fixed',
          bottom: 0,
          m: 0,
          borderRadius: '16px 16px 0 0',
          maxHeight: '85vh',
        },
      }}
    >
      {presetChips}

      <Box sx={{ display: 'flex', justifyContent: 'center', px: 1 }}>
        <DateCalendar
          key={calendarKey}
          value={null}
          views={['year', 'month', 'day']}
          referenceDate={leftMonth.toDate()}
          onViewChange={(view) => { viewRef.current = view; }}
          onChange={(val) => {
            if (viewRef.current === 'day') handleDayClick(val);
          }}
          showDaysOutsideCurrentMonth
          fixedWeekNumber={6}
          slots={calendarSlots}
          slotProps={calendarSlotProps}
          sx={{ ...calendarSx, width: '100%', maxWidth: 320 }}
        />
      </Box>

      {footer}
    </Dialog>
  );
}

InlineDateRangePicker.propTypes = {
  anchorEl: PropTypes.object,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  startDate: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.object]),
  endDate: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.object]),
  onApply: PropTypes.func,
  onClear: PropTypes.func,
};

export default InlineDateRangePicker;
