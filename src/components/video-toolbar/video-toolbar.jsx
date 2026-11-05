import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';

import { Box, Stack, alpha, Tooltip, IconButton, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

const DOT_COLOR = { open: '#F2C94C', resolved: '#22C55E' };

const ACTIVE_WINDOW = 1;

const EASE_OUT_CSS = 'cubic-bezier(0.23, 1, 0.32, 1)';

export const VIDEO_FRAME_ATTR = 'data-video-frame';

const controlButtonSx = {
  p: 0.5,
  color: 'common.white',
  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.12)' },
};

const parseTimestamp = (timestamp) => {
  const parts = (timestamp || '').split(':').map(Number);
  if (parts.some(Number.isNaN)) return 0;
  return parts.reduce((total, part) => total * 60 + part, 0);
};

const formatTimestamp = (timeInSeconds) => {
  const total = Math.floor(Math.max(0, Number(timeInSeconds) || 0));
  const pad = (value) => value.toString().padStart(2, '0');
  const hours = Math.floor(total / 3600);
  const clock = `${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
  return hours > 0 ? `${pad(hours)}:${clock}` : clock;
};

const isResolved = (comment) => Boolean(comment?.resolvedByUserId || comment?.resolvedAt);

const authorOf = (comment) => comment.user?.name;

function Scrubber({ comments, currentTime, duration, onSeek, onMarkerClick, getAuthorName }) {
  const [dragging, setDragging] = useState(false);

  const markers = useMemo(() => {
    const bySecond = new Map();
    comments
      .filter((comment) => comment.timestamp && !comment.deletedAt)
      .forEach((comment) => {
        const seconds = parseTimestamp(comment.timestamp);
        if (!bySecond.has(seconds)) bySecond.set(seconds, []);
        bySecond.get(seconds).push(comment);
      });
    return [...bySecond.entries()].map(([seconds, items]) => ({ seconds, items }));
  }, [comments]);

  const toPercent = (seconds) => (duration ? Math.min(100, (seconds / duration) * 100) : 0);

  const seekFromPointer = (event) => {
    if (!duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    onSeek(ratio * duration);
  };

  const handlePointerDown = (event) => {
    const marker = onMarkerClick && event.target.closest?.('[data-seconds]');
    if (marker) {
      const seconds = Number(marker.dataset.seconds);
      onMarkerClick(seconds, markers.find((item) => item.seconds === seconds)?.items ?? []);
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    seekFromPointer(event);
  };

  const handlePointerMove = (event) => {
    if (dragging) seekFromPointer(event);
  };

  const handlePointerUp = (event) => {
    if (!dragging) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setDragging(false);
  };

  return (
    <Box
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      sx={{
        position: 'relative',
        height: 16,
        cursor: 'pointer',
        touchAction: 'none',
        '&:hover .scrubber-track': { transform: 'translateY(-50%) scaleY(1)' },
      }}
    >
      <Box
        className="scrubber-track"
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '50%',
          // Fixed 6px; the thin 4px state is a scale, so hover/drag never re-lays out
          height: 6,
          transform: `translateY(-50%) scaleY(${dragging ? 1 : 0.667})`,
          borderRadius: 99,
          bgcolor: 'rgba(255, 255, 255, 0.25)',
          overflow: 'hidden',
          transition: `transform 150ms ${EASE_OUT_CSS}`,
        }}
      >
        <Box sx={{ width: `${toPercent(currentTime)}%`, height: 1, bgcolor: 'common.white' }} />
      </Box>

      {!!duration &&
        markers.map(({ seconds, items }) => {
          const isActive = Math.abs(currentTime - seconds) <= ACTIVE_WINDOW;
          const dotColor = items.every(isResolved) ? DOT_COLOR.resolved : DOT_COLOR.open;
          const hasDrawing = items.some((comment) => comment.annotation);
          const size = hasDrawing ? 16 : 12;

          return (
            <Tooltip
              key={seconds}
              placement="top"
              title={
                <Stack gap={0.5} sx={{ maxWidth: 260 }}>
                  {items.map((comment) => (
                    <Typography key={comment.id} sx={{ fontSize: 12, lineHeight: 1.4 }}>
                      <Box
                        component="span"
                        sx={{ fontFamily: 'monospace', opacity: 0.7, mr: 0.75 }}
                      >
                        {comment.timestamp}
                      </Box>
                      {comment.annotation && (
                        <Iconify
                          icon="solar:pen-bold"
                          width={11}
                          sx={{ mr: 0.5, verticalAlign: '-1px' }}
                        />
                      )}
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        {getAuthorName(comment)}
                      </Box>
                      : {comment.text}
                    </Typography>
                  ))}
                </Stack>
              }
            >
              <Box
                component="span"
                role="button"
                aria-label={`Feedback at ${items[0].timestamp}`}
                {...(onMarkerClick && { 'data-seconds': seconds })}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: `${toPercent(seconds)}%`,
                  width: size,
                  height: size,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  border: '1.5px solid rgba(0, 0, 0, 0.55)',
                  bgcolor: dotColor,
                  color: '#231F20',
                  boxShadow: isActive ? `0 0 0 3px ${alpha(dotColor, 0.35)}` : 'none',
                  transform: `translate(-50%, -50%) scale(${isActive ? 1 : 0.833})`,
                  transition: `transform 150ms ${EASE_OUT_CSS}`,
                  '&:hover': { transform: 'translate(-50%, -50%) scale(1)' },
                }}
              >
                {hasDrawing && (
                  <Iconify icon="solar:pen-bold" width={9} sx={{ pointerEvents: 'none' }} />
                )}
              </Box>
            </Tooltip>
          );
        })}
    </Box>
  );
}

Scrubber.propTypes = {
  comments: PropTypes.array.isRequired,
  currentTime: PropTypes.number.isRequired,
  duration: PropTypes.number,
  onSeek: PropTypes.func.isRequired,
  onMarkerClick: PropTypes.func,
  getAuthorName: PropTypes.func.isRequired,
};

/**
 * Toolbar over a video: play, a scrubber with feedback dots, time, mute and fullscreen.
 * Holds no player state itself, so any player can drive it. Sits at the bottom of a
 * positioned parent marked with VIDEO_FRAME_ATTR, and hides while playing unless that
 * parent is hovered.
 */
export default function VideoToolbar({
  isPlaying,
  currentTime,
  duration,
  muted,
  comments = [],
  disabled = false,
  zIndex = 10,
  actions,
  onTogglePlay,
  onSeek,
  onToggleMute,
  onFullscreen,
  onMarkerClick,
  // Name shown for each comment in a dot's tooltip (the real author by default)
  getAuthorName = authorOf,
}) {
  return (
    <Stack
      gap={0.5}
      onClick={(event) => event.stopPropagation()}
      sx={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex,
        px: 1.5,
        pt: 4,
        pb: 1,
        color: 'common.white',
        background: 'linear-gradient(to top, rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0))',
        opacity: isPlaying ? 0 : 1,
        transition: 'opacity 0.2s',
        [`[${VIDEO_FRAME_ATTR}]:hover &`]: { opacity: 1 },
      }}
    >
      <Scrubber
        comments={comments}
        currentTime={currentTime}
        duration={duration}
        onSeek={onSeek}
        onMarkerClick={onMarkerClick}
        getAuthorName={getAuthorName}
      />

      <Stack direction="row" alignItems="center" gap={1}>
        <IconButton
          size="small"
          disabled={disabled}
          onClick={onTogglePlay}
          sx={{ ...controlButtonSx, '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.35)' } }}
        >
          <Iconify icon={isPlaying ? 'mdi:pause' : 'mdi:play'} width={20} />
        </IconButton>

        <Typography sx={{ fontFamily: 'monospace', fontSize: 12 }}>
          {formatTimestamp(currentTime)} / {duration ? formatTimestamp(duration) : '--:--'}
        </Typography>

        {/* Extra buttons (e.g. draw on frame), right-aligned before mute */}
        <Stack direction="row" alignItems="center" sx={{ ml: 'auto' }}>
          {actions}
        </Stack>
        <IconButton size="small" onClick={onToggleMute} sx={controlButtonSx}>
          <Iconify icon={muted ? 'mdi:volume-off' : 'mdi:volume-high'} width={18} />
        </IconButton>
        {onFullscreen && (
          <IconButton size="small" onClick={onFullscreen} sx={controlButtonSx}>
            <Iconify icon="mdi:fullscreen" width={20} />
          </IconButton>
        )}
      </Stack>
    </Stack>
  );
}

VideoToolbar.propTypes = {
  isPlaying: PropTypes.bool,
  currentTime: PropTypes.number.isRequired,
  duration: PropTypes.number,
  muted: PropTypes.bool,
  comments: PropTypes.array,
  disabled: PropTypes.bool,
  zIndex: PropTypes.number,
  actions: PropTypes.node,
  onTogglePlay: PropTypes.func.isRequired,
  onSeek: PropTypes.func.isRequired,
  onToggleMute: PropTypes.func.isRequired,
  onFullscreen: PropTypes.func,
  onMarkerClick: PropTypes.func,
  getAuthorName: PropTypes.func,
};

// Exposed so a draw button (or similar) passed as `actions` matches the other buttons
export { controlButtonSx as videoToolbarButtonSx };
