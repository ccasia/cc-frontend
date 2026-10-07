import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';

import { Box, Stack, Tooltip, IconButton, Typography } from '@mui/material';

import { useSubmissionComments } from 'src/hooks/use-submission-comments';

import Iconify from 'src/components/iconify';

import { parseTimestamp, formatTimestamp, getCommentVideoId } from '../utils';
import {
  seekVideo,
  togglePlay,
  toggleMute,
  playFromFeedback,
  useCreatorSubmissionsStore,
} from '../../store/use-creator-submissions-store';

// Within this many seconds of the playhead, a feedback dot shows as active
const ACTIVE_WINDOW = 1;

const controlButtonSx = {
  p: 0.5,
  color: 'common.white',
  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.12)' },
};

// Marks this element as the fullscreen target (video + custom controls)
export const VIDEO_FRAME_ATTR = 'data-video-frame';

function Scrubber({ submission }) {
  const duration = useCreatorSubmissionsStore((s) => s.duration);
  const currentTime = useCreatorSubmissionsStore((s) => s.currentTime);
  const versionIndex = useCreatorSubmissionsStore((s) => s.versionIndex);
  // Only creator videos have timestamped feedback (raw footage doesn't)
  const isVideoSubmission = submission.submissionType?.type === 'VIDEO';
  const { comments } = useSubmissionComments(
    isVideoSubmission ? submission.id : null,
    getCommentVideoId(submission, versionIndex)
  );
  const [dragging, setDragging] = useState(false);

  // One dot per second that has feedback; several comments can share it
  const markers = useMemo(() => {
    const bySecond = new Map();
    comments
      .filter((comment) => comment.timestamp)
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
    seekVideo(ratio * duration);
  };

  const handlePointerDown = (event) => {
    // Clicking a dot plays from a few seconds before the feedback
    const markerSeconds = event.target.dataset?.seconds;
    if (markerSeconds !== undefined) {
      playFromFeedback(Number(markerSeconds));
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
        '&:hover .scrubber-track': { height: 6 },
      }}
    >
      <Box
        className="scrubber-track"
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '50%',
          height: dragging ? 6 : 4,
          transform: 'translateY(-50%)',
          borderRadius: 99,
          bgcolor: 'rgba(255, 255, 255, 0.25)',
          overflow: 'hidden',
          transition: 'height 0.15s',
        }}
      >
        <Box sx={{ width: `${toPercent(currentTime)}%`, height: 1, bgcolor: 'common.white' }} />
      </Box>

      {!!duration &&
        markers.map(({ seconds, items }) => {
          const isActive = Math.abs(currentTime - seconds) <= ACTIVE_WINDOW;

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
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        {comment.user?.name}
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
                data-seconds={seconds}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: `${toPercent(seconds)}%`,
                  width: isActive ? 12 : 10,
                  height: isActive ? 12 : 10,
                  borderRadius: '50%',
                  border: '1.5px solid rgba(0, 0, 0, 0.55)',
                  bgcolor: '#F2C94C',
                  boxShadow: isActive ? '0 0 0 3px rgba(242, 201, 76, 0.35)' : 'none',
                  transform: 'translate(-50%, -50%)',
                  transition: 'all 0.15s',
                  '&:hover': { width: 12, height: 12 },
                }}
              />
            </Tooltip>
          );
        })}
    </Box>
  );
}

Scrubber.propTypes = {
  submission: PropTypes.object.isRequired,
};

// Custom toolbar over the video: play, scrubber with feedback dots, time, mute, fullscreen
export default function VideoControls({ submission }) {
  const isPlaying = useCreatorSubmissionsStore((s) => s.isPlaying);
  const muted = useCreatorSubmissionsStore((s) => s.muted);
  const currentTime = useCreatorSubmissionsStore((s) => s.currentTime);
  const duration = useCreatorSubmissionsStore((s) => s.duration);

  const handleFullscreen = (event) => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      return;
    }
    event.currentTarget.closest(`[${VIDEO_FRAME_ATTR}]`)?.requestFullscreen();
  };

  return (
    <Stack
      gap={0.5}
      // Clicks on the toolbar shouldn't also toggle play via the video frame
      onClick={(event) => event.stopPropagation()}
      sx={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        px: 1.5,
        pt: 4,
        pb: 1,
        color: 'common.white',
        background: 'linear-gradient(to top, rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0))',
        // Hide while playing unless hovered
        opacity: isPlaying ? 0 : 1,
        transition: 'opacity 0.2s',
        [`[${VIDEO_FRAME_ATTR}]:hover &`]: { opacity: 1 },
      }}
    >
      <Scrubber submission={submission} />

      <Stack direction="row" alignItems="center" gap={1}>
        <IconButton size="small" onClick={togglePlay} sx={controlButtonSx}>
          <Iconify icon={isPlaying ? 'mdi:pause' : 'mdi:play'} width={20} />
        </IconButton>

        <Typography sx={{ fontFamily: 'monospace', fontSize: 12 }}>
          {formatTimestamp(currentTime)} / {formatTimestamp(duration)}
        </Typography>

        <IconButton size="small" onClick={toggleMute} sx={{ ...controlButtonSx, ml: 'auto' }}>
          <Iconify icon={muted ? 'mdi:volume-off' : 'mdi:volume-high'} width={18} />
        </IconButton>
        <IconButton size="small" onClick={handleFullscreen} sx={controlButtonSx}>
          <Iconify icon="mdi:fullscreen" width={20} />
        </IconButton>
      </Stack>
    </Stack>
  );
}

VideoControls.propTypes = {
  submission: PropTypes.object.isRequired,
};
