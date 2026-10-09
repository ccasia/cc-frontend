import { enqueueSnackbar } from 'notistack';

import axiosInstance, { endpoints } from 'src/utils/axios';

import useViewerData from './use-viewer-data';
import {
  setPendingDecision,
  useCreatorSubmissionsStore,
} from '../../store/use-creator-submissions-store';

// The admin's part of the flow: first review, and after the client has given feedback
const ADMIN_REVIEW_STATUSES = ['PENDING_REVIEW', 'CLIENT_FEEDBACK'];

/**
 * Admin decisions on submitted content, mirroring the legacy flows:
 *
 * - Send to client (client campaigns, first review): video → send-to-client;
 *   photos / raw footage → /approve, which the backend routes through client review.
 * - Approve (first review only): approves outright — /approve, with `direct`
 *   so photos / raw footage on client campaigns skip the client too.
 * - Send to creator: video → send-to-creator (forwards the unsent comment thread);
 *   photos / raw footage → /approve request_revision with the picked reasons.
 *
 * Decisions always apply to the latest upload.
 */
export default function useReviewDecision(submission) {
  const { mutateSubmissions } = useViewerData();
  const hasClient = useCreatorSubmissionsStore((s) => s.campaignHasClient);
  // 'client' | 'approve' | 'creator' while a request is in flight
  const pending = useCreatorSubmissionsStore((s) => s.pendingDecision);

  const isVideo = submission.submissionType?.type === 'VIDEO';
  const videoId = isVideo ? submission.video?.[0]?.id : undefined;

  const isAdminsTurn = ADMIN_REVIEW_STATUSES.includes(submission.status);
  const canSendToClient = hasClient && submission.status === 'PENDING_REVIEW';
  // Same as the current flow: approving is only for the first review
  const canApprove = submission.status === 'PENDING_REVIEW';
  const canSendToCreator = isAdminsTurn;

  const run = async (kind, request, successMessage) => {
    if (pending) return false;
    setPendingDecision(kind);
    try {
      await request();
      await mutateSubmissions();
      enqueueSnackbar(successMessage, { variant: 'success' });
      return true;
    } catch (error) {
      enqueueSnackbar(error?.message || 'Something went wrong, please try again', {
        variant: 'error',
      });
      return false;
    } finally {
      setPendingDecision(null);
    }
  };

  const sendToClient = () =>
    run(
      'client',
      () =>
        isVideo
          ? axiosInstance.post(endpoints.submission.v4.sendToClient(submission.id), { videoId })
          : axiosInstance.post(endpoints.submission.v4.approve, {
              submissionId: submission.id,
              action: 'approve',
            }),
      'Sent to client'
    );

  const approve = () =>
    run(
      'approve',
      () =>
        axiosInstance.post(endpoints.submission.v4.approve, {
          submissionId: submission.id,
          action: 'approve',
          direct: true,
          ...(videoId && { videoId }),
        }),
      'Submission approved'
    );

  // reasons: photos/raw footage are sent back with reasons only (no typed feedback);
  // videos forward their comment thread instead
  const sendToCreator = (reasons = []) =>
    run(
      'creator',
      () =>
        isVideo
          ? axiosInstance.post(endpoints.submission.v4.sendToCreator(submission.id), { videoId })
          : axiosInstance.post(endpoints.submission.v4.approve, {
              submissionId: submission.id,
              action: 'request_revision',
              feedback: '',
              reasons,
            }),
      'Sent to creator for changes'
    );

  return {
    pending,
    hasClient,
    canSendToClient,
    canApprove,
    canSendToCreator,
    sendToClient,
    approve,
    sendToCreator,
  };
}
