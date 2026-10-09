import { mutate } from 'swr';
import { enqueueSnackbar } from 'notistack';

import axiosInstance, { endpoints } from 'src/utils/axios';

import useViewerData from './use-viewer-data';
import { captionHistoryKey } from './use-caption-history';
import {
  setCaptionDraft,
  setCaptionSaving,
  useCreatorSubmissionsStore,
} from '../../store/use-creator-submissions-store';

// Statuses the backend accepts caption edits in (updateSubmissionCaption)
const CAPTION_EDITABLE_STATUSES = ['PENDING_REVIEW', 'APPROVE_LINK', 'CLIENT_FEEDBACK'];

/**
 * Admin caption editing for the viewer. The draft lives in the store so the caption
 * section and the send buttons share it — sending saves an unsaved edit first.
 */
export default function useCaptionEditor(submission) {
  const { mutateSubmissions } = useViewerData();
  const captionDraft = useCreatorSubmissionsStore((s) => s.captionDraft);
  const saving = useCreatorSubmissionsStore((s) => s.captionSaving);

  const savedCaption = submission?.caption || '';
  // Only videos carry a caption; photos and raw footage are reviewed without one
  const canEdit =
    submission?.submissionType?.type === 'VIDEO' &&
    CAPTION_EDITABLE_STATUSES.includes(submission?.status);
  const isDirty = captionDraft !== null && captionDraft.trim() !== savedCaption.trim();

  // Resolves true when there was nothing to save or the save succeeded
  const saveCaption = async () => {
    if (!canEdit || !isDirty) return true;
    if (saving) return false;

    setCaptionSaving(true);
    try {
      await axiosInstance.patch(endpoints.submission.v4.updateCaption(submission.id), {
        caption: captionDraft,
      });
      // Refetch before clearing the draft so the saved caption doesn't flash back; the
      // history refetch keeps the "edited" tag on once the draft is gone
      await Promise.all([mutateSubmissions(), mutate(captionHistoryKey(submission.id))]);
      setCaptionDraft(null);
      enqueueSnackbar('Caption saved', { variant: 'success' });
      return true;
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to save caption', { variant: 'error' });
      return false;
    } finally {
      setCaptionSaving(false);
    }
  };

  return {
    caption: captionDraft ?? savedCaption,
    canEdit,
    isDirty,
    saving,
    changeCaption: setCaptionDraft,
    discardCaption: () => setCaptionDraft(null),
    saveCaption,
  };
}
