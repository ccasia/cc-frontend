import PropTypes from 'prop-types';
import { useFormContext } from 'react-hook-form';
import { useRef, useMemo, useState, useEffect } from 'react';
import { m, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  format,
  isToday,
  subDays,
  addDays,
  isBefore,
  endOfDay,
  parseISO,
  isSameDay,
  endOfWeek,
  addMonths,
  subMonths,
  addMinutes,
  endOfMonth,
  startOfDay,
  isSameMonth,
  startOfWeek,
  startOfMonth,
  isWithinInterval,
  eachDayOfInterval,
  differenceInCalendarDays,
} from 'date-fns';

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DesktopTimePicker } from '@mui/x-date-pickers/DesktopTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  Box,
  Grid,
  Stack,
  Button,
  Switch,
  Divider,
  Collapse,
  Checkbox,
  MenuItem,
  FormLabel,
  TextField,
  Typography,
  ButtonBase,
  IconButton,
  createTheme,
  ThemeProvider,
  FormHelperText,
  FormControlLabel,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import { PRIMARY_ACTION_SX } from 'src/components/campaign/action-button-styles';

import { EASE_OUT } from '../components/motion';
import { FIELD_HEIGHT, helperTextSx } from '../components/field-styles';
import useScrollToFirstError from '../components/use-scroll-to-first-error';

const BLUE = '#1340FF';
const BLUE_SOFT = 'rgba(19, 64, 255, 0.15)';
const GREY = '#636366';
const MUTED = '#919EAB';
const BORDER = '#E0E0E0';

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const INTERVAL_OPTIONS = [0.5, 1, 1.5, 2, 3, 4];
const intervalLabel = (hours) => (hours < 1 ? `${hours * 60} min` : `${hours} hr`);
const ROW_EASE = [0.23, 1, 0.32, 1];

const dayKey = (date) => format(date, 'yyyy-MM-dd');
const isValidTime = (time) => time != null && !Number.isNaN(new Date(time).getTime());
const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

const ruleKey = (rule) =>
  [rule.allDay, rule.dates.join(','), rule.slots.map((s) => `${s.startTime}-${s.endTime}`)].join(
    '|'
  );

const sameRule = (a, b) =>
  a.allDay === b.allDay &&
  JSON.stringify(a.dates) === JSON.stringify(b.dates) &&
  JSON.stringify(a.slots) === JSON.stringify(b.slots);

// "10 - 12 Nov, 15 Nov 2026"
const formatDates = (dateStrings) => {
  if (!dateStrings?.length) return '';
  const sorted = dateStrings.map((d) => parseISO(d)).sort((a, b) => a - b);

  const groups = [[sorted[0]]];
  sorted.slice(1).forEach((day) => {
    const group = groups[groups.length - 1];
    if (differenceInCalendarDays(day, group[group.length - 1]) === 1) group.push(day);
    else groups.push([day]);
  });

  const parts = groups.map((group) =>
    group.length === 1
      ? format(group[0], 'd MMM')
      : `${format(group[0], 'd MMM')} - ${format(group[group.length - 1], 'd MMM')}`
  );
  return `${parts.join(', ')} ${format(sorted[sorted.length - 1], 'yyyy')}`;
};

const checkboxSx = { '&.Mui-checked': { color: BLUE } };

const labelSx = { fontWeight: 700, fontSize: '0.875rem', color: 'black' };

const hoverSx = (styles) => ({
  '@media (hover: hover) and (pointer: fine)': { '&:hover': styles },
});

const pickerTheme = (outer) =>
  createTheme(outer, {
    palette: { primary: { main: BLUE } },
    components: {
      MuiMultiSectionDigitalClockSection: {
        styleOverrides: {
          root: { scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } },
          item: {
            '&.Mui-selected': {
              backgroundColor: `${BLUE} !important`,
              color: '#fff !important',
              fontWeight: 700,
              borderRadius: 14,
            },
          },
        },
      },
    },
  });

const getDayStyles = ({ day, selectedSet, selectionStart, campaignInterval, currentMonth }) => {
  const isSelected = selectedSet.has(dayKey(day));
  const isPendingStart = selectionStart && isSameDay(day, selectionStart);
  const isWithinCampaign = campaignInterval ? isWithinInterval(day, campaignInterval) : true;
  const isPrevSelected = selectedSet.has(dayKey(subDays(day, 1)));
  const isNextSelected = selectedSet.has(dayKey(addDays(day, 1)));
  const isSingleDay = !isPrevSelected && !isNextSelected;

  const base = {
    width: '100%',
    height: 40,
    fontSize: 14,
    fontFamily: 'inherit',
    borderRadius: '50%',
    position: 'relative',
    zIndex: 1,
    color: isSameMonth(day, currentMonth) ? '#212B36' : MUTED,
    transition: 'background-color 120ms ease, color 120ms ease',
    '&.Mui-focusVisible': { outline: `2px solid ${BLUE}`, outlineOffset: -2 },
  };

  if (!isWithinCampaign) {
    return {
      ...base,
      opacity: 0.5,
      cursor: 'default',
      ...(isToday(day) && { border: `1.2px solid ${BLUE}`, color: BLUE }),
    };
  }

  if (!isSelected) {
    return {
      ...base,
      ...(isToday(day) && { border: `1.2px solid ${BLUE}`, color: BLUE }),
      ...hoverSx({ bgcolor: '#F4F6F8' }),
    };
  }

  if (isPendingStart && isSingleDay) {
    return { ...base, bgcolor: BLUE_SOFT, color: BLUE, fontWeight: 700 };
  }

  if (isSingleDay) return { ...base, bgcolor: BLUE, color: 'white' };

  // A range: solid ends, a soft band through the middle
  if (!isPrevSelected || !isNextSelected) {
    return {
      ...base,
      bgcolor: BLUE,
      color: 'white',
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: '50%',
        [isPrevSelected ? 'left' : 'right']: 0,
        bgcolor: BLUE_SOFT,
        zIndex: -1,
      },
    };
  }

  return { ...base, borderRadius: 0, bgcolor: BLUE_SOFT, color: BLUE, fontWeight: 700 };
};

const EmptyState = ({ icon, title, children }) => (
  <Stack spacing={1} alignItems="center" textAlign="center" sx={{ py: 4, px: 2 }}>
    <Box
      sx={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        bgcolor: '#F4F6F8',
        display: 'grid',
        placeItems: 'center',
        mb: 0.5,
      }}
    >
      <Iconify icon={icon} width={24} color={GREY} />
    </Box>
    <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{title}</Typography>
    <Typography sx={{ fontSize: 13, color: GREY, maxWidth: 260 }}>{children}</Typography>
  </Stack>
);

EmptyState.propTypes = {
  icon: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
};

const ReservationSlotsV2 = () => {
  const { enqueueSnackbar } = useSnackbar();
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();
  const reduceMotion = useReducedMotion();
  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const gridRef = useRef(null);

  useScrollToFirstError(containerRef);

  const campaignStartDate = watch('campaignStartDate');
  const campaignEndDate = watch('campaignEndDate');
  const watchedRules = watch('availabilityRules');
  const savedRules = useMemo(() => watchedRules || [], [watchedRules]);
  const restoredDraft = watch('reservationDraft');
  const hasRestoredSlots = useRef(Boolean(restoredDraft?.generatedSlots?.length));
  const initialMonth = restoredDraft?.currentMonth || campaignStartDate;

  // The draft only stores the picker once the user works with it, so opening the
  // step alone does not count as a change
  const touched = useRef(false);
  const touch = () => {
    touched.current = true;
  };

  const [currentMonth, setCurrentMonth] = useState(() =>
    initialMonth ? new Date(initialMonth) : new Date()
  );
  const [focusDate, setFocusDate] = useState(null);
  const pendingFocus = useRef(false);

  const [selectedDates, setSelectedDates] = useState(
    () => restoredDraft?.selectedDates?.map((date) => new Date(date)) || []
  );
  const [selectionStart, setSelectionStart] = useState(() =>
    restoredDraft?.selectionStart ? new Date(restoredDraft.selectionStart) : null
  );

  const [startTime, setStartTime] = useState(
    restoredDraft?.startTime || new Date().setHours(9, 0, 0, 0)
  );
  const [endTime, setEndTime] = useState(
    restoredDraft?.endTime || new Date().setHours(17, 0, 0, 0)
  );
  const [allDay, setAllDay] = useState(Boolean(restoredDraft?.allDay));
  const [intervalsChecked, setIntervalsChecked] = useState(restoredDraft?.intervalsChecked ?? true);
  const [interval, setInterval] = useState(restoredDraft?.interval || 1);
  const [generatedSlots, setGeneratedSlots] = useState(
    () =>
      restoredDraft?.generatedSlots?.map((slot) => ({
        ...slot,
        start: new Date(slot.start),
        end: new Date(slot.end),
      })) || []
  );

  const selectedSet = useMemo(() => new Set(selectedDates.map(dayKey)), [selectedDates]);

  const timesValid = isValidTime(startTime) && isValidTime(endTime);
  const timeOrderError = timesValid && !isBefore(new Date(startTime), new Date(endTime));

  useEffect(() => {
    if (hasRestoredSlots.current) {
      hasRestoredSlots.current = false;
      return;
    }

    if (!timesValid || timeOrderError) {
      setGeneratedSlots([]);
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const slotLabel = (from, to) => `${format(from, 'h:mm a')} - ${format(to, 'h:mm a')}`;

    // A new time range keeps the picks that still exist in it
    setGeneratedSlots((prev) => {
      const picked = new Set(prev.filter((s) => s.isSelected).map((s) => s.label));
      if (!intervalsChecked) {
        return [{ id: 'full', start, end, label: slotLabel(start, end), isSelected: true }];
      }

      const slots = [];
      let curr = start;
      while (!isBefore(end, addMinutes(curr, interval * 60))) {
        const next = addMinutes(curr, interval * 60);
        const label = slotLabel(curr, next);
        slots.push({
          id: curr.getTime(),
          start: curr,
          end: next,
          label,
          isSelected: picked.has(label),
        });
        curr = next;
      }
      return slots;
    });
  }, [startTime, endTime, interval, intervalsChecked, timesValid, timeOrderError]);

  useEffect(() => {
    if (!touched.current) return;
    setValue(
      'reservationDraft',
      {
        currentMonth: currentMonth.toISOString(),
        selectedDates: selectedDates.map((date) => date.toISOString()),
        selectionStart: selectionStart?.toISOString() || null,
        startTime,
        endTime,
        allDay,
        intervalsChecked,
        interval,
        generatedSlots: generatedSlots.map((slot) => ({
          ...slot,
          start: new Date(slot.start).toISOString(),
          end: new Date(slot.end).toISOString(),
        })),
      },
      { shouldDirty: true }
    );
  }, [
    allDay,
    currentMonth,
    endTime,
    generatedSlots,
    interval,
    intervalsChecked,
    selectedDates,
    selectionStart,
    setValue,
    startTime,
  ]);

  const campaignInterval = useMemo(() => {
    if (!campaignStartDate || !campaignEndDate) return null;
    return {
      start: startOfDay(new Date(campaignStartDate)),
      end: endOfDay(new Date(campaignEndDate)),
    };
  }, [campaignStartDate, campaignEndDate]);

  const campaignDayCount = campaignInterval ? eachDayOfInterval(campaignInterval).length : 0;

  const calendarDays = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentMonth)),
        end: endOfWeek(endOfMonth(currentMonth)),
      }),
    [currentMonth]
  );

  const canGoBack =
    !campaignInterval || isBefore(startOfMonth(campaignInterval.start), startOfMonth(currentMonth));
  const canGoForward =
    !campaignInterval || isBefore(endOfMonth(currentMonth), campaignInterval.end);

  // Only one day is in the tab order; arrow keys move between days
  const tabbableKey = useMemo(() => {
    const inMonth = (day) => isSameMonth(day, currentMonth);
    const inRange = (day) => !campaignInterval || isWithinInterval(day, campaignInterval);
    const pick =
      (focusDate && calendarDays.find((day) => isSameDay(day, focusDate))) ||
      selectedDates.find(inMonth) ||
      calendarDays.find((day) => inMonth(day) && inRange(day)) ||
      calendarDays.find(inMonth);
    return pick ? dayKey(pick) : null;
  }, [focusDate, calendarDays, currentMonth, campaignInterval, selectedDates]);

  useEffect(() => {
    if (!pendingFocus.current || !focusDate) return;
    pendingFocus.current = false;
    gridRef.current?.querySelector(`[data-date="${dayKey(focusDate)}"]`)?.focus();
  }, [focusDate, currentMonth]);

  const handleDayKeyDown = (event, day) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = addDays(day, step);
    if (!isSameMonth(next, currentMonth)) setCurrentMonth(startOfMonth(next));
    pendingFocus.current = true;
    setFocusDate(next);
  };

  const handleDateClick = (date) => {
    if (campaignInterval && !isWithinInterval(date, campaignInterval)) {
      enqueueSnackbar('Pick a date inside the campaign dates', { variant: 'warning' });
      return;
    }
    touch();
    setFocusDate(date);

    const dateStr = dayKey(date);
    const prevDateStr = dayKey(subDays(date, 1));
    const nextDateStr = dayKey(addDays(date, 1));

    if (selectionStart) {
      const start = isBefore(date, selectionStart) ? date : selectionStart;
      const end = isBefore(date, selectionStart) ? selectionStart : date;
      const newRange = eachDayOfInterval({ start, end });

      setSelectedDates((prev) => {
        const combined = [...prev];
        newRange.forEach((day) => {
          if (!prev.some((p) => isSameDay(p, day))) combined.push(day);
        });
        return combined.sort((a, b) => a - b);
      });
      setSelectionStart(null);
      return;
    }

    if (selectedSet.has(dateStr)) {
      const isStartOfRange = !selectedSet.has(prevDateStr) && selectedSet.has(nextDateStr);
      const isEndOfRange = selectedSet.has(prevDateStr) && !selectedSet.has(nextDateStr);

      if (isStartOfRange) {
        let cursor = date;
        while (selectedSet.has(dayKey(addDays(cursor, 1)))) cursor = addDays(cursor, 1);
        const segmentEnd = cursor;
        setSelectedDates((prev) =>
          prev.filter(
            (d) =>
              !isWithinInterval(startOfDay(d), {
                start: startOfDay(date),
                end: startOfDay(subDays(segmentEnd, 1)),
              })
          )
        );
        setSelectionStart(segmentEnd);
        return;
      }

      if (isEndOfRange) {
        let cursor = date;
        while (selectedSet.has(dayKey(subDays(cursor, 1)))) cursor = subDays(cursor, 1);
        const segmentStart = cursor;
        setSelectedDates((prev) =>
          prev.filter(
            (d) =>
              !isWithinInterval(startOfDay(d), {
                start: startOfDay(addDays(segmentStart, 1)),
                end: startOfDay(date),
              })
          )
        );
        setSelectionStart(segmentStart);
        return;
      }

      setSelectedDates((prev) => prev.filter((d) => !isSameDay(d, date)));
      setSelectionStart(null);
      return;
    }

    const isBridging = selectedSet.has(prevDateStr) || selectedSet.has(nextDateStr);
    setSelectedDates((prev) => [...prev, date].sort((a, b) => a - b));
    setSelectionStart(isBridging ? null : date);
  };

  const allDatesSelected = campaignDayCount > 0 && selectedDates.length === campaignDayCount;

  const handleSelectAllDates = (event) => {
    touch();
    setSelectedDates(
      event.target.checked && campaignInterval ? eachDayOfInterval(campaignInterval) : []
    );
    setSelectionStart(null);
  };

  const handleClear = () => {
    touch();
    setSelectedDates([]);
    setSelectionStart(null);
  };

  const toggleSlot = (index) => {
    touch();
    setGeneratedSlots((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, isSelected: !slot.isSelected } : slot))
    );
  };

  const pickedSlots = generatedSlots.filter((slot) => slot.isSelected);
  const allSlotsPicked = generatedSlots.length > 0 && pickedSlots.length === generatedSlots.length;

  const toggleAllSlots = () => {
    touch();
    setGeneratedSlots((prev) => prev.map((slot) => ({ ...slot, isSelected: !allSlotsPicked })));
  };

  const draftRule = {
    dates: selectedDates.map(dayKey),
    slots: allDay
      ? [{ startTime: '00:00', endTime: '23:59', label: 'All Day' }]
      : pickedSlots.map((slot) => ({
          startTime: format(slot.start, 'HH:mm'),
          endTime: format(slot.end, 'HH:mm'),
          label: slot.label,
        })),
    allDay,
  };

  let saveBlocker = null;
  if (!selectedDates.length) saveBlocker = 'Pick at least one date.';
  else if (!allDay && !draftRule.slots.length) {
    saveBlocker = generatedSlots.length
      ? 'Pick at least one time slot.'
      : 'Set a valid time range.';
  } else if (savedRules.some((rule) => sameRule(rule, draftRule))) {
    saveBlocker = 'These slots are already saved.';
  }

  const handleSave = () => {
    if (saveBlocker) return;
    setValue('availabilityRules', [...savedRules, draftRule], {
      shouldValidate: true,
      shouldDirty: true,
    });
    touch();
    setSelectedDates([]);
    setSelectionStart(null);
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'end',
      });
    }, 100);
  };

  const handleRemoveRule = (index) => {
    setValue(
      'availabilityRules',
      savedRules.filter((_, i) => i !== index),
      { shouldValidate: true, shouldDirty: true }
    );
  };

  // Stable keys, so a removed row leaves without the rows below it changing places
  const ruleKeys = useMemo(() => {
    const seen = new Map();
    return savedRules.map((rule) => {
      const key = ruleKey(rule);
      const count = seen.get(key) ?? 0;
      seen.set(key, count + 1);
      return count ? `${key}#${count}` : key;
    });
  }, [savedRules]);

  const rulesError = errors.availabilityRules?.root?.message ?? errors.availabilityRules?.message;

  const timePickerProps = (value, onChange, label) => ({
    value: isValidTime(value) ? new Date(value) : null,
    onChange: (next) => {
      touch();
      onChange(next ? next.getTime() : null);
    },
    slotProps: {
      textField: {
        fullWidth: true,
        error: timeOrderError,
        inputProps: { 'aria-label': label },
        sx: { '& .MuiOutlinedInput-root': { height: FIELD_HEIGHT, borderRadius: 1.5 } },
      },
      openPickerButton: { sx: { color: BLUE } },
    },
  });

  let slotsContent;
  if (generatedSlots.length) {
    slotsContent = (
      <Box sx={{ maxHeight: 280, overflowY: 'auto', p: '2px', m: '-2px' }}>
        <Grid container spacing={1.5}>
          {generatedSlots.map((slot, idx) => (
            <Grid item xs={6} key={slot.id}>
              <ButtonBase
                onClick={() => toggleSlot(idx)}
                aria-pressed={slot.isSelected}
                sx={{
                  width: '100%',
                  height: 44,
                  gap: 0.75,
                  border: '1.5px solid',
                  borderRadius: 1.5,
                  fontFamily: 'inherit',
                  fontSize: 13,
                  fontWeight: 600,
                  borderColor: slot.isSelected ? BLUE : '#F4F6F8',
                  bgcolor: slot.isSelected ? 'rgba(19, 64, 255, 0.04)' : '#fff',
                  color: slot.isSelected ? BLUE : MUTED,
                  transition:
                    'border-color 150ms ease, background-color 150ms ease, color 150ms ease',
                  ...hoverSx({ borderColor: slot.isSelected ? BLUE : BORDER }),
                  '&.Mui-focusVisible': { outline: `2px solid ${BLUE}`, outlineOffset: 2 },
                }}
              >
                {slot.isSelected && <Iconify icon="eva:checkmark-fill" width={16} />}
                {slot.label}
              </ButtonBase>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  } else {
    slotsContent = (
      <EmptyState icon="eva:clock-outline" title="No time slots yet">
        {timeOrderError
          ? 'Fix the times above to see the slots.'
          : 'Pick a start time, an end time and a slot length.'}
      </EmptyState>
    );
  }

  return (
    <Box ref={containerRef} sx={{ maxWidth: 900, mx: 'auto', p: 2, mb: 10, ...helperTextSx }}>
      <Typography
        variant="body2"
        textAlign="center"
        sx={{ color: GREY, maxWidth: 500, mx: 'auto', mb: 4 }}
      >
        Add the dates and times creators can book. All times are in Malaysian time (UTC+08:00).
      </Typography>

      <Box
        sx={{
          border: `1px solid ${BORDER}`,
          borderRadius: 2,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          overflow: 'hidden',
          bgcolor: '#fff',
        }}
      >
        <Box
          sx={{
            p: 3,
            width: { xs: '100%', md: '45%' },
            borderRight: { md: `1px solid ${BORDER}` },
            borderBottom: { xs: `1px solid ${BORDER}`, md: 'none' },
          }}
        >
          <FormLabel sx={labelSx}>Dates</FormLabel>
          <Typography sx={{ fontSize: 13, color: GREY, mt: 0.5 }}>
            {campaignInterval
              ? `${format(campaignInterval.start, 'd MMM yyyy')} - ${format(campaignInterval.end, 'd MMM yyyy')}`
              : 'Set the campaign dates first.'}
          </Typography>

          <Stack direction="row" spacing={0.75} sx={{ mt: 1.5, color: GREY }}>
            <Iconify icon="eva:info-outline" width={16} sx={{ flexShrink: 0, mt: '1px' }} />
            <Typography sx={{ fontSize: 12, lineHeight: '18px' }}>
              Click a start date, then an end date to pick the days between. Click a picked date to
              remove it.
            </Typography>
          </Stack>

          <Divider sx={{ my: 2.5 }} />

          <Box sx={{ maxWidth: 300, mx: 'auto' }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <IconButton
                aria-label="Previous month"
                disabled={!canGoBack}
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                size="small"
              >
                <Iconify icon="eva:arrow-ios-back-fill" />
              </IconButton>
              <Typography aria-live="polite" sx={{ fontWeight: 700 }}>
                {format(currentMonth, 'MMMM yyyy')}
              </Typography>
              <IconButton
                aria-label="Next month"
                disabled={!canGoForward}
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                size="small"
              >
                <Iconify icon="eva:arrow-ios-forward-fill" />
              </IconButton>
            </Stack>

            <Grid container columns={7} ref={gridRef}>
              {WEEKDAYS.map((d) => (
                <Grid item xs={1} key={d} sx={{ textAlign: 'center', mb: 1 }}>
                  <Typography variant="caption" sx={{ color: MUTED, fontWeight: 600 }}>
                    {d}
                  </Typography>
                </Grid>
              ))}
              {calendarDays.map((day) => {
                const key = dayKey(day);
                const inRange = !campaignInterval || isWithinInterval(day, campaignInterval);
                return (
                  <Grid item xs={1} key={key}>
                    <ButtonBase
                      data-date={key}
                      tabIndex={key === tabbableKey ? 0 : -1}
                      aria-pressed={selectedSet.has(key)}
                      aria-disabled={!inRange}
                      aria-label={format(day, 'EEEE d MMMM yyyy')}
                      onClick={() => handleDateClick(day)}
                      onKeyDown={(event) => handleDayKeyDown(event, day)}
                      sx={getDayStyles({
                        day,
                        selectedSet,
                        selectionStart,
                        campaignInterval,
                        currentMonth,
                      })}
                    >
                      {format(day, 'd')}
                    </ButtonBase>
                  </Grid>
                );
              })}
            </Grid>
          </Box>

          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: GREY }}>
                {selectedDates.length
                  ? `${plural(selectedDates.length, 'day')} picked`
                  : 'No days picked'}
              </Typography>
              {selectedDates.length > 0 && (
                <Button
                  onClick={handleClear}
                  size="small"
                  sx={{
                    minWidth: 0,
                    px: 0.75,
                    textTransform: 'none',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#FF5630',
                    ...hoverSx({ bgcolor: 'rgba(255, 86, 48, 0.08)' }),
                  }}
                >
                  Clear
                </Button>
              )}
            </Stack>

            <FormControlLabel
              disabled={!campaignInterval}
              control={
                <Checkbox
                  checked={allDatesSelected}
                  onChange={handleSelectAllDates}
                  size="small"
                  sx={checkboxSx}
                />
              }
              label={<Typography sx={{ fontSize: 13, fontWeight: 600 }}>All dates</Typography>}
              sx={{ mr: 0 }}
            />
          </Stack>
        </Box>

        <Box
          sx={{
            p: 3,
            width: { xs: '100%', md: '55%' },
            display: 'flex',
            flexDirection: 'column',
            minHeight: { md: 500 },
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box>
              <FormLabel sx={labelSx}>Times</FormLabel>
              <Typography sx={{ fontSize: 13, color: GREY, mt: 0.5 }}>
                {allDay ? 'Creators can come at any time.' : 'Set the hours creators can book.'}
              </Typography>
            </Box>
            <FormControlLabel
              labelPlacement="start"
              label={<Typography sx={{ fontSize: 14, fontWeight: 600 }}>All day</Typography>}
              control={
                <Switch
                  checked={allDay}
                  onChange={(e) => {
                    touch();
                    setAllDay(e.target.checked);
                  }}
                  sx={{
                    '& .Mui-checked': { color: BLUE },
                    '& .Mui-checked + .MuiSwitch-track': { bgcolor: `${BLUE} !important` },
                  }}
                />
              }
              sx={{ mr: 0, flexShrink: 0 }}
            />
          </Stack>

          <Divider sx={{ my: 2.5 }} />

          <Collapse in={allDay} timeout={200} easing={EASE_OUT} unmountOnExit>
            <EmptyState icon="eva:sun-outline" title="All day">
              The picked dates are open all day. Pick dates, then save.
            </EmptyState>
          </Collapse>

          <Collapse in={!allDay} timeout={200} easing={EASE_OUT}>
            <ThemeProvider theme={pickerTheme}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={{ xs: 1, sm: 1.5 }}
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                >
                  <DesktopTimePicker {...timePickerProps(startTime, setStartTime, 'Start time')} />
                  <Typography variant="body2" sx={{ color: GREY, textAlign: 'center' }}>
                    to
                  </Typography>
                  <DesktopTimePicker {...timePickerProps(endTime, setEndTime, 'End time')} />
                </Stack>
              </LocalizationProvider>
            </ThemeProvider>
            {timeOrderError && (
              <FormHelperText error>End time must be after the start time.</FormHelperText>
            )}

            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={intervalsChecked}
                    onChange={(e) => {
                      touch();
                      setIntervalsChecked(e.target.checked);
                    }}
                    size="small"
                    sx={checkboxSx}
                  />
                }
                label={
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                    Split into slots of
                  </Typography>
                }
                sx={{ mr: 0 }}
              />
              <TextField
                select
                size="small"
                value={interval}
                disabled={!intervalsChecked}
                onChange={(e) => {
                  touch();
                  setInterval(e.target.value);
                }}
                inputProps={{ 'aria-label': 'Slot length' }}
                sx={{ width: 110, '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
              >
                {INTERVAL_OPTIONS.map((opt) => (
                  <MenuItem key={opt} value={opt} sx={{ fontSize: 14 }}>
                    {intervalLabel(opt)}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <Divider sx={{ my: 2.5 }} />

            {generatedSlots.length > 0 && (
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1.5 }}
              >
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: GREY }}>
                  {pickedSlots.length} of {plural(generatedSlots.length, 'slot')} picked
                </Typography>
                {generatedSlots.length > 1 && (
                  <Button
                    onClick={toggleAllSlots}
                    size="small"
                    sx={{
                      minWidth: 0,
                      px: 0.75,
                      textTransform: 'none',
                      fontSize: 13,
                      fontWeight: 600,
                      color: BLUE,
                      ...hoverSx({ bgcolor: 'rgba(19, 64, 255, 0.06)' }),
                    }}
                  >
                    {allSlotsPicked ? 'Clear all' : 'Pick all'}
                  </Button>
                )}
              </Stack>
            )}
            {slotsContent}
          </Collapse>

          <Box sx={{ flexGrow: 1 }} />

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="flex-end"
            spacing={2}
            sx={{ pt: 3 }}
          >
            {saveBlocker && (
              <Typography sx={{ fontSize: 13, color: GREY, textAlign: 'right' }}>
                {saveBlocker}
              </Typography>
            )}
            <Button
              onClick={handleSave}
              disabled={Boolean(saveBlocker)}
              sx={{ ...PRIMARY_ACTION_SX, flexShrink: 0, px: 3 }}
            >
              Save slots
            </Button>
          </Stack>
        </Box>
      </Box>

      <Box
        ref={bottomRef}
        sx={{
          mt: 3,
          border: '1px solid',
          borderColor: rulesError ? 'error.main' : BORDER,
          borderRadius: 2,
          p: 2,
          bgcolor: '#fff',
          transition: 'border-color 150ms ease',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          <Iconify icon="eva:calendar-outline" width={18} color={BLUE} />
          <FormLabel sx={labelSx}>Saved reservation slots</FormLabel>
          {savedRules.length > 0 && (
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: GREY }}>
              {savedRules.length}
            </Typography>
          )}
        </Stack>
        <Divider />

        {savedRules.length === 0 && (
          <Typography variant="body2" sx={{ color: MUTED, py: 3, textAlign: 'center' }}>
            Pick dates and times above, then press Save slots.
          </Typography>
        )}

        <Box sx={{ pt: savedRules.length ? 1.5 : 0 }}>
          <AnimatePresence initial={false}>
            {savedRules.map((rule, index) => (
              <m.div
                key={ruleKeys[index]}
                initial={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: ROW_EASE }}
                style={{ overflow: 'hidden' }}
              >
                <Box sx={{ pb: 1 }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={2}
                    sx={{ p: 1.5, bgcolor: '#F9FAFB', borderRadius: 1.5 }}
                  >
                    <Stack direction="row" spacing={1.5} sx={{ minWidth: 0 }}>
                      <Iconify
                        icon={rule.allDay ? 'eva:sun-outline' : 'eva:clock-outline'}
                        color={BLUE}
                        width={18}
                        sx={{ mt: '2px', flexShrink: 0 }}
                      />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                          {formatDates(rule.dates)}
                        </Typography>
                        <Typography sx={{ fontSize: 14, color: GREY, mt: 0.5 }}>
                          {rule.slots.map((slot) => slot.label).join(', ')}
                        </Typography>
                      </Box>
                    </Stack>
                    <IconButton
                      aria-label={`Remove slots for ${formatDates(rule.dates)}`}
                      onClick={() => handleRemoveRule(index)}
                      size="small"
                      sx={{
                        color: MUTED,
                        ...hoverSx({ color: '#FF5630', bgcolor: 'rgba(255, 86, 48, 0.08)' }),
                      }}
                    >
                      <Iconify icon="eva:trash-2-outline" width={20} />
                    </IconButton>
                  </Stack>
                </Box>
              </m.div>
            ))}
          </AnimatePresence>
        </Box>

        {rulesError && <FormHelperText error>{rulesError}</FormHelperText>}
      </Box>
    </Box>
  );
};

export default ReservationSlotsV2;
