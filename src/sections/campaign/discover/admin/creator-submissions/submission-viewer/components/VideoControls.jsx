import PropTypes from 'prop-types';

import { Tooltip, IconButton } from '@mui/material';

import { useSubmissionComments } from 'src/hooks/use-submission-comments';

import Iconify from 'src/components/iconify';
import { VideoToolbar, VIDEO_FRAME_ATTR, videoToolbarButtonSx } from 'src/components/video-toolbar';

import { needsAction, getCommentVideoId } from '../utils';
import useDisplayDuration from '../hooks/use-display-duration';
import {
  seekVideo,
  togglePlay,
  toggleMute,
  startAnnotation,
  useCreatorSubmissionsStore,
} from '../../store/use-creator-submissions-store';

// Marks this element as the fullscreen target (video + custom controls)
export { VIDEO_FRAME_ATTR };

// Overlays on the media (toolbar, arrows, tags, spinner) sit above every stacked media layer
export const OVERLAY_Z = 10;

// The shared video toolbar, driven by the viewer's store
export default function VideoControls({ submission }) {
  const isPlaying = useCreatorSubmissionsStore((s) => s.isPlaying);
  const mediaSwitching = useCreatorSubmissionsStore((s) => s.mediaSwitching);
  const muted = useCreatorSubmissionsStore((s) => s.muted);
  const currentTime = useCreatorSubmissionsStore((s) => s.currentTime);
  const versionIndex = useCreatorSubmissionsStore((s) => s.versionIndex);
  const duration = useDisplayDuration(submission);

  // Only creator videos have timestamped feedback (raw footage doesn't)
  const isVideoSubmission = submission.submissionType?.type === 'VIDEO';
  const { comments } = useSubmissionComments(
    isVideoSubmission ? submission.id : null,
    getCommentVideoId(submission, versionIndex),
    // Same cache entry as the review thread, so the dots update with it
    { includeDeleted: true }
  );

  // Same rule as the review composer, the only place a drawing can be posted:
  // the latest upload of a video that's waiting on an admin (link checks have no composer)
  const canDraw =
    isVideoSubmission &&
    versionIndex === 0 &&
    needsAction(submission.status) &&
    submission.status !== 'APPROVE_LINK';

  const handleFullscreen = (event) => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      return;
    }
    event.currentTarget.closest(`[${VIDEO_FRAME_ATTR}]`)?.requestFullscreen();
  };

  return (
    <VideoToolbar
      isPlaying={isPlaying}
      currentTime={currentTime}
      duration={duration}
      muted={muted}
      comments={comments}
      disabled={mediaSwitching}
      zIndex={OVERLAY_Z}
      onTogglePlay={togglePlay}
      onSeek={seekVideo}
      onToggleMute={toggleMute}
      onFullscreen={handleFullscreen}
      actions={
        canDraw && (
          <Tooltip title="Draw on frame" placement="top">
            <IconButton
              size="small"
              aria-label="Draw on frame"
              disabled={mediaSwitching}
              onClick={startAnnotation}
              sx={{
                ...videoToolbarButtonSx,
                '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.35)' },
              }}
            >
              <Iconify icon="solar:pen-bold" width={18} />
            </IconButton>
          </Tooltip>
        )
      }
    />
  );
}

VideoControls.propTypes = {
  submission: PropTypes.object.isRequired,
};
