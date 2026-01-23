import { useFormContext } from 'react-hook-form';
import React, { useRef, useMemo, useState, useEffect } from 'react';
import {
  format,
  isToday,
  subDays,
  addDays,
  isBefore,
  endOfDay,
  isSameDay,
  endOfWeek,
  addMonths,
  subMonths,
  addMinutes,
  endOfMonth,
  startOfDay,
  startOfWeek,
  startOfMonth,
  isWithinInterval,
  eachDayOfInterval,
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
  Checkbox,
  MenuItem,
  Typography,
  IconButton,
  createTheme,
  ThemeProvider,
  FormControlLabel,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

const ReservationSlotsV2 = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { watch, setValue } = useFormContext();
  const bottomRef = useRef(null);

  const campaignStartDate = watch('campaignStartDate');
  const campaignEndDate = watch('campaignEndDate');
  const savedRules = watch('availabilityRules') || [];

  const [currentMonth, setCurrentMonth] = useState(
    campaignStartDate ? new Date(campaignStartDate) : new Date()
  );

  // Multi-Range State
  const [selectedDates, setSelectedDates] = useState([]);
  const [selectionStart, setSelectionStart] = useState(null);

  const [startTime, setStartTime] = useState(new Date().setHours(9, 0, 0, 0));
  const [endTime, setEndTime] = useState(new Date().setHours(17, 0, 0, 0));
  const [allDay, setAllDay] = useState(false);
  const [intervalsChecked, setIntervalsChecked] = useState(true);
  const [interval, setInterval] = useState(1);
  const [showIntervalDropdown, setShowIntervalDropdown] = useState(false);
  const [generatedSlots, setGeneratedSlots] = useState([]);

  const intervalOptions = [0.5, 1, 1.5, 2, 3, 4];

  const selectedSet = useMemo(
    () => new Set(selectedDates.map((d) => format(d, 'yyyy-MM-dd'))),
    [selectedDates]
  );

  useEffect(() => {
    generateGrid();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTime, endTime, interval, intervalsChecked]);

  const campaignInterval = useMemo(() => {
    if (!campaignStartDate || !campaignEndDate) return null;
    return {
      start: startOfDay(new Date(campaignStartDate)),
      end: endOfDay(new Date(campaignEndDate)),
    };
  }, [campaignStartDate, campaignEndDate]);

  const calendarDays = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentMonth)),
        end: endOfWeek(endOfMonth(currentMonth)),
      }),
    [currentMonth]
  );

  const handleDateClick = (date) => {
    if (!date) return;

    if (campaignInterval && !isWithinInterval(date, campaignInterval)) {
      enqueueSnackbar('Date is outside campaign active range', { variant: 'warning' });
      return;
    }

    const dateStr = format(date, 'yyyy-MM-dd');
    const prevDateStr = format(subDays(date, 1), 'yyyy-MM-dd');
    const nextDateStr = format(addDays(date, 1), 'yyyy-MM-dd');

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
        while (selectedSet.has(format(addDays(cursor, 1), 'yyyy-MM-dd'))) {
          cursor = addDays(cursor, 1);
        }
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
        while (selectedSet.has(format(subDays(cursor, 1), 'yyyy-MM-dd'))) {
          cursor = subDays(cursor, 1);
        }
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

    if (isBridging) {
      setSelectedDates((prev) => [...prev, date].sort((a, b) => a - b));
      setSelectionStart(null);
    } else {
      setSelectedDates((prev) => [...prev, date].sort((a, b) => a - b));
      setSelectionStart(date);
    }
  };

  const handleSelectAllDates = (e) => {
    if (e.target.checked && campaignInterval) {
      const allDays = eachDayOfInterval({
        start: campaignInterval.start,
        end: campaignInterval.end,
      });
      setSelectedDates(allDays);
    } else {
      setSelectedDates([]);
    }
    setSelectionStart(null);
  };

  const handleClear = () => {
    setSelectedDates([]);
    setSelectionStart(null);
  };

  const getDayStyles = (day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const isSelected = selectedSet.has(dateStr);
    const isPendingStart = selectionStart && isSameDay(day, selectionStart);
    const isTodayDate = isToday(day);

    const isWithinCampaign = campaignInterval ? isWithinInterval(day, campaignInterval) : true;
    const isCurrentMonth = day.getMonth() === currentMonth.getMonth();

    const prevDateStr = format(subDays(day, 1), 'yyyy-MM-dd');
    const nextDateStr = format(addDays(day, 1), 'yyyy-MM-dd');

    const isPrevSelected = selectedSet.has(prevDateStr);
    const isNextSelected = selectedSet.has(nextDateStr);

    const isVisualStart = !isPrevSelected;
    const isVisualEnd = !isNextSelected;
    const isSingleDay = isVisualStart && isVisualEnd;

    const baseStyles = {
      height: 40,
      mx: 'auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: '0.2s',
      borderRadius: '50%',
      position: 'relative',
      zIndex: 1,
      color: isCurrentMonth ? '#212B36' : '#919EAB',
    };

    if (!isSelected && !isPendingStart && isTodayDate) {
      return {
        ...baseStyles,
        border: '1.2px solid #1340FF',
        borderRadius: '50%',
        color: '#1340FF',
        // fontWeight: '700',
        '&:hover': {
          bgcolor: '#F4F6F8',
        },
      };
    }

    if (!isWithinCampaign) {
      return {
        ...baseStyles,
        color: '#919EAB',
        opacity: 0.5,
        cursor: 'default',
      };
    }

    if (isPendingStart && !selectedSet.has(prevDateStr) && !selectedSet.has(nextDateStr)) {
      return {
        ...baseStyles,
        bgcolor: 'rgba(19, 64, 255, 0.15)',
        color: '#1340FF',
        borderRadius: '50%',
        fontWeight: 700,
      };
    }

    if (!isSelected) {
      return {
        ...baseStyles,
        '&:hover': {
          bgcolor: '#F4F6F8',
        },
      };
    }

    const selectedStyles = {
      ...baseStyles,
      bgcolor: isSingleDay ? '#1340FF' : 'rgba(19, 64, 255, 0.15)',
      color: isSingleDay ? 'white' : '#1340FF',
      fontWeight: isSingleDay ? 'normal' : 'bold',
      borderRadius: 0,
    };

    if (isSingleDay) {
      return {
        ...selectedStyles,
        borderRadius: '50%',
      };
    }

    if (isVisualStart) {
      return {
        ...selectedStyles,
        bgcolor: '#1340FF',
        color: 'white',
        borderRadius: '50%',
        '&::after': {
          content: '""',
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '50%',
          bgcolor: 'rgba(19, 64, 255, 0.15)',
          zIndex: -1,
        },
      };
    }

    if (isVisualEnd) {
      return {
        ...selectedStyles,
        bgcolor: '#1340FF',
        color: 'white',
        borderRadius: '50%',
        '&::after': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '50%',
          bgcolor: 'rgba(19, 64, 255, 0.15)',
          zIndex: -1,
        },
      };
    }

    // Middle segments
    return selectedStyles;
  };

  const generateGrid = () => {
    if (!startTime || !endTime) return;
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isBefore(end, start)) {
      setGeneratedSlots([]);
      return;
    }

    const slots = [];
    if (!intervalsChecked) {
      slots.push({
        id: 'full',
        start,
        end,
        label: `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`,
        isSelected: true,
      });
    } else {
      let curr = new Date(start);
      while (isBefore(curr, end)) {
        const next = addMinutes(curr, interval * 60);
        if (isBefore(end, next)) break;
        slots.push({
          id: curr.getTime(),
          start: new Date(curr),
          end: new Date(next),
          label: `${format(curr, 'h:mm a')} - ${format(next, 'h:mm a')}`,
          isSelected: false,
        });
        curr = next;
      }
    }
    setGeneratedSlots(slots);
  };

  const toggleSlot = (index) => {
    const newSlots = [...generatedSlots];
    newSlots[index].isSelected = !newSlots[index].isSelected;
    setGeneratedSlots(newSlots);
  };

  const handleSave = () => {
    if (selectedDates.length === 0) {
      enqueueSnackbar('Please select dates first', { variant: 'error' });
      return;
    }

    let newRule;

    if (allDay) {
      newRule = {
        dates: selectedDates.map((d) => format(d, 'yyyy-MM-dd')),
        slots: [{ startTime: '00:00', endTime: '23:59', label: 'All Day' }],
        allDay: true,
      };
    } else {
      const activeSlots = generatedSlots.filter((s) => s.isSelected);

      if (activeSlots.length === 0) {
        enqueueSnackbar('Please select at least one time slot', { variant: 'error' });
        return;
      }

      newRule = {
        dates: selectedDates.map((d) => format(d, 'yyyy-MM-dd')),
        slots: activeSlots.map((slot) => ({
          startTime: format(slot.start, 'HH:mm'),
          endTime: format(slot.end, 'HH:mm'),
          label: slot.label,
        })),
        allDay: false,
      };
    }

    const isDuplicate = savedRules.some((rule) => {
      if (rule.allDay !== newRule.allDay) return false;
      const datesMatch = JSON.stringify(rule.dates) === JSON.stringify(newRule.dates);
      const slotsMatch = JSON.stringify(rule.slots) === JSON.stringify(newRule.slots);
      return datesMatch && slotsMatch;
    });

    if (isDuplicate) {
      enqueueSnackbar('This timeslot has already been saved', { variant: 'error' });
      return;
    }

    setValue('availabilityRules', [...savedRules, newRule], {
      shouldValidate: true,
      shouldDirty: true,
    });

    enqueueSnackbar('Added successfully', { variant: 'success' });

    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);

    // Reset Selection
    setSelectedDates([]);
    setSelectionStart(null);
  };

  const handleRemoveRule = (index) => {
    const updatedRules = savedRules.filter((_, i) => i !== index);
    setValue('availabilityRules', updatedRules, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const formatDatesForDisplay = (dateStrings) => {
    if (!dateStrings || dateStrings.length === 0) return '';

    // 1. Sort dates chronologically
    const sorted = [...dateStrings]
      .map((d) => new Date(d))
      .sort((a, b) => a.getTime() - b.getTime());

    const groups = [];
    let currentGroup = [sorted[0]];

    // 2. Group consecutive dates
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = sorted[i - 1];
      const curr = sorted[i];

      // Check if the difference is exactly 1 day (approx 86400000ms)
      const diffTime = Math.abs(curr - prev);
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentGroup.push(curr);
      } else {
        groups.push(currentGroup);
        currentGroup = [curr];
      }
    }
    groups.push(currentGroup);

    // 3. Format the groups
    const parts = groups.map((group) => {
      const start = group[0];
      const end = group[group.length - 1];

      if (group.length === 1) {
        return format(start, 'd MMM');
      }
      return `${format(start, 'd MMM')} - ${format(end, 'd MMM')}`;
    });

    // 4. Add the Year to the end
    const lastDate = sorted[sorted.length - 1];
    return `${parts.join(', ')} ${format(lastDate, 'yyyy')}`;
  };

  let renderRightColumn;

  if (allDay) {
    renderRightColumn = (
      <Stack spacing={1} alignItems="center" textAlign="center">
        <Typography sx={{ fontSize: '48px' }}>👌</Typography>
        <Typography variant="h6" fontWeight={700}>
          All-Day Events
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select dates and you’re good to go!
        </Typography>
      </Stack>
    );
  } else if (generatedSlots.length > 0) {
    renderRightColumn = (
      <Box sx={{ width: '100%', maxHeight: 280, overflowY: 'auto' }}>
        <Grid container spacing={1.5}>
          {generatedSlots.map((slot, idx) => (
            <Grid item xs={6} key={idx}>
              <Box
                onClick={() => toggleSlot(idx)}
                sx={{
                  p: 1.5,
                  textAlign: 'center',
                  border: '1.5px solid',
                  borderRadius: 1.5,
                  cursor: 'pointer',
                  borderColor: slot.isSelected ? '#1340FF' : '#F4F6F8',
                  bgcolor: slot.isSelected ? 'rgba(19, 64, 255, 0.04)' : '#fff',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: slot.isSelected ? '#1340FF' : '#919EAB',
                  }}
                >
                  {slot.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  } else {
    renderRightColumn = (
      <Stack spacing={1} alignItems="center" textAlign="center">
        <Typography sx={{ fontSize: '48px' }}>😘</Typography>
        <Typography variant="h6" fontWeight={700}>
          Add Time Slots
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select a start/end time and interval.
        </Typography>
      </Stack>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 2, mb: 10 }}>
      <Stack alignItems="center" spacing={1} sx={{ mb: 4 }}>
        <Typography variant="body2" textAlign="center" sx={{ color: '#636366', maxWidth: 500 }}>
          Add options for creators to select their available time slots. Times are standardized to
          Malaysian time (UTC+08:00).
        </Typography>
      </Stack>

      <Box
        sx={{
          border: '1px solid #E0E0E0',
          borderRadius: 2,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          overflow: 'hidden',
          bgcolor: '#fff',
        }}
      >
        <Box
          sx={{ p: 3, width: { xs: '100%', md: '45%' }, borderRight: { md: '1px solid #E0E0E0' } }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: '18px', mb: 1 }}>Select Dates:</Typography>

          <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 2 }}>
            Between {campaignStartDate ? format(new Date(campaignStartDate), 'd MMMM yyyy') : '...'}{' '}
            to {campaignEndDate ? format(new Date(campaignEndDate), 'd MMMM yyyy') : '...'}
          </Typography>

          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Switch
              size="small"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              sx={{ '& .Mui-checked': { color: '#1340FF' } }}
            />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              All Day
            </Typography>
          </Stack>

          <Box sx={{ borderRadius: '8px', bgcolor: '#1340FF', p: 1, mb: 3 }}>
            <Typography sx={{ fontSize: '12px', color: 'white', lineHeight: 1.5 }}>
              Click once to select the start date, then click again on the end date to include all
              days in between. <br />
              <strong>Double-click for a single day</strong>, and click a selected date to deselect
              it.
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />
          <Box sx={{ maxWidth: 300, mx: 'auto' }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 3 }}
            >
              <IconButton onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} size="small">
                <Iconify icon="eva:arrow-ios-back-fill" />
              </IconButton>
              <Typography sx={{ fontWeight: 700 }}>{format(currentMonth, 'MMM yyyy')}</Typography>
              <IconButton onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} size="small">
                <Iconify icon="eva:arrow-ios-forward-fill" />
              </IconButton>
            </Stack>

            <Grid container columns={7}>
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
                <Grid item xs={1} key={d} sx={{ textAlign: 'center', mb: 1 }}>
                  <Typography variant="caption" sx={{ color: '#919EAB', fontWeight: 600 }}>
                    {d}
                  </Typography>
                </Grid>
              ))}
              {calendarDays.map((day, i) => (
                <Grid item xs={1} key={i}>
                  <Box onClick={() => handleDateClick(day)} sx={getDayStyles(day)}>
                    <Typography variant="body2" sx={{ fontWeight: 'inherit', color: 'inherit' }}>
                      {format(day, 'd')}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
          {/* RESET AND SELECT ALL BOX */}
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
            <Button
              onClick={handleClear}
              size="small"
              sx={{
                fontSize: '14px',
                textTransform: 'none',
                fontWeight: 500,
                minWidth: 'auto',
                p: 0,
                '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
              }}
            >
              <Iconify icon="eva:trash-2-outline" color="#FF5630" width={20} sx={{ mr: 1 }} /> Clear
              Dates
            </Button>

            <FormControlLabel
              control={
                <Checkbox
                  checked={
                    campaignInterval &&
                    selectedDates.length > 0 &&
                    selectedDates.length === eachDayOfInterval(campaignInterval).length
                  }
                  onChange={handleSelectAllDates}
                  size="small"
                />
              }
              label={
                <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>Select All Dates</Typography>
              }
              // sx={{ mr: 0 }}
            />
          </Box>
        </Box>

        <Box
          sx={{
            p: 3,
            width: { xs: '100%', md: '55%' },
            display: 'flex',
            flexDirection: 'column',
            minHeight: 500,
          }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: '18px', mb: 3 }}>
            Select Time Slots:
          </Typography>

          <ThemeProvider
            theme={createTheme({
              palette: {
                primary: { main: '#1340FF' },
              },
              components: {
                MuiIconButton: {
                  styleOverrides: {
                    root: {
                      color: '#1340FF',
                    },
                  },
                },
                MuiMultiSectionDigitalClockSection: {
                  styleOverrides: {
                    root: {
                      '&::-webkit-scrollbar': {
                        display: 'none',
                      },
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                    },
                    item: {
                      '&.Mui-selected': {
                        backgroundColor: '#1340FF !important',
                        color: '#fff !important',
                        fontWeight: 'bold',
                        borderRadius: 3.5,
                      },
                    },
                  },
                },
              },
            })}
          >
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <DesktopTimePicker
                  disabled={allDay}
                  onChange={(value) => setStartTime(value?.getTime())}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      sx: {
                        '& .MuiOutlinedInput-root': { borderRadius: 1.5 },
                        ...(allDay && { bgcolor: '#F4F6F8' }),
                      },
                    },
                    openPickerButton: {
                      sx: { color: allDay ? 'text.disabled' : '#1340FF' },
                    },
                  }}
                />
                <Typography variant="body2" sx={{ color: allDay ? 'text.disabled' : '#636366' }}>
                  to
                </Typography>
                <DesktopTimePicker
                  disabled={allDay}
                  onChange={(value) => setEndTime(value?.getTime())}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      sx: {
                        '& .MuiOutlinedInput-root': { borderRadius: 1.5 },
                        ...(allDay && { bgcolor: '#F4F6F8' }),
                      },
                    },
                    openPickerButton: {
                      sx: { color: allDay ? 'text.disabled' : '#1340FF' },
                    },
                  }}
                />
              </Stack>
            </LocalizationProvider>
          </ThemeProvider>

          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              mb: 3,
              position: 'relative',
              opacity: allDay ? 0.6 : 1,
            }}
          >
            <Checkbox
              disabled={allDay}
              checked={intervalsChecked}
              onChange={(e) => setIntervalsChecked(e.target.checked)}
              size="small"
              sx={{ p: 0, '&.Mui-disabled': { color: 'text.disabled' } }}
            />
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                ml: 1,
                color: allDay ? 'text.disabled' : 'inherit',
              }}
            >
              Intervals
            </Typography>

            {intervalsChecked && (
              <Button
                disabled={allDay}
                variant="outlined"
                size="small"
                onClick={() => !allDay && setShowIntervalDropdown(!showIntervalDropdown)}
                endIcon={
                  <Iconify icon="eva:chevron-down-fill" color={allDay ? '#919EAB' : '#1340FF'} />
                }
                sx={{
                  ml: 2,
                  borderColor: '#E0E0E0',
                  color: allDay ? 'text.disabled' : '#212B36',
                  textTransform: 'none',
                  px: 2,
                  borderRadius: 1.5,
                  '&.Mui-disabled': { borderColor: '#F4F6F8' },
                }}
              >
                {interval} hr
              </Button>
            )}

            {showIntervalDropdown && !allDay && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '100%',
                  left: 100,
                  zIndex: 10,
                  bgcolor: '#fff',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  borderRadius: 1,
                  minWidth: 100,
                  mt: 1,
                }}
              >
                {intervalOptions.map((opt) => (
                  <MenuItem
                    key={opt}
                    onClick={() => {
                      const isChecked = e.target.checked;
                      setIntervalsChecked(isChecked);
                      if (!isChecked) {
                        setInterval(opt);
                        setShowIntervalDropdown(false);
                      }
                    }}
                    sx={{ fontSize: '14px', px: 2 }}
                  >
                    {opt} hr
                  </MenuItem>
                ))}
              </Box>
            )}
          </Stack>

          <Divider sx={{ mb: 3 }} />

          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            {renderRightColumn}
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
            {(allDay || generatedSlots.length > 0) && (
              <Button
                onClick={handleSave}
                sx={{
                  mt: 2,
                  alignSelf: 'flex-end',
                  width: 'fit-content',
                  px: 4,
                  height: 48,
                  bgcolor: '#3A3A3C',
                  color: '#fff',
                  borderRadius: '12px',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0px -3px 0px 0px #00000073 inset',
                  '&:hover': { bgcolor: '#000' },
                  '&.Mui-disabled': {
                    bgcolor: '#F4F6F8',
                    color: '#919EAB',
                    boxShadow: 'none',
                  },
                }}
              >
                {allDay ? 'Save All Day' : 'Save Time Slots'}
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      <Box
        ref={bottomRef}
        sx={{ mt: 3, border: '1px solid #E0E0E0', borderRadius: 2, p: 2, bgcolor: '#fff' }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Iconify icon="eva:calendar-outline" width={18} color="#1340FF" />
          <Typography variant="overline" sx={{ fontWeight: 800, color: '#212B36', mt: 0.5 }}>
            RESERVATION SLOTS
          </Typography>
        </Stack>
        <Divider />
        {savedRules.length === 0 ? (
          <Typography variant="body2" sx={{ color: '#919EAB', py: 3, textAlign: 'center' }}>
            Saved time slots will show up here.
          </Typography>
        ) : (
          <Stack spacing={1} sx={{ mt: 2 }}>
            {savedRules.map((rule, index) => (
              <Stack
                key={index}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ p: 1.5, bgcolor: '#F9FAFB', borderRadius: 1.5 }}
              >
                <Stack direction="row" spacing={2}>
                  <Iconify icon="feather:edit" color="#1340FF" sx={{ mt: 0.5 }} />
                  <Box>
                    <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>
                      {formatDatesForDisplay(rule.dates)}
                    </Typography>
                    <Typography sx={{ fontSize: '14px', color: '#636366', mt: 0.5 }}>
                      {rule.slots.map((slot, i) => (
                        <span key={i}>
                          {slot.label}
                          {i < rule.slots.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </Typography>
                  </Box>
                </Stack>
                <IconButton onClick={() => handleRemoveRule(index)} size="small">
                  <Iconify icon="eva:trash-2-outline" color="#FF5630" width={20} />
                </IconButton>
              </Stack>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default ReservationSlotsV2;
