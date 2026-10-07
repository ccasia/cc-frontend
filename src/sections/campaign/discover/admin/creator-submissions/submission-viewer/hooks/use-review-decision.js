import { useState } from 'react';
import { enqueueSnackbar } from 'notistack';

import axiosInstance, { endpoints } from 'src/utils/axios';

import useViewerData from './use-viewer-data';
import { useCreatorSubmissionsStore } from '../../store/use-creator-submissions-store';

/**
 * Admin decisions on submitted content, mirroring the legacy flows:
 *
 * - Video:  client campaign → send-to-client; otherwise /approve. Sending back uses
 *           send-to-creator, which forwards the video's unsent comments (the feedback).
 * - Photos / raw footage: /approve with approve | request_revision (+ feedback text);
 *           the backend routes approval through client review when a client is attached.
 *
 * Decisions always apply to the latest upload.
 */
export default function useReviewDecision(submission) {
  const { mutateSubmissions } = useViewerData();
  const hasClient = useCreatorSubmissionsStore((s) => s.campaignHasClient);
  // 'approve' | 'creator' while a request is in flight
  const [pending, setPending] = useState(null);

  const isVideo = submission.submissionType?.type === 'VIDEO';
  const videoId = isVideo ? submission.video?.[0]?.id : undefined;

  // Same visibility as the legacy admin panel: approve/send-to-client only on first review;
  // client feedback can only be forwarded to the creator
  const canApprove = submission.status === 'PENDING_REVIEW';
  const canSendToCreator = ['PENDING_REVIEW', 'CLIENT_FEEDBACK'].includes(submission.status);

  const run = async (kind, request, successMessage) => {
    if (pending) return false;
    setPending(kind);
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
      setPending(null);
    }
  };

  const approve = () =>
    run(
      'approve',
      () =>
        isVideo && hasClient
          ? axiosInstance.post(endpoints.submission.v4.sendToClient(submission.id), { videoId })
          : axiosInstance.post(endpoints.submission.v4.approve, {
              submissionId: submission.id,
              action: 'approve',
              ...(videoId && { videoId }),
            }),
      hasClient ? 'Sent to client' : 'Submission approved'
    );

  // feedback: text for photos/raw footage (videos send their comment thread instead)
  const sendToCreator = (feedback) =>
    run(
      'creator',
      () =>
        isVideo
          ? axiosInstance.post(endpoints.submission.v4.sendToCreator(submission.id), { videoId })
          : axiosInstance.post(endpoints.submission.v4.approve, {
              submissionId: submission.id,
              action: 'request_revision',
              feedback,
              reasons: [],
            }),
      'Sent to creator for changes'
    );

  return { pending, hasClient, canApprove, canSendToCreator, approve, sendToCreator };
}
