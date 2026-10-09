import { enqueueSnackbar } from 'notistack';

import axiosInstance, { endpoints } from 'src/utils/axios';

import useViewerData from './use-viewer-data';
import useCaptionEditor from './use-caption-editor';
import {
  closeLinkChange,
  setPendingDecision,
  useCreatorSubmissionsStore,
} from '../../store/use-creator-submissions-store';

/**
 * Approve or send back a posted link (APPROVE_LINK). Same endpoint/payload as the legacy
 * PostingLinkSection: approve → POSTED; reject → REJECTED with the chosen reasons as feedback.
 */
export default function useLinkReview(submission) {
  const { mutateSubmissions } = useViewerData();
  const { saveCaption } = useCaptionEditor(submission);
  // 'link-approve' | 'link-reject' while a request is in flight
  const pendingDecision = useCreatorSubmissionsStore((s) => s.pendingDecision);
  const pending = pendingDecision?.startsWith('link-') ? pendingDecision.slice(5) : null;

  const review = async (action, reasons) => {
    if (pendingDecision) return;
    // An unsaved caption edit goes out with the decision, like the other send actions
    if (!(await saveCaption())) return;

    setPendingDecision(`link-${action}`);
    try {
      await axiosInstance.post(endpoints.submission.v4.approvePostingLink, {
        submissionId: submission.id,
        action,
        ...(action === 'reject' && { reasons }),
      });
      await mutateSubmissions();
      closeLinkChange();
      enqueueSnackbar(
        action === 'approve' ? 'Posting link approved' : 'Change request sent to creator',
        { variant: 'success' }
      );
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to update posting link', { variant: 'error' });
    } finally {
      setPendingDecision(null);
    }
  };

  return {
    pending,
    approveLink: () => review('approve'),
    requestLinkChange: (reasons) => review('reject', reasons),
  };
}
