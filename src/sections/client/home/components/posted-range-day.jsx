import PropTypes from 'prop-types';
import {
  format,
  isAfter,
  isBefore,
  isSunday,
  isSameDay,
  isSaturday,
  isLastDayOfMonth,
  isFirstDayOfMonth,
} from 'date-fns';

import { Box, Avatar } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';

import { plural, dayKey, initialOf, LOGO_RING, ACTION_BLUE, STATUS_COLOR } from '../utils';

// Same footprint as MUI's weekday labels (36px + 2px margin each side), so every row lines up.
const CELL = { width: 40, height: 36 };
const BAND_RADIUS = '18px';
const MAX_DOTS = 3;

export default function PostedRangeDay({
  day,
  outsideCurrentMonth,
  rangeStart,
  rangeEnd,
  previewEnd,
  postDays,
  onDayHover,
  ...other
}) {
  const theme = useTheme();

  if (outsideCurrentMonth) return <Box sx={CELL} />;

  const end = rangeEnd ?? previewEnd;
  const preview = !rangeEnd && !!previewEnd;

  const isStart = !!rangeStart && isSameDay(day, rangeStart);
  const isEnd = !!end && isSameDay(day, end);
  const rowStart = isSunday(day) || isFirstDayOfMonth(day);
  const rowEnd = isSaturday(day) || isLastDayOfMonth(day);

  const inRange =
    !!rangeStart &&
    !!end &&
    !isSameDay(rangeStart, end) &&
    !isBefore(day, rangeStart) &&
    !isAfter(day, end);
  // An endpoint at the edge of a row has nothing beside it to connect to.
  const showBand = inRange && !(isStart && rowEnd) && !(isEnd && rowStart);

  const posts = postDays?.get(dayKey(day)) ?? [];
  const postCount = posts.reduce((sum, p) => sum + p.count, 0);
  // Only a one-campaign day has room to name it with a logo; busier days rely on dots.
  const onlyCampaign = posts.length === 1 ? posts[0] : null;
  const solid = isStart || (isEnd && !preview);

  let dayStyle = {};
  if (solid) {
    dayStyle = {
      bgcolor: `${ACTION_BLUE} !important`,
      color: '#fff !important',
      fontWeight: 600,
    };
  } else if (isEnd) {
    // Opaque in every state, so the half band underneath cannot tint one side of the circle.
    const fill = `color-mix(in srgb, ${ACTION_BLUE} 16%, ${theme.palette.background.paper})`;
    dayStyle = {
      color: ACTION_BLUE,
      fontWeight: 600,
      '&, &:hover, &:focus': { bgcolor: fill },
    };
  } else if (inRange) {
    dayStyle = { color: 'text.primary', '&:hover': { bgcolor: alpha(ACTION_BLUE, 0.12) } };
  }

  return (
    <Box
      onMouseEnter={() => onDayHover?.(day)}
      onFocus={() => onDayHover?.(day)}
      sx={{
        ...CELL,
        position: 'relative',
        display: 'grid',
        placeItems: 'center',
        ...(showBand && {
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 2,
            bottom: 2,
            left: isStart ? '50%' : 0,
            right: isEnd ? '50%' : 0,
            bgcolor: alpha(ACTION_BLUE, preview ? 0.06 : 0.1),
            borderTopLeftRadius: rowStart && !isStart ? BAND_RADIUS : 0,
            borderBottomLeftRadius: rowStart && !isStart ? BAND_RADIUS : 0,
            borderTopRightRadius: rowEnd && !isEnd ? BAND_RADIUS : 0,
            borderBottomRightRadius: rowEnd && !isEnd ? BAND_RADIUS : 0,
          },
        }),
      }}
    >
      <PickersDay
        {...other}
        day={day}
        outsideCurrentMonth={false}
        disableMargin
        aria-label={
          postCount ? `${format(day, 'd MMMM')}, ${plural(postCount, 'post')}` : undefined
        }
        sx={{
          zIndex: 1,
          width: 32,
          height: 32,
          fontSize: 13,
          cursor: 'pointer',
          transition: 'background-color 120ms ease',
          '&:hover': { bgcolor: alpha(ACTION_BLUE, 0.08) },
          '&:focus': { bgcolor: alpha(ACTION_BLUE, 0.12) },
          '&.Mui-disabled': { cursor: 'default', color: 'grey.400' },
          // Bold blue text, not MUI's ring (reads as selected) or a dot (reads as a post).
          '&.MuiPickersDay-today': { border: 'none', fontWeight: 700, color: ACTION_BLUE },
          ...dayStyle,
        }}
      />

      {postCount > 0 && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            bottom: 5,
            left: '50%',
            zIndex: 2,
            display: 'flex',
            gap: '2px',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
          }}
        >
          {Array.from({ length: Math.min(postCount, MAX_DOTS) }, (_, i) => (
            <Box
              key={i}
              sx={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                bgcolor: solid ? '#fff' : STATUS_COLOR.done,
              }}
            />
          ))}
        </Box>
      )}

      {onlyCampaign && (
        <Avatar
          aria-hidden
          src={onlyCampaign.thumb ?? undefined}
          alt=""
          sx={{
            position: 'absolute',
            top: 0,
            right: 1,
            zIndex: 2,
            width: 14,
            height: 14,
            fontSize: 8,
            fontWeight: 600,
            color: 'common.white',
            bgcolor: 'grey.500',
            border: '1.5px solid',
            borderColor: 'background.paper',
            boxShadow: LOGO_RING,
            pointerEvents: 'none',
          }}
        >
          {initialOf(onlyCampaign.name)}
        </Avatar>
      )}
    </Box>
  );
}

PostedRangeDay.propTypes = {
  day: PropTypes.instanceOf(Date).isRequired,
  outsideCurrentMonth: PropTypes.bool,
  rangeStart: PropTypes.instanceOf(Date),
  rangeEnd: PropTypes.instanceOf(Date),
  previewEnd: PropTypes.instanceOf(Date),
  postDays: PropTypes.instanceOf(Map),
  onDayHover: PropTypes.func,
};
