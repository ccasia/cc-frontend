import PropTypes from 'prop-types';
import { isSameDay } from 'date-fns';

import Box from '@mui/material/Box';
import { Typography } from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

const getStatusColor = (status) => {
  switch (status) {
    case 'DELIVERED':
      return '#1ABF66';
    case 'RECEIVED':
      return '#1ABF66';
    case 'COMPLETED':
      return '#1ABF66';
    case 'ISSUE_REPORTED':
      return '#FF3500';
    default:
      return '#1340FF';
  }
};

function ServerDay(props) {
  const { logistics = [], day, outsideCurrentMonth, ...other } = props;

  const dayLogistics = logistics.filter((logistic) => {
    if (!logistic.deliveryDetails?.expectedDeliveryDate) return false;
    return isSameDay(new Date(logistic.deliveryDetails.expectedDeliveryDate), day);
  });

  const count = dayLogistics.length;

  const renderBadges = () => {
    if (count === 0 || outsideCurrentMonth) return null;

    const itemsToRender = dayLogistics.slice(0, 3);
    const extraCount = count > 3 ? count - 3 : 0;

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'end',
          justifyContent: 'center',
          position: 'absolute',
          bottom: '-3px',
          left: '50%',
          transform: 'translateX(-50%)',
          gap: '1.5px',
          width: '100%',
        }}
      >
        {itemsToRender.map((item, index) => (
          <Box
            key={index}
            sx={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              backgroundColor: getStatusColor ? getStatusColor(item.status) : '#1340FF',
            }}
          />
        ))}
        {extraCount > 0 && (
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.6rem',
              lineHeight: 1,
              color: 'black',
              fontWeight: 'bold',
              transform: 'translateY(20%)',
            }}
          >
            +{extraCount}
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: 36,
        width: 36,
        margin: '0 2px',
      }}
    >
      <PickersDay
        {...other}
        outsideCurrentMonth={outsideCurrentMonth}
        day={day}
        sx={{
          width: 30,
          height: 30,
          fontSize: '0.75rem',
          fontWeight: 400,
          '&.Mui-selected': {
            backgroundColor: '#1340FF !important',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#0b2dad !important',
            },
          },
        }}
      />
      {renderBadges()}
    </Box>
  );
}

ServerDay.propTypes = {
  day: PropTypes.object,
  highlightedDays: PropTypes.array,
  outsideCurrentMonth: PropTypes.bool,
  logistics: PropTypes.array,
};

export default function LogisticsCalendar({ date, onChange, logistics }) {
  const safeLogistics = logistics || [];

  return (
    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DateCalendar
          value={date}
          onChange={onChange}
          minDate={new Date()}
          showDaysOutsideCurrentMonth
          fixedWeekNumber={6}
          slots={{
            day: ServerDay,
          }}
          slotProps={{
            day: { logistics: safeLogistics },
          }}
          sx={{
            width: '100%',
            height: '100%',
            maxHeight: 500,
            '& .MuiPickersCalendarHeader-root': { mt: 1 },
            '& .MuiPickersCalendarHeader': { borderBottom: '5px solid rgba(145, 158, 171, 0.24)' },
            '& .MuiDayCalendar-weekDayLabel': {
              width: 36,
              height: 36,
              fontSize: '0.75rem',
              fontWeight: 600,
              margin: '0 2px',
              color: '#3A3A3C',
            },
            '& .MuiDayCalendar-monthContainer': {
              borderTop: '1px solid rgba(145, 158, 171, 0.24)',
              paddingBottom: '4px',
            },
            '& .MuiPickersYear-yearButton.Mui-selected': {
              backgroundColor: '#1340FF !important', // Your Blue Color
              color: '#ffffff',
              '&:hover': {
                backgroundColor: '#0b2dad !important', // Darker Blue on hover
              },
            },
          }}
        />
      </LocalizationProvider>
    </Box>
  );
}

LogisticsCalendar.propTypes = {
  date: PropTypes.object,
  onChange: PropTypes.func,
  logistics: PropTypes.array,
};
