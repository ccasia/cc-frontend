import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { m, useReducedMotion } from 'framer-motion';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

// Ring colour + inner glyph for every autosave state.
// `null` glyph = still working, so the ring stays an open spinning arc.
const STATUS_CONFIG = {
  restoring: { color: '#8E8E93', glyph: null },
  saving: { color: '#8E8E93', glyph: null },
  saved: { color: '#22C55E', glyph: 'check' },
  local: { color: '#FFAB00', glyph: 'check' },
  conflict: { color: '#FF5630', glyph: 'bang' },
  error: { color: '#FF5630', glyph: 'bang' },
};

const CHECK_PATH = 'M7.6 12.3l2.9 2.9 5.9-6.4';
const BANG_PATH = 'M12 7.2v5.4';

// Strong ease-out. UI feedback stays under 300ms so it never feels sluggish.
const DRAW = { duration: 0.22, ease: [0.16, 1, 0.3, 1] };

const MINUTE = 60 * 1000;

/**
 * Relative time reads faster than a clock time: "Saved 2 min ago" answers
 * "is my work safe?" without the user having to check their own clock.
 * Falls back to a clock time once the draft is genuinely old.
 */
function formatSavedAt(date) {
  if (!date) return '';

  const elapsed = Date.now() - date.getTime();

  if (elapsed < MINUTE) return 'just now';
  if (elapsed < 60 * MINUTE) return `${Math.floor(elapsed / MINUTE)} min ago`;

  return `at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

/** Re-render on a slow tick so relative time stays honest without a per-second timer. */
function useRelativeTime(date, active) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!date || !active) return undefined;

    const bump = () => setTick((n) => n + 1);
    const id = setInterval(bump, 30 * 1000);

    // A backgrounded tab throttles timers, so refresh the moment it returns.
    document.addEventListener('visibilitychange', bump);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', bump);
    };
  }, [date, active]);

  return formatSavedAt(date);
}

export default function DraftSaveIndicator({ status, lastSavedAt, onRetry }) {
  const config = STATUS_CONFIG[status];
  const reduceMotion = useReducedMotion();

  const showsTime = status === 'saved' || status === 'local';
  const relativeTime = useRelativeTime(lastSavedAt, showsTime);

  if (!config) return null;

  const { color, glyph } = config;
  const isBusy = glyph === null;
  const isConflict = status === 'conflict' || status === 'error';

  const label = {
    restoring: 'Restoring draft...',
    saving: 'Saving...',
    saved: relativeTime ? `Saved ${relativeTime}` : 'Saved',
    local: relativeTime ? `Saved on this device ${relativeTime}` : 'Saved on this device',
    conflict: 'Could not save',
    error: 'Could not save',
  }[status];

  const tooltip = {
    restoring: 'Loading your last draft',
    saving: 'Saving your draft',
    saved: 'Your draft is saved. You can close this and come back later.',
    local: 'Saved in this browser only. It is not on the server yet.',
    conflict: 'This draft changed somewhere else. Retry to save your version.',
    error: 'The draft could not be saved. Try again.',
  }[status];

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.75}
      role="status"
      aria-live="polite"
      sx={{
        minWidth: 0,
        // Quiet when things are fine, loud only when the save actually failed.
        ...(isConflict && {
          px: 1,
          py: 0.25,
          borderRadius: 1,
          bgcolor: alpha(color, 0.08),
        }),
      }}
    >
      <Tooltip title={tooltip} placement="bottom-end" arrow>
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.75}
          sx={{ minWidth: 0, cursor: 'default' }}
        >
          <Box
            component={m.div}
            animate={{ scale: isBusy || reduceMotion ? 1 : [1, 1.15, 1] }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            sx={{ width: 16, height: 16, flexShrink: 0, display: 'flex' }}
          >
            <Box
              component={m.svg}
              viewBox="0 0 24 24"
              width={16}
              height={16}
              aria-hidden
              animate={{ rotate: isBusy && !reduceMotion ? 360 : 0 }}
              transition={
                isBusy && !reduceMotion
                  ? { duration: 0.75, repeat: Infinity, ease: 'linear' }
                  : { duration: 0 } // a closed ring is rotationally symmetric, so snapping is invisible
              }
            >
              {/* The ring: an open arc while saving, closing into a full circle when done */}
              <m.circle
                cx="12"
                cy="12"
                r="9"
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                initial={false}
                animate={{ pathLength: isBusy ? 0.25 : 1, stroke: color }}
                transition={reduceMotion ? { duration: 0 } : DRAW}
              />

              {/* Inner glyph draws itself on top once the ring closes */}
              <m.path
                d={glyph === 'bang' ? BANG_PATH : CHECK_PATH}
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={false}
                animate={{ pathLength: isBusy ? 0 : 1, opacity: isBusy ? 0 : 1, stroke: color }}
                transition={reduceMotion ? { duration: 0 } : { ...DRAW, delay: isBusy ? 0 : 0.08 }}
              />

              {/* Dot under the exclamation mark */}
              <m.circle
                cx="12"
                cy="16.4"
                r="1"
                strokeWidth="0"
                initial={false}
                animate={{
                  scale: glyph === 'bang' ? 1 : 0.5,
                  opacity: glyph === 'bang' ? 1 : 0,
                  fill: color,
                }}
                transition={reduceMotion ? { duration: 0 } : { ...DRAW, delay: 0.16 }}
                style={{ originX: '12px', originY: '16.4px' }}
              />
            </Box>
          </Box>

          <Typography
            variant="caption"
            sx={{
              // The step indicator sits between this and the close button, so the
              // label only shows once the header is wide enough to carry it.
              display: { xs: 'none', md: 'block' },
              color: isBusy ? 'text.secondary' : color,
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </Typography>
        </Stack>
      </Tooltip>

      {isConflict && onRetry && (
        <Button
          size="small"
          onClick={onRetry}
          sx={{
            minWidth: 0,
            px: 0.75,
            py: 0,
            fontSize: 12,
            fontWeight: 600,
            color,
            transition: 'transform 160ms cubic-bezier(0.16, 1, 0.3, 1)',
            '&:hover': { bgcolor: alpha(color, 0.12) },
            '&:active': { transform: 'scale(0.96)' },
          }}
        >
          Retry
        </Button>
      )}
    </Stack>
  );
}

DraftSaveIndicator.propTypes = {
  status: PropTypes.string,
  lastSavedAt: PropTypes.instanceOf(Date),
  onRetry: PropTypes.func,
};
