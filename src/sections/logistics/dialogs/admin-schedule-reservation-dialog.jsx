import useSWR from 'swr';
import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';
import {
  format,
  endOfWeek,
  isSameDay,
  addMonths,
  subMonths,
  endOfMonth,
  startOfWeek,
  startOfMonth,
  eachDayOfInterval,
} from 'date-fns';

import { LoadingButton } from '@mui/lab';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import {
  Box,
  Grid,
  Stack,
  Dialog,
  Typography,
  IconButton,
  createTheme,
  ThemeProvider,
} from '@mui/material';

import axiosInstance, { fetcher } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

export default function AdminScheduleReservationDialog({
  open,
  onClose,
  logistic,
  campaignId,
  onUpdate,
}) {
  const { enqueueSnackbar } = useSnackbar();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date().setHours(9, 0, 0, 0));
  const [endTime, setEndTime] = useState(new Date().setHours(17, 0, 0, 0));
  const [loading, setLoading] = useState(false);
  const monthQuery = format(currentMonth, 'yyyy-MM-dd');
  const { data: daysData } = useSWR(
    open ? `/api/logistics/campaign/${campaignId}/slots?month=${monthQuery}` : null,
    fetcher
  );

  const hasConflict = useMemo(() => {
    if (!daysData || !selectedDate) return false;

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const slotStart = `${dateStr}T${format(new Date(startTime), 'HH:mm')}`;
    const slotEnd = `${dateStr}T${format(new Date(endTime), 'HH:mm')}`;

    const isFullDay =
      (slotStart.includes('T00:00') && slotEnd.includes('T23:59')) ||
      (slotStart.includes('T08:00') && slotEnd.includes('T07:59'));
    if (isFullDay) return false;

    const confirmedSlots =
      daysData
        .find((d) => d.date === dateStr)
        ?.slots?.filter((s) =>
          s.attendees.some((a) => a.status === 'SELECTED' && a.id !== logistic?.creatorId)
        ) || [];

    return confirmedSlots.some((slot) => {
      const existingStart = slot.startTime.substring(0, 16);
      const existingEnd = slot.endTime.substring(0, 16);
      return slotStart < existingEnd && slotEnd > existingStart;
    });
  }, [daysData, selectedDate, startTime, endTime, logistic?.creatorId]);

  const calendarGrid = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const handleSchedule = async () => {
    setLoading(true);
    try {
      const datePart = format(selectedDate, 'yyyy-MM-dd');
      const startPart = format(new Date(startTime), 'HH:mm:ss');
      const endPart = format(new Date(endTime), 'HH:mm:ss');

      await axiosInstance.patch(
        `/api/logistics/campaign/${campaignId}/${logistic.id}/admin-schedule`,
        {
          startTime: `${datePart}T${startPart}`,
          endTime: `${datePart}T${endPart}`,
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: 2,
          p: 3,
          bgcolor: '#F4F4F4',
          width: 360,
          mx: 'auto',
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
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

      <Typography
        variant="caption"
        sx={{ fontWeight: 600, color: '#636366', mb: 1, display: 'block' }}
      >
        Select Date/Time <span style={{ color: '#D92D20' }}>*</span>
      </Typography>

      <Box sx={{ bgcolor: '#fff', borderRadius: 2, p: 2, border: '1px solid #EAEAEA', mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <IconButton onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} size="small">
            <Iconify icon="eva:chevron-left-fill" />
          </IconButton>
          <Typography variant="subtitle2" fontWeight={700}>
            {format(currentMonth, 'MMMM yyyy')}
          </Typography>
          <IconButton onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} size="small">
            <Iconify icon="eva:chevron-right-fill" />
          </IconButton>
        </Stack>

        <Grid container spacing={1} textAlign="center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <Grid item xs={12 / 7} key={d}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#3A3A3C' }}>
                {d}
              </Typography>
            </Grid>
          ))}
          {calendarGrid.map((day, idx) => {
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = day.getMonth() === currentMonth.getMonth();

            let textColor = '#919EAB';
            if (isCurrentMonth) textColor = '#231F20';
            if (isSelected) textColor = '#fff';
            return (
              <Grid item xs={12 / 7} key={idx}>
                <Box
                  onClick={() => setSelectedDate(day)}
                  sx={{
                    width: 32,
                    height: 32,
                    mx: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    bgcolor: isSelected ? '#1340FF' : 'transparent',
                    color: textColor,
                    '&:hover': { bgcolor: isSelected ? '#1340FF' : '#F4F6F8' },
                  }}
                >
                  <Typography variant="caption" fontWeight={isSelected ? 700 : 400}>
                    {day.getDate()}
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Box>
      <ThemeProvider
        theme={createTheme({
          palette: {
            primary: {
              main: '#1340FF',
            },
          },
        })}
      >
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Stack direction="row" spacing={1} alignItems="center" mb={3}>
            <TimePicker
              value={new Date(startTime)}
              onChange={setStartTime}
              slotProps={{
                textField: { size: 'small', sx: { bgcolor: '#fff', borderRadius: 1 } },
                openPickerButton: { sx: { color: '#1340FF' } },
              }}
            />
            <Typography variant="body2">to</Typography>
            <TimePicker
              value={new Date(endTime)}
              onChange={setEndTime}
              slotProps={{
                textField: { size: 'small', sx: { bgcolor: '#fff', borderRadius: 1 } },
                openPickerButton: { sx: { color: '#1340FF' } },
              }}
            />
          </Stack>
        </LocalizationProvider>
      </ThemeProvider>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <LoadingButton
          variant="contained"
          onClick={handleSchedule}
          loading={loading}
          disabled={hasConflict}
          sx={{
            width: 'fit-content',
            height: 44,
            padding: { xs: '4px 8px', sm: '6px 10px' },
            borderRadius: '8px',
            boxShadow: '0px -4px 0px 0px #00000073 inset',
            backgroundColor: '#3A3A3C',
            color: '#FFFFFF',
            fontSize: { xs: 12, sm: 14, md: 16 },
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#3a3a3ce1',
              boxShadow: '0px -4px 0px 0px #00000073 inset',
            },
            '&:active': {
              boxShadow: '0px 0px 0px 0px #00000073 inset',
              transform: 'translateY(1px)',
            },
          }}
        >
          Schedule Slot
        </LoadingButton>
      </Box>
      {hasConflict && (
        <Typography
          variant="caption"
          sx={{ color: '#FF3500', fontWeight: 600, textAlign: 'right', mt: 1, display: 'block' }}
        >
          ⚠️ Another creator has confirmed this slot.
        </Typography>
      )}
    </Dialog>
  );
}

AdminScheduleReservationDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  logistic: PropTypes.object,
  onUpdate: PropTypes.func,
  campaignId: PropTypes.string,
};
