import { useMemo } from 'react';
import PropTypes from 'prop-types';

import { Box, Typography } from '@mui/material';

import { useSubmissionComments } from 'src/hooks/use-submission-comments';

import Iconify from 'src/components/iconify';
import { DarkGlassTooltip } from 'src/components/tooltip/glass-tooltip';

import { displayNameOf } from './modal-video-toolbar';

const DOT_COLOR = { open: '#F2C94C', resolved: '#22C55E' };

// "mm:ss" or "hh:mm:ss" -> seconds
const toSeconds = (timestamp) => {
  const parts = String(timestamp).split(':').map(Number);
  if (parts.some(Number.isNaN)) return null;
  return parts.reduce((total, part) => total * 60 + part, 0);
};

const isResolved = (comment) => Boolean(comment.resolvedByUserId || comment.resolvedAt);

/**
 * Feedback dots under the video, one per second that has timestamped feedback (like the
 * admin viewer's scrubber). The native player's own scrubber can't carry markers, so this
 * is a separate track. A dot with a drawing shows a pen; clicking it shows the drawing,
 * otherwise it jumps the video to that moment.
 */
export default function FeedbackTimeline({
  submissionId,
  videoId,
  duration,
  currentTime,
  onSeek,
  onShowAnnotation,
}) {
  // Same request (and cache entry) as the feedback panel next to the video
  const { comments } = useSubmissionComments(submissionId, videoId);

  const markers = useMemo(() => {
    const bySecond = new Map();
    comments
      .filter((comment) => comment.timestamp && !comment.deletedAt)
      .forEach((comment) => {
        const seconds = toSeconds(comment.timestamp);
        if (seconds == null || seconds > duration) return;
        bySecond.set(seconds, [...(bySecond.get(seconds) || []), comment]);
      });
    return [...bySecond.entries()].map(([seconds, items]) => ({ seconds, items }));
  }, [comments, duration]);

  if (!duration || !markers.length) return null;

  const percent = (seconds) => `${Math.min(100, (seconds / duration) * 100)}%`;

  return (
    <Box sx={{ position: 'relative', height: 20, mx: 1, flexShrink: 0 }}>
      {/* Track, filled up to the playhead */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: 3,
          transform: 'translateY(-50%)',
          borderRadius: 2,
          bgcolor: 'rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ width: percent(currentTime), height: 1, bgcolor: 'rgba(0, 0, 0, 0.35)' }} />
      </Box>

      {markers.map(({ seconds, items }) => {
        const drawing = items.find((comment) => comment.annotation)?.annotation;
        const color = items.every(isResolved) ? DOT_COLOR.resolved : DOT_COLOR.open;
        const size = drawing ? 18 : 10;

        return (
          <DarkGlassTooltip
            key={seconds}
            placement="top"
            title={
              <Box sx={{ maxWidth: 260 }}>
                {items.map((comment) => (
                  <Typography key={comment.id} sx={{ fontSize: 12, lineHeight: 1.4 }}>
                    <Box component="span" sx={{ fontFamily: 'monospace', opacity: 0.7, mr: 0.75 }}>
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
                      {displayNameOf(comment)}
                    </Box>
                    : {comment.text}
                  </Typography>
                ))}
              </Box>
            }
          >
            <Box
              component="button"
              type="button"
              aria-label={`Feedback at ${items[0].timestamp}${drawing ? ', with a drawing' : ''}`}
              onClick={() => (drawing ? onShowAnnotation(drawing) : onSeek(seconds))}
              sx={{
                position: 'absolute',
                top: '50%',
                left: percent(seconds),
                width: size,
                height: size,
                p: 0,
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #FFF',
                borderRadius: '50%',
                bgcolor: color,
                color: '#231F20',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                transition: 'transform 0.15s',
                '&:hover': { transform: 'translate(-50%, -50%) scale(1.25)' },
              }}
            >
              {drawing && <Iconify icon="solar:pen-bold" width={9} />}
            </Box>
          </DarkGlassTooltip>
        );
      })}
    </Box>
  );
}

FeedbackTimeline.propTypes = {
  submissionId: PropTypes.string,
  videoId: PropTypes.string,
  duration: PropTypes.number,
  currentTime: PropTypes.number,
  onSeek: PropTypes.func.isRequired,
  onShowAnnotation: PropTypes.func.isRequired,
};
