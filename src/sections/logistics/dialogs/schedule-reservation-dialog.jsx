import useSWR from 'swr';
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { format, addMonths, subMonths, isSameDay } from 'date-fns';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Grid,
  Stack,
  Avatar,
  Dialog,
  Button,
  Typography,
  IconButton,
  CircularProgress,
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

  // State for the calendar view
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Available Slots for the displayed month
  // Note: We need the full date string for the query
  const monthQuery = format(currentMonth, 'yyyy-MM-dd');
  const { data: daysData, isLoading } = useSWR(
    open ? `/api/logistics/campaign/${campaignId}/slots?month=${monthQuery}` : null,
    fetcher
  );

  // Parse current booking data
  const details = logistic?.reservationDetails;
  const proposedSlots = details?.slots?.filter((s) => s.status === 'PROPOSED') || [];
  const confirmedSlot = details?.slots?.find((s) => s.status === 'SELECTED');

  // Pre-select logic on open
  useEffect(() => {
    if (open) {
      if (confirmedSlot) {
        setSelectedDate(new Date(confirmedSlot.startTime));
        setSelectedSlotId(confirmedSlot.id);
        setCurrentMonth(new Date(confirmedSlot.startTime));
      } else if (proposedSlots.length > 0) {
        // Default to the first proposed date
        const firstProp = new Date(proposedSlots[0].startTime);
        setCurrentMonth(firstProp);
        setSelectedDate(firstProp);
      } else {
        // Default to today
        setCurrentMonth(new Date());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, logistic]);

  // --- Handlers ---

  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const handleDateClick = (dateStr) => {
    setSelectedDate(new Date(dateStr));
    setSelectedSlotId(null); // Reset slot selection when changing date
  };

  const handleSlotClick = (slot) => {
    // If it's an existing slot (from our db), use its ID.
    // If it's a raw slot from the `daysData` availability, we might not have an ID yet
    // unless we are in "Admin Override" mode creating a new slot.
    // *Simplified Logic*: We only allow selecting from the "Proposed" list OR
    // we match the available time to a proposed slot ID.

    // For now, let's assume Admin selects one of the PROPOSED slots displayed on that day.
    // If Admin needs to pick a NEW time not proposed, backend logic is needed to create a new slot.

    // Find if this time matches a proposed slot
    const matchingProposed = proposedSlots.find(
      (p) => new Date(p.startTime).getTime() === new Date(slot.startTime).getTime()
    );

    if (matchingProposed) {
      setSelectedSlotId(matchingProposed.id);
    } else {
      // Admin is picking a fresh slot.
      // You might need a way to pass this "raw" time to backend if it's not in DB yet.
      // For simplicity, I'll alert if it's not a proposed slot.
      // Or better: Pass the raw times to backend and let backend create the slot.
      setSelectedSlotId(slot.startTime); // Use start time as ID proxy if needed
    }
  };

  const handleConfirm = async () => {
    if (!selectedSlotId) return;

    setIsSubmitting(true);
    try {
      await axiosInstance.patch(
        `/api/logistics/campaign/${campaignId}/${logistic.id}/confirm-reservation`,
        {
          slotId: selectedSlotId,
        }
      );

      enqueueSnackbar('Reservation scheduled successfully');
      onUpdate();
      onClose();
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Failed to schedule', { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Helpers ---

  // Get slots for the selected date from the API data
  const selectedDateSlots =
    daysData?.find((d) => selectedDate && d.date === format(selectedDate, 'dd-MM-yyyy'))?.slots ||
    [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      PaperProps={{ sx: { bgcolor: '#F4F4F4', borderRadius: 2, p: 3, width: '100%' } }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Box>
          <Typography
            variant="h3"
            fontFamily="instrument serif"
            sx={{ fontWeight: 400, color: '#231F20' }}
          >
            Schedule Reservation
          </Typography>
          <Typography variant="body2" sx={{ color: '#636366' }}>
            Scheduling for: {logistic?.creator?.name}
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <Iconify icon="eva:close-fill" width={32} />
        </IconButton>
      </Box>

      {/* --- CALENDAR UI --- */}
      <Box
        sx={{ bgcolor: '#FFFFFF', borderRadius: 2, p: 2, mt: 2, display: 'flex', minHeight: 400 }}
      >
        {/* Left: Date Picker (Simplified Calendar) */}
        <Box sx={{ width: '50%', pr: 2, borderRight: '1px solid #E0E0E0' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <IconButton onClick={handlePrevMonth}>
              <Iconify icon="eva:chevron-left-fill" />
            </IconButton>
            <Typography variant="subtitle1" fontWeight={700}>
              {format(currentMonth, 'MMMM yyyy')}
            </Typography>
            <IconButton onClick={handleNextMonth}>
              <Iconify icon="eva:chevron-right-fill" />
            </IconButton>
          </Stack>

          {isLoading ? (
            <Box display="flex" justifyContent="center" py={5}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={1}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <Grid item xs={12 / 7} key={i} textAlign="center">
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    {d}
                  </Typography>
                </Grid>
              ))}
              {/* Simplified Logic: Just rendering daysData assuming backend returns padding or we handle it */}
              {daysData?.map((dayObj, index) => {
                // Very basic layout, real calendar needs padding logic for start of month
                const date = new Date(dayObj.date.split('-').reverse().join('-')); // dd-MM-yyyy to Date
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                const hasProposal = proposedSlots.some((p) =>
                  isSameDay(new Date(p.startTime), date)
                );

                return (
                  <Grid item xs={12 / 7} key={index}>
                    <Box
                      onClick={() => handleDateClick(date.toISOString())}
                      sx={{
                        height: 36,
                        width: 36,
                        mx: 'auto',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        bgcolor: isSelected ? '#1340FF' : 'transparent',
                        color: isSelected ? '#fff' : '#231F20',
                        border: hasProposal && !isSelected ? '1px solid #1340FF' : 'none',
                        '&:hover': { bgcolor: isSelected ? '#1340FF' : '#F4F6F8' },
                      }}
                    >
                      <Typography variant="body2">{date.getDate()}</Typography>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>

        {/* Right: Slot List */}
        <Box sx={{ width: '50%', pl: 2, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            {selectedDate ? format(selectedDate, 'EEEE, d MMMM yyyy') : 'Select a date'}
          </Typography>

          <Stack spacing={1} sx={{ flexGrow: 1, overflowY: 'auto' }}>
            {selectedDate && selectedDateSlots.length === 0 && (
              <Typography variant="caption" color="text.secondary">
                No slots available.
              </Typography>
            )}
            {selectedDateSlots.map((slot, idx) => {
              const slotStart = new Date(slot.startTime);
              const slotEnd = new Date(slot.endTime);
              const timeLabel = `${format(slotStart, 'h:mm a')} - ${format(slotEnd, 'h:mm a')}`;

              const isProposed = proposedSlots.some(
                (p) => new Date(p.startTime).getTime() === slotStart.getTime()
              );

              // NEW: Check for attendees from our updated API
              const attendees = slot.attendees || [];

              const isSelected =
                selectedSlotId === slot.startTime ||
                proposedSlots.find((p) => p.id === selectedSlotId)?.startTime === slot.startTime;

              return (
                <Box key={idx} sx={{ mb: 1 }}>
                  <Button
                    fullWidth
                    variant={isSelected ? 'contained' : 'outlined'}
                    onClick={() => handleSlotClick(slot)}
                    sx={{
                      justifyContent: 'space-between',
                      borderColor: isProposed ? '#1340FF' : '#E0E0E0',
                      bgcolor: isSelected ? '#1340FF' : '#fff',
                      color: isSelected ? '#fff' : '#231F20',
                      mb: 0.5,
                      '&:hover': { bgcolor: isSelected ? '#133effd3' : '#F4F6F8' },
                    }}
                  >
                    <Typography variant="body2">{timeLabel}</Typography>
                    {isProposed && (
                      <Box
                        sx={{
                          px: 1,
                          py: 0.2,
                          bgcolor: isSelected ? 'rgba(255,255,255,0.2)' : '#E3F2FD',
                          color: isSelected ? '#fff' : '#1340FF',
                          borderRadius: 0.5,
                          fontSize: '10px',
                          fontWeight: 700,
                        }}
                      >
                        PROPOSED
                      </Box>
                    )}
                  </Button>

                  {/* NEW: Render Attendees underneath the button */}
                  {attendees.length > 0 && (
                    <Stack direction="column" spacing={1} sx={{ pl: 1, mt: 1, mb: 2 }}>
                      {attendees.map((person) => (
                        <Stack key={person.id} direction="row" alignItems="center" spacing={1}>
                          <Avatar src={person.photoURL} sx={{ width: 24, height: 24 }} />
                          <Box>
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: 600, display: 'block' }}
                            >
                              {person.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontSize: '0.65rem' }}
                            >
                              {person.phoneNumber}
                            </Typography>
                          </Box>
                        </Stack>
                      ))}
                    </Stack>
                  )}
                </Box>
              );
            })}
          </Stack>
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ color: 'text.primary', borderColor: '#E0E0E0' }}
        >
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          onClick={handleConfirm}
          loading={isSubmitting}
          disabled={!selectedSlotId}
          sx={{ bgcolor: '#3A3A3C', color: '#fff', '&:hover': { bgcolor: '#000' } }}
        >
          Confirm
        </LoadingButton>
      </Box>
    </Dialog>
  );
}

ScheduleReservationDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  logistic: PropTypes.object,
  campaignId: PropTypes.string,
  onUpdate: PropTypes.func,
};
