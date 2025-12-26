import PropTypes from 'prop-types';
import { useState, useMemo } from 'react';
import useSWR from 'swr';
import {
  format,
  addMonths,
  subMonths,
  isSameDay,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from 'date-fns';

import {
  Box,
  Stack,
  Button,
  Typography,
  IconButton,
  Grid,
  CircularProgress,
  Divider,
  Collapse,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import { fetcher } from 'src/utils/axios';

export default function CreatorCalendarPicker({ campaignId, onSlotSelect, onCancel }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const monthQuery = format(currentMonth, 'yyyy-MM-dd');
  const { data: daysData, isLoading } = useSWR(
    campaignId ? `/api/logistics/campaign/${campaignId}/slots?month=${monthQuery}` : null,
    fetcher
  );

  const calendarGrid = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({
      start: startDate,
      end: endDate,
    });
  }, [currentMonth]);

  const activeDay = daysData?.find(
    (d) => selectedDate && d.date === format(selectedDate, 'yyyy-MM-dd')
  );
  const activeDateSlots = activeDay?.slots || [];

  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <Box
      sx={{
        bgcolor: '#FFFFFF',
        borderRadius: 2,
        border: '1px solid #EDEFF2',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        minHeight: 340,
      }}
    >
      {/* LEFT: Calendar Section */}
      <Box sx={{ p: 2.5, flex: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <IconButton onClick={handlePrevMonth} size="small">
            <Iconify icon="eva:chevron-left-fill" />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: 'Inter' }}>
            {format(currentMonth, 'MMM yyyy')}
          </Typography>
          <IconButton onClick={handleNextMonth} size="small">
            <Iconify icon="eva:chevron-right-fill" />
          </IconButton>
        </Stack>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 1,
              textAlign: 'center',
            }}
          >
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
              <Typography
                key={day}
                variant="caption"
                sx={{ color: '#919EAB', fontWeight: 600, mb: 1 }}
              >
                {day}
              </Typography>
            ))}

            {calendarGrid?.map((date, idx) => {
              const dateString = format(date, 'yyyy-MM-dd');

              const dayData = daysData?.find((d) => d.date === dateString);

              const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              const hasSlots = dayData?.slots && dayData.slots.length > 0;

              let color = '#919EAB';
              if (isCurrentMonth && hasSlots) color = '#231F20';
              if (isSelected) color = '#1340FF';

              return (
                <Box
                  key={dateString}
                  onClick={() => hasSlots && setSelectedDate(new Date(date))}
                  sx={{
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: hasSlots ? 'pointer' : 'default',
                    color,
                    opacity: isCurrentMonth ? 1 : 0.3,
                    fontSize: '14px',
                    fontWeight: isSelected || hasSlots ? 700 : 400,
                    '&:hover': hasSlots ? { bgcolor: '#F4F6F8', borderRadius: '50%' } : {},
                  }}
                >
                  {date.getDate()}
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      <Divider
        orientation="vertical"
        flexItem
        sx={{ display: { xs: 'none', sm: 'block' }, borderColor: '#EDEFF2' }}
      />

      {/* RIGHT: Slots Section */}
      <Box
        sx={{
          width: { xs: '100%', sm: 200 },
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#FFFFFF',
        }}
      >
        <Stack
          spacing={1}
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            maxHeight: 280, // Limit height to show ~5 slots before scrolling
            pr: 0.5,
            '&::-webkit-scrollbar': { width: '4px' },
            '&::-webkit-scrollbar-thumb': { bgcolor: '#EDEFF2', borderRadius: '10px' },
          }}
        >
          {activeDateSlots.length === 0 ? (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="caption" sx={{ color: 'text.disabled', textAlign: 'center' }}>
                Select a date to view available times
              </Typography>
            </Box>
          ) : (
            activeDateSlots.map((slot, idx) => (
              <Button
                key={idx}
                variant="outlined"
                // disabled={slot.isTaken}
                onClick={() =>
                  onSlotSelect({
                    start: slot.startTime,
                    end: slot.endTime,
                  })
                }
                sx={{
                  py: 1,
                  fontSize: '13px',
                  color: '#231F20',
                  borderColor: '#EDEFF2',
                  borderRadius: 1,
                  fontWeight: 500,
                  '&:hover': {
                    bgcolor: '#1340FF',
                    color: '#fff',
                    borderColor: '#1340FF',
                  },
                }}
              >
                {format(new Date(slot.startTime), 'h:mm a')} -{' '}
                {format(new Date(slot.endTime), 'h:mm a')}
              </Button>
            ))
          )}
        </Stack>

        <Button
          fullWidth
          size="small"
          onClick={onCancel}
          sx={{ mt: 2, color: 'text.secondary', fontSize: '12px' }}
        >
          Cancel
        </Button>
      </Box>
    </Box>
  );
}

CreatorCalendarPicker.propTypes = {
  campaignId: PropTypes.string,
  onSlotSelect: PropTypes.func,
  onCancel: PropTypes.func,
};
