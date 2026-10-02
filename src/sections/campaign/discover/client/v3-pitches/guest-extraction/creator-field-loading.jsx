import PropTypes from 'prop-types';
import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import { keyframes } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import {
  CC,
  fieldSx,
  FIELD_HEIGHT,
  FIELD_RADIUS,
  SHIMMER_DURATION_MS,
  SPINNER_DURATION_MS,
} from './creator-field-tokens';

/**
 * The loading state for a metric field while a fetch runs.
 *
 * It replaces the input inside the same 52px slot, so the row never changes
 * height. With reduced motion it shows a static placeholder instead of the
 * shimmer and the spinner.
 */

const shimmer = keyframes`
  0%   { background-position: -300px 0; }
  100% { background-position: 300px 0; }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

/**
 * What the hover card says while a scrape runs.
 *
 * The API status picks the step. Time only moves the text inside a step, and
 * counts from when the scrape started on the server, so a refresh does not
 * reset it. A scrape can take much longer than a minute, so a long step
 * cycles the "still going" lines instead of claiming to be done.
 */
export const STARTING_STEPS = [
  { at: 0, text: 'Starting the scrape...' },
  { at: 10, text: 'Waiting for a free slot...' },
];

export const FIRST_BATCH_STEPS = [
  { at: 0, text: 'Extracting posts...' },
  { at: 15, text: 'Counting the views...' },
  { at: 30, text: 'Crunching the numbers...' },
  { at: 45, text: 'Almost done...' },
  { at: 70, text: 'Wrapping up...' },
];

export const SECOND_BATCH_LINES = [
  'Not enough usable Reels. Checking 20 more...',
  'Digging deeper...',
  'Skipping collabs and ads...',
  'Nearly there, promise...',
];

export const STILL_GOING = [
  'Still digging...',
  'Good things take time...',
  'Hang tight...',
  'Reading every Reel...',
];

const STILL_GOING_FROM = 90;
const CYCLE_SECONDS = 8;

const cycle = (lines, seconds) => lines[Math.floor(seconds / CYCLE_SECONDS) % lines.length];

const stepAt = (steps, seconds) =>
  seconds >= STILL_GOING_FROM
    ? cycle(STILL_GOING, seconds - STILL_GOING_FROM)
    : steps.filter((step) => seconds >= step.at).pop().text;

/**
 * The status line for a scrape.
 *
 * `progress` is `{ status, checkingMore }` from the API, or null when this
 * loader does not know it. Null falls back to the first-batch steps.
 */
export function statusLine(progress, seconds) {
  const status = progress?.status;
  if (status === 'QUEUED' || status === 'RUNNING' || status === 'REQUIRES_RECONCILIATION')
    return stepAt(STARTING_STEPS, seconds);
  if (progress?.checkingMore) return cycle(SECOND_BATCH_LINES, seconds);
  return stepAt(FIRST_BATCH_STEPS, seconds);
}

/** Seconds since the scrape started, or since this loader appeared. */
const secondsSince = (startedAt, mountedAt) => {
  const start = startedAt ? new Date(startedAt).getTime() : NaN;
  const from = Number.isFinite(start) ? start : mountedAt;
  return Math.max(0, Math.floor((Date.now() - from) / 1000));
};

/** Hover or tap card with the live status line. It ticks only while open. */
function StatusTooltip({ progress, children }) {
  const mountedAt = useRef(Date.now());
  const [open, setOpen] = useState(false);
  const [seconds, setSeconds] = useState(() =>
    secondsSince(progress?.startedAt, mountedAt.current)
  );
  const startedAt = progress?.startedAt;

  useEffect(() => {
    if (!open) return undefined;
    const tick = () => setSeconds(secondsSince(startedAt, mountedAt.current));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [open, startedAt]);

  return (
    <Tooltip
      arrow
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      placement="top"
      enterTouchDelay={0}
      leaveTouchDelay={4000}
      title={statusLine(progress, seconds)}
    >
      {children}
    </Tooltip>
  );
}

StatusTooltip.propTypes = {
  progress: PropTypes.shape({
    status: PropTypes.string,
    startedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    checkingMore: PropTypes.bool,
  }),
  children: PropTypes.element.isRequired,
};

StatusTooltip.defaultProps = {
  progress: null,
};

export default function CreatorFieldLoading({
  label = 'Fetching creator details',
  showSpinner = false,
  height,
  progress = null,
}) {
  // Respect the viewer's motion setting. No shimmer, no spin.
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const field = (
    <Box
      data-testid="creator-field-loading"
      aria-busy="true"
      aria-live="polite"
      aria-label={label}
      role="status"
      sx={{
        ...fieldSx,
        width: '100%',
        gap: '10px',
        // The field keeps its white shell while it loads. Only the bar moves.
        backgroundColor: '#FFFFFF',
        // The skeleton has to match the field it stands in for, and the two
        // modals size their fields differently. Absent keeps the token.
        ...(height ? { height, minHeight: height } : null),
      }}
    >
      <Box
        data-testid="creator-field-shimmer"
        sx={{
          flex: 1,
          height: '12px',
          borderRadius: '9999px',
          ...(reducedMotion
            ? // Static placeholder in the same brand blue.
              { backgroundColor: CC.blue100 }
            : {
                background: `linear-gradient(90deg, ${CC.light200} 0%, ${CC.blue100} 50%, ${CC.light200} 100%)`,
                backgroundSize: '600px 100%',
                animation: `${shimmer} ${SHIMMER_DURATION_MS}ms linear infinite`,
              }),
        }}
      />

      {showSpinner && (
        <Box
          data-testid="creator-field-spinner"
          sx={{
            width: '16px',
            height: '16px',
            flexShrink: 0,
            borderRadius: '50%',
            border: `2px solid ${CC.blue100}`,
            borderTopColor: CC.blue500,
            ...(reducedMotion
              ? {}
              : { animation: `${spin} ${SPINNER_DURATION_MS}ms linear infinite` }),
          }}
        />
      )}
    </Box>
  );

  return showSpinner ? <StatusTooltip progress={progress}>{field}</StatusTooltip> : field;
}

CreatorFieldLoading.propTypes = {
  /** What is loading, announced to a screen reader. */
  label: PropTypes.string,
  /** Show the spinner beside the bar. Every fetching field shows one. */
  showSpinner: PropTypes.bool,
  /** Match a field taller than the token, as the platform modal's 52px. */
  height: PropTypes.number,
  /** The scrape's `{ status, startedAt, checkingMore }`, for the status line. */
  progress: PropTypes.object,
};

export { FIELD_HEIGHT, FIELD_RADIUS };
