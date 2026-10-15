import { useSubmissionComments } from 'src/hooks/use-submission-comments';

import { useAuthContext } from 'src/auth/hooks';

import { getCommentVideoId } from '../utils';
import { useCreatorSubmissionsStore } from '../../store/use-creator-submissions-store';

/**
 * The review thread of the upload on screen, plus what the admin may do with each comment.
 * Older uploads are read-only. Same rules as the legacy AdminFeedbackPanel and the backend:
 * admins edit client comments (and their own), delete only their own, resolve top-level ones.
 */
export default function useCommentThread(submission) {
  const { user } = useAuthContext();
  const versionIndex = useCreatorSubmissionsStore((s) => s.versionIndex);
  const videoId = getCommentVideoId(submission, versionIndex);
  // Deleted comments come back as blank placeholders ("Message deleted")
  const { comments, commentsLoading, commentsMutate } = useSubmissionComments(
    submission?.id,
    videoId,
    { includeDeleted: true }
  );

  const isLatest = versionIndex === 0;
  // First review sends everything; once the client has weighed in the admin picks what to forward
  const canSelectForCreator = isLatest && submission?.status === 'CLIENT_FEEDBACK';

  const isOwn = (comment) => (comment.userId ?? comment.user?.id) === user?.id;

  const permissionsFor = (comment, { isReply = false } = {}) => {
    // A deleted comment is just a placeholder; its thread can still be resolved
    const isLive = isLatest && !comment.deletedAt;
    return {
      canReply: isLive && !isReply,
      canResolve: isLatest && !isReply,
      canEdit: isLive && (comment.user?.role === 'client' || isOwn(comment)),
      // Sending to the creator stamps forwardedByUserId; only that admin can still remove it
      canDelete:
        isLive &&
        isOwn(comment) &&
        (!comment.forwardedByUserId || comment.forwardedByUserId === user?.id),
      canToggleForCreator:
        canSelectForCreator &&
        !comment.deletedAt &&
        comment.user?.role !== 'creator' &&
        !comment.isSentToCreator,
    };
  };

  return {
    videoId,
    comments,
    commentsLoading,
    commentsMutate,
    currentUser: user,
    isLatest,
    canSelectForCreator,
    permissionsFor,
  };
}
