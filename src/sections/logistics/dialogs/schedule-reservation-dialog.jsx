import useSWR from 'swr';
import PropTypes from 'prop-types';
import { useState, useEffect, useMemo } from 'react';
import {
  format,
  addMonths,
  subMonths,
  isSameDay,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from 'date-fns';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Grid,
  Stack,
  Avatar,
  Dialog,
  Button,
  Tooltip,
  Typography,
  IconButton,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material';

import axiosInstance, { fetcher } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

export default function ScheduleReservationDialog({
  open,
  onClose,
  logistic,
  campaignId,
  onUpdate,
}) {
  const { enqueueSnackbar } = useSnackbar();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlotTime, setSelectedSlotTime] = useState(null); // Store ISO string
  const [isSubmitting, setIsSubmitting] = useState(false);

  const monthQuery = format(currentMonth, 'yyyy-MM-dd');
  const { data: daysData, isLoading } = useSWR(
    open ? `/api/logistics/campaign/${campaignId}/slots?month=${monthQuery}` : null,
    fetcher
  );

  const creator = logistic?.creator;
  const socialMediaHandle =
    creator?.creator?.instagramUser?.username || creator?.creator?.tiktokUser?.username;

  const calendarGrid = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const details = logistic?.reservationDetails;
  const proposedSlots = useMemo(
    () => details?.slots?.filter((s) => s.status === 'PROPOSED') || [],
    [details]
  );
  const confirmedSlot = useMemo(
    () => details?.slots?.find((s) => s.status === 'SELECTED'),
    [details]
  );

  useEffect(() => {
    if (open) {
      if (confirmedSlot) {
        const date = parseISO(confirmedSlot.startTime);
        setSelectedDate(date);
        setSelectedSlotTime(confirmedSlot.startTime);
        setCurrentMonth(date);
      } else if (proposedSlots.length > 0) {
        const firstProp = parseISO(proposedSlots[0].startTime);
        setCurrentMonth(firstProp);
        setSelectedDate(firstProp);
      }
    }
  }, [open, confirmedSlot, proposedSlots]);

  // --- Helpers ---

  const getOptionTag = (attendee) => {
    if (attendee.status === 'SELECTED') {
      return { label: 'Confirmed this slot', color: 'success' };
    }

    const count = attendee.optionsCount || 1;

    if (count === 1) {
      return { label: 'Only this option', color: 'error' };
    }

    const moreOptions = count - 1;
    return {
      label: `${moreOptions} more option${moreOptions > 1 ? 's' : ''}`,
      color: 'info',
    };
  };

  const handleConfirm = async () => {
    const slotToConfirm = proposedSlots.find((p) => p.startTime === selectedSlotTime);

    if (!slotToConfirm) {
      enqueueSnackbar('Please select a slot proposed by the creator or configure a new one', {
        variant: 'warning',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await axiosInstance.patch(
        `/api/logistics/campaign/${campaignId}/${logistic.id}/schedule-reservation`,
        { slotId: slotToConfirm.id }
      );
      enqueueSnackbar('Reservation scheduled successfully');
      onUpdate();
      onClose();
    } catch (error) {
      enqueueSnackbar('Failed to schedule', { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDayObj = daysData?.find(
    (d) => selectedDate && d.date === format(selectedDate, 'yyyy-MM-dd')
  );
  const slotsForSelectedDate = selectedDayObj?.slots || [];

  const isSelectedSlotConflict = slotsForSelectedDate
    .find((s) => s.startTime === selectedSlotTime)
    ?.attendees?.some((a) => a.id !== logistic.creatorId && a.status === 'SELECTED');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2, p: 3, bgcolor: '#F9F9F9' } }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'Instrument Serif', fontWeight: 400 }}>
            Schedule Reservation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Scheduling for: {logistic?.creator?.name}
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <Iconify icon="eva:close-fill" />
        </IconButton>
      </Stack>

      <Box
        sx={{
          display: 'flex',
          bgcolor: '#fff',
          borderRadius: 2,
          border: '1px solid #EAEAEA',
          minHeight: 360,
        }}
      >
        {/* LEFT: CALENDAR */}
        <Box sx={{ width: '45%', p: 2, borderRight: '1px solid #EAEAEA' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <IconButton onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <Iconify icon="eva:chevron-left-fill" />
            </IconButton>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {format(currentMonth, 'MMMM yyyy')}
            </Typography>
            <IconButton onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <Iconify icon="eva:chevron-right-fill" />
            </IconButton>
          </Stack>

          <Grid container spacing={1}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <Grid item xs={12 / 7} key={d} textAlign="center">
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.disabled' }}>
                  {d}
                </Typography>
              </Grid>
            ))}
            {isLoading ? (
              <CircularProgress size={20} sx={{ m: 'auto', mt: 5 }} />
            ) : (
              calendarGrid.map((date) => {
                const dateString = format(date, 'yyyy-MM-dd');
                const dayData = daysData?.find((d) => d.date === dateString);

                const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                const isProposed = proposedSlots.some((p) =>
                  isSameDay(parseISO(p.startTime), date)
                );
                const hasConfirmed = dayData?.slots?.some((slot) =>
                  slot.attendees?.some((attendee) => attendee.status === 'SELECTED')
                );

                const canClick = dayData?.available;

                return (
                  <Grid item xs={12 / 7} key={dateString}>
                    <Stack alignItems="center" spacing={0.5}>
                      <Box
                        onClick={() => {
                          if (canClick) {
                            setSelectedDate(date);
                            setSelectedSlotTime(null);
                          }
                        }}
                        sx={{
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          cursor: canClick ? 'pointer' : 'default',
                          fontSize: '13px',
                          fontWeight: isSelected || isProposed ? 700 : 400,
                          color: isSelected ? '#fff' : canClick ? '#231F20' : '#919EAB',
                          bgcolor: isSelected ? '#1340FF' : 'transparent',
                          opacity: isCurrentMonth ? 1 : 0.3,
                          border: isProposed && !isSelected ? '1px solid #1340FF' : 'none',
                          '&:hover': canClick
                            ? { bgcolor: isSelected ? '#1340FF' : '#F4F6F8' }
                            : {},
                        }}
                      >
                        {date.getDate()}
                      </Box>
                      <Box
                        sx={{
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          bgcolor: hasConfirmed ? '#1340FF' : 'transparent',
                        }}
                      />
                    </Stack>
                  </Grid>
                );
              })
            )}
          </Grid>
        </Box>

        {/* RIGHT: SLOTS & ATTENDEES */}
        <Box sx={{ width: '55%', p: 2, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>
            {selectedDate ? format(selectedDate, 'EEEE, d MMMM yyyy') : 'Select a date'}
          </Typography>

          <Grid container spacing={2} sx={{ flexGrow: 1, minHeight: 0 }}>
            {/* TIMESLOT COLUMN */}
            <Grid item xs={5} sx={{ height: '100%' }}>
              <Stack
                spacing={1}
                sx={{
                  maxHeight: 250,
                  overflowY: 'auto',
                  msOverflowStyle: 'none',
                  scrollbarWidth: 'none',
                  '&::-webkit-scrollbar': {
                    display: 'none',
                  },
                }}
              >
                {slotsForSelectedDate.map((slot) => {
                  const isProposed = proposedSlots.some((p) => p.startTime === slot.startTime);
                  const isSelected = selectedSlotTime === slot.startTime;

                  return (
                    <Button
                      key={slot.startTime}
                      fullWidth
                      variant={isSelected ? 'contained' : 'outlined'}
                      onClick={() => setSelectedSlotTime(slot.startTime)}
                      sx={{
                        py: 1,
                        fontSize: '11px',
                        bgcolor: isSelected ? '#1340FF' : '#fff',
                        borderColor: isSelected ? '#1340FF' : isProposed ? '#1340FF' : '#EDEFF2',
                        color: isSelected ? '#fff' : isProposed ? '#1340FF' : 'text.disabled',
                        '&:hover': { bgcolor: isSelected ? '#0026e6' : '#F4F6F8' },
                      }}
                    >
                      {format(parseISO(slot.startTime), 'p')} -{' '}
                      {format(parseISO(slot.endTime), 'p')}
                    </Button>
                  );
                })}
              </Stack>
            </Grid>
            {/* ATTENDEE COLUMN */}
            <Grid item xs={7}>
              {selectedSlotTime && (
                <Stack spacing={2}>
                  {slotsForSelectedDate
                    .find((s) => s.startTime === selectedSlotTime)
                    ?.attendees.map((attendee) => {
                      const isTargetCreator = attendee.id === logistic.creatorId;
                      const tag = getOptionTag(attendee);

                      return (
                        <Stack key={attendee.id} direction="row" spacing={1} alignItems="center">
                          <Avatar src={attendee.photoURL} sx={{ width: 32, height: 32 }} />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: 700, display: 'block' }}
                            >
                              {attendee.name} {isTargetCreator && '(Current)'}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'block', fontSize: '10px', mt: -0.5 }}
                            >
                              {attendee.handle || ''}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontSize: '10px', mt: -0.5 }}
                            >
                              {attendee.phoneNumber}
                            </Typography>
                          </Box>

                          {/* Show Status Chip */}
                          <Chip
                            label={tag.label}
                            size="small"
                            variant="soft"
                            color={tag.color}
                            sx={{
                              fontSize: '9px',
                              height: 18,
                              ...(tag.color === 'error' && {
                                bgcolor: '#FFE9E9',
                                color: '#FF4842',
                              }),
                              ...(tag.color === 'info' && {
                                bgcolor: '#E9F0FF',
                                color: '#1340FF',
                              }),
                              ...(tag.color === 'success' && {
                                bgcolor: '#E9FFF0',
                                color: '#22C55E',
                              }),
                            }}
                          />
                        </Stack>
                      );
                    })}
                  {!slotsForSelectedDate
                    .find((s) => s.startTime === selectedSlotTime)
                    ?.attendees.some((a) => a.id === logistic.creatorId) &&
                    proposedSlots.some((p) => p.startTime === selectedSlotTime) && (
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ opacity: 0.6 }}>
                        <Avatar src={logistic.creator.photoURL} sx={{ width: 32, height: 32 }} />
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                            {logistic.creator.name} (Current)
                          </Typography>
                          {socialMediaHandle && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'block', fontSize: '10px', mt: -0.5 }}
                            >
                              {socialMediaHandle}
                            </Typography>
                          )}
                          <Typography
                            variant="caption"
                            color="warning.main"
                            sx={{ fontSize: '10px' }}
                          >
                            Proposed
                          </Typography>
                        </Box>
                      </Stack>
                    )}

                  {/* If the current creator is one of the proposers but not confirmed yet, we show them too */}
                  {proposedSlots.some((p) => p.startTime === selectedSlotTime) &&
                    !slotsForSelectedDate
                      .find((s) => s.startTime === selectedSlotTime)
                      ?.attendees.some((a) => a.id === logistic.creatorId) && (
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ opacity: 0.6 }}>
                        <Avatar src={logistic.creator.photoURL} sx={{ width: 32, height: 32 }} />
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          {logistic.creator.name} (Proposing)
                        </Typography>
                      </Stack>
                    )}
                </Stack>
              )}
            </Grid>
          </Grid>

          {isSelectedSlotConflict && (
            <Typography
              variant="caption"
              color="error"
              sx={{ mt: 'auto', textAlign: 'center', fontWeight: 600 }}
            >
              Another creator has already confirmed this timeslot.
            </Typography>
          )}
        </Box>
      </Box>

      <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
        <Button variant="outlined" onClick={onClose} sx={{ px: 4 }}>
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          loading={isSubmitting}
          disabled={!selectedSlotTime || isSelectedSlotConflict}
          onClick={handleConfirm}
          sx={{ bgcolor: '#231F20', px: 4, '&:hover': { bgcolor: '#000' } }}
        >
          Confirm
        </LoadingButton>
      </Stack>
    </Dialog>
  );
}
