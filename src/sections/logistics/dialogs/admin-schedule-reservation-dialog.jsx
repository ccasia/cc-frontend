import useSWR from 'swr';
import PropTypes from 'prop-types';
import { useMemo, useState, useEffect } from 'react';
import {
  format,
  parseISO,
  isSameDay,
  isValid,
  addMonths,
  subMonths,
  endOfWeek,
  endOfMonth,
  startOfWeek,
  startOfMonth,
  eachDayOfInterval,
} from 'date-fns';

import { LoadingButton } from '@mui/lab';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DesktopTimePicker } from '@mui/x-date-pickers';
import {
  Box,
  Grid,
  Chip,
  Stack,
  Avatar,
  Dialog,
  Tooltip,
  Typography,
  IconButton,
  createTheme,
  ThemeProvider,
  CircularProgress,
  Divider,
} from '@mui/material';

import axiosInstance, { fetcher } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import { formatReservationSlot } from 'src/utils/reservation-time';

const parseLiteralToLocal = (isoStr) => {
  if (!isoStr) return null;
  const [datePart, timePart] = isoStr.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mm] = timePart.split(':').map(Number);

  return new Date(y, m - 1, d, hh, mm);
};

export default function AdminScheduleReservationDialog({
  open,
  onClose,
  logistic,
  campaignId,
  onUpdate,
  reservationConfig,
}) {
  const { enqueueSnackbar } = useSnackbar();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState(() => {
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return d;
  });
  const [endTime, setEndTime] = useState(() => {
    const d = new Date();
    d.setHours(17, 0, 0, 0);
    return d;
  });
  const [loading, setLoading] = useState(false);

  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const monthQuery = format(currentMonth, 'yyyy-MM-dd');
  const { data: daysData, isLoading } = useSWR(
    open ? `/api/logistics/campaign/${campaignId}/slots?month=${monthQuery}` : null,
    fetcher
  );

  const creator = logistic?.creator;
  const details = logistic?.reservationDetails;
  const socialMediaHandle =
    creator?.creator?.instagramUser?.username || creator?.creator?.tiktokUser?.username;
  const proposedSlots = useMemo(
    () => details?.slots?.filter((s) => s.status === 'PROPOSED') || [],
    [details]
  );
  const confirmedSlot = useMemo(
    () => details?.slots?.find((s) => s.status === 'SELECTED'),
    [details]
  );

  const allFetchedSlots = useMemo(() => {
    if (!daysData) return [];
    return daysData.reduce((acc, day) => [...acc, ...day.slots], []);
  }, [daysData]);

  useEffect(() => {
    if (open) {
      const firstActive = confirmedSlot || proposedSlots[0];
      if (firstActive) {
        const datePart = firstActive.startTime.split('T')[0];
        const localDate = parseISO(datePart);

        setSelectedDate(localDate);
        setCurrentMonth(localDate);
      } else {
        setSelectedDate(new Date());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || !selectedDate) return;

    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const myConfirmed = confirmedSlot?.startTime.startsWith(dateStr) ? confirmedSlot : null;
    const myProposed = proposedSlots.find((p) => p.startTime.startsWith(dateStr));

    if (myConfirmed) {
      setStartTime(parseLiteralToLocal(myConfirmed.startTime));
      setEndTime(parseLiteralToLocal(myConfirmed.endTime));
    } else if (myProposed) {
      setStartTime(parseLiteralToLocal(myProposed.startTime));
      setEndTime(parseLiteralToLocal(myProposed.endTime));
    } else {
      setStartTime(null);
      setEndTime(null);
    }
  }, [selectedDate, confirmedSlot, proposedSlots, open]);

  const hasConflict = useMemo(() => {
    if (
      !daysData ||
      !selectedDate ||
      !isValid(startTime) ||
      !isValid(endTime) ||
      reservationConfig?.allowMultipleBookings
    )
      return false;

    const slotStart = `${dateString}T${format(startTime, 'HH:mm')}`;
    const slotEnd = `${dateString}T${format(endTime, 'HH:mm')}`;

    const isFullDay =
      (slotStart.includes('T00:00') && slotEnd.includes('T23:59')) ||
      (slotStart.includes('T08:00') && slotEnd.includes('T07:59'));
    if (isFullDay) return false;

    const confirmedSlots =
      daysData
        .find((d) => d.date === dateString)
        ?.slots?.filter((s) =>
          s.attendees.some((a) => a.status === 'SELECTED' && a.id !== logistic?.creatorId)
        ) || [];

    return confirmedSlots.some((slot) => {
      const existingStart = slot.startTime.substring(0, 16);
      const existingEnd = slot.endTime.substring(0, 16);
      return slotStart < existingEnd && slotEnd > existingStart;
    });
  }, [
    daysData,
    selectedDate,
    startTime,
    endTime,
    logistic?.creatorId,
    dateString,
    reservationConfig?.allowMultipleBookings,
  ]);

  const isNotProposedSlot = useMemo(() => {
    if (!selectedDate || !startTime || !isValid(startTime)) return false;

    const currentWindowStart = `${dateString}T${format(startTime, 'HH:mm')}`;

    return !proposedSlots.some((p) => p.startTime.startsWith(currentWindowStart));
  }, [dateString, startTime, proposedSlots, selectedDate]);

  const attendeesList = useMemo(() => {
    if (!selectedDate) return [];

    const creatorsMap = new Map();

    allFetchedSlots.forEach((slot) => {
      if (!slot.startTime.startsWith(dateString)) return;

      slot.attendees?.forEach((a) => {
        if (!creatorsMap.has(a.id) || a.status === 'SELECTED') {
          creatorsMap.set(a.id, {
            ...a,
            currentSlot: { start: slot.startTime, end: slot.endTime },
          });
        }
      });
    });

    if (!creatorsMap.has(logistic?.creatorId)) {
      const targetDayProposal = proposedSlots.find((p) => p.startTime.startsWith(dateString));
      const targetDayConfirmed = confirmedSlot?.startTime.startsWith(dateString)
        ? confirmedSlot
        : null;

      const activeTargetDay = targetDayProposal || targetDayConfirmed;

      if (activeTargetDay) {
        creatorsMap.set(logistic.creatorId, {
          id: logistic.creatorId,
          name: logistic.creator.name,
          photoURL: logistic.creator.photoURL,
          handle: socialMediaHandle,
          status: activeTargetDay.status,
          currentSlot: { start: activeTargetDay.startTime, end: activeTargetDay.endTime },
          otherSlots: proposedSlots.filter((p) => p.startTime !== activeTargetDay.startTime),
        });
      }
    }

    return Array.from(creatorsMap.values()).sort((a, b) => {
      if (a.id === logistic?.creatorId) return -1;
      if (b.id === logistic?.creatorId) return 1;

      const timeA = a.currentSlot?.start || '';
      const timeB = b.currentSlot?.start || '';

      return timeA.localeCompare(timeB);
    });
  }, [
    allFetchedSlots,
    dateString,
    logistic,
    proposedSlots,
    socialMediaHandle,
    selectedDate,
    confirmedSlot,
  ]);

  const calendarGrid = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const handleSchedule = async () => {
    setLoading(true);
    try {
      const startPart = format(new Date(startTime), 'HH:mm:ss');
      const endPart = format(new Date(endTime), 'HH:mm:ss');

      await axiosInstance.patch(
        `/api/logistics/campaign/${campaignId}/${logistic.id}/admin-schedule`,
        {
          startTime: `${dateString}T${startPart}`,
          endTime: `${dateString}T${endPart}`,
        }
      );

      enqueueSnackbar('Reservation scheduled successfully');
      onUpdate();
      onClose();
    } catch (error) {
      enqueueSnackbar('Error scheduling slot', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getOptionTag = (attendee) => {
    if (attendee.status === 'SELECTED') return { label: 'Confirmed this slot', color: 'success' };
    const count = attendee.otherSlots?.length || 0;
    if (count === 0) return { label: 'Only this option', color: 'error' };
    return { label: `${count} more option${count > 1 ? 's' : ''}`, color: 'info' };
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      PaperProps={{
        sx: { width: 'fit-content', maxWidth: '90vw', borderRadius: 2, p: 3, bgcolor: '#F4F4F4' },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Box>
          <Typography variant="h3" sx={{ fontFamily: 'Instrument Serif', fontWeight: 400 }}>
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
          width: 720,
          minHeight: 360,
          maxHeight: 400,
          mb: 3,
        }}
      >
        {/* LEFT: CALENDAR */}
        <Box sx={{ width: '45%', p: 2, borderRight: '1px solid #EAEAEA' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <IconButton onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} size="small">
              <Iconify icon="eva:chevron-left-fill" />
            </IconButton>
            <Typography variant="body" sx={{ fontSize: '20px', fontWeight: 700 }}>
              {format(currentMonth, 'MMMM yyyy')}
            </Typography>
            <IconButton onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} size="small">
              <Iconify icon="eva:chevron-right-fill" />
            </IconButton>
          </Stack>

          <Grid container spacing={1} textAlign="center">
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
              calendarGrid.map((day, idx) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                const isProposed = proposedSlots.some((p) => p.startTime.startsWith(dateStr));
                const hasConfirmed = allFetchedSlots
                  .filter((s) => s.startTime.startsWith(dateStr))
                  .some((s) => s.attendees?.some((a) => a.status === 'SELECTED'));

                const dayData = daysData?.find((d) => d.date === dateStr);
                const canClick = dayData?.available;

                let color = '#919EAB';
                if (isSelected) {
                  color = '#fff';
                } else if (canClick && !isProposed) {
                  color = '#090708ff';
                } else if (isProposed) {
                  color = '#1340FF';
                }

                return (
                  <Grid item xs={12 / 7} key={dateStr}>
                    <Stack alignItems="center" spacing={0.2}>
                      <Box
                        onClick={() => setSelectedDate(day)}
                        sx={{
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: isSelected || isProposed ? 700 : 400,
                          color,
                          bgcolor: isSelected ? '#1340FF' : 'transparent',
                          // color: isSelected ? '#fff' : isCurrentMonth ? '#231F20' : '#919EAB',
                          border: isProposed && !isSelected ? '1px solid #1340FF' : 'none',
                          '&:hover': { bgcolor: isSelected ? '#1340FF' : '#F4F6F8' },
                        }}
                      >
                        {day.getDate()}
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

        {/* RIGHT: ATTENDEE LIST */}
        <Box sx={{ width: '55%', p: 2, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="subtitle1" mb={2} fontWeight={700}>
            {format(selectedDate, 'EEEE, d MMMM yyyy')}
          </Typography>

          <Stack spacing={0.5} sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: 320 }}>
            {attendeesList.map((attendee) => {
              const isTargetCreator = attendee.id === logistic?.creatorId;
              const tag = getOptionTag(attendee);

              const tooltip = (
                <Box sx={{ p: 0.5 }}>
                  {attendee.otherSlots.map((slot, i) => (
                    <Typography
                      key={i}
                      variant="caption"
                      sx={{ display: 'block', fontSize: '11px' }}
                    >
                      {/* Use the start/end or startTime/endTime depending on object source */}•{' '}
                      {formatReservationSlot(
                        slot.start || slot.startTime,
                        slot.end || slot.endTime,
                        true
                      )}
                    </Typography>
                  ))}
                </Box>
              );

              return (
                <Stack
                  key={attendee.id}
                  direction="row"
                  spacing={1}
                  sx={{
                    display: 'flex',
                    p: 1,
                    borderRadius: 1,
                    borderLeft: isTargetCreator ? '4px solid #1340FF' : 'none',
                    bgcolor: isTargetCreator ? 'rgba(19, 64, 255, 0.04)' : 'transparent',
                  }}
                >
                  <Avatar src={attendee.photoURL} sx={{ width: 32, height: 32 }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Box direction="row" justifyContent="space-between" sx={{ display: 'flex' }}>
                      <Typography
                        variant="caption"
                        noWrap
                        sx={{ fontWeight: 700, fontSize: '16px', display: 'block' }}
                      >
                        {attendee.name}
                      </Typography>
                      <Box sx={{ flexShrink: 0 }}>
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
                          <Box component="span">
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
                          </Box>
                        </Tooltip>
                      </Box>
                    </Box>
                    <Stack spacing={1} sx={{ display: 'flex', flexDirection: 'row' }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 400,
                          display: 'block',
                          fontSize: '14px',
                          mt: -0.25,
                        }}
                      >
                        {`@${attendee.handle}` || ''}
                      </Typography>
                      <Divider
                        orientation="vertical"
                        flexItem
                        sx={{ height: 14, alignSelf: 'center', borderColor: '#8E8E93' }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 400,
                          display: 'block',
                          fontSize: '14px',
                          mt: -0.25,
                        }}
                      >
                        {attendee.phoneNumber || ''}
                      </Typography>
                    </Stack>
                    {attendee.currentSlot && (
                      <Typography
                        variant="caption"
                        color="#636366"
                        display="block"
                        noWrap
                        sx={{ mt: 0.2 }}
                      >
                        {formatReservationSlot(
                          attendee.currentSlot.start,
                          attendee.currentSlot.end
                        )}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              );
            })}
          </Stack>
        </Box>
      </Box>

      {/* OVERWRITE CONTROLS */}
      <Stack direction="row" spacing={1} alignItems="center">
        <ThemeProvider theme={createTheme({ palette: { primary: { main: '#1340FF' } } })}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Stack direction="row" spacing={1} alignItems="center" flexGrow={1}>
              <DesktopTimePicker
                label="Start Time"
                value={startTime}
                onChange={(newValue) => setStartTime(newValue)}
                slotProps={{
                  popper: {
                    sx: {
                      '& .MuiMenuItem-root': {
                        fontSize: '14px',
                        '&:hover': {
                          bgcolor: 'rgba(19, 64, 255, 0.08)',
                          color: '#1340FF',
                          borderRadius: 1.5,
                        },
                        '&.Mui-selected': {
                          bgcolor: '#1340FF !important',
                          color: '#fff !important',
                          borderRadius: 1.5,
                          '&:hover': {
                            bgcolor: '#0c2aa6 !important',
                          },
                        },
                      },
                    },
                  },
                  textField: {
                    size: 'small',
                    sx: { bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 1.5 } },
                  },
                }}
              />
              <Typography variant="body2">to</Typography>
              <DesktopTimePicker
                label="End Time"
                value={endTime}
                onChange={(newValue) => setEndTime(newValue)}
                slotProps={{
                  popper: {
                    sx: {
                      '& .MuiMenuItem-root': {
                        fontSize: '14px',
                        '&:hover': {
                          bgcolor: 'rgba(19, 64, 255, 0.08)',
                          color: '#1340FF',
                          borderRadius: 1.5,
                        },
                        '&.Mui-selected': {
                          bgcolor: '#1340FF !important',
                          color: '#fff !important',
                          borderRadius: 1.5,
                          '&:hover': {
                            bgcolor: '#0c2aa6 !important',
                          },
                        },
                      },
                    },
                  },
                  textField: {
                    size: 'small',
                    sx: { bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 1.5 } },
                  },
                }}
              />
            </Stack>
          </LocalizationProvider>
        </ThemeProvider>

        <LoadingButton
          variant="contained"
          onClick={handleSchedule}
          loading={loading}
          disabled={hasConflict || endTime === null || startTime === null}
          sx={{ height: 44, bgcolor: '#3A3A3C', px: 4, textTransform: 'none', fontWeight: 600 }}
        >
          Confirm
        </LoadingButton>
      </Stack>

      <Box sx={{ mt: 1, textAlign: 'right' }}>
        {hasConflict && (
          <Typography variant="caption" color="error" fontWeight={600} display="block">
            ⚠️ Overlapping with an existing confirmed reservation.
          </Typography>
        )}
        {isNotProposedSlot && (
          <Typography variant="caption" color="error" fontWeight={600} display="block">
            Creator did not select this window.
          </Typography>
        )}
        {(endTime === null || startTime === null) && (
          <Typography variant="caption" color="error" fontWeight={600} display="block">
            Select a start and end time.
          </Typography>
        )}
      </Box>
    </Dialog>
  );
}

AdminScheduleReservationDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  logistic: PropTypes.object,
  onUpdate: PropTypes.func,
  campaignId: PropTypes.string,
  reservationConfig: PropTypes.object,
};
