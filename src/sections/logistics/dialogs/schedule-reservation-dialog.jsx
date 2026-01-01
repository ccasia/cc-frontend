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
  getHours,
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
} from '@mui/material';

import axiosInstance, { fetcher } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import { formatReservationSlot } from 'src/utils/reservation-time';
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
  const details = logistic?.reservationDetails;

  const allFetchedSlots = useMemo(() => {
    if (!daysData) return [];
    return daysData.reduce((acc, day) => [...acc, ...day.slots], []);
  }, [daysData]);

  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const dateString = format(selectedDate, 'yyyy-MM-dd');

    return allFetchedSlots
      .filter((slot) => slot.startTime.startsWith(dateString))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [selectedDate, allFetchedSlots]);

  // const isSelectedSlotConflict = slotsForSelectedDate
  //   .find((s) => s.startTime === selectedSlotTime)
  //   ?.attendees?.some((a) => a.id !== logistic.creatorId && a.status === 'SELECTED');

  const isSelectedSlotConflict = useMemo(() => {
    const slot = slotsForSelectedDate.find((s) => s.startTime === selectedSlotTime);
    if (!slot) return false;

    const start = parseISO(slot.startTime);
    const end = parseISO(slot.endTime);
    const isFullDay = getHours(start) === 8 && getHours(end) === 7;

    return (
      !isFullDay &&
      slot.attendees?.some((a) => a.id !== logistic?.creatorId && a.status === 'SELECTED')
    );
  }, [selectedSlotTime, slotsForSelectedDate, logistic?.creatorId]);

  const calendarGrid = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const proposedSlots = useMemo(
    () => details?.slots?.filter((s) => s.status === 'PROPOSED') || [],
    [details]
  );

  const isNotProposedSlot = useMemo(() => {
    if (!selectedSlotTime || !logistic) return false;

    return !proposedSlots.some((p) => p.startTime === selectedSlotTime);
  }, [selectedSlotTime, proposedSlots, logistic]);

  const confirmedSlot = useMemo(
    () => details?.slots?.find((s) => s.status === 'SELECTED'),
    [details]
  );

  const selectedSlotDetails = useMemo(() => {
    if (!selectedSlotTime) return null;

    const slot = slotsForSelectedDate.find((s) => s.startTime === selectedSlotTime);
    if (!slot) return null;

    const timeLabel = formatReservationSlot(slot.startTime, slot.endTime);

    return `${format(selectedDate, 'EEEE, d MMMM yyyy')}, ${timeLabel}`;
  }, [selectedSlotTime, slotsForSelectedDate, selectedDate]);

  const dateHeader =
    selectedSlotDetails ||
    (selectedDate ? format(selectedDate, 'EEEE, d MMMM yyyy') : 'Select a date');

  useEffect(() => {
    if (open) {
      if (confirmedSlot) {
        const datePart = confirmedSlot.startTime.split('T')[0];
        const date = parseISO(datePart);

        setSelectedDate(date);
        setSelectedSlotTime(confirmedSlot.startTime);
        setCurrentMonth(date);
      } else if (proposedSlots.length > 0) {
        const datePart = proposedSlots[0].startTime.split('T')[0];
        const date = parseISO(datePart);

        setCurrentMonth(date);
        setSelectedDate(date);
      }
    }
  }, [open, confirmedSlot, proposedSlots]);

  // --- Helpers ---

  const getOptionTag = (attendee) => {
    if (attendee.status === 'SELECTED') {
      return { label: 'Confirmed this slot', color: 'success' };
    }

    const count = attendee.otherSlots?.length || 0;

    if (count === 0) {
      return { label: 'Only this option', color: 'error' };
    }

    return {
      label: `${count} more option${count > 1 ? 's' : ''}`,
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
          <Typography variant="h2" sx={{ fontFamily: 'Instrument Serif', fontWeight: 400 }}>
            Schedule Reservation
          </Typography>
          <Typography variant="body" color="#636366">
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
        <Box sx={{ width: '40%', p: 2, borderRight: '1px solid #EAEAEA' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <IconButton onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <Iconify icon="eva:chevron-left-fill" />
            </IconButton>
            <Typography variant="body" sx={{ fontSize: '20px', fontWeight: 700 }}>
              {format(currentMonth, 'MMMM yyyy')}
            </Typography>
            <IconButton onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <Iconify icon="eva:chevron-right-fill" />
            </IconButton>
          </Stack>

          <Grid container spacing={1}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <Grid
                item
                xs={12 / 7}
                key={day}
                textAlign="center"
                sx={{ borderBottom: '1px solid #EAEAEA', p: 1.5 }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#333333' }}>
                  {day}
                </Typography>
              </Grid>
            ))}
            {isLoading ? (
              <CircularProgress size={20} sx={{ m: 'auto', mt: 5 }} />
            ) : (
              calendarGrid.map((date) => {
                const dateString = format(date, 'yyyy-MM-dd');
                const todaySlots = allFetchedSlots.filter((slot) =>
                  slot.startTime.startsWith(dateString)
                );

                const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                const isProposed = proposedSlots.some((p) => p.startTime.startsWith(dateString));
                const hasConfirmed = todaySlots.some((slot) =>
                  slot.attendees?.some((attendee) => attendee.status === 'SELECTED')
                );

                const dayData = daysData?.find((d) => d.date === dateString);
                const canClick = dayData?.available;

                let color = '#919EAB';
                if (isSelected) {
                  color = '#fff';
                } else if (canClick) {
                  color = '#231F20';
                }

                return (
                  <Grid item xs={12 / 7} key={dateString}>
                    <Stack alignItems="center" spacing={0.2}>
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
                          fontSize: '14px',
                          fontWeight: isSelected || isProposed ? 700 : 400,
                          color,
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
                          width: 6,
                          height: 6,
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
        <Box sx={{ width: '60%', p: 2, pb: 0, display: 'flex', flexDirection: 'column' }}>
          <Grid container spacing={2} sx={{ flexGrow: 1, minHeight: 0 }}>
            {/* TIMESLOT COLUMN */}
            <Grid
              item
              xs={5}
              alignContent="center"
              sx={{ height: '100%', pr: 2, borderRight: '1px solid #EAEAEA' }}
            >
              <Stack
                spacing={1}
                sx={{
                  maxHeight: 300,
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
                  const borderColor = isSelected || isProposed ? '#1340FF' : '#EDEFF2';
                  let color = 'text.disabled';
                  if (isSelected) {
                    color = '#fff';
                  } else if (isProposed) {
                    color = '#1340FF';
                  }

                  return (
                    <Button
                      key={slot.startTime}
                      fullWidth
                      variant={isSelected ? 'contained' : 'outlined'}
                      onClick={() => setSelectedSlotTime(slot.startTime)}
                      sx={{
                        py: 1,
                        px: 0.5,
                        fontSize: '15px',
                        bgcolor: isSelected ? '#1340FF' : '#fff',
                        borderColor,
                        color,
                        '&:hover': { bgcolor: isSelected ? '#0026e6' : '#F4F6F8' },
                      }}
                    >
                      {formatReservationSlot(slot.startTime, slot.endTime)}
                    </Button>
                  );
                })}
              </Stack>
            </Grid>
            {/* ATTENDEE COLUMN */}
            <Grid item xs={7}>
              <Typography variant="body" sx={{ fontSize: '20px', mb: 2, fontWeight: 700 }}>
                {dateHeader}
              </Typography>
              {selectedSlotTime && (
                <Stack spacing={1}>
                  {slotsForSelectedDate
                    .find((s) => s.startTime === selectedSlotTime)
                    ?.attendees.map((attendee) => {
                      const isTargetCreator = attendee.id === logistic.creatorId;
                      const tag = getOptionTag(attendee);

                      const tooltip = (
                        <Box sx={{ p: 0.5 }}>
                          {attendee.otherSlots?.map((slot, i) => (
                            <Typography
                              key={i}
                              variant="caption"
                              sx={{ display: 'block', fontSize: '12px' }}
                            >
                              {formatReservationSlot(slot.start, slot.end, true)}
                            </Typography>
                          ))}
                        </Box>
                      );

                      return (
                        <Stack
                          key={attendee.id}
                          direction="row"
                          spacing={1}
                          borderLeft={isTargetCreator ? '2px solid #1340FF' : ''}
                          pl={1}
                        >
                          <Avatar src={attendee.photoURL} sx={{ width: 32, height: 32 }} />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: 700, fontSize: '16px', display: 'block' }}
                            >
                              {attendee.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              // color="text.secondary"
                              sx={{
                                fontWeight: 400,
                                display: 'block',
                                fontSize: '14px',
                                mt: -0.25,
                              }}
                            >
                              {`@${attendee.handle}` || ''}
                            </Typography>
                            <Typography
                              variant="caption"
                              // color="text.secondary"
                              sx={{
                                fontWeight: 400,
                                display: 'block',
                                fontSize: '14px',
                                mt: -0.25,
                              }}
                            >
                              {attendee.phoneNumber}
                            </Typography>
                          </Box>

                          {/* Show Status Chip */}
                          <Tooltip
                            title={attendee.otherSlots?.length > 0 ? tooltip : ''}
                            placement="bottom"
                            slotProps={{
                              popper: {
                                modifiers: [
                                  {
                                    name: 'offset',
                                    options: {
                                      offset: [40, -10],
                                    },
                                  },
                                ],
                              },
                              tooltip: {
                                sx: {
                                  bgcolor: '#FFFFFF',
                                  color: '#231F20',
                                  borderRadius: 1.5,
                                  border: '1px solid #EAEAEA',
                                  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
                                  '& .MuiTooltip-arrow': {
                                    color: '#FFFFFF',
                                    '&:before': {
                                      border: '1px solid #EAEAEA',
                                    },
                                  },
                                },
                              },
                            }}
                          >
                            <Chip
                              label={tag.label}
                              size="small"
                              variant="soft"
                              color={tag.color}
                              sx={{
                                fontSize: '9px',
                                height: 18,
                                cursor: attendee.otherSlots?.length > 0 ? 'help' : 'default',
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
                          </Tooltip>
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
        </Box>
      </Box>

      <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
        <Button variant="outlined" onClick={onClose} sx={{ px: 4 }}>
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          loading={isSubmitting}
          disabled={!selectedSlotTime || isSelectedSlotConflict || isNotProposedSlot}
          onClick={handleConfirm}
          sx={{ bgcolor: '#231F20', px: 4, '&:hover': { bgcolor: '#000' } }}
        >
          Confirm
        </LoadingButton>
      </Stack>
      {isSelectedSlotConflict && (
        <Typography
          variant="caption"
          color="error"
          sx={{ mt: 1, textAlign: 'right', fontWeight: 600 }}
        >
          Another creator has already confirmed this timeslot.
        </Typography>
      )}
      {isNotProposedSlot && (
        <Typography
          variant="caption"
          color="error"
          sx={{ mt: 1, textAlign: 'right', fontWeight: 600 }}
        >
          Creator did not select this timeslot.
        </Typography>
      )}
    </Dialog>
  );
}

ScheduleReservationDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  logistic: PropTypes.object,
  onUpdate: PropTypes.func,
  campaignId: PropTypes.string,
};
