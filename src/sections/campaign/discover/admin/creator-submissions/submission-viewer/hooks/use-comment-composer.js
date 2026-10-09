import { useEffect } from 'react';
import { enqueueSnackbar } from 'notistack';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import useCommentThread from './use-comment-thread';
import useDisplayDuration from './use-display-duration';
import { revealComment, formatTimestamp, getUnsentFeedback } from '../utils';
import {
  seekVideo,
  playVideo,
  pauseVideo,
  setFeedbackDraft,
  setFeedbackSending,
  setFeedbackFrozenTime,
  useCreatorSubmissionsStore,
} from '../../store/use-creator-submissions-store';

// Same key as the legacy admin panel, so an unsent draft survives closing either UI
const draftKeyFor = (userId, submissionId, videoId) =>
  `draft_feedback_admin_${userId}_${submissionId}_${videoId}`;

const readDraft = (key) => {
  try {
    return localStorage.getItem(key) || '';
  } catch (error) {
    return '';
  }
};

const writeDraft = (key, value) => {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch (error) {
    // Storage unavailable — the draft just won't survive closing
  }
};

/**
 * Drives the "Your feedback" box: typing locks the timestamp and pauses the video,
 * posting saves it as a SubmissionComment at that timestamp. Drafts persist per upload.
 */
export default function useCommentComposer(submission) {
  const { user } = useAuthContext();
  const isVideo = submission.submissionType?.type === 'VIDEO';
  const { videoId, comments, commentsMutate } = useCommentThread(submission);
  const draftKey = draftKeyFor(user?.id, submission.id, videoId);

  const draft = useCreatorSubmissionsStore((s) => s.feedbackDraft);
  const currentTime = useCreatorSubmissionsStore((s) => s.currentTime);
  // Preloaded length when the video hasn't loaded yet, so the drag is always bounded
  const duration = useDisplayDuration(submission);

  // Timestamp locked in when the admin starts typing
  const frozenTime = useCreatorSubmissionsStore((s) => s.feedbackFrozenTime);
  const sending = useCreatorSubmissionsStore((s) => s.feedbackSending);

  const draftTime = frozenTime ?? currentTime;

  useEffect(() => {
    setFeedbackDraft(readDraft(draftKey));
  }, [draftKey]);

  // What "Send to creator" would forward right now
  const unsentComments = getUnsentFeedback(comments);
  const hasUnsentFeedback = unsentComments.length > 0;

  const changeDraft = (value) => {
    setFeedbackDraft(value);
    writeDraft(draftKey, value);

    if (!isVideo) return;
    if (value && frozenTime == null) {
      setFeedbackFrozenTime(currentTime);
      pauseVideo();
    } else if (!value && frozenTime != null) {
      setFeedbackFrozenTime(null);
    }
  };

  // Dragging the timestamp chip: moves the video, and the locked timestamp with it
  const adjustDraftTime = (seconds) => {
    // Unknown length: nothing to bound against, so don't move it at all
    if (!duration) return;
    const time = Math.min(Math.max(0, seconds), Math.floor(duration));
    if (frozenTime != null) setFeedbackFrozenTime(time);
    seekVideo(time);
  };

  // Resolves true when there was nothing to post or the post succeeded
  const postDraft = async () => {
    const text = draft.trim();
    if (!text) return true;
    if (sending) return false;

    setFeedbackSending(true);
    try {
      const { data } = await axiosInstance.post(endpoints.submission.v4.comments(submission.id), {
        text,
        videoId,
        ...(isVideo && { timestamp: formatTimestamp(draftTime) }),
      });
      setFeedbackDraft('');
      writeDraft(draftKey, '');
      setFeedbackFrozenTime(null);
      await commentsMutate();
      revealComment(data?.id);
      if (isVideo) playVideo();
      return true;
    } catch (error) {
      enqueueSnackbar('Failed to save feedback', { variant: 'error' });
      return false;
    } finally {
      setFeedbackSending(false);
    }
  };

  return {
    isVideo,
    draft,
    draftTime,
    sending,
    unsentComments,
    hasUnsentFeedback,
    changeDraft,
    adjustDraftTime,
    postDraft,
  };
}
