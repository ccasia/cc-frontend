import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';

// ----------------------------------------------------------------------

const BRAND_BLUE = '#1340FF';
const RANGE_BG = '#E8EDFF';

function RangeDay(props) {
  const {
    day,
    outsideCurrentMonth,
    rangeStart,
    rangeEnd,
    hoverDay,
    selectingEnd,
    onDayHover,
    ...other
  } = props;

  if (outsideCurrentMonth) {
    return <PickersDay {...other} outsideCurrentMonth day={day} sx={{ visibility: 'hidden' }} />;
  }

  const d = dayjs(day);
  const start = rangeStart ? dayjs(rangeStart) : null;
  const end = rangeEnd ? dayjs(rangeEnd) : null;
  const hover = hoverDay ? dayjs(hoverDay) : null;

  const isStart = start && d.isSame(start, 'day');
  const isEnd = end && d.isSame(end, 'day');
  const effectiveEnd = end || (selectingEnd && hover ? hover : null);
  const isPreviewEnd = !end && selectingEnd && hover && d.isSame(hover, 'day');

  const inRange =
    start && effectiveEnd && d.isAfter(start, 'day') && d.isBefore(effectiveEnd, 'day');

  const isEndpoint = isStart || isEnd;
  const dayOfWeek = d.day(); // 0 = Sunday, 6 = Saturday
  const isRowStart = dayOfWeek === 0;
  const isRowEnd = dayOfWeek === 6;

  // Determine if start/end days need a half-band extending behind them
  const startHasBand = isStart && effectiveEnd && !d.isSame(effectiveEnd, 'day');
  const endHasBand = (isEnd || isPreviewEnd) && start && !d.isSame(start, 'day');

  // Calculate band position — extend -4px into gaps for seamless coverage
  let needsBand = false;
  let bandLeft = 0;
  let bandRight = 0;

  if (inRange) {
    needsBand = true;
    bandLeft = isRowStart ? 0 : '-4px';
    bandRight = isRowEnd ? 0 : '-4px';
  } else if (startHasBand) {
    needsBand = true;
    bandLeft = '50%';
    bandRight = isRowEnd ? 0 : '-4px';
  } else if (endHasBand) {
    needsBand = true;
    bandLeft = isRowStart ? 0 : '-4px';
    bandRight = '50%';
  }

  return (
    <Box
      onMouseEnter={() => onDayHover?.(day)}
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        ...(needsBand && {
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 2,
            bottom: 2,
            left: bandLeft,
            right: bandRight,
            bgcolor: RANGE_BG,
            zIndex: 0,
          },
        }),
      }}
    >
      <PickersDay
        {...other}
        outsideCurrentMonth={outsideCurrentMonth}
        day={day}
        disableMargin
        sx={{
          zIndex: 1,
          width: 32,
          height: 32,
          fontSize: '0.8125rem',
          fontWeight: (() => {
            if (isEndpoint) return 700;
            if (inRange) return 500;
            return 400;
          })(),
          // In-range days get blue text
          ...(inRange &&
            !isEndpoint && {
              color: BRAND_BLUE,
            }),
          // Start/end endpoint styling
          ...(isEndpoint && {
            bgcolor: `${BRAND_BLUE} !important`,
            color: '#fff !important',
            '&:hover': { bgcolor: `${BRAND_BLUE} !important` },
            '&:focus': { bgcolor: `${BRAND_BLUE} !important` },
          }),
          // Preview end (hover target)
          ...(isPreviewEnd &&
            !isEndpoint && {
              border: `1.5px dashed ${BRAND_BLUE}`,
              bgcolor: 'transparent',
            }),
          // Today ring (if not an endpoint)
          '&.MuiPickersDay-today': {
            borderColor: isEndpoint ? BRAND_BLUE : '#c4cdd5',
            ...(isEndpoint && { border: 'none' }),
          },
        }}
      />
    </Box>
  );
}

RangeDay.propTypes = {
  day: PropTypes.object,
  outsideCurrentMonth: PropTypes.bool,
  rangeStart: PropTypes.object,
  rangeEnd: PropTypes.object,
  hoverDay: PropTypes.object,
  selectingEnd: PropTypes.bool,
  onDayHover: PropTypes.func,
};

export default RangeDay;
