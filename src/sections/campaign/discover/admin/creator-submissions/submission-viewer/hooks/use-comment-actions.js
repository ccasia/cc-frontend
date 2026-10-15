import { enqueueSnackbar } from 'notistack';

import axiosInstance, { endpoints } from 'src/utils/axios';

import useCommentThread from './use-comment-thread';
import { revealComment, isCommentResolved, extractLeadingTimestamp } from '../utils';
import {
  expandThread,
  closeCommentComposer,
  setCommentDeletePending,
} from '../../store/use-creator-submissions-store';

export const DELETE_UNDO_MS = 5000;

// Outlive the component that started them, so moving on doesn't cancel (or lose) a delete
const deleteTimers = new Map();

// Comments with a toggle request in flight; a second click waits for the first to land
const togglesInFlight = new Set();

const updateInThread = (comments, commentId, changes) =>
  comments?.map((comment) => {
    if (comment.id === commentId) return { ...comment, ...changes };
    if (!comment.replies?.some((reply) => reply.id === commentId)) return comment;
    return {
      ...comment,
      replies: comment.replies.map((reply) =>
        reply.id === commentId ? { ...reply, ...changes } : reply
      ),
    };
  });

export default function useCommentActions(submission) {
  const { videoId, commentsMutate, currentUser } = useCommentThread(submission);

  const fail = (message) => enqueueSnackbar(message, { variant: 'error' });

  const reply = async (parentId, input) => {
    const { timestamp, text } = extractLeadingTimestamp(input.trim());
    if (!text) return false;
    try {
      const { data } = await axiosInstance.post(endpoints.submission.v4.comments(submission.id), {
        text,
        videoId,
        parentId,
        ...(timestamp && { timestamp }),
      });
      closeCommentComposer();
      // Threads fold all replies away; open this one so the reply just sent is visible
      expandThread(parentId);
      await commentsMutate();
      revealComment(data?.id);
      return true;
    } catch (error) {
      fail('Failed to send reply');
      return false;
    }
  };

  // Editing a client's comment is how admins reword it before it reaches the creator
  const edit = async (comment, input) => {
    const text = input.trim();
    if (!text) return false;
    if (text === comment.text) {
      closeCommentComposer();
      return true;
    }
    try {
      await axiosInstance.patch(endpoints.submission.v4.updateComment(comment.id), {
        text,
        timestamp: comment.timestamp || null,
      });
      closeCommentComposer();
      await commentsMutate();
      return true;
    } catch (error) {
      fail('Failed to edit comment');
      return false;
    }
  };

  // Shows the change at once and keeps it: SWR drops any refetch that started before the
  // request finished (so an in-flight reload can't flip the comment back) and rolls back
  // on failure. The request's own socket event then refetches the confirmed state.
  const toggleComment = async (commentId, changes, request, errorMessage) => {
    if (togglesInFlight.has(commentId)) return;
    togglesInFlight.add(commentId);
    try {
      await commentsMutate(
        async (comments) => {
          await request();
          return updateInThread(comments, commentId, changes);
        },
        {
          optimisticData: (comments) => updateInThread(comments, commentId, changes),
          rollbackOnError: true,
          populateCache: true,
          revalidate: false,
        }
      );
    } catch (error) {
      fail(errorMessage);
    } finally {
      togglesInFlight.delete(commentId);
    }
  };

  const toggleResolved = (comment) =>
    toggleComment(
      comment.id,
      isCommentResolved(comment)
        ? { resolvedAt: null, resolvedByUserId: null, resolvedBy: null }
        : {
            resolvedAt: new Date().toISOString(),
            resolvedByUserId: currentUser?.id,
            resolvedBy: { id: currentUser?.id, name: currentUser?.name },
          },
      () => axiosInstance.patch(endpoints.submission.v4.resolveComment(comment.id)),
      'Failed to update resolve status'
    );

  const toggleForCreator = (comment) =>
    toggleComment(
      comment.id,
      { isVisibleToCreator: comment.isVisibleToCreator === false },
      () => axiosInstance.patch(endpoints.submission.v4.toggleCommentVisibility(comment.id)),
      'Failed to update the selection'
    );

  const deleteComment = (commentId) => {
    if (deleteTimers.has(commentId)) return;
    setCommentDeletePending(commentId, true);
    deleteTimers.set(
      commentId,
      setTimeout(async () => {
        try {
          await axiosInstance.delete(endpoints.submission.v4.deleteComment(commentId));
        } catch (error) {
          fail('Failed to delete comment');
        }
        await commentsMutate();
        deleteTimers.delete(commentId);
        setCommentDeletePending(commentId, false);
      }, DELETE_UNDO_MS)
    );
  };

  const undoDelete = (commentId) => {
    clearTimeout(deleteTimers.get(commentId));
    deleteTimers.delete(commentId);
    setCommentDeletePending(commentId, false);
  };

  return { reply, edit, toggleResolved, toggleForCreator, deleteComment, undoDelete };
}
