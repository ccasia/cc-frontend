import { useFormContext } from 'react-hook-form';
import React, { useMemo, useState, useEffect } from 'react';
import {
  format,
  isBefore,
  endOfDay,
  isSameDay,
  endOfWeek,
  addMonths,
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

// const ReservationSlots = () => {
//   const { enqueueSnackbar } = useSnackbar();
//   const { watch, setValue } = useFormContext();
//   const savedRules = watch('availabilityRules') || [];

//   const [startDate, setStartDate] = useState(new Date());
//   const [endDate, setEndDate] = useState(addDays(new Date(), 30));
//   const [startTime, setStartTime] = useState(new Date().setHours(9, 0, 0));
//   const [endTime, setEndTime] = useState(new Date().setHours(17, 0, 0));
//   const [interval, setInterval] = useState(1);
//   const [allDay, setAllDay] = useState(false);
//   const [selectedDates, setSelectedDates] = useState([]);
//   const [currentMonth, setCurrentMonth] = useState(new Date());
//   const [selectAllDates, setSelectAllDates] = useState(false);
//   const [dateRange, setDateRange] = useState([null, null]);
//   const [intervalsChecked, setIntervalsChecked] = useState(false);
//   const [intervalOptions] = useState([0.5, 1, 1.5, 2, 3, 4]);
//   const [showIntervalDropdown, setShowIntervalDropdown] = useState(false);
//   const [generatedTimeSlots, setGeneratedTimeSlots] = useState([]);
//   const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
//   // Direct time input - no need for picker state variables
//   // const [savedTimeSlots, setSavedTimeSlots] = useState([]);

//   // Generate time slots when component mounts or when relevant values change
//   useEffect(() => {
//     if (intervalsChecked && startTime && endTime) {
//       generateTimeSlots(startTime, endTime, interval, intervalsChecked);
//     }
//   }, [intervalsChecked, startTime, endTime, interval]);

//   // Generate calendar data for the current month
//   const generateCalendar = () => {
//     const year = currentMonth.getFullYear();
//     const month = currentMonth.getMonth();
//     const firstDay = new Date(year, month, 1).getDay();
//     const daysInMonth = new Date(year, month + 1, 0).getDate();
//     const today = new Date();

//     const days = [];

//     for (let i = 0; i < firstDay; i += 1) {
//       days.push({ day: null, date: null });
//     }

//     let rangeStartDate = null;
//     let rangeEndDate = null;

//     if (selectedDates.length > 0) {
//       const sortedDates = [...selectedDates].sort((a, b) => a - b);
//       rangeStartDate = sortedDates[0];
//       rangeEndDate = sortedDates[sortedDates.length - 1];
//     }

//     const selectedDatesMap = {};
//     selectedDates.forEach((date) => {
//       const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

//       const isRangeEndpoint =
//         date.getTime() === rangeStartDate?.getTime() || date.getTime() === rangeEndDate?.getTime();

//       selectedDatesMap[key] = {
//         selected: true,
//         isRangeEndpoint,
//       };
//     });

//     for (let i = 1; i <= daysInMonth; i += 1) {
//       const date = new Date(year, month, i);
//       const isToday =
//         date.getDate() === today.getDate() &&
//         date.getMonth() === today.getMonth() &&
//         date.getFullYear() === today.getFullYear();

//       const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
//       const dateInfo = selectedDatesMap[dateKey] || { selected: false, isRangeEndpoint: false };
//       const isSelected = dateInfo.selected;
//       const { isRangeEndpoint } = dateInfo;

//       const isInRange =
//         rangeStartDate && rangeEndDate && date >= rangeStartDate && date <= rangeEndDate;

//       let isRangeStart = false;
//       let isRangeEnd = false;

//       if (isInRange) {
//         isRangeStart = date.getTime() === rangeStartDate.getTime() || date.getDay() === 0;
//         isRangeEnd = date.getTime() === rangeEndDate.getTime() || date.getDay() === 6;
//       }

//       const isPast = date < new Date(today.setHours(0, 0, 0, 0));

//       days.push({
//         day: i,
//         date,
//         isToday,
//         isSelected: dateInfo.selected,
//         isPast,
//         isRangeEndpoint: dateInfo.isRangeEndpoint,
//         isInRange,
//         isRangeStart,
//         isRangeEnd,
//       });
//     }

//     return days;
//   };

//   const handleDateClick = (date) => {
//     if (!date) return;

//     console.log('Date clicked:', format(date, 'yyyy-MM-dd'));

//     const isDateSelected = selectedDates.some(
//       (selectedDate) =>
//         selectedDate.getDate() === date.getDate() &&
//         selectedDate.getMonth() === date.getMonth() &&
//         selectedDate.getFullYear() === date.getFullYear()
//     );

//     if (isDateSelected) {
//       const newSelectedDates = selectedDates.filter(
//         (selectedDate) =>
//           !(
//             selectedDate.getDate() === date.getDate() &&
//             selectedDate.getMonth() === date.getMonth() &&
//             selectedDate.getFullYear() === date.getFullYear()
//           )
//       );

//       console.log(
//         'Deselected date, new selected dates:',
//         newSelectedDates.map((d) => format(d, 'yyyy-MM-dd'))
//       );
//       setSelectedDates(newSelectedDates);

//       if (newSelectedDates.length === 0) {
//         setDateRange([null, null]);
//       } else if (newSelectedDates.length === 1) {
//         setDateRange([newSelectedDates[0], null]);
//       } else {
//         const sortedDates = [...newSelectedDates].sort((a, b) => a.getTime() - b.getTime());
//         setDateRange([sortedDates[0], sortedDates[sortedDates.length - 1]]);
//       }
//     } else if (dateRange[0] && !dateRange[1]) {
//       if (date < dateRange[0]) {
//         setDateRange([date, dateRange[0]]);
//       } else {
//         setDateRange([dateRange[0], date]);
//       }

//       const allDatesInRange = [];
//       const start = new Date(dateRange[0]);
//       const end = new Date(date);

//       console.log(
//         `Creating date range from ${format(start, 'yyyy-MM-dd')} to ${format(end, 'yyyy-MM-dd')}`
//       );

//       const current = new Date(start);
//       while (current <= end) {
//         allDatesInRange.push(new Date(current));
//         current.setDate(current.getDate() + 1);
//       }

//       console.log(
//         'All dates in range:',
//         allDatesInRange.map((d) => format(d, 'yyyy-MM-dd'))
//       );
//       setSelectedDates(allDatesInRange);
//     } else {
//       setDateRange([date, null]);
//       setSelectedDates([date]);
//       console.log('Started new selection with date:', format(date, 'yyyy-MM-dd'));
//     }
//   };

//   const handleDoubleClick = (date) => {
//     if (!date) return;

//     const isSelected = selectedDates.some(
//       (selectedDate) =>
//         selectedDate.getDate() === date.getDate() &&
//         selectedDate.getMonth() === date.getMonth() &&
//         selectedDate.getFullYear() === date.getFullYear()
//     );

//     if (isSelected) {
//       setSelectedDates(
//         selectedDates.filter(
//           (selectedDate) =>
//             !(
//               selectedDate.getDate() === date.getDate() &&
//               selectedDate.getMonth() === date.getMonth() &&
//               selectedDate.getFullYear() === date.getFullYear()
//             )
//         )
//       );
//     } else {
//       setSelectedDates([...selectedDates, date]);
//     }

//     setDateRange([null, null]);
//   };

//   const handlePrevMonth = () => {
//     setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
//   };

//   const handleNextMonth = () => {
//     setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
//   };

//   const handleSelectAllDates = (event) => {
//     setSelectAllDates(event.target.checked);
//     if (event.target.checked) {
//       const year = currentMonth.getFullYear();
//       const month = currentMonth.getMonth();
//       const daysInMonth = new Date(year, month + 1, 0).getDate();

//       const dates = [];
//       for (let i = 1; i <= daysInMonth; i += 1) {
//         dates.push(new Date(year, month, i));
//       }

//       setSelectedDates(dates);
//       setDateRange([dates[0], dates[dates.length - 1]]);
//     } else {
//       setSelectedDates([]);
//       setDateRange([null, null]);
//     }
//   };

//   const handleAllDayToggle = (event) => {
//     setAllDay(event.target.checked);
//     if (event.target.checked) {
//       setStartTime(null);
//       setEndTime(null);
//     }
//   };

//   const handleStartTimeChange = (time) => {
//     setStartTime(time);
//     generateTimeSlots(time, endTime, interval, intervalsChecked);
//   };

//   const handleEndTimeChange = (time) => {
//     setEndTime(time);
//     generateTimeSlots(startTime, time, interval, intervalsChecked);
//   };

//   const handleIntervalChange = (newInterval) => {
//     setInterval(newInterval);
//     setShowIntervalDropdown(false);
//     generateTimeSlots(startTime, endTime, newInterval, intervalsChecked);
//   };

//   const handleIntervalsChecked = (event) => {
//     const isChecked = event.target.checked;
//     console.log(`Intervals checkbox ${isChecked ? 'checked' : 'unchecked'}`);
//     setIntervalsChecked(isChecked);
//     generateTimeSlots(startTime, endTime, interval, isChecked);
//   };

//   const generateTimeSlots = (start, end, intervalHours, enabled) => {
//     if (!enabled || !start || !end) {
//       setGeneratedTimeSlots([]);
//       return;
//     }

//     console.log(
//       `Generating time slots from ${format(new Date(start), 'h:mm a')} to ${format(new Date(end), 'h:mm a')} with interval ${intervalHours} hours`
//     );

//     const slots = [];
//     const slotStartDate = new Date(start);
//     const slotEndDate = new Date(end);

//     let currentTime = new Date(slotStartDate);
//     while (currentTime < slotEndDate) {
//       const slotEnd = new Date(currentTime);
//       slotEnd.setHours(currentTime.getHours() + Math.floor(intervalHours));
//       slotEnd.setMinutes(currentTime.getMinutes() + (intervalHours % 1) * 60);

//       if (slotEnd > slotEndDate) {
//         break;
//       }

//       slots.push({
//         start: new Date(currentTime),
//         end: new Date(slotEnd),
//         selected: false,
//       });

//       currentTime = new Date(slotEnd);
//     }

//     console.log(
//       `Generated ${slots.length} time slots:`,
//       slots.map((slot) => `${format(slot.start, 'h:mm a')} - ${format(slot.end, 'h:mm a')}`)
//     );

//     setGeneratedTimeSlots(slots);
//   };

//   const toggleTimeSlotSelection = (index) => {
//     const updatedSlots = [...generatedTimeSlots];
//     updatedSlots[index].selected = !updatedSlots[index].selected;
//     setGeneratedTimeSlots(updatedSlots);

//     if (updatedSlots[index].selected) {
//       setSelectedTimeSlots([...selectedTimeSlots, updatedSlots[index]]);
//     } else {
//       setSelectedTimeSlots(
//         selectedTimeSlots.filter(
//           (slot) =>
//             !(
//               slot.start.getTime() === updatedSlots[index].start.getTime() &&
//               slot.end.getTime() === updatedSlots[index].end.getTime()
//             )
//         )
//       );
//     }
//   };

//   const handleSaveTimeSlots = () => {
//     if (selectedDates.length === 0) {
//       enqueueSnackbar('Please select at least one date before saving', { variant: 'error' });
//       return;
//     }

//     if (intervalsChecked && selectedTimeSlots.length === 0) {
//       enqueueSnackbar('Please select at least one time slot interval from the grid', {
//         variant: 'error',
//       });
//       return;
//     }

//     if (!startTime || !endTime) {
//       enqueueSnackbar('Please select start and end time', { variant: 'error' });
//       return;
//     }

//     let newRule;

//     if (intervalsChecked) {
//       // Sort selected slots to find range
//       const sortedSlots = [...selectedTimeSlots].sort((a, b) => a.start - b.start);

//       newRule = {
//         dates: selectedDates.map((date) => format(date, 'yyyy-MM-dd')),
//         startTime: format(sortedSlots[0].start, 'HH:mm'),
//         endTime: format(sortedSlots[sortedSlots.length - 1].end, 'HH:mm'),
//         interval: Number(interval),
//       };
//     } else {
//       // Standard Range (No intervals)
//       newRule = {
//         dates: selectedDates.map((date) => format(date, 'yyyy-MM-dd')),
//         startTime: format(new Date(startTime), 'HH:mm'),
//         endTime: format(new Date(endTime), 'HH:mm'),
//         interval: Number(interval), // Default interval if not checked
//       };
//     }

//     const updatedRules = [...savedRules, newRule];
//     setValue('availabilityRules', updatedRules);

//     setSelectedDates([]);
//     setDateRange([null, null]);
//     setSelectedTimeSlots([]);
//     setGeneratedTimeSlots([]);
//     // setSelectAllDates(false);

//     enqueueSnackbar('Availability rule added successfully!', { variant: 'success' });
//   };

//   // Utility to format list of dates nicely (e.g., "7 Oct - 10 Oct")
//   const formatDateRange = (dateStrings) => {
//     if (!dateStrings || dateStrings.length === 0) return '';
//     const dates = dateStrings.map((d) => new Date(d)).sort((a, b) => a - b);

//     if (dates.length === 1) return format(dates[0], 'd MMM yyyy');

//     const ranges = [];
//     let rangeStart = dates[0];
//     let rangeEnd = dates[0];

//     for (let i = 1; i < dates.length; i += 1) {
//       const prevDate = dates[i - 1];
//       const currDate = dates[i];
//       const dayDiff = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

//       if (dayDiff === 1) {
//         rangeEnd = currDate;
//       } else {
//         ranges.push([rangeStart, rangeEnd]);
//         rangeStart = currDate;
//         rangeEnd = currDate;
//       }
//     }
//     ranges.push([rangeStart, rangeEnd]);

//     return ranges
//       .map(([start, end]) => {
//         if (start.getTime() === end.getTime()) {
//           return format(start, 'd MMM');
//         }
//         return `${format(start, 'd MMM')} - ${format(end, 'd MMM')}`;
//       })
//       .join(', ');
//   };

//   const formatTimeSlot = (slot) =>
//     `${format(slot.start, 'h:mm a')} - ${format(slot.end, 'h:mm a')}`;

//   return (
//     <Box
//       sx={{
//         display: 'flex',
//         flexDirection: 'column',
//         gap: 3,
//         p: { xs: 2, sm: 3 },
//         maxWidth: 900,
//         mx: 'auto',
//       }}
//     >
//       <Typography
//         textAlign="center"
//         sx={{
//           mb: 2,
//           fontFamily: 'Inter Display, sans-serif',
//           fontWeight: 400,
//           fontSize: '16px',
//           lineHeight: '20px',
//           letterSpacing: '0%',
//           color: '#231F20',
//         }}
//       >
//         Add options for creators to select their available time slots. Times are standardized to
//         Malaysian time (UTC+08:00).
//       </Typography>

//       <Box
//         sx={{
//           border: '1px solid #e0e0e0',
//           borderRadius: 1,
//           overflow: 'hidden',
//           boxShadow: '0px 0px 5px rgba(0, 0, 0, 0.05)',
//           position: 'relative',
//         }}
//       >
//         <Grid container spacing={{ xs: 0, md: 0 }}>
//           {/* Left side - Date selection */}
//           <Grid
//             item
//             xs={12}
//             md={6}
//             sx={{
//               borderRight: { xs: 'none', md: '1px solid #e0e0e0' },
//               borderBottom: { xs: '1px solid #e0e0e0', md: 'none' },
//               p: { xs: 2, sm: 3, md: 4 },
//             }}
//           >
//             <Typography
//               sx={{
//                 mb: 2,
//                 fontFamily: 'Inter Display, sans-serif',
//                 fontWeight: 600,
//                 fontSize: '18px',
//                 lineHeight: '22px',
//                 letterSpacing: '0%',
//               }}
//             >
//               Select Dates:
//             </Typography>

//             <Box sx={{ mb: 2 }}>
//               <Typography
//                 sx={{
//                   mb: 1,
//                   fontFamily: 'Inter Display, sans-serif',
//                   fontWeight: 500,
//                   fontSize: '14px',
//                   lineHeight: '18px',
//                   letterSpacing: '0%',
//                 }}
//               >
//                 Between{' '}
//                 {selectedDates.length > 0
//                   ? `${format(selectedDates[0], 'd MMMM yyyy')} to ${
//                       selectedDates.length > 1
//                         ? format(selectedDates[selectedDates.length - 1], 'd MMMM yyyy')
//                         : format(selectedDates[0], 'd MMMM yyyy')
//                     }`
//                   : `${format(startDate, 'd MMMM yyyy')} to ${format(endDate, 'd MMMM yyyy')}`}
//               </Typography>

//               <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
//                 <Switch
//                   checked={allDay}
//                   onChange={handleAllDayToggle}
//                   size="small"
//                   sx={{
//                     '& .MuiSwitch-switchBase.Mui-checked': {
//                       color: '#1340FF',
//                     },
//                     '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
//                       backgroundColor: '#1340FF',
//                     },
//                   }}
//                 />
//                 <Typography
//                   variant="body2"
//                   sx={{ ml: 1, color: allDay ? '#1340FF' : 'text.primary' }}
//                 >
//                   All Day
//                 </Typography>
//               </Box>

//               <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
//                 Click once to select the start date, then click again on the end date to include all
//                 days in between. Double-click for a single day, and click a selected date to
//                 deselect it.
//               </Typography>

//               <Box sx={{ borderTop: '1px solid #e0e0e0', my: 2 }} />
//             </Box>

//             <Box sx={{ mb: 2 }}>
//               <Box
//                 sx={{
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'space-between',
//                   mb: 2,
//                 }}
//               >
//                 <IconButton onClick={handlePrevMonth} size="small">
//                   <Iconify icon="eva:arrow-ios-back-fill" />
//                 </IconButton>
//                 <Typography
//                   sx={{
//                     fontFamily: 'Inter Display, sans-serif',
//                     fontWeight: 600,
//                     fontSize: '18px',
//                     lineHeight: '22px',
//                     letterSpacing: '0%',
//                   }}
//                 >
//                   {format(currentMonth, 'MMM yyyy')}
//                 </Typography>
//                 <IconButton onClick={handleNextMonth} size="small">
//                   <Iconify icon="eva:arrow-ios-forward-fill" />
//                 </IconButton>
//               </Box>

//               <Box
//                 sx={{
//                   width: '100%',
//                   maxWidth: { xs: '100%', sm: '450px' },
//                   mx: 'auto',
//                   pt: 2,
//                   pb: 0,
//                 }}
//               >
//                 <Box
//                   sx={{
//                     display: 'grid',
//                     gridTemplateColumns: 'repeat(7, 1fr)',
//                     textAlign: 'center',
//                     mb: 2,
//                     mt: 1,
//                   }}
//                 >
//                   {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
//                     <Typography
//                       key={day}
//                       variant="caption"
//                       sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '12px' }}
//                     >
//                       {day}
//                     </Typography>
//                   ))}
//                 </Box>

//                 <Box
//                   sx={{
//                     display: 'grid',
//                     gridTemplateColumns: 'repeat(7, 1fr)',
//                     gap: { xs: 0, sm: 0 },
//                     textAlign: 'center',
//                     mt: 2,
//                     mb: 0,
//                     mx: { xs: -1, sm: 0 },
//                   }}
//                 >
//                   {generateCalendar().map((day, index) => {
//                     if (!day.day) {
//                       // Empty cell
//                       return <Box key={`empty-${index}`} />;
//                     }

//                     return (
//                       <Box
//                         key={`day-${day.day}`}
//                         onClick={() => handleDateClick(day.date)}
//                         onDoubleClick={() => handleDoubleClick(day.date)}
//                         sx={{
//                           position: 'relative',
//                           cursor: 'pointer',
//                           height: { xs: 40, sm: 50 },
//                           display: 'flex',
//                           alignItems: 'center',
//                           justifyContent: 'center',
//                           bgcolor: day.isSelected ? 'rgba(51, 102, 255, 0.08)' : 'transparent',
//                           borderTopLeftRadius: day.isRangeStart ? '20px' : 0,
//                           borderBottomLeftRadius: day.isRangeStart ? '20px' : 0,
//                           borderTopRightRadius: day.isRangeEnd ? '20px' : 0,
//                           borderBottomRightRadius: day.isRangeEnd ? '20px' : 0,
//                           '&:hover': {
//                             '& .MuiTypography-root': {
//                               color: day.isPast ? 'text.secondary' : '#1340FF',
//                             },
//                           },
//                           borderRight: index % 7 === 6 ? 'none' : 'none',
//                           zIndex: day.isSelected ? 2 : 1,
//                         }}
//                       >
//                         {day.isRangeEndpoint ? (
//                           <Box
//                             sx={{
//                               width: { xs: 36, sm: 40 },
//                               height: { xs: 36, sm: 40 },
//                               bgcolor: '#3366FF',
//                               borderRadius: '50%',
//                               display: 'flex',
//                               alignItems: 'center',
//                               justifyContent: 'center',
//                               mx: 'auto',
//                             }}
//                           >
//                             <Typography color="white" sx={{ fontSize: { xs: '14px', sm: '16px' } }}>
//                               {day.day}
//                             </Typography>
//                           </Box>
//                         ) : (
//                           <Box
//                             sx={{
//                               height: { xs: 36, sm: 40 },
//                               width: { xs: 36, sm: 40 },
//                               display: 'flex',
//                               alignItems: 'center',
//                               justifyContent: 'center',
//                               mx: 'auto',
//                             }}
//                           >
//                             <Typography
//                               color={(() => {
//                                 if (day.isPast) return 'text.secondary';
//                                 if (day.isSelected || day.isInRange) return '#1340FF';
//                                 return 'text.primary';
//                               })()}
//                               sx={{
//                                 fontFamily: 'Inter Display, sans-serif',
//                                 fontSize: { xs: '14px', sm: '16px' },
//                                 fontWeight: day.isSelected || day.isInRange ? 500 : 400,
//                                 lineHeight: { xs: '18px', sm: '20px' },
//                                 letterSpacing: '0%',
//                                 textAlign: 'center',
//                               }}
//                             >
//                               {day.day}
//                             </Typography>
//                           </Box>
//                         )}
//                       </Box>
//                     );
//                   })}
//                 </Box>
//               </Box>
//             </Box>

//             <Box sx={{ mt: -2, mb: 0, display: 'flex', justifyContent: 'flex-end' }}>
//               <FormControlLabel
//                 control={
//                   <Checkbox checked={selectAllDates} onChange={handleSelectAllDates} size="small" />
//                 }
//                 label="Select All Dates"
//                 sx={{ '& .MuiTypography-root': { fontSize: '14px' } }}
//               />
//             </Box>
//           </Grid>

//           {/* Right side - Time selection */}
//           <Grid
//             item
//             xs={12}
//             md={6}
//             sx={{
//               p: { xs: 2, sm: 3 },
//               position: 'relative',
//               minHeight: { xs: 'auto', md: '500px' },
//               display: 'flex',
//               flexDirection: 'column',
//             }}
//           >
//             <Typography
//               sx={{
//                 mb: 2,
//                 fontFamily: 'Inter Display, sans-serif',
//                 fontWeight: 600,
//                 fontSize: '18px',
//                 lineHeight: '22px',
//                 letterSpacing: '0%',
//               }}
//             >
//               Select Time Slots:
//             </Typography>

//             <ThemeProvider
//               theme={createTheme({
//                 palette: {
//                   primary: {
//                     main: '#1340FF',
//                   },
//                 },
//                 components: {
//                   MuiClock: {
//                     styleOverrides: {
//                       pin: {
//                         backgroundColor: '#1340FF',
//                       },
//                       clock: {
//                         '& .MuiClockNumber-root.Mui-selected': {
//                           backgroundColor: '#1340FF',
//                         },
//                       },
//                     },
//                   },
//                   MuiClockPointer: {
//                     styleOverrides: {
//                       root: {
//                         backgroundColor: '#1340FF',
//                       },
//                       thumb: {
//                         backgroundColor: '#1340FF',
//                         borderColor: '#1340FF',
//                       },
//                     },
//                   },
//                   MuiMultiSectionDigitalClockSection: {
//                     styleOverrides: {
//                       item: {
//                         '&.Mui-selected': {
//                           backgroundColor: '#1340FF',
//                           color: '#fff',
//                         },
//                       },
//                     },
//                   },
//                 },
//               })}
//             >
//               <LocalizationProvider dateAdapter={AdapterDateFns}>
//                 <Box
//                   sx={{
//                     display: 'flex',
//                     flexDirection: 'row',
//                     gap: 1,
//                     mb: 3,
//                     alignItems: 'center',
//                     width: '100%',
//                     '& .MuiDesktopTimePicker-root': {
//                       flex: 1,
//                       maxWidth: 'calc(50% - 15px)',
//                     },
//                     '& .MuiMultiSectionDigitalClockSection-item.Mui-selected': {
//                       backgroundColor: '#1340FF !important',
//                       color: '#fff !important',
//                     },
//                     '& .MuiMenuItem-root.Mui-selected': {
//                       backgroundColor: '#1340FF !important',
//                       color: '#fff !important',
//                     },
//                     '& .MuiClock-clock .MuiClockNumber-root.Mui-selected': {
//                       backgroundColor: '#1340FF !important',
//                     },
//                     '& .MuiClockPointer-root': {
//                       backgroundColor: '#1340FF !important',
//                     },
//                     '& .MuiClockPointer-thumb': {
//                       backgroundColor: '#1340FF !important',
//                       borderColor: '#1340FF !important',
//                     },
//                     '& .MuiClock-pin': {
//                       backgroundColor: '#1340FF !important',
//                     },
//                     '& .MuiPickersDay-root.Mui-selected': {
//                       backgroundColor: '#1340FF !important',
//                     },
//                   }}
//                 >
//                   <DesktopTimePicker
//                     value={startTime ? new Date(startTime) : new Date().setHours(9, 0, 0)}
//                     onChange={(newTime) => {
//                       if (newTime) {
//                         handleStartTimeChange(new Date(newTime).getTime());
//                       }
//                     }}
//                     sx={{ width: '100%' }}
//                     slotProps={{
//                       textField: {
//                         fullWidth: true,
//                         sx: {
//                           width: '100%',
//                           '& .MuiOutlinedInput-root': {
//                             borderRadius: 1,
//                           },
//                         },
//                       },
//                       openPickerButton: {
//                         sx: { color: '#1340FF' },
//                       },
//                       digitalClockItem: {
//                         sx: {
//                           '&.MuiMultiSectionDigitalClockSection-item.Mui-selected': {
//                             backgroundColor: '#1340FF !important',
//                             color: '#fff !important',
//                           },
//                         },
//                       },
//                       clock: {
//                         sx: {
//                           '& .MuiClock-clock .MuiClockNumber-root.Mui-selected': {
//                             backgroundColor: '#1340FF !important',
//                           },
//                         },
//                       },
//                       popper: {
//                         sx: {
//                           '& .MuiClockPointer-root': { backgroundColor: '#1340FF' },
//                           '& .MuiClockPointer-thumb': {
//                             backgroundColor: '#1340FF',
//                             borderColor: '#1340FF',
//                           },
//                           '& .MuiClock-pin': { backgroundColor: '#1340FF' },
//                           '& .MuiClockNumber-root.Mui-selected': { backgroundColor: '#1340FF' },
//                         },
//                       },
//                     }}
//                     format="h:mm a"
//                   />

//                   <Typography
//                     sx={{ mx: 0.5, alignSelf: 'center', textAlign: 'center', width: '20px' }}
//                   >
//                     to
//                   </Typography>

//                   <DesktopTimePicker
//                     value={endTime ? new Date(endTime) : new Date().setHours(17, 0, 0)}
//                     onChange={(newTime) => {
//                       if (newTime) {
//                         handleEndTimeChange(new Date(newTime).getTime());
//                       }
//                     }}
//                     sx={{ width: '100%' }}
//                     slotProps={{
//                       textField: {
//                         fullWidth: true,
//                         sx: {
//                           width: '100%',
//                           '& .MuiOutlinedInput-root': {
//                             borderRadius: 1,
//                           },
//                         },
//                       },
//                       openPickerButton: {
//                         sx: { color: '#1340FF' },
//                       },
//                       digitalClockItem: {
//                         sx: {
//                           '&.MuiMultiSectionDigitalClockSection-item.Mui-selected': {
//                             backgroundColor: '#1340FF !important',
//                             color: '#fff !important',
//                           },
//                         },
//                       },
//                       clock: {
//                         sx: {
//                           '& .MuiClock-clock .MuiClockNumber-root.Mui-selected': {
//                             backgroundColor: '#1340FF !important',
//                           },
//                         },
//                       },
//                       popper: {
//                         sx: {
//                           '& .MuiClockPointer-root': { backgroundColor: '#1340FF' },
//                           '& .MuiClockPointer-thumb': {
//                             backgroundColor: '#1340FF',
//                             borderColor: '#1340FF',
//                           },
//                           '& .MuiClock-pin': { backgroundColor: '#1340FF' },
//                           '& .MuiClockNumber-root.Mui-selected': { backgroundColor: '#1340FF' },
//                         },
//                       },
//                     }}
//                     format="h:mm a"
//                   />
//                 </Box>
//               </LocalizationProvider>
//             </ThemeProvider>

//             <Box
//               sx={{
//                 display: 'flex',
//                 flexDirection: 'row',
//                 alignItems: 'center',
//                 mb: 3,
//                 position: 'relative',
//               }}
//             >
//               <Checkbox
//                 size="small"
//                 checked={intervalsChecked}
//                 onChange={handleIntervalsChecked}
//                 sx={{
//                   color: '#1340FF',
//                   '&.Mui-checked': {
//                     color: '#1340FF',
//                   },
//                   '& .MuiSvgIcon-root': {
//                     color: '#1340FF',
//                   },
//                 }}
//               />
//               <Typography variant="body2">Intervals</Typography>

//               {intervalsChecked && (
//                 <Box
//                   onClick={() => setShowIntervalDropdown(!showIntervalDropdown)}
//                   sx={{
//                     ml: 2,
//                     border: '1px solid #e0e0e0',
//                     borderRadius: 1,
//                     display: 'flex',
//                     alignItems: 'center',
//                     cursor: 'pointer',
//                     alignSelf: { xs: 'flex-start', sm: 'center' },
//                   }}
//                 >
//                   <Typography sx={{ px: 2 }}>{interval} hr</Typography>
//                   <IconButton size="small" sx={{ color: '#1340FF' }}>
//                     <Iconify icon="mdi:chevron-down" />
//                   </IconButton>
//                 </Box>
//               )}

//               {showIntervalDropdown && (
//                 <Box
//                   sx={{
//                     position: 'absolute',
//                     top: { xs: '40px', sm: '100%' },
//                     left: { xs: '0', sm: 'auto' },
//                     right: { xs: 'auto', sm: '0' },
//                     mt: 1,
//                     bgcolor: 'background.paper',
//                     boxShadow: 3,
//                     borderRadius: 1,
//                     zIndex: 10,
//                     width: { xs: '150px', sm: 'auto' },
//                   }}
//                 >
//                   {intervalOptions.map((option) => (
//                     <Box
//                       key={option}
//                       onClick={() => handleIntervalChange(option)}
//                       sx={{
//                         p: 1.5,
//                         borderBottom: '1px solid #e0e0e0',
//                         '&:hover': { bgcolor: 'rgba(51, 102, 255, 0.08)' },
//                         cursor: 'pointer',
//                         bgcolor: interval === option ? 'rgba(51, 102, 255, 0.08)' : 'transparent',
//                       }}
//                     >
//                       <Typography>{option} hr</Typography>
//                     </Box>
//                   ))}
//                 </Box>
//               )}
//             </Box>

//             <Box sx={{ borderTop: '1px solid #e0e0e0', my: 2 }} />

//             {/* Time slots display area */}
//             <Box sx={{ mb: 3 }}>
//               {intervalsChecked && startTime && endTime ? (
//                 <Box sx={{ mb: 2 }}>
//                   <Box
//                     sx={{
//                       display: 'flex',
//                       flexWrap: 'wrap',
//                       gap: 2,
//                       justifyContent: { xs: 'center', sm: 'flex-start' },
//                     }}
//                   >
//                     {generatedTimeSlots.map((slot, index) => (
//                       <Box
//                         key={index}
//                         onClick={() => toggleTimeSlotSelection(index)}
//                         sx={{
//                           border: `1px solid ${slot.selected ? '#1340FF' : '#e0e0e0'}`,
//                           borderRadius: 1,
//                           p: 2,
//                           minWidth: { xs: '140px', sm: '180px' },
//                           width: { xs: 'calc(50% - 8px)', sm: 'auto' },
//                           textAlign: 'center',
//                           cursor: 'pointer',
//                           color: slot.selected ? '#1340FF' : 'text.primary',
//                           bgcolor: slot.selected ? 'rgba(51, 102, 255, 0.05)' : 'transparent',
//                         }}
//                       >
//                         <Typography
//                           sx={{
//                             fontFamily: 'Inter Display, sans-serif',
//                             fontWeight: 400,
//                             fontSize: '14px',
//                             lineHeight: '18px',
//                             letterSpacing: '0%',
//                             color: slot.selected ? '#1340FF' : 'inherit',
//                           }}
//                         >
//                           {formatTimeSlot(slot)}
//                         </Typography>
//                       </Box>
//                     ))}
//                   </Box>
//                 </Box>
//               ) : (
//                 <Box sx={{ textAlign: 'center', mb: 2 }}>
//                   <Box
//                     sx={{
//                       border: '1px solid #e0e0e0',
//                       borderRadius: 1,
//                       p: 2,
//                       display: 'inline-block',
//                       minWidth: '200px',
//                     }}
//                   >
//                     <Typography
//                       sx={{
//                         fontFamily: 'Inter Display, sans-serif',
//                         fontWeight: 400,
//                         fontSize: '14px',
//                         lineHeight: '18px',
//                         letterSpacing: '0%',
//                         color: 'text.secondary',
//                       }}
//                     >
//                       {startTime && endTime
//                         ? `${format(new Date(startTime), 'h:mm a')} - ${format(new Date(endTime), 'h:mm a')}`
//                         : 'Select start and end times'}
//                     </Typography>
//                   </Box>
//                 </Box>
//               )}
//             </Box>

//             {/* Flexible spacer */}
//             <Box sx={{ flexGrow: 1 }} />

//             {/* Save Time Slots button positioned at the bottom right of the time slots section */}
//             <Box
//               sx={{
//                 display: 'flex',
//                 justifyContent: 'flex-end',
//                 position: { xs: 'relative', md: 'absolute' },
//                 bottom: { xs: 'auto', md: 20 },
//                 right: { xs: 'auto', md: 20 },
//                 mt: { xs: 2, md: 0 },
//               }}
//             >
//               <Button
//                 variant="contained"
//                 disabled={!intervalsChecked || selectedTimeSlots.length === 0}
//                 onClick={handleSaveTimeSlots}
//                 sx={{
//                   width: 167,
//                   height: 52,
//                   background:
//                     intervalsChecked && selectedTimeSlots.length > 0
//                       ? '#3A3A3C'
//                       : 'linear-gradient(0deg, #3A3A3C, #3A3A3C), linear-gradient(0deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6))',
//                   '&:hover': {
//                     bgcolor:
//                       intervalsChecked && selectedTimeSlots.length > 0 ? '#2A2A2C' : undefined,
//                   },
//                   borderRadius: '12px',
//                   pt: '10px',
//                   pr: '16px',
//                   pb: '13px',
//                   pl: '16px',
//                   boxShadow:
//                     intervalsChecked && selectedTimeSlots.length > 0
//                       ? '0px -3px 0px 0px #00000073 inset'
//                       : '0px -3px 0px 0px #0000001A inset',
//                   gap: '6px',
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                   opacity: intervalsChecked && selectedTimeSlots.length > 0 ? 1 : 0.7,
//                   cursor:
//                     intervalsChecked && selectedTimeSlots.length > 0 ? 'pointer' : 'not-allowed',
//                 }}
//               >
//                 <Typography
//                   sx={{
//                     fontFamily: 'Inter Display, sans-serif',
//                     fontWeight: 600,
//                     fontSize: '16px',
//                     lineHeight: '22px',
//                     letterSpacing: '0%',
//                     color: 'white',
//                   }}
//                 >
//                   Save Time Slots
//                 </Typography>
//               </Button>
//             </Box>
//           </Grid>
//         </Grid>
//       </Box>

//       <Box
//         sx={{
//           border: '1px solid #e0e0e0',
//           borderRadius: 1,
//           p: 3,
//           boxShadow: '0px 0px 5px rgba(0, 0, 0, 0.05)',
//         }}
//       >
//         <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
//           <Box
//             component="img"
//             src="/assets/icons/components/event_note.svg"
//             alt="Reservation Slots"
//             sx={{ width: 12, height: 14, mr: 1 }}
//           />
//           <Typography
//             sx={{
//               fontFamily: 'Inter Display, sans-serif',
//               fontWeight: 600,
//               fontSize: '12px',
//               lineHeight: '16px',
//               letterSpacing: '0%',
//               textTransform: 'uppercase',
//               color: '#231F20',
//             }}
//           >
//             RESERVATION SLOTS
//           </Typography>
//         </Box>

//         <Box sx={{ borderTop: '1px solid #e0e0e0', my: 2 }} />

//         {savedRules.length > 0 ? (
//           <Box sx={{ mt: 2 }}>
//             {savedRules.map((rule, index) => (
//               <Box key={index} sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}>
//                 <Box
//                   component="img"
//                   src="/assets/icons/components/slotscom.svg"
//                   alt="Time Slot"
//                   sx={{ width: 14, height: 19, mr: 1, mt: 0.5 }}
//                 />
//                 <Box>
//                   <Typography
//                     sx={{
//                       fontFamily: 'Inter Display, sans-serif',
//                       fontWeight: 400,
//                       fontSize: '14px',
//                       lineHeight: '18px',
//                       letterSpacing: '0%',
//                       color: '#636366',
//                     }}
//                   >
//                     {formatDateRange(rule.dates)}
//                   </Typography>
//                   <Typography
//                     sx={{
//                       fontFamily: 'Inter Display, sans-serif',
//                       fontWeight: 400,
//                       fontSize: '14px',
//                       lineHeight: '18px',
//                       letterSpacing: '0%',
//                       color: '#636366',
//                     }}
//                   >
//                     {rule.startTime} - {rule.endTime} ({rule.interval} hour interval)
//                   </Typography>
//                 </Box>
//               </Box>
//             ))}
//           </Box>
//         ) : (
//           <Typography
//             sx={{
//               fontFamily: 'Inter Display, sans-serif',
//               fontWeight: 400,
//               fontSize: '14px',
//               lineHeight: '18px',
//               letterSpacing: '0%',
//               color: '#636366',
//             }}
//           >
//             Saved time slots will show up here.
//           </Typography>
//         )}
//       </Box>

//       {/* No popovers needed - using direct input fields */}
//     </Box>
//   );
// };

// export  ReservationSlots;

// export const ReservationSlotsV2 = () => {
//   const { enqueueSnackbar } = useSnackbar();
//   const { watch, setValue } = useFormContext();

//   // Watch existing rules to display them at the bottom
//   const savedRules = watch('availabilityRules') || [];

//   // --- Local State ---
//   const [currentMonth, setCurrentMonth] = useState(new Date());

//   // Date Selection
//   const [selectedDates, setSelectedDates] = useState([]);
//   // Track the start of a range selection (Click 1)
//   const [rangeStart, setRangeStart] = useState(null);
//   const [allDay, setAllDay] = useState(false);
//   const [selectAllDates, setSelectAllDates] = useState(false);

//   // Time Selection
//   const [startTime, setStartTime] = useState(new Date().setHours(9, 0, 0, 0));
//   const [endTime, setEndTime] = useState(new Date().setHours(17, 0, 0, 0));

//   // Interval Logic
//   const [intervalsChecked, setIntervalsChecked] = useState(true);
//   const [interval, setInterval] = useState(1);
//   const [showIntervalDropdown, setShowIntervalDropdown] = useState(false);
//   const [intervalOptions] = useState([0.5, 1, 1.5, 2]);

//   // The Generated Grid (what the user sees and clicks)
//   const [generatedSlots, setGeneratedSlots] = useState([]);

//   // --- Effects ---

//   // 1. Regenerate the grid whenever Start/End/Interval changes
//   useEffect(() => {
//     if (startTime && endTime) {
//       generateGrid();
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [startTime, endTime, interval, intervalsChecked]);

//   // --- Calendar Helpers ---

//   const handlePrevMonth = () =>
//     setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
//   const handleNextMonth = () =>
//     setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

//   const generateCalendar = () => {
//     const year = currentMonth.getFullYear();
//     const month = currentMonth.getMonth();
//     const firstDay = new Date(year, month, 1).getDay();
//     const daysInMonth = new Date(year, month + 1, 0).getDate();

//     const days = [];
//     // Padding for empty days
//     for (let i = 0; i < firstDay; i += 1) days.push({ day: null });

//     for (let i = 1; i <= daysInMonth; i += 1) {
//       const date = new Date(year, month, i);
//       const isSelected = selectedDates.some((d) => isSameDay(d, date));
//       // Visual indicator for the "Anchor" of a range
//       const isRangeStart = rangeStart && isSameDay(date, rangeStart);
//       days.push({ day: i, date, isSelected, isRangeStart });
//     }
//     return days;
//   };

//   const handleDateClick = (date) => {
//     if (!date) return;

//     // 1. Check if date is already selected
//     const isAlreadySelected = selectedDates.some((d) => isSameDay(d, date));

//     if (isAlreadySelected) {
//       // Deselect Logic
//       setSelectedDates(selectedDates.filter((d) => !isSameDay(d, date)));
//       setRangeStart(null);
//       return;
//     }

//     // 2. Selection Logic
//     if (rangeStart) {
//       // Range Completion: Click 2
//       const start = isBefore(date, rangeStart) ? date : rangeStart;
//       const end = isBefore(date, rangeStart) ? rangeStart : date;

//       // REPLACED WHILE/FOR LOOPS:
//       // eachDayOfInterval generates an array of all dates between start and end
//       const allDaysInRange = eachDayOfInterval({ start, end });

//       // Filter the generated range to only include days NOT already selected
//       const uniqueNewDates = allDaysInRange.filter(
//         (dayInRange) => !selectedDates.some((s) => isSameDay(s, dayInRange))
//       );

//       setSelectedDates((prev) => [...prev, ...uniqueNewDates]);
//       setRangeStart(null);
//     } else {
//       // Range Start: Click 1
//       setRangeStart(date);
//       setSelectedDates((prev) => [...prev, date]);
//     }
//   };

//   const handleSelectAllDates = (e) => {
//     setSelectAllDates(e.target.checked);
//     setRangeStart(null); // Reset manual range if "Select All" is used
//     if (e.target.checked) {
//       // Select all days in current month
//       const year = currentMonth.getFullYear();
//       const month = currentMonth.getMonth();
//       const days = [];
//       const numDays = new Date(year, month + 1, 0).getDate();
//       for (let i = 1; i <= numDays; i += 1) days.push(new Date(year, month, i));
//       setSelectedDates(days);
//     } else {
//       setSelectedDates([]);
//     }
//   };

//   // --- Time Slot Generation Logic ---

//   const generateGrid = () => {
//     if (!startTime || !endTime) return;

//     const start = new Date(startTime);
//     const end = new Date(endTime);
//     const slots = [];

//     // Validation: End must be after Start
//     if (isBefore(end, start)) return;

//     // If interval is unchecked, it's just one big slot
//     if (!intervalsChecked) {
//       slots.push({
//         id: 'full-day',
//         start,
//         end,
//         label: `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`,
//         isSelected: true,
//       });
//     } else {
//       // Loop to create intervals
//       let curr = new Date(start);
//       while (isBefore(curr, end)) {
//         const next = addMinutes(curr, interval * 60);
//         if (isBefore(end, next)) break; // Don't go past end time

//         slots.push({
//           id: curr.getTime(), // unique id based on time
//           start: new Date(curr),
//           end: new Date(next),
//           label: `${format(curr, 'h:mm a')} - ${format(next, 'h:mm a')}`,
//           isSelected: true, // Default to selected
//         });
//         curr = next;
//       }
//     }
//     setGeneratedSlots(slots);
//   };

//   const toggleSlot = (index) => {
//     const newSlots = [...generatedSlots];
//     newSlots[index].isSelected = !newSlots[index].isSelected;
//     setGeneratedSlots(newSlots);
//   };

//   // --- Save Logic (The Smart Grouping) ---

//   const handleSave = () => {
//     if (selectedDates.length === 0) {
//       enqueueSnackbar('Please select dates first', { variant: 'error' });
//       return;
//     }

//     const activeSlots = generatedSlots.filter((s) => s.isSelected);
//     if (activeSlots.length === 0) {
//       enqueueSnackbar('Please select at least one time slot', { variant: 'error' });
//       return;
//     }

//     const newRules = [];

//     if (!intervalsChecked) {
//       // Simple Case: One rule
//       newRules.push({
//         dates: selectedDates.map((d) => format(d, 'yyyy-MM-dd')),
//         startTime: format(new Date(startTime), 'HH:mm'),
//         endTime: format(new Date(endTime), 'HH:mm'),
//         interval: 0, // 0 or null indicates full block
//       });
//     } else {
//       // Complex Case: Grouping
//       // Sort by time first
//       activeSlots.sort((a, b) => a.start - b.start);

//       let currentGroupStart = activeSlots[0].start;
//       let currentGroupEnd = activeSlots[0].end;

//       for (let i = 1; i < activeSlots.length; i += 1) {
//         const prev = activeSlots[i - 1];
//         const curr = activeSlots[i];

//         // Check if continuous (curr start === prev end)
//         if (curr.start.getTime() === prev.end.getTime()) {
//           // Extend group
//           currentGroupEnd = curr.end;
//         } else {
//           // Break detected (e.g. Lunch), push previous group and start new
//           newRules.push({
//             dates: selectedDates.map((d) => format(d, 'yyyy-MM-dd')),
//             startTime: format(currentGroupStart, 'HH:mm'),
//             endTime: format(currentGroupEnd, 'HH:mm'),
//             interval,
//           });
//           currentGroupStart = curr.start;
//           currentGroupEnd = curr.end;
//         }
//       }
//       // Push final group
//       newRules.push({
//         dates: selectedDates.map((d) => format(d, 'yyyy-MM-dd')),
//         startTime: format(currentGroupStart, 'HH:mm'),
//         endTime: format(currentGroupEnd, 'HH:mm'),
//         interval,
//       });
//     }

//     // 2. Update Form State
//     const updatedRules = [...savedRules, ...newRules];
//     setValue('availabilityRules', updatedRules);

//     enqueueSnackbar(`Added ${newRules.length} availability rule(s)`, { variant: 'success' });

//     // 3. Reset Selection
//     setSelectedDates([]);
//     setRangeStart(null);
//     setSelectAllDates(false);
//   };

//   // Utility to display dates nicely in the bottom list
//   const formatDatesForDisplay = (dateStrings) => {
//     if (!dateStrings.length) return '';
//     const dates = dateStrings.map((d) => new Date(d)).sort((a, b) => a - b);

//     // If range check logic is needed (e.g. 7 Oct - 14 Oct), simple for now:
//     if (dates.length > 2) {
//       return `${format(dates[0], 'd MMM')} - ${format(dates[dates.length - 1], 'd MMM')}`;
//     }
//     return dates.map((d) => format(d, 'd MMM')).join(', ');
//   };

//   const handleRemoveRule = (index) => {
//     const updated = savedRules.filter((_, i) => i !== index);
//     setValue('availabilityRules', updated);
//   };

//   return (
//     <Box sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
//       <Typography textAlign="center" sx={{ mb: 3, color: '#636366' }}>
//         Add options for creators to select their available time slots.
//       </Typography>

//       <Box
//         sx={{
//           border: '1px solid #E0E0E0',
//           borderRadius: 2,
//           display: 'flex',
//           flexDirection: { xs: 'column', md: 'row' },
//         }}
//       >
//         {/* --- LEFT: CALENDAR --- */}
//         <Box
//           sx={{
//             p: 3,
//             width: { xs: '100%', md: '50%' },
//             borderRight: { md: '1px solid #E0E0E0' },
//             borderBottom: { xs: '1px solid #E0E0E0', md: 'none' },
//           }}
//         >
//           <Typography variant="h6" sx={{ mb: 1 }}>
//             Select Dates:
//           </Typography>
//           <FormControlLabel
//             control={<Switch checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />}
//             label="All Day (24 Hours)"
//             sx={{ mb: 2 }}
//           />

//           {/* Month Nav */}
//           <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
//             <IconButton onClick={handlePrevMonth}>
//               <Iconify icon="eva:arrow-ios-back-fill" />
//             </IconButton>
//             <Typography variant="subtitle1">{format(currentMonth, 'MMMM yyyy')}</Typography>
//             <IconButton onClick={handleNextMonth}>
//               <Iconify icon="eva:arrow-ios-forward-fill" />
//             </IconButton>
//           </Stack>

//           {/* Grid */}
//           <Box
//             sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 2, mt: 3 }}
//           >
//             {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => (
//               <Typography key={d} variant="caption" textAlign="center" color="text.secondary">
//                 {d}
//               </Typography>
//             ))}
//             {generateCalendar().map((dayObj, idx) => {
//               let backgroundColor = 'transparent';
//               if (dayObj.isRangeStart) {
//                 backgroundColor = '#0B2DAD';
//               } else if (dayObj.isSelected) {
//                 backgroundColor = '#1340FF';
//               }
//               return (
//                 <Box
//                   key={dayObj.date || idx}
//                   onClick={() => dayObj.day && handleDateClick(dayObj.date)}
//                   sx={{
//                     height: 36,
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                     borderRadius: '50%',
//                     cursor: dayObj.day ? 'pointer' : 'default',
//                     bgcolor: backgroundColor,
//                     color: dayObj.isSelected ? '#fff' : 'text.primary',
//                     transition: 'all 0.2s',
//                     ...(dayObj.day &&
//                       !dayObj.isSelected && {
//                         '&:hover': { bgcolor: '#F4F6F8' },
//                       }),
//                   }}
//                 >
//                   {dayObj.day}
//                 </Box>
//               );
//             })}
//           </Box>

//           <Box display="flex" justifyContent="flex-end">
//             <FormControlLabel
//               control={
//                 <Checkbox checked={selectAllDates} onChange={handleSelectAllDates} size="small" />
//               }
//               label={<Typography variant="body2">Select All Dates</Typography>}
//             />
//           </Box>
//         </Box>

//         {/* --- RIGHT: TIME SLOTS --- */}
//         <Box
//           sx={{
//             p: 3,
//             width: { xs: '100%', md: '50%' },
//             display: 'flex',
//             flexDirection: 'column',
//           }}
//         >
//           <Typography variant="h6" sx={{ mb: 2 }}>
//             Select Time Slots:
//           </Typography>

//           <ThemeProvider
//             theme={createTheme({
//               palette: { primary: { main: '#1340FF' } },
//               components: {
//                 MuiTextField: {
//                   styleOverrides: {
//                     root: {
//                       '& .MuiOutlinedInput-root': {
//                         borderRadius: 8,
//                       },
//                     },
//                   },
//                 },
//               },
//             })}
//           >
//             <LocalizationProvider dateAdapter={AdapterDateFns}>
//               <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
//                 <DesktopTimePicker
//                   label="Start"
//                   value={new Date(startTime)}
//                   onChange={(val) => setStartTime(val ? val.getTime() : null)}
//                   slotProps={{ textField: { size: 'small', fullWidth: true } }}
//                 />
//                 <Typography>to</Typography>
//                 <DesktopTimePicker
//                   label="End"
//                   value={new Date(endTime)}
//                   onChange={(val) => setEndTime(val ? val.getTime() : null)}
//                   slotProps={{ textField: { size: 'small', fullWidth: true } }}
//                 />
//               </Stack>
//             </LocalizationProvider>
//           </ThemeProvider>

//           <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
//             <FormControlLabel
//               control={
//                 <Checkbox
//                   checked={intervalsChecked}
//                   onChange={(e) => setIntervalsChecked(e.target.checked)}
//                 />
//               }
//               label="Intervals"
//             />
//             {intervalsChecked && (
//               <Box sx={{ position: 'relative' }}>
//                 <Button
//                   variant="outlined"
//                   size="small"
//                   onClick={() => setShowIntervalDropdown(!showIntervalDropdown)}
//                   endIcon={<Iconify icon="eva:chevron-down-fill" />}
//                   sx={{ borderColor: '#E0E0E0', color: 'text.primary' }}
//                 >
//                   {interval} hr
//                 </Button>
//                 {showIntervalDropdown && (
//                   <Box
//                     sx={{
//                       position: 'absolute',
//                       top: '100%',
//                       left: 0,
//                       zIndex: 10,
//                       bgcolor: 'background.paper',
//                       boxShadow: 3,
//                       borderRadius: 1,
//                       mt: 0.5,
//                     }}
//                   >
//                     {intervalOptions.map((opt) => (
//                       <MenuItem
//                         key={opt}
//                         onClick={() => {
//                           setInterval(opt);
//                           setShowIntervalDropdown(false);
//                         }}
//                       >
//                         {opt} hr
//                       </MenuItem>
//                     ))}
//                   </Box>
//                 )}
//               </Box>
//             )}
//           </Stack>

//           <Divider sx={{ mb: 2 }} />

//           {/* THE GENERATED SLOTS */}
//           <Box sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: 300 }}>
//             <Grid container spacing={1}>
//               {generatedSlots.length > 0 ? (
//                 generatedSlots.map((slot, idx) => (
//                   <Grid item xs={6} key={slot.id}>
//                     <Button
//                       fullWidth
//                       variant="outlined"
//                       onClick={() => toggleSlot(idx)}
//                       sx={{
//                         textTransform: 'none',
//                         color: slot.isSelected ? '#1340FF' : 'text.secondary',
//                         borderColor: slot.isSelected ? '#1340FF' : '#E0E0E0',
//                         bgcolor: slot.isSelected ? 'rgba(19, 64, 255, 0.08)' : 'transparent',
//                         '&:hover': {
//                           borderColor: '#1340FF',
//                           bgcolor: 'rgba(19, 64, 255, 0.08)',
//                         },
//                       }}
//                     >
//                       {slot.label}
//                     </Button>
//                   </Grid>
//                 ))
//               ) : (
//                 <Typography
//                   variant="caption"
//                   sx={{ width: '100%', textAlign: 'center', mt: 4, color: 'text.disabled' }}
//                 >
//                   Select times to generate slots
//                 </Typography>
//               )}
//             </Grid>
//           </Box>

//           <Button
//             variant="contained"
//             fullWidth
//             sx={{
//               mt: 3,
//               bgcolor: '#3A3A3C',
//               color: '#fff',
//               '&:hover': { bgcolor: '#000' },
//               height: 48,
//             }}
//             onClick={handleSave}
//           >
//             Save Time Slots
//           </Button>
//         </Box>
//       </Box>

//       {/* --- BOTTOM LIST: SAVED RULES --- */}
//       <Box sx={{ mt: 4, border: '1px solid #E0E0E0', borderRadius: 2, p: 3 }}>
//         <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
//           RESERVATION SLOTS
//         </Typography>
//         <Divider sx={{ my: 1 }} />

//         {savedRules.length === 0 ? (
//           <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
//             Saved time slots will show up here.
//           </Typography>
//         ) : (
//           <Stack spacing={2} sx={{ mt: 2 }}>
//             {savedRules.map((rule, index) => (
//               <Stack key={index} direction="row" spacing={2} alignItems="flex-start">
//                 <Iconify icon="solar:calendar-date-bold" sx={{ color: '#1340FF', mt: 0.5 }} />
//                 <Box>
//                   <Typography variant="body2" sx={{ fontWeight: 600 }}>
//                     {formatDatesForDisplay(rule.dates)}
//                   </Typography>
//                   <Typography variant="caption" color="text.secondary">
//                     {rule.startTime} - {rule.endTime}{' '}
//                     {rule.interval > 0 ? `(${rule.interval}hr interval)` : '(All Day)'}
//                   </Typography>
//                 </Box>
//                 <Box flexGrow={1} />
//                 <IconButton size="small" onClick={() => handleRemoveRule(index)}>
//                   <Iconify icon="eva:trash-2-outline" width={18} sx={{ color: '#FF4842' }} />
//                 </IconButton>
//               </Stack>
//             ))}
//           </Stack>
//         )}
//       </Box>
//     </Box>
//   );
// };
const ReservationSlotsV2 = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { watch, setValue } = useFormContext();

  const campaignStartDate = watch('campaignStartDate');
  const campaignEndDate = watch('campaignEndDate');
  const savedRules = watch('availabilityRules') || [];

  const [currentMonth, setCurrentMonth] = useState(new Date(campaignStartDate || new Date()));
  const [selectedDates, setSelectedDates] = useState([]);
  const [rangeStart, setRangeStart] = useState(null);
  const [selectAllDates, setSelectAllDates] = useState(false);

  const [startTime, setStartTime] = useState(new Date().setHours(9, 0, 0, 0));
  const [endTime, setEndTime] = useState(new Date().setHours(17, 0, 0, 0));
  const [allDay, setAllDay] = useState(false);
  const [intervalsChecked, setIntervalsChecked] = useState(true);
  const [interval, setInterval] = useState(1);
  const [showIntervalDropdown, setShowIntervalDropdown] = useState(false);
  const [generatedSlots, setGeneratedSlots] = useState([]);

  const intervalOptions = [0.5, 1, 1.5, 2, 3, 4];

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

  const handleDateClick = (date) => {
    if (!date) return;

    if (campaignInterval && !isWithinInterval(date, campaignInterval)) {
      enqueueSnackbar('Date is outside campaign active range', { variant: 'warning' });
      return;
    }

    const isAlreadySelected = selectedDates.some((d) => isSameDay(d, date));

    if (isAlreadySelected) {
      setSelectedDates(selectedDates.filter((d) => !isSameDay(d, date)));
      setRangeStart(null);
      return;
    }

    if (rangeStart) {
      const start = isBefore(date, rangeStart) ? date : rangeStart;
      const end = isBefore(date, rangeStart) ? rangeStart : date;

      const allDaysInRange = eachDayOfInterval({ start, end });

      const validDays = allDaysInRange.filter((d) =>
        campaignInterval ? isWithinInterval(d, campaignInterval) : true
      );

      setSelectedDates((prev) => {
        const existing = prev.filter((p) => !validDays.some((v) => isSameDay(v, p)));
        return [...existing, ...validDays].sort((a, b) => a - b);
      });
      setRangeStart(null);
    } else {
      setRangeStart(date);
      setSelectedDates((prev) => [...prev, date]);
    }
  };

  const handleSelectAllDates = (e) => {
    setSelectAllDates(e.target.checked);
    if (e.target.checked && campaignInterval) {
      const allDaysInCampaign = eachDayOfInterval({
        start: campaignInterval.start,
        end: campaignInterval.end,
      });

      setSelectedDates(allDaysInCampaign);
    } else {
      setSelectedDates([]);
    }
  };

  const generateCalendarDays = () => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    const days = [];
    let curr = start;

    while (curr <= end) {
      const dateCopy = new Date(curr);
      const isCurrentMonth = curr.getMonth() === currentMonth.getMonth();
      const isSelected = selectedDates.some((d) => isSameDay(d, dateCopy));
      const isWithinCampaign = campaignInterval
        ? isWithinInterval(dateCopy, campaignInterval)
        : true;

      const sorted = [...selectedDates].sort((a, b) => a - b);
      const isRangeEndCap =
        sorted.length > 0 &&
        (isSameDay(dateCopy, sorted[0]) || isSameDay(dateCopy, sorted[sorted.length - 1]));

      days.push({ date: dateCopy, isCurrentMonth, isSelected, isWithinCampaign, isRangeEndCap });
      curr = addMinutes(curr, 24 * 60);
    }
    return days;
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
          isSelected: true,
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
    setValue('availabilityRules', [...savedRules, newRule], {
      shouldValidate: true,
      shouldDirty: true,
    });

    enqueueSnackbar('Added successfully', { variant: 'success' });
    setSelectedDates([]);
    setRangeStart(null);
    setSelectAllDates(false);
  };

  const handleRemoveRule = (index) => {
    const updatedRules = savedRules.filter((_, i) => i !== index);
    setValue('availabilityRules', updatedRules, {
      shouldValidate: true,
      shouldDirty: true,
    });
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
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3, mb: 10 }}>
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
          sx={{ p: 4, width: { xs: '100%', md: '50%' }, borderRight: { md: '1px solid #E0E0E0' } }}
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

          <Typography sx={{ fontSize: '12px', color: '#919EAB', mb: 3, lineHeight: 1.5 }}>
            Click once to select the start date, then click again on the end date to include all
            days in between. Double-click for a single day, and click a selected date to deselect
            it.
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <IconButton onClick={() => setCurrentMonth(addMonths(currentMonth, -1))} size="small">
              <Iconify icon="eva:arrow-ios-back-fill" />
            </IconButton>
            <Typography sx={{ fontWeight: 700 }}>{format(currentMonth, 'MMM yyyy')}</Typography>
            <IconButton onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} size="small">
              <Iconify icon="eva:arrow-ios-forward-fill" />
            </IconButton>
          </Stack>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center' }}>
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
              <Typography
                key={d}
                variant="caption"
                sx={{ color: '#919EAB', fontWeight: 600, mb: 2 }}
              >
                {d}
              </Typography>
            ))}
            {generateCalendarDays().map((day, idx) => {
              let cellColor = '#212B36';
              if (!day.isCurrentMonth || !day.isWithinCampaign) cellColor = '#919EAB';
              if (day.isSelected && !day.isRangeEndCap) cellColor = '#1340FF';
              if (day.isRangeEndCap) cellColor = '#FFF';

              return (
                <Box
                  key={idx}
                  onClick={() => day.isWithinCampaign && handleDateClick(day.date)}
                  sx={{
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: day.isWithinCampaign ? 'pointer' : 'default',
                    bgcolor:
                      day.isSelected && !day.isRangeEndCap
                        ? 'rgba(19, 64, 255, 0.08)'
                        : 'transparent',
                    color: cellColor,
                    borderRadius: day.isRangeEndCap ? '50%' : 0,
                    ...(day.isRangeEndCap && { bgcolor: '#1340FF' }),
                  }}
                >
                  <Typography sx={{ fontSize: '14px', fontWeight: day.isSelected ? 600 : 400 }}>
                    {format(day.date, 'd')}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          <Box display="flex" justifyContent="flex-end" sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Checkbox checked={selectAllDates} onChange={handleSelectAllDates} size="small" />
              }
              label={
                <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>Select All Dates</Typography>
              }
              sx={{ mr: 0 }}
            />
          </Box>
        </Box>

        <Box
          sx={{
            p: 4,
            width: { xs: '100%', md: '50%' },
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
                      '&.Mui-selected': { backgroundColor: '#1340FF !important' },
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
                  value={new Date(startTime)}
                  onChange={(v) => setStartTime(v?.getTime())}
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
                  value={new Date(endTime)}
                  onChange={(v) => setEndTime(v?.getTime())}
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
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  borderRadius: 1,
                  minWidth: 100,
                  mt: 1,
                }}
              >
                {intervalOptions.map((opt) => (
                  <MenuItem
                    key={opt}
                    onClick={() => {
                      setInterval(opt);
                      setShowIntervalDropdown(false);
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
                }}
              >
                {allDay ? 'Save All Day' : 'Save Time Slots'}
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      <Box sx={{ mt: 3, border: '1px solid #E0E0E0', borderRadius: 2, p: 2, bgcolor: '#fff' }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Iconify icon="solar:calendar-date-bold" width={18} color="#919EAB" />
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
                  <Iconify
                    icon="solar:pen-new-square-bold-duotone"
                    color="#1340FF"
                    // width={24}
                    sx={{ mt: 0.5 }}
                  />
                  <Box>
                    <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>
                      {rule.dates.length > 1
                        ? `${format(new Date(rule.dates[0]), 'd MMM')} - ${format(new Date(rule.dates[rule.dates.length - 1]), 'd MMM yyyy')}`
                        : format(new Date(rule.dates[0]), 'd MMM yyyy')}
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
                  <Iconify icon="solar:trash-bin-trash-bold" color="#FF5630" width={20} />
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
