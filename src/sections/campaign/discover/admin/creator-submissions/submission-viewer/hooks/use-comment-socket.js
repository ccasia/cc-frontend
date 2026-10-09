import { useRef, useEffect } from 'react';

import useSocketContext from 'src/socket/hooks/useSocketContext';

import useCommentThread from './use-comment-thread';

const REFRESH_EVENTS = [
  'v4:comment:updated',
  'v4:comment:deleted',
  'v4:comment:agreed',
  'v4:comment:visibility:toggled',
];
const ADDED_EVENTS = ['v4:comment:added', 'v4:comment:reply:added'];

/**
 * Keeps the thread live. onIncoming(comment) fires for comments other people add to the
 * upload on screen, once the thread has refetched (so the comment is rendered).
 */
export default function useCommentSocket(submission, onIncoming) {
  const { socket } = useSocketContext();
  const { videoId, commentsMutate, currentUser } = useCommentThread(submission);

  // Latest callback without resubscribing on every render
  const onIncomingRef = useRef(onIncoming);
  onIncomingRef.current = onIncoming;

  const submissionId = submission?.id;
  const userId = currentUser?.id;

  useEffect(() => {
    if (!socket || !submissionId) return undefined;

    const refresh = (data) => {
      if (data?.submissionId === submissionId) commentsMutate();
    };

    const added = async (data) => {
      // Clients' unpublished drafts never reach admins
      if (data?.submissionId !== submissionId || data.comment?.isClientDraft) return;
      await commentsMutate();
      const isOnScreen = !data.videoId || !videoId || data.videoId === videoId;
      if (isOnScreen && data.comment && data.comment.userId !== userId) {
        onIncomingRef.current?.(data.comment);
      }
    };

    REFRESH_EVENTS.forEach((event) => socket.on(event, refresh));
    ADDED_EVENTS.forEach((event) => socket.on(event, added));
    return () => {
      REFRESH_EVENTS.forEach((event) => socket.off(event, refresh));
      ADDED_EVENTS.forEach((event) => socket.off(event, added));
    };
  }, [socket, submissionId, videoId, userId, commentsMutate]);
}
