import { useState } from 'react';
import { enqueueSnackbar } from 'notistack';

import { useSubmissionComments } from 'src/hooks/use-submission-comments';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { formatTimestamp, getCommentVideoId } from '../utils';
import {
  playVideo,
  pauseVideo,
  setFeedbackDraft,
  useCreatorSubmissionsStore,
} from '../../store/use-creator-submissions-store';

/**
 * Drives the "Your feedback" box: typing locks the timestamp and pauses the video,
 * posting saves it as a SubmissionComment at that timestamp.
 */
export default function useCommentComposer(submission) {
  const isVideo = submission.submissionType?.type === 'VIDEO';
  const versionIndex = useCreatorSubmissionsStore((s) => s.versionIndex);
  const videoId = getCommentVideoId(submission, versionIndex);

  const draft = useCreatorSubmissionsStore((s) => s.feedbackDraft);
  const currentTime = useCreatorSubmissionsStore((s) => s.currentTime);
  const { comments, commentsMutate } = useSubmissionComments(submission.id, videoId);

  // Timestamp locked in when the admin starts typing
  const [frozenTime, setFrozenTime] = useState(null);
  const [sending, setSending] = useState(false);

  const draftTime = frozenTime ?? currentTime;

  // Admin comments the creator hasn't received yet
  const unsentComments = comments.filter(
    (comment) => comment.user?.role !== 'creator' && !comment.isSentToCreator
  );
  const hasUnsentFeedback = unsentComments.length > 0;

  const changeDraft = (value) => {
    setFeedbackDraft(value);

    if (!isVideo) return;
    if (value && frozenTime == null) {
      setFrozenTime(currentTime);
      pauseVideo();
    } else if (!value && frozenTime != null) {
      setFrozenTime(null);
    }
  };

  // Resolves true when there was nothing to post or the post succeeded
  const postDraft = async () => {
    const text = draft.trim();
    if (!text) return true;
    if (sending) return false;

    setSending(true);
    try {
      await axiosInstance.post(endpoints.submission.v4.comments(submission.id), {
        text,
        videoId,
        ...(isVideo && { timestamp: formatTimestamp(draftTime) }),
      });
      setFeedbackDraft('');
      setFrozenTime(null);
      commentsMutate();
      if (isVideo) playVideo();
      return true;
    } catch (error) {
      enqueueSnackbar('Failed to save feedback', { variant: 'error' });
      return false;
    } finally {
      setSending(false);
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
    postDraft,
  };
}
