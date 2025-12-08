import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { format, addDays } from 'date-fns';

import {
  Box,
  Grid,
  Stack,
  Avatar,
  Button,
  Checkbox,
  TextField,
  Typography,
  FormControlLabel,
  IconButton,
  Switch,
  useTheme,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { DesktopTimePicker } from '@mui/x-date-pickers/DesktopTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import dayjs from 'dayjs';

import Iconify from 'src/components/iconify';

const ReservationSlots = () => {
  const theme = useTheme();
  const { watch, setValue } = useFormContext();
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(addDays(new Date(), 30));
  const [startTime, setStartTime] = useState(new Date().setHours(9, 0, 0));
  const [endTime, setEndTime] = useState(new Date().setHours(17, 0, 0));
  const [interval, setInterval] = useState(1);
  const [allDay, setAllDay] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectAllDates, setSelectAllDates] = useState(false);
  const [dateRange, setDateRange] = useState([null, null]); 
  const [intervalsChecked, setIntervalsChecked] = useState(false);
  const [intervalOptions] = useState([0.5, 1, 1.5, 2, 3, 4]);
  const [showIntervalDropdown, setShowIntervalDropdown] = useState(false);
  const [generatedTimeSlots, setGeneratedTimeSlots] = useState([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  // Direct time input - no need for picker state variables
  const [savedTimeSlots, setSavedTimeSlots] = useState([]);

  // Generate time slots when component mounts or when relevant values change
  useEffect(() => {
    if (intervalsChecked && startTime && endTime) {
      generateTimeSlots(startTime, endTime, interval, intervalsChecked);
    }
  }, [intervalsChecked, startTime, endTime, interval]);

  // Generate calendar data for the current month
  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    
    // Create array for all days in the month
    const days = [];

    for (let i = 0; i < firstDay; i += 1) {
      days.push({ day: null, date: null });
    }

    const selectedDatesMap = {};
    let rangeStartDate = null;
    let rangeEndDate = null;
    
    if (selectedDates.length > 0) {

      const sortedDates = [...selectedDates].sort((a, b) => a - b);
      rangeStartDate = sortedDates[0];
      rangeEndDate = sortedDates[sortedDates.length - 1];
    }
    
    selectedDates.forEach(date => {
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

      const isRangeEndpoint = 
        (date.getTime() === rangeStartDate?.getTime() || 
         date.getTime() === rangeEndDate?.getTime());
      
      selectedDatesMap[key] = {
        selected: true,
        isRangeEndpoint
      };
    });
    
    for (let i = 1; i <= daysInMonth; i += 1) {
      const date = new Date(year, month, i);
      const isToday = (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
      
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const dateInfo = selectedDatesMap[dateKey] || { selected: false, isRangeEndpoint: false };
      const isSelected = dateInfo.selected;
      const { isRangeEndpoint } = dateInfo;
      
      const isInRange = rangeStartDate && rangeEndDate && 
        date >= rangeStartDate && date <= rangeEndDate;

      let isRangeStart = false;
      let isRangeEnd = false;
      
      if (isInRange) {
        const prevDate = new Date(date);
        prevDate.setDate(date.getDate() - 1);
        const isPrevInRange = prevDate.getMonth() === month && 
                            prevDate.getDate() >= 1 &&
                            rangeStartDate && rangeEndDate && 
                            prevDate >= rangeStartDate && prevDate <= rangeEndDate;
        
        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1);
        const isNextInRange = nextDate.getMonth() === month && 
                            nextDate.getDate() <= daysInMonth &&
                            rangeStartDate && rangeEndDate && 
                            nextDate >= rangeStartDate && nextDate <= rangeEndDate;
        
        isRangeStart = !isPrevInRange || date.getDay() === 0;
        
        isRangeEnd = !isNextInRange || date.getDay() === 6;
      }
      
      const isPast = date < new Date(today.setHours(0, 0, 0, 0));
      
      days.push({
        day: i,
        date,
        isToday,
        isSelected,
        isPast,
        isRangeEndpoint,
        isInRange,
        isRangeStart,
        isRangeEnd
      });
    }
    
    return days;
  };

  const handleDateClick = (date) => {
    if (!date) return;
    
    console.log('Date clicked:', format(date, 'yyyy-MM-dd'));
    
    const isDateSelected = selectedDates.some(selectedDate => 
      selectedDate.getDate() === date.getDate() &&
      selectedDate.getMonth() === date.getMonth() &&
      selectedDate.getFullYear() === date.getFullYear()
    );
    
    if (isDateSelected) {
      const newSelectedDates = selectedDates.filter(selectedDate => 
        !(selectedDate.getDate() === date.getDate() &&
        selectedDate.getMonth() === date.getMonth() &&
        selectedDate.getFullYear() === date.getFullYear())
      );
      
      console.log('Deselected date, new selected dates:', newSelectedDates.map(d => format(d, 'yyyy-MM-dd')));
      setSelectedDates(newSelectedDates);
      
      if (newSelectedDates.length === 0) {
        setDateRange([null, null]);
      } else if (newSelectedDates.length === 1) {
        setDateRange([newSelectedDates[0], null]);
      } else {
        const sortedDates = [...newSelectedDates].sort((a, b) => a.getTime() - b.getTime());
        setDateRange([sortedDates[0], sortedDates[sortedDates.length - 1]]);
      }
    } else if (dateRange[0] && !dateRange[1]) {
        if (date < dateRange[0]) {
          setDateRange([date, dateRange[0]]);
        } else {
          setDateRange([dateRange[0], date]);
        }
        
        const allDatesInRange = [];
        const start = new Date(dateRange[0]);
        const end = new Date(date);
        
        console.log(`Creating date range from ${format(start, 'yyyy-MM-dd')} to ${format(end, 'yyyy-MM-dd')}`);
        
        const current = new Date(start);
        while (current <= end) {
          allDatesInRange.push(new Date(current));
          current.setDate(current.getDate() + 1);
        }
        
        console.log('All dates in range:', allDatesInRange.map(d => format(d, 'yyyy-MM-dd')));
        setSelectedDates(allDatesInRange);
    } else {
      setDateRange([date, null]);
      setSelectedDates([date]);
      console.log('Started new selection with date:', format(date, 'yyyy-MM-dd'));
    }
  };
  
  const handleDoubleClick = (date) => {
    if (!date) return;
    
    const isSelected = selectedDates.some(selectedDate => 
      selectedDate.getDate() === date.getDate() &&
      selectedDate.getMonth() === date.getMonth() &&
      selectedDate.getFullYear() === date.getFullYear()
    );
    
    if (isSelected) {
      setSelectedDates(selectedDates.filter(selectedDate => 
        !(selectedDate.getDate() === date.getDate() &&
        selectedDate.getMonth() === date.getMonth() &&
        selectedDate.getFullYear() === date.getFullYear())
      ));
    } else {
      setSelectedDates([...selectedDates, date]);
    }
    
    setDateRange([null, null]);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleSelectAllDates = (event) => {
    setSelectAllDates(event.target.checked);
    if (event.target.checked) {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      const dates = [];
      for (let i = 1; i <= daysInMonth; i += 1) {
        dates.push(new Date(year, month, i));
      }
      
      setSelectedDates(dates);
      setDateRange([dates[0], dates[dates.length - 1]]);
    } else {
      setSelectedDates([]);
      setDateRange([null, null]);
    }
  };

  const handleAllDayToggle = (event) => {
    setAllDay(event.target.checked);
    if (event.target.checked) {
      setStartTime(null);
      setEndTime(null);
    }
  };
  
  const handleStartTimeChange = (time) => {
    setStartTime(time);
    generateTimeSlots(time, endTime, interval, intervalsChecked);
  };
  
  const handleEndTimeChange = (time) => {
    setEndTime(time);
    generateTimeSlots(startTime, time, interval, intervalsChecked);
  };
  
  const handleIntervalChange = (newInterval) => {
    setInterval(newInterval);
    setShowIntervalDropdown(false);
    generateTimeSlots(startTime, endTime, newInterval, intervalsChecked);
  };
  
  const handleIntervalsChecked = (event) => {
    const isChecked = event.target.checked;
    console.log(`Intervals checkbox ${isChecked ? 'checked' : 'unchecked'}`);
    setIntervalsChecked(isChecked);
    generateTimeSlots(startTime, endTime, interval, isChecked);
  };
  
  const generateTimeSlots = (start, end, intervalHours, enabled) => {
    if (!enabled || !start || !end) {
      setGeneratedTimeSlots([]);
      return;
    }
    
    console.log(`Generating time slots from ${format(new Date(start), 'h:mm a')} to ${format(new Date(end), 'h:mm a')} with interval ${intervalHours} hours`);
    
    const slots = [];
    const slotStartDate = new Date(start);
    const slotEndDate = new Date(end);
    
    let currentTime = new Date(slotStartDate);
    while (currentTime < slotEndDate) {
      const slotEnd = new Date(currentTime);
      slotEnd.setHours(currentTime.getHours() + Math.floor(intervalHours));
      slotEnd.setMinutes(currentTime.getMinutes() + (intervalHours % 1) * 60);
      
      if (slotEnd > slotEndDate) {
        break;
      }
      
      slots.push({
        start: new Date(currentTime),
        end: new Date(slotEnd),
        selected: false
      });
      
      currentTime = new Date(slotEnd);
    }
    
    console.log(`Generated ${slots.length} time slots:`, slots.map(slot => 
      `${format(slot.start, 'h:mm a')} - ${format(slot.end, 'h:mm a')}`
    ));
    
    setGeneratedTimeSlots(slots);
  };
  
  const toggleTimeSlotSelection = (index) => {
    const updatedSlots = [...generatedTimeSlots];
    updatedSlots[index].selected = !updatedSlots[index].selected;
    setGeneratedTimeSlots(updatedSlots);
    
    if (updatedSlots[index].selected) {
      setSelectedTimeSlots([...selectedTimeSlots, updatedSlots[index]]);
    } else {
      setSelectedTimeSlots(selectedTimeSlots.filter(slot => 
        !(slot.start.getTime() === updatedSlots[index].start.getTime() && 
          slot.end.getTime() === updatedSlots[index].end.getTime())
      ));
    }
  };
  
  const handleSaveTimeSlots = () => {
    const dateGroups = {};
    
    console.log('Selected Time Slots:', selectedTimeSlots);
    console.log('Selected Dates:', selectedDates);
    
    if (selectedDates.length === 0 && selectedTimeSlots.length > 0) {
      console.log('No dates selected, cannot save time slots without dates');
      alert('Please select at least one date before saving time slots');
      return;
    }

    const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
    console.log('Sorted selected dates:', sortedDates.map(d => format(d, 'yyyy-MM-dd')));
    
    const rangeKey = 'date-range';
    
    dateGroups[rangeKey] = {
      dates: sortedDates.map(date => new Date(date)),
      slots: selectedTimeSlots.map(slot => ({
        start: new Date(slot.start),
        end: new Date(slot.end)
      }))
    };
    
    console.log('Created date range entry with dates:', 
      dateGroups[rangeKey].dates.map(d => format(d, 'yyyy-MM-dd')));
    
    const groupedSlots = Object.values(dateGroups).sort((a, b) => {
      const dateA = a.dates ? a.dates[0] : a.date;
      const dateB = b.dates ? b.dates[0] : b.date;
      return dateA.getTime() - dateB.getTime();
    });
    console.log('Grouped slots by date:', groupedSlots);
    
    const consecutiveGroups = [];
    let currentGroup = null;
    
    groupedSlots.forEach(dateSlot => {
      if (!currentGroup) {
        currentGroup = {
          dates: dateSlot.dates || [dateSlot.date],
          slots: dateSlot.slots
        };
        console.log('Initialized current group with dates:', 
          currentGroup.dates.map(d => format(d, 'yyyy-MM-dd')));
      } else if (dateSlot.dates) {
        consecutiveGroups.push(currentGroup);
        currentGroup = {
          dates: dateSlot.dates,
          slots: dateSlot.slots
        };
        console.log('Added pre-built date range:', 
          dateSlot.dates.map(d => format(d, 'yyyy-MM-dd')));
      } else {
        const lastDate = currentGroup.dates[currentGroup.dates.length - 1];
        const dayDiff = Math.round((dateSlot.date - lastDate) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === 1 && haveSameTimeSlots(currentGroup.slots, dateSlot.slots)) {
          currentGroup.dates.push(dateSlot.date);
          console.log(`Added ${format(dateSlot.date, 'yyyy-MM-dd')} to existing group`);
        } else {
          consecutiveGroups.push(currentGroup);
          console.log(`Created new group for ${format(dateSlot.date, 'yyyy-MM-dd')}`);
          currentGroup = {
            dates: [dateSlot.date],
            slots: dateSlot.slots
          };
        }
      }
    });
    
    if (currentGroup) {
      consecutiveGroups.push(currentGroup);
    }
    
    console.log('Final consecutive groups:', consecutiveGroups);
    console.log('Formatted output:');
    consecutiveGroups.forEach(group => {
      console.log(`Dates: ${formatDateRange(group.dates)}`);
      console.log(`Time Slots: ${formatTimeSlotsForDisplay(group.slots)}`);
    });
    
    setSavedTimeSlots(consecutiveGroups);
    
    alert('Time slots saved successfully! Check the console for details.');
  };
  
  const haveSameTimeSlots = (slots1, slots2) => {
    if (slots1.length !== slots2.length) {
      console.log('Different number of slots:', slots1.length, 'vs', slots2.length);
      return false;
    }
    
    // Sort slots by start time
    const sortedSlots1 = [...slots1].sort((a, b) => a.start - b.start);
    const sortedSlots2 = [...slots2].sort((a, b) => a.start - b.start);
    
    const result = sortedSlots1.every((slot, index) => {
      const slot2 = sortedSlots2[index];
      const startMatch = format(slot.start, 'HH:mm') === format(slot2.start, 'HH:mm');
      const endMatch = format(slot.end, 'HH:mm') === format(slot2.end, 'HH:mm');
      
      if (!startMatch || !endMatch) {
        console.log('Slot mismatch:', 
          `${format(slot.start, 'HH:mm')}-${format(slot.end, 'HH:mm')}`, 'vs', 
          `${format(slot2.start, 'HH:mm')}-${format(slot2.end, 'HH:mm')}`);
      }
      
      return startMatch && endMatch;
    });
    
    return result;
  };
  
  // Format date range for display
  const formatDateRange = (dates) => {
    console.log('Formatting date range for dates:', dates);
    
    if (dates.length === 0) return '';
    if (dates.length === 1) return format(dates[0], 'd MMM');
    
    const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
    console.log('Sorted dates:', sortedDates.map(d => format(d, 'yyyy-MM-dd')));
    
    const ranges = [];
    let rangeStart = sortedDates[0];
    let rangeEnd = sortedDates[0];
    
    for (let i = 1; i < sortedDates.length; i += 1) {
      const prevDate = sortedDates[i-1];
      const currDate = sortedDates[i];
      const dayDiff = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      console.log(`Comparing ${format(prevDate, 'yyyy-MM-dd')} and ${format(currDate, 'yyyy-MM-dd')}, diff: ${dayDiff} days`);
      
      if (dayDiff === 1) {
        rangeEnd = currDate;
        console.log(`Extended range to ${format(rangeEnd, 'yyyy-MM-dd')}`);
      } else {
        ranges.push([rangeStart, rangeEnd]);
        console.log(`Added range ${format(rangeStart, 'yyyy-MM-dd')} - ${format(rangeEnd, 'yyyy-MM-dd')}`);
        rangeStart = currDate;
        rangeEnd = currDate;
      }
    }
    
    ranges.push([rangeStart, rangeEnd]);
    console.log(`Added final range ${format(rangeStart, 'yyyy-MM-dd')} - ${format(rangeEnd, 'yyyy-MM-dd')}`);
    
    const formattedRanges = ranges.map(([start, end]) => {
      if (start.getTime() === end.getTime()) {
        return format(start, 'd MMM');
      }
      return `${format(start, 'd MMM')} - ${format(end, 'd MMM')}`;
    }).join(', ');
    
    console.log('Formatted date range:', formattedRanges);
    return formattedRanges;
  };
  
  const formatTimeSlotsForDisplay = (slots) => slots
    .sort((a, b) => a.start - b.start)
    .map(slot => `${format(slot.start, 'h:mm a')} - ${format(slot.end, 'h:mm a')}`)
    .join(', ');
  
  const formatTimeSlot = (slot) => `${format(slot.start, 'h:mm a')} - ${format(slot.end, 'h:mm a')}`;

  // Direct time input - no need for popover handlers

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        p: { xs: 2, sm: 3 },
        maxWidth: 900,
        mx: 'auto'
      }}
    >
      <Typography 
        textAlign="center" 
        sx={{ 
          mb: 2,
          fontFamily: 'Inter Display, sans-serif',
          fontWeight: 400,
          fontSize: '16px',
          lineHeight: '20px',
          letterSpacing: '0%',
          color: '#231F20'
        }}
      >
        Add options for creators to select their available time slots.
        Times are standardized to Malaysian time (UTC+08:00).
      </Typography>
      
      <Box sx={{ 
        border: '1px solid #e0e0e0', 
        borderRadius: 1, 
        overflow: 'hidden',
        boxShadow: '0px 0px 5px rgba(0, 0, 0, 0.05)',
        position: 'relative'
      }}>
        <Grid container spacing={{ xs: 0, md: 0 }}>
          {/* Left side - Date selection */}
          <Grid item xs={12} md={6} sx={{ 
            borderRight: { xs: 'none', md: '1px solid #e0e0e0' },
            borderBottom: { xs: '1px solid #e0e0e0', md: 'none' },
            p: { xs: 2, sm: 3, md: 4 }
          }}>
            <Typography sx={{ 
              mb: 2, 
              fontFamily: 'Inter Display, sans-serif',
              fontWeight: 600,
              fontSize: '18px',
              lineHeight: '22px',
              letterSpacing: '0%'
            }}>
              Select Dates:
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ 
                mb: 1,
                fontFamily: 'Inter Display, sans-serif',
                fontWeight: 500,
                fontSize: '14px',
                lineHeight: '18px',
                letterSpacing: '0%'
              }}>
                Between {selectedDates.length > 0 
                  ? `${format(selectedDates[0], 'd MMMM yyyy')} to ${selectedDates.length > 1 
                      ? format(selectedDates[selectedDates.length - 1], 'd MMMM yyyy')
                      : format(selectedDates[0], 'd MMMM yyyy')}` 
                  : `${format(startDate, 'd MMMM yyyy')} to ${format(endDate, 'd MMMM yyyy')}`}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Switch
                  checked={allDay}
                  onChange={handleAllDayToggle}
                  size="small"
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#1340FF',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#1340FF',
                    },
                  }}
                />
                <Typography variant="body2" sx={{ ml: 1, color: allDay ? '#1340FF' : 'text.primary' }}>
                  All Day
                </Typography>
              </Box>
              
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Click once to select the start date, then click again on the end date
                to include all days in between. Double-click for a single day, and
                click a selected date to deselect it.
              </Typography>
              
              <Box sx={{ borderTop: '1px solid #e0e0e0', my: 2 }} />
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <IconButton onClick={handlePrevMonth} size="small">
                  <Iconify icon="eva:arrow-ios-back-fill" />
                </IconButton>
                <Typography sx={{ 
                  fontFamily: 'Inter Display, sans-serif',
                  fontWeight: 600,
                  fontSize: '18px',
                  lineHeight: '22px',
                  letterSpacing: '0%'
                }}>
                  {format(currentMonth, 'MMM yyyy')}
                </Typography>
                <IconButton onClick={handleNextMonth} size="small">
                  <Iconify icon="eva:arrow-ios-forward-fill" />
                </IconButton>
              </Box>
              
              <Box sx={{ 
                width: '100%',
                maxWidth: { xs: '100%', sm: '450px' },
                mx: 'auto',
                pt: 2,
                pb: 0
              }}>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  textAlign: 'center',
                  mb: 2,
                  mt: 1
                }}>
                  {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                    <Typography key={day} variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '12px' }}>
                      {day}
                    </Typography>
                  ))}
                </Box>
                
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: { xs: 0, sm: 0 },
                  textAlign: 'center', 
                  mt: 2,
                  mb: 0,
                  mx: { xs: -1, sm: 0 }
                }}>
                  {generateCalendar().map((day, index) => {
                    if (!day.day) {
                      // Empty cell
                      return <Box key={`empty-${index}`} />;
                    }
                    
                    return (
                      <Box 
                        key={`day-${day.day}`}
                        onClick={() => handleDateClick(day.date)}
                        onDoubleClick={() => handleDoubleClick(day.date)}
                        sx={{
                          position: 'relative',
                          cursor: 'pointer',
                          height: { xs: 40, sm: 50 },
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: day.isSelected ? 'rgba(51, 102, 255, 0.08)' : 'transparent',
                          borderTopLeftRadius: day.isRangeStart ? '20px' : 0,
                          borderBottomLeftRadius: day.isRangeStart ? '20px' : 0,
                          borderTopRightRadius: day.isRangeEnd ? '20px' : 0,
                          borderBottomRightRadius: day.isRangeEnd ? '20px' : 0,
                          '&:hover': {
                            '& .MuiTypography-root': {
                              color: day.isPast ? 'text.secondary' : '#1340FF'
                            }
                          },
                          borderRight: index % 7 === 6 ? 'none' : 'none',
                          zIndex: day.isSelected ? 2 : 1
                        }}
                      >
                        {day.isRangeEndpoint ? (
                          <Box 
                            sx={{ 
                              width: { xs: 36, sm: 40 }, 
                              height: { xs: 36, sm: 40 }, 
                              bgcolor: '#3366FF', 
                              borderRadius: '50%', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              mx: 'auto'
                            }}
                          >
                            <Typography color="white" sx={{ fontSize: { xs: '14px', sm: '16px' } }}>{day.day}</Typography>
                          </Box>
                        ) : (
                          <Box sx={{ height: { xs: 36, sm: 40 }, width: { xs: 36, sm: 40 }, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto' }}>
                            <Typography 
                              color={(() => {
                                if (day.isPast) return 'text.secondary';
                                if (day.isSelected || day.isInRange) return '#1340FF';
                                return 'text.primary';
                              })()} 
                              sx={{ 
                                fontFamily: 'Inter Display, sans-serif',
                                fontSize: { xs: '14px', sm: '16px' }, 
                                fontWeight: (day.isSelected || day.isInRange) ? 500 : 400,
                                lineHeight: { xs: '18px', sm: '20px' },
                                letterSpacing: '0%',
                                textAlign: 'center'
                              }}
                            >
                              {day.day}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>
            
            <Box sx={{ mt: -2, mb: 0, display: 'flex', justifyContent: 'flex-end' }}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={selectAllDates}
                    onChange={handleSelectAllDates}
                    size="small"
                  />
                }
                label="Select All Dates"
                sx={{ '& .MuiTypography-root': { fontSize: '14px' } }}
              />
            </Box>
          </Grid>
          
          {/* Right side - Time selection */}
          <Grid item xs={12} md={6} sx={{ p: { xs: 2, sm: 3 }, position: 'relative', minHeight: { xs: 'auto', md: '500px' }, display: 'flex', flexDirection: 'column' }}>
            <Typography sx={{ 
              mb: 2, 
              fontFamily: 'Inter Display, sans-serif',
              fontWeight: 600,
              fontSize: '18px',
              lineHeight: '22px',
              letterSpacing: '0%'
            }}>
              Select Time Slots:
            </Typography>
            
            <ThemeProvider theme={createTheme({
              palette: {
                primary: {
                  main: '#1340FF',
                },
              },
              components: {
                MuiClock: {
                  styleOverrides: {
                    pin: {
                      backgroundColor: '#1340FF',
                    },
                    clock: {
                      '& .MuiClockNumber-root.Mui-selected': {
                        backgroundColor: '#1340FF',
                      },
                    },
                  },
                },
                MuiClockPointer: {
                  styleOverrides: {
                    root: {
                      backgroundColor: '#1340FF',
                    },
                    thumb: {
                      backgroundColor: '#1340FF',
                      borderColor: '#1340FF',
                    },
                  },
                },
                MuiMultiSectionDigitalClockSection: {
                  styleOverrides: {
                    item: {
                      '&.Mui-selected': {
                        backgroundColor: '#1340FF',
                        color: '#fff',
                      },
                    },
                  },
                },
              },
            })}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Box sx={{
                display: 'flex', 
                flexDirection: 'row',
                gap: 1, 
                mb: 3, 
                alignItems: 'center',
                width: '100%',
                '& .MuiDesktopTimePicker-root': {
                  flex: 1,
                  maxWidth: 'calc(50% - 15px)',
                },
                '& .MuiMultiSectionDigitalClockSection-item.Mui-selected': {
                  backgroundColor: '#1340FF !important',
                  color: '#fff !important'
                },
                '& .MuiMenuItem-root.Mui-selected': {
                  backgroundColor: '#1340FF !important',
                  color: '#fff !important'
                },
                '& .MuiClock-clock .MuiClockNumber-root.Mui-selected': {
                  backgroundColor: '#1340FF !important'
                },
                '& .MuiClockPointer-root': { 
                  backgroundColor: '#1340FF !important' 
                },
                '& .MuiClockPointer-thumb': { 
                  backgroundColor: '#1340FF !important', 
                  borderColor: '#1340FF !important' 
                },
                '& .MuiClock-pin': { 
                  backgroundColor: '#1340FF !important' 
                },
                '& .MuiPickersDay-root.Mui-selected': {
                  backgroundColor: '#1340FF !important'
                }
              }}>
                <DesktopTimePicker
                  value={startTime ? new Date(startTime) : new Date().setHours(9, 0, 0)}
                  onChange={(newTime) => {
                    if (newTime) {
                      handleStartTimeChange(new Date(newTime).getTime());
                    }
                  }}
                  sx={{ width: '100%' }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      sx: {
                        width: '100%',
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                        }
                      }
                    },
                    openPickerButton: {
                      sx: { color: '#1340FF' }
                    },
                    digitalClockItem: {
                      sx: {
                        '&.MuiMultiSectionDigitalClockSection-item.Mui-selected': {
                          backgroundColor: '#1340FF !important',
                          color: '#fff !important'
                        }
                      }
                    },
                    clock: {
                      sx: {
                        '& .MuiClock-clock .MuiClockNumber-root.Mui-selected': {
                          backgroundColor: '#1340FF !important'
                        }
                      }
                    },
                    popper: {
                      sx: {
                        '& .MuiClockPointer-root': { backgroundColor: '#1340FF' },
                        '& .MuiClockPointer-thumb': { backgroundColor: '#1340FF', borderColor: '#1340FF' },
                        '& .MuiClock-pin': { backgroundColor: '#1340FF' },
                        '& .MuiClockNumber-root.Mui-selected': { backgroundColor: '#1340FF' }
                      }
                    }
                  }}
                  format="h:mm a"
                />
                
                <Typography sx={{ mx: 0.5, alignSelf: 'center', textAlign: 'center', width: '20px' }}>to</Typography>
                
                <DesktopTimePicker
                  value={endTime ? new Date(endTime) : new Date().setHours(17, 0, 0)}
                  onChange={(newTime) => {
                    if (newTime) {
                      handleEndTimeChange(new Date(newTime).getTime());
                    }
                  }}
                  sx={{ width: '100%' }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      sx: {
                        width: '100%',
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                        }
                      }
                    },
                    openPickerButton: {
                      sx: { color: '#1340FF' }
                    },
                    digitalClockItem: {
                      sx: {
                        '&.MuiMultiSectionDigitalClockSection-item.Mui-selected': {
                          backgroundColor: '#1340FF !important',
                          color: '#fff !important'
                        }
                      }
                    },
                    clock: {
                      sx: {
                        '& .MuiClock-clock .MuiClockNumber-root.Mui-selected': {
                          backgroundColor: '#1340FF !important'
                        }
                      }
                    },
                    popper: {
                      sx: {
                        '& .MuiClockPointer-root': { backgroundColor: '#1340FF' },
                        '& .MuiClockPointer-thumb': { backgroundColor: '#1340FF', borderColor: '#1340FF' },
                        '& .MuiClock-pin': { backgroundColor: '#1340FF' },
                        '& .MuiClockNumber-root.Mui-selected': { backgroundColor: '#1340FF' }
                      }
                    }
                  }}
                  format="h:mm a"
                />
              </Box>
            </LocalizationProvider>
            </ThemeProvider>
            
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'row',
              alignItems: 'center', 
              mb: 3, 
              position: 'relative' 
            }}>
              <Checkbox 
                size="small" 
                checked={intervalsChecked}
                onChange={handleIntervalsChecked}
                sx={{
                  color: '#1340FF',
                  '&.Mui-checked': {
                    color: '#1340FF',
                  },
                  '& .MuiSvgIcon-root': {
                    color: '#1340FF',
                  }
                }}
              />
              <Typography variant="body2">Intervals</Typography>
              
              {intervalsChecked && (
                <Box 
                  onClick={() => setShowIntervalDropdown(!showIntervalDropdown)}
                  sx={{ 
                    ml: 2,
                    border: '1px solid #e0e0e0', 
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    alignSelf: { xs: 'flex-start', sm: 'center' }
                  }}
                >
                  <Typography sx={{ px: 2 }}>{interval} hr</Typography>
                  <IconButton size="small" sx={{ color: '#1340FF' }}>
                    <Iconify icon="mdi:chevron-down" />
                  </IconButton>
                </Box>
              )}
              
              {showIntervalDropdown && (
                <Box sx={{
                  position: 'absolute',
                  top: { xs: '40px', sm: '100%' },
                  left: { xs: '0', sm: 'auto' },
                  right: { xs: 'auto', sm: '0' },
                  mt: 1,
                  bgcolor: 'background.paper',
                  boxShadow: 3,
                  borderRadius: 1,
                  zIndex: 10,
                  width: { xs: '150px', sm: 'auto' }
                }}>
                  {intervalOptions.map((option) => (
                    <Box 
                      key={option}
                      onClick={() => handleIntervalChange(option)}
                      sx={{ 
                        p: 1.5, 
                        borderBottom: '1px solid #e0e0e0',
                        '&:hover': { bgcolor: 'rgba(51, 102, 255, 0.08)' },
                        cursor: 'pointer',
                        bgcolor: interval === option ? 'rgba(51, 102, 255, 0.08)' : 'transparent'
                      }}
                    >
                      <Typography>{option} hr</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
            
            <Box sx={{ borderTop: '1px solid #e0e0e0', my: 2 }} />
            
            {/* Time slots display area */}
            <Box sx={{ mb: 3 }}>
              {intervalsChecked && startTime && endTime ? (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                    {generatedTimeSlots.map((slot, index) => (
                      <Box 
                        key={index}
                        onClick={() => toggleTimeSlotSelection(index)}
                        sx={{
                          border: `1px solid ${slot.selected ? '#1340FF' : '#e0e0e0'}`,
                          borderRadius: 1,
                          p: 2,
                          minWidth: { xs: '140px', sm: '180px' },
                          width: { xs: 'calc(50% - 8px)', sm: 'auto' },
                          textAlign: 'center',
                          cursor: 'pointer',
                          color: slot.selected ? '#1340FF' : 'text.primary',
                          bgcolor: slot.selected ? 'rgba(51, 102, 255, 0.05)' : 'transparent'
                        }}
                      >
                        <Typography sx={{ 
                          fontFamily: 'Inter Display, sans-serif',
                          fontWeight: 400,
                          fontSize: '14px',
                          lineHeight: '18px',
                          letterSpacing: '0%',
                          color: slot.selected ? '#1340FF' : 'inherit'
                        }}>
                          {formatTimeSlot(slot)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Box sx={{ 
                    border: '1px solid #e0e0e0', 
                    borderRadius: 1, 
                    p: 2, 
                    display: 'inline-block',
                    minWidth: '200px'
                  }}>
                    <Typography sx={{ 
                      fontFamily: 'Inter Display, sans-serif',
                      fontWeight: 400,
                      fontSize: '14px',
                      lineHeight: '18px',
                      letterSpacing: '0%',
                      color: 'text.secondary'
                    }}>
                      {startTime && endTime ? 
                        `${format(new Date(startTime), 'h:mm a')} - ${format(new Date(endTime), 'h:mm a')}` : 
                        'Select start and end times'}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
            
            {/* Flexible spacer */}
            <Box sx={{ flexGrow: 1 }} />
            
            {/* Save Time Slots button positioned at the bottom right of the time slots section */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'flex-end',
              position: { xs: 'relative', md: 'absolute' },
              bottom: { xs: 'auto', md: 20 },
              right: { xs: 'auto', md: 20 },
              mt: { xs: 2, md: 0 }
            }}>
              <Button 
                variant="contained" 
                disabled={!intervalsChecked || selectedTimeSlots.length === 0}
                onClick={handleSaveTimeSlots}
                sx={{ 
                  width: 167,
                  height: 52,
                  background: intervalsChecked && selectedTimeSlots.length > 0 ? 
                    '#3A3A3C' : 
                    'linear-gradient(0deg, #3A3A3C, #3A3A3C), linear-gradient(0deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6))',
                  '&:hover': { bgcolor: intervalsChecked && selectedTimeSlots.length > 0 ? '#2A2A2C' : undefined },
                  borderRadius: '12px',
                  pt: '10px',
                  pr: '16px',
                  pb: '13px',
                  pl: '16px',
                  boxShadow: intervalsChecked && selectedTimeSlots.length > 0 ? 
                    '0px -3px 0px 0px #00000073 inset' : 
                    '0px -3px 0px 0px #0000001A inset',
                  gap: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: intervalsChecked && selectedTimeSlots.length > 0 ? 1 : 0.7,
                  cursor: intervalsChecked && selectedTimeSlots.length > 0 ? 'pointer' : 'not-allowed'
                }}
              >
                <Typography sx={{
                  fontFamily: 'Inter Display, sans-serif',
                  fontWeight: 600,
                  fontSize: '16px',
                  lineHeight: '22px',
                  letterSpacing: '0%',
                  color: 'white'
                }}>
                  Save Time Slots
                </Typography>
              </Button>
            </Box>
            
          </Grid>
        </Grid>
        
      </Box>
      
      <Box sx={{ 
        border: '1px solid #e0e0e0', 
        borderRadius: 1, 
        p: 3,
        boxShadow: '0px 0px 5px rgba(0, 0, 0, 0.05)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            component="img"
            src="/assets/icons/components/event_note.svg"
            alt="Reservation Slots"
            sx={{ width: 12, height: 14, mr: 1 }}
          />
          <Typography sx={{ 
            fontFamily: 'Inter Display, sans-serif',
            fontWeight: 600,
            fontSize: '12px',
            lineHeight: '16px',
            letterSpacing: '0%',
            textTransform: 'uppercase',
            color: '#231F20'
          }}>
            RESERVATION SLOTS
          </Typography>
        </Box>
        
        <Box sx={{ borderTop: '1px solid #e0e0e0', my: 2 }} />
        
        {savedTimeSlots.length > 0 ? (
          <Box sx={{ mt: 2 }}>
            {savedTimeSlots.map((group, index) => (
              <Box key={index} sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}>
                <Box
                  component="img"
                  src="/assets/icons/components/slotscom.svg"
                  alt="Time Slot"
                  sx={{ width: 14, height: 19, mr: 1, mt: 0.5 }}
                />
                <Box>
                  <Typography sx={{ 
                    fontFamily: 'Inter Display, sans-serif',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '18px',
                    letterSpacing: '0%',
                    color: '#636366'
                  }}>
                    {formatDateRange(group.dates)}
                  </Typography>
                  <Typography sx={{ 
                    fontFamily: 'Inter Display, sans-serif',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '18px',
                    letterSpacing: '0%',
                    color: '#636366'
                  }}>
                    {formatTimeSlotsForDisplay(group.slots)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography sx={{ 
            fontFamily: 'Inter Display, sans-serif',
            fontWeight: 400,
            fontSize: '14px',
            lineHeight: '18px',
            letterSpacing: '0%',
            color: '#636366'
          }}>
            Saved time slots will show up here.
          </Typography>
        )}
      </Box>
      
      {/* No popovers needed - using direct input fields */}
    </Box>
  );
};

export default ReservationSlots;
