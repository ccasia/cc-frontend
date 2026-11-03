import PropTypes from 'prop-types';
import { useRef, useState } from 'react';
import { format, startOfDay, differenceInCalendarDays } from 'date-fns';

import { alpha } from '@mui/material/styles';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import {
  Box,
  Stack,
  Button,
  Avatar,
  Popover,
  Tooltip,
  MenuItem,
  MenuList,
  ButtonBase,
  Typography,
  AvatarGroup,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import { whiteTooltipSlotProps } from 'src/components/tooltip/white-tooltip';

import RangeSlots from './range-slots';
import PostedRangeDay from './posted-range-day';
import {
  plural,
  dayKey,
  nameList,
  initialOf,
  LOGO_RING,
  periodLabel,
  ACTION_BLUE,
  STATUS_COLOR,
  POSTED_RANGES,
} from '../utils';

const EMPTY_DRAFT = { from: null, to: null };
const NO_POSTS = new Map();
const ONE_LINE = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };

export default function PostedPeriodPicker({ period, onChange, postDays = NO_POSTS, countPosts }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  // The day under the pointer or keyboard focus.
  const [peekDay, setPeekDay] = useState(null);
  const [month, setMonth] = useState(() => new Date());
  const [calendarKey, setCalendarKey] = useState(0);

  const pillRef = useRef(null);
  const triggerRef = useRef(null);

  const open = !!anchorEl;
  const filtered = period.value !== 'all';
  const selectingEnd = !!draft.from && !draft.to;

  const close = () => setAnchorEl(null);

  const apply = (next) => {
    onChange(next);
    close();
  };

  // The reset button disappears once used, so hand focus back to the trigger.
  const resetPeriod = () => {
    onChange({ value: 'all' });
    triggerRef.current?.focus();
  };

  // Start from the applied range each time, so closing drops unsaved picks.
  const reset = () => {
    const next = period.value === 'custom' ? { from: period.from, to: period.to } : EMPTY_DRAFT;
    setDraft(next);
    setPeekDay(null);
    setMonth(next.from ?? new Date());
    setCalendarKey((key) => key + 1);
  };

  // DateCalendar copies the current time onto the picked day; keep whole days so range checks match.
  const pickDay = (picked) => {
    const day = startOfDay(picked);
    if (!draft.from || draft.to || day < draft.from) setDraft({ from: day, to: null });
    else setDraft({ from: draft.from, to: day });
  };

  // Preview only days the range can end on: after the start, and not in the future.
  const previewEnd =
    selectingEnd && peekDay && peekDay > draft.from && peekDay <= new Date() ? peekDay : null;
  const peekPosts = peekDay ? postDays.get(dayKey(peekDay)) : null;

  const monthPrefix = format(month, 'yyyy-MM');
  let monthPosts = 0;
  postDays.forEach((posts, key) => {
    if (key.startsWith(monthPrefix)) monthPosts += posts.reduce((sum, p) => sum + p.count, 0);
  });

  const draftEnd = previewEnd ?? draft.to ?? draft.from;
  const draftCount =
    draft.from && countPosts
      ? countPosts({ value: 'custom', from: draft.from, to: draftEnd })
      : null;
  const postsLabel = (suffix) =>
    draftCount === null ? suffix : `${plural(draftCount, 'post')} ${suffix}`;

  // What the footer says before anything is hovered: the month, the start day, or the range.
  let summary = {
    main: `${plural(monthPosts, 'post')} in ${format(month, 'MMMM')}`,
    sub: 'Pick a start date',
    dot: monthPosts > 0,
  };
  if (selectingEnd && !previewEnd) {
    summary = {
      main: postsLabel(`on ${format(draft.from, 'd MMM')}`),
      sub: 'Pick an end date, or apply this day',
    };
  } else if (draft.from) {
    const days = differenceInCalendarDays(draftEnd, draft.from) + 1;
    summary = { main: postsLabel('in range'), sub: `Across ${plural(days, 'day')}` };
  }

  return (
    <>
      <Box
        ref={pillRef}
        sx={{
          display: 'flex',
          alignItems: 'center',
          height: 32,
          borderRadius: 1,
          bgcolor: 'background.paper',
          // Same raised pill as the selected campaign tab; a blue ring while open.
          boxShadow: open ? `0 0 0 1.5px ${ACTION_BLUE}` : '0 1px 2px rgba(18, 18, 20, 0.08)',
          transition: 'box-shadow 160ms ease',
        }}
      >
        <ButtonBase
          ref={triggerRef}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setAnchorEl(pillRef.current)}
          sx={{
            gap: 0.75,
            height: 1,
            pl: 1.25,
            pr: filtered ? 0.5 : 1.25,
            fontSize: 13,
            whiteSpace: 'nowrap',
            borderRadius: 1,
            transition: 'transform 160ms ease-out',
            '&:active': { transform: 'scale(0.97)' },
            '&:focus-visible': { outline: `2px solid ${ACTION_BLUE}`, outlineOffset: 2 },
          }}
        >
          <Iconify icon="solar:calendar-linear" width={16} sx={{ color: 'grey.500' }} />
          <Box component="span" sx={{ fontWeight: 500 }}>
            {periodLabel(period)}
          </Box>
          <Iconify
            icon="eva:chevron-down-fill"
            width={16}
            sx={{
              color: 'grey.500',
              transform: open ? 'rotate(180deg)' : 'none',
              transition: 'transform 200ms cubic-bezier(0.23, 1, 0.32, 1)',
            }}
          />
        </ButtonBase>

        {filtered && (
          <Tooltip
            arrow
            placement="top"
            slotProps={whiteTooltipSlotProps}
            title={
              <>
                <Box sx={{ fontSize: 12, fontWeight: 600, color: 'text.primary' }}>
                  Reset date range
                </Box>
                <Box sx={{ fontSize: 12, color: 'text.secondary' }}>Show posts from all time</Box>
              </>
            }
          >
            <ButtonBase
              aria-label="Reset to all time"
              onClick={resetPeriod}
              sx={{
                width: 24,
                height: 24,
                mr: 0.5,
                borderRadius: '50%',
                color: 'grey.500',
                transition: 'background-color 120ms ease, color 120ms ease, transform 160ms ease-out',
                '&:hover': { bgcolor: 'grey.200', color: 'text.primary' },
                '&:active': { transform: 'scale(0.9)' },
                '&:focus-visible': { outline: `2px solid ${ACTION_BLUE}`, outlineOffset: 1 },
              }}
            >
              <Iconify icon="eva:close-fill" width={14} />
            </ButtonBase>
          </Tooltip>
        )}
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        transitionDuration={{ enter: 200, exit: 120 }}
        TransitionProps={{ onEnter: reset }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              borderRadius: '14px',
              border: 1,
              borderColor: 'divider',
              boxShadow: '0 12px 32px -8px rgba(18, 18, 20, 0.16)',
              // Phones: full width, so the preset row has room. Wider screens size to content.
              width: { xs: 'calc(100vw - 32px)', sm: 'auto' },
              maxWidth: 'calc(100vw - 32px)',
            },
          },
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }}>
          <MenuList
            // With a custom range nothing in the list is chosen, so focusing the first
            // preset would make it look selected.
            autoFocusItem={period.value !== 'custom'}
            aria-label="Posted period"
            sx={{
              p: 1,
              display: 'grid',
              // One even row on phones; a list beside the calendar on wider screens.
              gridTemplateColumns: { xs: 'repeat(5, minmax(0, 1fr))', sm: '1fr' },
              alignContent: 'start',
              gap: { xs: 0.5, sm: 0.25 },
              width: { sm: 184 },
              borderBottom: { xs: 1, sm: 0 },
              borderRight: { sm: 1 },
              borderColor: { xs: 'divider', sm: 'divider' },
            }}
          >
            {POSTED_RANGES.map((option) => {
              const selected = period.value === option.value;
              return (
                <MenuItem
                  key={option.value}
                  selected={selected}
                  onClick={() => apply({ value: option.value })}
                  sx={{
                    gap: 1,
                    px: { xs: 0.5, sm: 1.25 },
                    py: 0.75,
                    // MUI adds a 48px touch height on phones, which made a wrapped item a tall box.
                    minHeight: 'auto',
                    borderRadius: 1,
                    fontSize: 13,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    justifyContent: { xs: 'center', sm: 'space-between' },
                    fontWeight: selected ? 600 : 400,
                    color: selected ? ACTION_BLUE : 'text.primary',
                    '&.Mui-selected, &.Mui-selected:hover, &.Mui-selected.Mui-focusVisible': {
                      bgcolor: alpha(ACTION_BLUE, 0.08),
                    },
                  }}
                >
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                    {option.label}
                  </Box>
                  <Box component="span" sx={{ display: { sm: 'none' } }}>
                    {option.short}
                  </Box>
                  {countPosts && (
                    <Box
                      component="span"
                      sx={{
                        display: { xs: 'none', sm: 'inline' },
                        fontSize: 12,
                        fontWeight: 500,
                        color: selected ? ACTION_BLUE : 'text.disabled',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {countPosts({ value: option.value })}
                    </Box>
                  )}
                </MenuItem>
              );
            })}
          </MenuList>

          {/* Fixed width, so long campaign names in the footer truncate instead of widening it. */}
          <Box sx={{ width: { xs: 1, sm: 296 } }}>
            <RangeSlots from={draft.from} to={draft.to} previewEnd={previewEnd} />

            <Box onMouseLeave={() => setPeekDay(null)} onBlur={() => setPeekDay(null)}>
              <DateCalendar
                key={calendarKey}
                value={null}
                views={['day']}
                referenceDate={draft.from ?? new Date()}
                onChange={pickDay}
                onMonthChange={setMonth}
                disableFuture
                showDaysOutsideCurrentMonth
                fixedWeekNumber={6}
                dayOfWeekFormatter={(date) => format(date, 'EEEEEE')}
                slots={{ day: PostedRangeDay }}
                slotProps={{
                  day: {
                    rangeStart: draft.from,
                    rangeEnd: draft.to,
                    previewEnd,
                    postDays,
                    onDayHover: setPeekDay,
                  },
                }}
                sx={{
                  width: 296,
                  height: 300,
                  maxWidth: 1,
                  mx: 'auto',
                  '& .MuiPickersCalendarHeader-root': { pl: 2.5, pr: 1.5, mt: 0.5 },
                  '& .MuiPickersCalendarHeader-label': { fontSize: 14, fontWeight: 600 },
                  '& .MuiDayCalendar-weekDayLabel': { fontSize: 12, color: 'grey.500' },
                  '& .MuiDayCalendar-header, & .MuiDayCalendar-weekContainer': {
                    justifyContent: 'center',
                  },
                }}
              />
            </Box>

            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={1.5}
              // Tall enough for the two-line day summary, so hovering days does not move the footer.
              sx={{ px: 2, py: 1.5, minHeight: 58, borderTop: 1, borderColor: 'divider' }}
            >
              {/* While picking an end date, the range total matters more than one day's posts. */}
              {peekPosts && !previewEnd ? (
                <DayPosts day={peekDay} posts={peekPosts} />
              ) : (
                <Box aria-live="polite" sx={{ minWidth: 0, lineHeight: 1.35 }}>
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    {'dot' in summary && (
                      <Box
                        component="span"
                        sx={{
                          width: 6,
                          height: 6,
                          flex: 'none',
                          borderRadius: '50%',
                          bgcolor: summary.dot ? STATUS_COLOR.done : 'grey.400',
                        }}
                      />
                    )}
                    <Typography
                      sx={{
                        ...ONE_LINE,
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'text.primary',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {summary.main}
                    </Typography>
                  </Stack>
                  <Typography sx={{ ...ONE_LINE, fontSize: 12, color: 'text.secondary' }}>
                    {summary.sub}
                  </Typography>
                </Box>
              )}
              <Button
                size="small"
                variant="contained"
                disabled={!draft.from}
                onClick={() =>
                  apply({ value: 'custom', from: draft.from, to: draft.to ?? draft.from })
                }
                sx={{
                  flex: 'none',
                  px: 1.75,
                  borderRadius: 1,
                  bgcolor: ACTION_BLUE,
                  transition:
                    'background-color 160ms ease, color 160ms ease, transform 160ms ease-out',
                  '&:hover': { bgcolor: ACTION_BLUE, opacity: 0.9 },
                  '&:active': { transform: 'scale(0.97)' },
                  // A soft tint reads as "not yet" rather than a dead grey block.
                  '&.Mui-disabled': {
                    bgcolor: alpha(ACTION_BLUE, 0.08),
                    color: alpha(ACTION_BLUE, 0.4),
                  },
                }}
              >
                Apply
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Popover>
    </>
  );
}

PostedPeriodPicker.propTypes = {
  period: PropTypes.shape({
    value: PropTypes.string.isRequired,
    from: PropTypes.instanceOf(Date),
    to: PropTypes.instanceOf(Date),
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  postDays: PropTypes.instanceOf(Map),
  countPosts: PropTypes.func,
};

function DayPosts({ day, posts }) {
  const total = posts.reduce((sum, p) => sum + p.count, 0);

  return (
    <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
      <AvatarGroup
        max={3}
        sx={{
          flex: 'none',
          '& .MuiAvatar-root': {
            width: 24,
            height: 24,
            fontSize: 10,
            border: '1.5px solid',
            borderColor: 'background.paper',
            boxShadow: LOGO_RING,
          },
        }}
      >
        {posts.map((p) => (
          <Avatar
            key={p.id}
            src={p.thumb ?? undefined}
            alt={p.name}
            sx={{ bgcolor: 'grey.500', color: 'common.white' }}
          >
            {initialOf(p.name)}
          </Avatar>
        ))}
      </AvatarGroup>
      <Box sx={{ minWidth: 0, fontSize: 12, lineHeight: 1.35 }}>
        <Box
          sx={{
            ...ONE_LINE,
            fontWeight: 600,
            color: 'text.primary',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {format(day, 'd MMM')} · {plural(total, 'post')}
        </Box>
        <Box
          title={posts.map((p) => p.name).join(', ')}
          sx={{ ...ONE_LINE, color: 'text.secondary' }}
        >
          {nameList(posts.map((p) => p.name))}
        </Box>
      </Box>
    </Stack>
  );
}

DayPosts.propTypes = {
  day: PropTypes.instanceOf(Date).isRequired,
  posts: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string, name: PropTypes.string, thumb: PropTypes.string })
  ).isRequired,
};
