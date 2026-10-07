import { useState } from 'react';
import { enqueueSnackbar } from 'notistack';

import axiosInstance, { endpoints } from 'src/utils/axios';

import useViewerData from './use-viewer-data';
import useCaptionEditor from './use-caption-editor';

/**
 * Approve or send back a posted link (APPROVE_LINK). Same endpoint/payload as the legacy
 * PostingLinkSection: approve → POSTED; reject → REJECTED with the chosen reasons as feedback.
 */
export default function useLinkReview(submission) {
  const { mutateSubmissions } = useViewerData();
  const { saveCaption } = useCaptionEditor(submission);
  // 'approve' | 'reject' while a request is in flight
  const [pending, setPending] = useState(null);

  const review = async (action, reasons) => {
    if (pending) return;
    // An unsaved caption edit goes out with the decision, like the other send actions
    if (!(await saveCaption())) return;

    setPending(action);
    try {
      await axiosInstance.post(endpoints.submission.v4.approvePostingLink, {
        submissionId: submission.id,
        action,
        ...(action === 'reject' && { reasons }),
      });
      await mutateSubmissions();
      enqueueSnackbar(
        action === 'approve' ? 'Posting link approved' : 'Change request sent to creator',
        { variant: 'success' }
      );
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to update posting link', { variant: 'error' });
    } finally {
      setPending(null);
    }
  };

  return {
    pending,
    approveLink: () => review('approve'),
    requestLinkChange: (reasons) => review('reject', reasons),
  };
}
