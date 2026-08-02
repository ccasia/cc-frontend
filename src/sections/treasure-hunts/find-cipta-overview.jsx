import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import relativeTime from 'dayjs/plugin/relativeTime';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';

import { useBoolean } from 'src/hooks/use-boolean';

import Iconify from 'src/components/iconify';

import FindCiptaEventEdit from './find-cipta-event-edit';
import {
  INK,
  MUTED,
  HAIRLINE,
  getEventState,
  getAppVisibility,
} from './find-cipta-shared';

dayjs.extend(relativeTime);

const ACCENT = '#1340FF';
const GOOD = '#1ABF66';
const WARN = '#FF9A02';
const FAINT = '#A0A0A5';

// Longest window the daily chart will draw. Past this the bars are too thin to
// read, and the last month is the only part anyone acts on anyway.
const CHART_DAYS = 30;
const CHART_HEIGHT = 132;
const BAR_MAX_WIDTH = 30;
const BAR_GAP = 3;

// Mirrors the backend publish gate so an admin can see exactly what is missing
// instead of discovering it as a 400 when they hit Publish.
const buildChecklist = (hunt) => {
  const enabled = (hunt.locations ?? []).filter((location) => location.isEnabled);

  return [
    {
      label: 'Event artwork uploaded',
      fix: 'Open Edit event and upload a square image.',
      done: Boolean(hunt.heroArtworkUrl),
    },
    {
      label: 'At least one location is switched on',
      fix: 'Add a spot on the Locations tab, or switch an existing one on.',
      done: enabled.length > 0,
    },
    {
      label: 'Every switched-on location has a QR code ready',
      fix: 'Generate the missing QR codes on the Locations tab.',
      done:
        enabled.length > 0 &&
        enabled.every((l) => l.artworkUrl && l.bitlyPublication?.status === 'READY'),
    },
    {
      label: 'End date is valid and still in the future',
      fix: 'Set a future end date in Edit event.',
      done: new Date(hunt.endsAt) > new Date(hunt.startsAt) && new Date(hunt.endsAt) > new Date(),
    },
    {
      label: 'XP per scan is above zero',
      fix: 'Set a reward in Edit event.',
      done: hunt.rewardXp > 0,
    },
  ];
};

const formatStamp = (value) => dayjs(value).format('D MMM YYYY, h:mm A');

const formatRemaining = (daysLeft) => {
  if (daysLeft > 1) return `${daysLeft} days left`;
  if (daysLeft === 1) return '1 day left';
  return 'Ends today';
};

/**
 * One line that answers "so when does anything actually happen?". It carries a
 * precise day count rather than a vague relative phrase, and never repeats what
 * the status pill or the visibility strip already said.
 */
const getTiming = (state, startsAt, endsAt, now, daysLeft) => {
  switch (state.phase) {
    // The track already carries both dates, so this line no longer has to
    // restate one of them to make sense.
    case 'draft':
      return { text: 'Not published yet', tone: MUTED };
    case 'scheduled':
      return { text: `Goes live ${dayjs(startsAt).from(now)}`, tone: WARN };
    case 'paused':
      // Same day count as the live state, only amber: pausing stops collections
      // but not the countdown.
      return { text: formatRemaining(daysLeft), tone: WARN };
    case 'ended':
      return { text: `Ended ${dayjs(endsAt).from(now)}`, tone: MUTED };
    default:
      return { text: formatRemaining(daysLeft), tone: GOOD };
  }
};

/**
 * The event-health panel is a card, not a hint, so it drops the default dark
 * tooltip chrome — icons and two-line rows need a white surface to read on.
 */
const panelTooltipProps = {
  tooltip: {
    sx: {
      bgcolor: '#fff',
      color: INK,
      p: 2,
      maxWidth: 340,
      borderRadius: 1.5,
      border: `1px solid ${HAIRLINE}`,
      boxShadow: '0 16px 40px rgba(20,18,19,0.20)',
    },
  },
  arrow: {
    sx: { color: '#fff', '&::before': { border: `1px solid ${HAIRLINE}` } },
  },
};

/**
 * The publish gate, collapsed to one glanceable mark next to the title. A clear
 * event says so in a tick and gets out of the way; a blocked one shows the count
 * up front and keeps the fix instructions one hover away.
 */
const HealthBadge = ({ blockers, passing, isDraft, enabledCount }) => {
  const clear = blockers.length === 0;

  return (
    <Tooltip
      arrow
      placement="bottom-start"
      enterTouchDelay={0}
      leaveTouchDelay={8000}
      slotProps={panelTooltipProps}
      title={
        <Box>
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: INK }}>
            {clear
              ? `${isDraft ? 'Ready to publish' : 'Everything is set up'}`
              : `${blockers.length} thing${blockers.length === 1 ? '' : 's'} to fix`}
          </Typography>

          <Typography sx={{ fontSize: '0.75rem', color: MUTED, mt: 0.25, lineHeight: 1.5 }}>
            {(() => {
              if (clear) {
                return `${enabledCount} ${enabledCount === 1 ? 'spot is' : 'spots are'} switched on with a working QR code.`;
              }
              return isDraft
                ? 'Publishing is blocked until every item below is done.'
                : 'These would stop creators collecting a spot right now.';
            })()}
          </Typography>

          {blockers.length > 0 && (
            <Stack spacing={1.5} sx={{ mt: 1.75 }}>
              {blockers.map((item) => (
                <Stack key={item.label} direction="row" spacing={1} alignItems="flex-start">
                  <Iconify
                    icon="eva:alert-circle-fill"
                    width={16}
                    sx={{ color: WARN, flexShrink: 0, mt: '1px' }}
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.813rem', fontWeight: 600, color: INK }}>
                      {item.label}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: MUTED, lineHeight: 1.5 }}>
                      {item.fix}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          )}

          {passing.length > 0 && (
            <>
              <Divider sx={{ borderColor: HAIRLINE, my: 1.5 }} />
              <Stack spacing={0.875}>
                {passing.map((item) => (
                  <Stack key={item.label} direction="row" spacing={1} alignItems="center">
                    <Iconify
                      icon="eva:checkmark-circle-2-fill"
                      width={15}
                      sx={{ color: GOOD, flexShrink: 0 }}
                    />
                    <Typography sx={{ fontSize: '0.75rem', color: MUTED }}>{item.label}</Typography>
                  </Stack>
                ))}
              </Stack>
            </>
          )}
        </Box>
      }
    >
      <ButtonBase
        aria-label={
          clear ? 'Event health: every check passed' : `Event health: ${blockers.length} to fix`
        }
        sx={{
          flexShrink: 0,
          width: 34,
          height: 34,
          borderRadius: '50%',
          bgcolor: 'rgba(255,255,255,0.14)',
          border: '1px solid rgba(255,255,255,0.28)',
          backdropFilter: 'blur(8px)',
          transition: 'background-color 150ms ease, transform 150ms ease',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' },
          '&:active': { transform: 'scale(0.94)' },
        }}
      >
        <Iconify
          icon={clear ? 'eva:checkmark-circle-2-fill' : 'eva:alert-circle-fill'}
          width={20}
          sx={{ color: clear ? '#3DDC84' : '#FFB020' }}
        />
      </ButtonBase>
    </Tooltip>
  );
};

HealthBadge.propTypes = {
  blockers: PropTypes.array,
  passing: PropTypes.array,
  isDraft: PropTypes.bool,
  enabledCount: PropTypes.number,
};

// Bordered tiles rather than a divider row: four numbers of different shapes
// (count, fraction, fraction, count) each get their own field, and the set
// reflows to two columns on a phone instead of squeezing to nothing. `lead`
// marks the one metric the event is actually judged on, so four equal tiles
// stop competing for the same attention.
const Figure = ({ icon, value, label, tone, status, lead }) => (
  <Box
    sx={{
      minWidth: 0,
      p: { xs: 1.5, sm: 1.75 },
      borderRadius: 1.5,
      border: `1px solid ${lead ? 'rgba(19,64,255,0.22)' : HAIRLINE}`,
      bgcolor: lead ? 'rgba(19,64,255,0.04)' : '#FCFCFD',
    }}
  >
    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
      <Iconify icon={icon} width={13} sx={{ color: tone ?? FAINT, flexShrink: 0 }} />
      <Typography
        noWrap
        sx={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: FAINT,
        }}
      >
        {label}
      </Typography>
    </Stack>

    <Stack direction="row" spacing={0.625} alignItems="center">
      <Typography
        sx={{
          fontSize: lead ? 30 : 26,
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums',
          color: tone ?? INK,
        }}
      >
        {value}
      </Typography>

      {/* Green means on-track and amber means needs-attention, everywhere on
          this page — the glyph carries the state so the number itself does not
          have to turn into a traffic light. */}
      {status ? (
        <Iconify
          icon={status === 'good' ? 'eva:checkmark-circle-2-fill' : 'eva:alert-circle-fill'}
          width={15}
          sx={{ color: status === 'good' ? GOOD : WARN, flexShrink: 0 }}
        />
      ) : null}
    </Stack>
  </Box>
);

Figure.propTypes = {
  icon: PropTypes.string,
  value: PropTypes.node,
  label: PropTypes.string,
  tone: PropTypes.string,
  status: PropTypes.oneOf(['good', 'warn']),
  lead: PropTypes.bool,
};

const MiniStat = ({ label, value, note }) => (
  <Box sx={{ minWidth: 0, flex: 1 }}>
    <Typography
      noWrap
      sx={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: FAINT,
      }}
    >
      {label}
    </Typography>
    <Typography
      noWrap
      sx={{ fontSize: 15, fontWeight: 700, color: INK, mt: 0.25, fontVariantNumeric: 'tabular-nums' }}
    >
      {value}
    </Typography>
    {note ? (
      <Typography noWrap sx={{ fontSize: 11, color: MUTED, mt: 0.125 }}>
        {note}
      </Typography>
    ) : null}
  </Box>
);

MiniStat.propTypes = { label: PropTypes.string, value: PropTypes.node, note: PropTypes.string };

/**
 * The event window as one object instead of four stacked ones.
 *
 * The old block spent a stamp row, a track, decorative endpoint dots and a meta
 * row on a single idea, and the meta row contradicted itself — "Day 1 of 31"
 * and "30 days left" are the same fact stated twice. This keeps the track (the
 * only part that shows *where* now sits), hangs the two dates off its ends, and
 * puts one phase-coloured sentence in the middle. Exact timestamps and the total
 * length move to the hover, where precision belongs and glanceability does not.
 *
 * Week boundaries are notched into the track so its length reads as a duration
 * rather than a bare fraction — a 31-day bar and a 7-day bar are otherwise
 * identical pictures.
 */
const EventWindow = ({ state, startsAt, endsAt, progress, duration, timing }) => {
  const totalDays = Math.max(dayjs(endsAt).diff(startsAt, 'day'), 1);
  const showNow = state.phase === 'live' || state.phase === 'paused';
  const weekTicks =
    totalDays >= 14
      ? Array.from(
          { length: Math.floor(totalDays / 7) },
          (_, index) => (((index + 1) * 7) / totalDays) * 100
        ).filter((left) => left < 99)
      : [];

  return (
    <Box>
      <Tooltip
        arrow
        placement="top"
        enterTouchDelay={0}
        title={`${duration.label} — ${formatStamp(startsAt)} to ${formatStamp(endsAt)}`}
      >
        {/* Inset by the marker's radius so it can sit on 0% or 100% without
            clipping out of the card. */}
        <Box sx={{ position: 'relative', mx: '8px', py: 0.75, cursor: 'default' }}>
          <Box
            sx={{
              position: 'relative',
              height: 10,
              borderRadius: 5,
              bgcolor: '#EFEFEF',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                width: `${progress}%`,
                height: 1,
                borderRadius: 5,
                bgcolor: state.color,
                transition: 'width 400ms ease',
              }}
            />
            {weekTicks.map((left) => (
              <Box
                key={left}
                sx={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${left}%`,
                  width: '2px',
                  bgcolor: '#fff',
                  opacity: 0.85,
                }}
              />
            ))}
          </Box>

          {/* Only meaningful while the window is actually open. */}
          {showNow ? (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: `${progress}%`,
                transform: 'translate(-50%, -50%)',
                width: 16,
                height: 16,
                borderRadius: '50%',
                bgcolor: state.color,
                border: '3px solid #fff',
                boxShadow: '0 0 0 1px rgba(20,18,19,0.14)',
                transition: 'left 400ms ease',
              }}
            />
          ) : null}
        </Box>
      </Tooltip>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1.5}
        sx={{ mt: 0.875 }}
      >
        <Typography noWrap sx={{ fontSize: 11, fontWeight: 600, color: FAINT }}>
          {dayjs(startsAt).format('D MMM')}
        </Typography>

        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
          <Box
            sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: timing.tone, flexShrink: 0 }}
          />
          <Typography noWrap sx={{ fontSize: 12.5, fontWeight: 600, color: timing.tone }}>
            {timing.text}
          </Typography>
        </Stack>

        <Typography noWrap sx={{ fontSize: 11, fontWeight: 600, color: FAINT }}>
          {dayjs(endsAt).format('D MMM')}
        </Typography>
      </Stack>
    </Box>
  );
};

EventWindow.propTypes = {
  state: PropTypes.object,
  startsAt: PropTypes.instanceOf(Date),
  endsAt: PropTypes.instanceOf(Date),
  progress: PropTypes.number,
  duration: PropTypes.object,
  timing: PropTypes.object,
};

/**
 * Day counts rather than another restatement of the dates — "Day 1 of 31" is
 * what tells you whether a quiet event is failing or simply hasn't run yet.
 */
const getDuration = (state, startsAt, endsAt, now) => {
  const totalDays = Math.max(dayjs(endsAt).diff(startsAt, 'day'), 1);
  const daysLeft = Math.max(dayjs(endsAt).diff(now, 'day'), 0);

  if (state.phase === 'draft' || state.phase === 'scheduled') {
    return { label: `${totalDays} day${totalDays === 1 ? '' : 's'} long`, daysLeft };
  }

  if (state.phase === 'ended') {
    return { label: `Ran ${totalDays} day${totalDays === 1 ? '' : 's'}`, daysLeft: 0 };
  }

  const dayNumber = Math.min(Math.max(dayjs(now).diff(startsAt, 'day') + 1, 1), totalDays);

  return { label: `Day ${dayNumber} of ${totalDays}`, daysLeft };
};

/**
 * A continuous day-by-day series over the part of the window that has actually
 * run. The backend only returns days that saw a scan, so the gaps are filled
 * here — a missing bar and a zero bar mean very different things to an admin,
 * and a quiet stretch is the whole point of drawing this.
 */
const buildDailySeries = (state, dailyClaims, startsAt, endsAt, now) => {
  // A draft whose start date has already slipped past would otherwise draw a
  // month of honest-looking zeroes for a window it never actually ran.
  if (state.phase === 'draft' || state.phase === 'scheduled') return [];

  const first = dayjs(startsAt).startOf('day');
  const last = dayjs(Math.min(dayjs(endsAt).valueOf(), dayjs(now).valueOf())).startOf('day');

  const elapsed = last.diff(first, 'day') + 1;
  if (elapsed < 1) return [];

  const byDate = new Map((dailyClaims ?? []).map((entry) => [entry.date, entry.claims]));
  const span = Math.min(elapsed, CHART_DAYS);
  const from = last.subtract(span - 1, 'day');

  return Array.from({ length: span }, (_, index) => {
    const day = from.add(index, 'day');
    const key = day.format('YYYY-MM-DD');
    return { key, day, claims: byDate.get(key) ?? 0 };
  });
};

const axisLabelSx = { fontSize: 11, color: FAINT, fontWeight: 600 };

// Title and its qualifier on one line instead of stacked: the second line was
// costing ~30px of every card to say something that fits in the margin.
const CardHead = ({ title, meta }) => (
  <Stack
    direction="row"
    spacing={2}
    alignItems="baseline"
    justifyContent="space-between"
    sx={{ mb: 2 }}
  >
    <Typography variant="subtitle1" sx={{ lineHeight: 1.3 }}>
      {title}
    </Typography>
    {meta ? (
      <Typography noWrap sx={{ fontSize: 12, color: MUTED, flexShrink: 0 }}>
        {meta}
      </Typography>
    ) : null}
  </Stack>
);

CardHead.propTypes = { title: PropTypes.string, meta: PropTypes.node };

/**
 * Single series, so no legend — the card title names it. Bars are thin and
 * flat-bottomed on a zero baseline, with a dashed reference line at the busiest
 * day so a height can be read without a grid competing with the data.
 *
 * Today is drawn lighter and labelled "so far": a part-finished day plotted in
 * the same ink as a finished one reads as a collapse in scans every single
 * morning, which is the fastest way to lose an admin's trust in the chart.
 */
const CollectionsChart = ({ series }) => {
  const peak = Math.max(...series.map((point) => point.claims), 1);
  const last = series[series.length - 1];
  const isPartial = last.day.isSame(dayjs(), 'day');

  // Beyond a fortnight the per-day ticks collide, so the axis falls back to
  // naming its two ends and leaves the rest to the hover tooltips.
  const showDayTicks = series.length <= 14;
  const rowSx = {
    display: 'flex',
    gap: `${BAR_GAP}px`,
    maxWidth: series.length * (BAR_MAX_WIDTH + BAR_GAP) - BAR_GAP,
  };

  return (
    <Box>
      <Box sx={{ position: 'relative', pt: 2 }}>
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            left: 0,
            right: 0,
            borderTop: `1px dashed ${HAIRLINE}`,
          }}
        />

        {/* Both ends of the scale are named, so a bar's height is readable as a
            number instead of only as "taller than that one". */}
        <Typography
          sx={{
            position: 'absolute',
            top: 4,
            right: 0,
            px: 0.5,
            bgcolor: '#fff',
            fontSize: 10,
            fontWeight: 700,
            color: FAINT,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {peak}
        </Typography>
        <Typography
          sx={{
            position: 'absolute',
            bottom: 2,
            right: 0,
            px: 0.5,
            bgcolor: '#fff',
            fontSize: 10,
            fontWeight: 700,
            color: FAINT,
          }}
        >
          0
        </Typography>

        {/* Width-capped so a short run draws thin bars against an empty stretch
            of window rather than one wall-to-wall slab. Past a week the cap
            exceeds the card and the bars simply fill it. */}
        <Box sx={{ ...rowSx, alignItems: 'flex-end', height: CHART_HEIGHT }}>
          {series.map((point, index) => {
            const partial = isPartial && index === series.length - 1;

            return (
              <Tooltip
                key={point.key}
                arrow
                placement="top"
                enterTouchDelay={0}
                title={`${point.day.format('ddd D MMM')} — ${point.claims} ${point.claims === 1 ? 'collection' : 'collections'}${partial ? ' so far' : ''}`}
              >
                <Box
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    height: 1,
                    display: 'flex',
                    alignItems: 'flex-end',
                    cursor: 'default',
                    '&:hover > div': { opacity: 0.7 },
                  }}
                >
                  <Box
                    sx={{
                      width: 1,
                      height: point.claims > 0 ? `max(${(point.claims / peak) * 100}%, 5px)` : 3,
                      borderRadius: '4px 4px 0 0',
                      bgcolor: (point.claims > 0 && (partial ? '#8FA6FF' : ACCENT)) || '#EDEDF0',
                      transition: 'height 320ms ease, opacity 150ms ease',
                    }}
                  />
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      </Box>

      <Divider sx={{ borderColor: HAIRLINE }} />

      {/* One axis row, never two. Short runs get a tick under every bar; long
          ones name their two ends and leave the rest to the tooltips. The dates
          themselves live in the card header, so neither row has to carry them. */}
      {showDayTicks ? (
        <Box sx={{ ...rowSx, mt: 0.75 }}>
          {series.map((point, index) => {
            const isToday = isPartial && index === series.length - 1;
            // Weekends read differently for an event people have to walk to,
            // so the axis says which bars are which.
            const isWeekend = [0, 6].includes(point.day.day());

            return (
              <Typography
                key={point.key}
                sx={{
                  ...axisLabelSx,
                  flex: 1,
                  minWidth: 0,
                  fontSize: 9,
                  textAlign: 'center',
                  color: (isToday && ACCENT) || (isWeekend && MUTED) || FAINT,
                  fontWeight: isToday || isWeekend ? 700 : 600,
                }}
              >
                {point.day.format('dd')}
              </Typography>
            );
          })}
        </Box>
      ) : (
        <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.875 }}>
          <Typography sx={axisLabelSx}>{series[0].day.format('D MMM')}</Typography>
          <Typography sx={axisLabelSx}>
            {isPartial ? 'Today, so far' : last.day.format('D MMM')}
          </Typography>
        </Stack>
      )}
    </Box>
  );
};

CollectionsChart.propTypes = { series: PropTypes.array };

export default function FindCiptaOverview({ hunt, mutate }) {
  const edit = useBoolean();

  const now = new Date();
  const state = getEventState(hunt, now);
  const app = getAppVisibility(hunt, state);
  const checklist = buildChecklist(hunt);
  const blockers = checklist.filter((item) => !item.done);
  const passing = checklist.filter((item) => item.done);
  const isEditable = hunt.status !== 'ARCHIVED';
  const isDraft = hunt.status === 'DRAFT';

  const locations = hunt.locations ?? [];
  const enabled = locations.filter((l) => l.isEnabled);
  const qrReady = enabled.filter((l) => l.bitlyPublication?.status === 'READY').length;
  const collected = locations.reduce((total, l) => total + (l._count?.claims ?? 0), 0);

  const locationStatus =
    (locations.length > 0 && enabled.length === locations.length && 'good') ||
    (enabled.length === 0 && 'warn') ||
    undefined;
  const qrStatus =
    (enabled.length > 0 && qrReady === enabled.length && 'good') ||
    (enabled.length > 0 && 'warn') ||
    undefined;

  const startsAt = new Date(hunt.startsAt);
  const endsAt = new Date(hunt.endsAt);
  const duration = getDuration(state, startsAt, endsAt, now);
  const timing = getTiming(state, startsAt, endsAt, now, duration.daysLeft);

  const span = endsAt.getTime() - startsAt.getTime();
  const elapsed = now.getTime() - startsAt.getTime();
  const progress = span > 0 ? Math.min(Math.max((elapsed / span) * 100, 0), 100) : 0;

  const series = buildDailySeries(state, hunt.dailyClaims, startsAt, endsAt, now);
  const windowTotal = series.reduce((total, point) => total + point.claims, 0);
  // The header carries the window, so neither axis row has to spend a line on it.
  const chartRange = series.length
    ? `${series[0].day.format('D MMM')} – ${
        series[series.length - 1].day.isSame(dayjs(), 'day')
          ? 'today'
          : series[series.length - 1].day.format('D MMM')
      }`
    : null;
  const busiest = series.reduce(
    (best, point) => (point.claims > best.claims ? point : best),
    series[0] ?? { claims: 0 }
  );
  // Source order is the admin's own sort on the Locations tab, which says
  // nothing about performance. Ranking by collections puts the spot that is
  // actually working — and the one that is not — where they get noticed.
  const rankedLocations = [...locations].sort((a, b) => {
    if (a.isEnabled !== b.isEnabled) return a.isEnabled ? -1 : 1;
    return (b._count?.claims ?? 0) - (a._count?.claims ?? 0);
  });

  // Each location carries only its newest claim, which is all this needs.
  const lastCollectedAt = locations
    .map((l) => l.claims?.[0]?.claimedAt)
    .filter(Boolean)
    .sort()
    .pop();

  return (
    <>
      {/* Hero — the artwork is the event's whole identity, so it gets to be the
          backdrop rather than a 96px thumbnail in the corner. */}
      <Card sx={{ position: 'relative', overflow: 'hidden', mb: 3 }}>
        {hunt.heroArtworkUrl ? (
          <>
            <Box
              component="img"
              src={hunt.heroArtworkUrl}
              alt=""
              aria-hidden
              sx={{
                position: 'absolute',
                inset: 0,
                width: 1,
                height: 1,
                objectFit: 'cover',
                filter: 'blur(28px) saturate(1.3)',
                transform: 'scale(1.25)',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(100deg, rgba(14,13,14,0.94) 0%, rgba(14,13,14,0.78) 45%, rgba(14,13,14,0.48) 100%)',
              }}
            />
          </>
        ) : (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(115deg, #1340ff 0%, #0b1d78 100%)',
            }}
          />
        )}

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 2.5, sm: 3 }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          sx={{ position: 'relative', p: { xs: 2.5, md: 3.5 } }}
        >
          {hunt.heroArtworkUrl ? (
            <Box
              component="img"
              src={hunt.heroArtworkUrl}
              alt={hunt.title}
              sx={{
                width: { xs: 88, md: 124 },
                height: { xs: 88, md: 124 },
                borderRadius: 2,
                objectFit: 'cover',
                flexShrink: 0,
                boxShadow: '0 14px 34px rgba(0,0,0,0.45)',
              }}
            />
          ) : (
            <Stack
              alignItems="center"
              justifyContent="center"
              sx={{
                width: { xs: 88, md: 124 },
                height: { xs: 88, md: 124 },
                borderRadius: 2,
                border: '1px dashed rgba(255,255,255,0.5)',
                color: 'rgba(255,255,255,0.85)',
                flexShrink: 0,
                textAlign: 'center',
                px: 1,
              }}
            >
              <Iconify icon="mdi:image-outline" width={26} />
              <Typography sx={{ fontSize: 11, mt: 0.5, fontWeight: 600 }}>No artwork</Typography>
            </Stack>
          )}

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.6)',
                mb: 0.75,
              }}
            >
              Limited Time Event
            </Typography>

            {/* Health rides beside the title: it is a property of the event, not
                a panel that deserves a third of the page once it reads "all
                clear" — which is what it reads almost every day. */}
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.75 }}>
              <Typography
                sx={{
                  fontFamily: 'Instrument Serif',
                  fontSize: { xs: 32, md: 44 },
                  fontWeight: 400,
                  lineHeight: 1.05,
                  color: '#fff',
                  minWidth: 0,
                }}
              >
                {hunt.title}
              </Typography>

              <HealthBadge
                blockers={blockers}
                passing={passing}
                isDraft={isDraft}
                enabledCount={enabled.length}
              />
            </Stack>

            <Typography
              sx={{
                fontSize: '0.875rem',
                color: 'rgba(255,255,255,0.74)',
                maxWidth: 560,
                lineHeight: 1.5,
              }}
            >
              {hunt.description}
            </Typography>
          </Box>

          <Button
            onClick={edit.onTrue}
            disabled={!isEditable}
            startIcon={<Iconify icon="solar:pen-bold" width={16} />}
            sx={{
              flexShrink: 0,
              alignSelf: { xs: 'stretch', sm: 'center' },
              height: 44,
              px: 2.5,
              fontSize: '0.85rem',
              fontWeight: 600,
              textTransform: 'none',
              whiteSpace: 'nowrap',
              borderRadius: 1.15,
              color: '#fff',
              bgcolor: 'rgba(255,255,255,0.14)',
              border: '1px solid rgba(255,255,255,0.28)',
              borderBottom: '3px solid rgba(255,255,255,0.28)',
              backdropFilter: 'blur(8px)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.24)' },
              '&:disabled': { color: 'rgba(255,255,255,0.45)' },
            }}
          >
            Edit event
          </Button>
        </Stack>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Whether creators can see it right now is the first thing you came
                to check, so it leads instead of sitting in a row at the bottom. */}
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                px: 2.5,
                py: 1.5,
                bgcolor: app.visible ? 'rgba(26,191,102,0.08)' : 'rgba(255,154,2,0.10)',
                color: app.visible ? '#129450' : '#B36B00',
              }}
            >
              <Iconify
                icon={app.visible ? 'eva:checkmark-circle-2-fill' : 'eva:eye-off-2-outline'}
                width={18}
              />
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{app.label}</Typography>
            </Stack>

            <Box sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                  gap: 1.25,
                  mb: 2.5,
                }}
              >
                <Figure
                  lead
                  icon="mdi:qrcode-scan"
                  value={collected}
                  label="Collected"
                  tone={collected > 0 ? ACCENT : undefined}
                />
                <Figure
                  icon="mdi:map-marker-radius-outline"
                  value={`${enabled.length}/${locations.length}`}
                  label="Locations on"
                  status={locationStatus}
                />
                <Figure
                  icon="mdi:qrcode"
                  value={`${qrReady}/${enabled.length}`}
                  label="QR ready"
                  tone={enabled.length > 0 && qrReady < enabled.length ? WARN : undefined}
                  status={qrStatus}
                />
                <Figure
                  icon="mdi:lightning-bolt-outline"
                  value={hunt.rewardXp}
                  label="XP per spot"
                />
              </Box>

              <EventWindow
                state={state}
                startsAt={startsAt}
                endsAt={endsAt}
                progress={progress}
                duration={duration}
                timing={timing}
              />

              {/* Which spots are actually being found. This lives here rather
                  than in a card of its own because it is the one block that can
                  grow: it absorbs whatever height the taller chart card leaves,
                  instead of the timeline row floating above an empty half-card.
                  Past a handful of spots it scrolls rather than stretching the
                  row. */}
              <Divider sx={{ borderColor: HAIRLINE, mt: 2.5, mb: 1.5 }} />

              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="baseline"
                spacing={2}
                sx={{ mb: 1.25 }}
              >
                <Typography
                  sx={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: FAINT,
                  }}
                >
                  Spots
                </Typography>
                <Typography noWrap sx={{ fontSize: 11, color: MUTED, flexShrink: 0 }}>
                  Ranked by collections
                </Typography>
              </Stack>

              <Box sx={{ flexGrow: 1, minHeight: 0, overflowY: 'auto', mr: -1, pr: 1 }}>
                {locations.length === 0 ? (
                  <Typography sx={{ fontSize: '0.813rem', color: MUTED }}>
                    No spots yet — add the first one on the Locations tab.
                  </Typography>
                ) : (
                  <Stack spacing={1.25}>
                    {rankedLocations.map((location, index) => {
                      const claims = location._count?.claims ?? 0;
                      const share = collected > 0 ? (claims / collected) * 100 : 0;
                      // Ranks describe collectible spots. A switched-off one
                      // still shows its historic numbers but holds no position.
                      const rank = location.isEnabled ? index + 1 : null;

                      return (
                        <Stack
                          key={location.id}
                          direction="row"
                          spacing={1.25}
                          alignItems="center"
                          sx={{ opacity: location.isEnabled ? 1 : 0.6 }}
                        >
                          <Box
                            sx={{
                              flexShrink: 0,
                              width: 20,
                              height: 20,
                              borderRadius: 0.75,
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: 10,
                              fontWeight: 700,
                              fontVariantNumeric: 'tabular-nums',
                              bgcolor: rank === 1 ? 'rgba(19,64,255,0.10)' : '#F4F4F5',
                              color: rank === 1 ? ACCENT : FAINT,
                            }}
                          >
                            {rank ?? '–'}
                          </Box>

                          <Typography
                            noWrap
                            sx={{ fontSize: '0.875rem', color: INK, flexShrink: 0, maxWidth: 180 }}
                          >
                            {location.name}
                          </Typography>

                          {location.isEnabled ? null : (
                            <Box
                              sx={{
                                flexShrink: 0,
                                px: 0.625,
                                borderRadius: 0.75,
                                bgcolor: '#F4F4F5',
                                fontSize: 9,
                                fontWeight: 700,
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                color: FAINT,
                              }}
                            >
                              Off
                            </Box>
                          )}

                          {/* Relative share, so one busy spot next to a dead one
                              is obvious without reading both numbers. */}
                          <Box
                            sx={{
                              flexGrow: 1,
                              height: 5,
                              borderRadius: 2.5,
                              bgcolor: '#F1F1F1',
                              overflow: 'hidden',
                              minWidth: 24,
                            }}
                          >
                            <Box
                              sx={{
                                width: `${share}%`,
                                height: 1,
                                borderRadius: 2.5,
                                bgcolor: claims > 0 ? ACCENT : 'transparent',
                                transition: 'width 400ms ease',
                              }}
                            />
                          </Box>

                          {/* The bar shows the proportion; these say what it is,
                              so nobody has to do the division in their head. */}
                          <Typography
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: claims > 0 ? MUTED : '#C4C4C8',
                              flexShrink: 0,
                              width: 34,
                              textAlign: 'right',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {`${Math.round(share)}%`}
                          </Typography>

                          <Typography
                            sx={{
                              fontSize: '0.813rem',
                              fontWeight: 700,
                              color: claims > 0 ? INK : '#B0B0B0',
                              flexShrink: 0,
                              minWidth: 28,
                              textAlign: 'right',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {claims}
                          </Typography>
                        </Stack>
                      );
                    })}
                  </Stack>
                )}
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Pace, not just the total: one flat week in the middle of a run is the
            thing a headline count can never show you. */}
        <Grid item xs={12} md={5}>
          <Card sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardHead title="Collections per day" meta={chartRange} />

            {series.length === 0 ? (
              <Stack
                alignItems="center"
                justifyContent="center"
                spacing={1}
                sx={{ flexGrow: 1, py: 5, textAlign: 'center' }}
              >
                <Iconify icon="mdi:chart-timeline-variant" width={26} sx={{ color: '#D5D5DA' }} />
                <Typography sx={{ fontSize: '0.813rem', color: MUTED, maxWidth: 240 }}>
                  Nothing to chart yet — the event has not started collecting.
                </Typography>
              </Stack>
            ) : (
              <>
                <CollectionsChart series={series} />

                {/* Absorbs any height the taller neighbouring card leaves, so the
                    summary sits on the card floor instead of a gap opening up
                    mid-card the way it did under the progress bar. */}
                <Box sx={{ flexGrow: 1, minHeight: 20 }} />

                <Divider sx={{ borderColor: HAIRLINE, mb: 2 }} />

                <Stack
                  direction="row"
                  spacing={2}
                  divider={
                    <Divider orientation="vertical" flexItem sx={{ borderColor: HAIRLINE }} />
                  }
                >
                  <MiniStat
                    label="Busiest day"
                    value={busiest.claims}
                    note={busiest.claims > 0 ? busiest.day.format('D MMM') : 'No scans yet'}
                  />
                  <MiniStat
                    label="Daily average"
                    value={(windowTotal / series.length).toFixed(1)}
                    note={`Over ${series.length} day${series.length === 1 ? '' : 's'}`}
                  />
                  <MiniStat
                    label="Last collected"
                    value={lastCollectedAt ? dayjs(lastCollectedAt).from(now) : '—'}
                    note={lastCollectedAt ? dayjs(lastCollectedAt).format('D MMM, h:mm A') : 'Never'}
                  />
                </Stack>
              </>
            )}
          </Card>
        </Grid>
      </Grid>

      <FindCiptaEventEdit open={edit.value} onClose={edit.onFalse} hunt={hunt} mutate={mutate} />
    </>
  );
}

FindCiptaOverview.propTypes = {
  hunt: PropTypes.object,
  mutate: PropTypes.func,
};
