import { enqueueSnackbar } from 'notistack';

import axiosInstance from 'src/utils/axios';

import useViewerData from './use-viewer-data';
import { checkPostingLink, MAX_POSTING_LINKS, checkPostingLinks } from '../posting-links';
import {
  setPendingDecision,
  setPostingLinkDraft,
  setPostingLinkError,
  resetPostingLinkForm,
  setPostingLinkFields,
  setPostingLinkSubmitError,
  useCreatorSubmissionsStore,
} from '../../store/use-creator-submissions-store';

const POSTING_LINK_URL = '/api/submissions/v4/posting-link';

/**
 * Admin adding posting links for a creator (they then need a superadmin / CS lead to approve).
 * Fields grow one at a time: the next empty field only appears once the last one holds a
 * valid link, up to MAX_POSTING_LINKS. Links are checked (and https:// added) when a field
 * is left or Enter is pressed; empty fields are never sent.
 */
export default function usePostingLinkForm(submission) {
  const { mutateSubmissions } = useViewerData();
  const drafts = useCreatorSubmissionsStore((s) => s.postingLinkDrafts);
  const errors = useCreatorSubmissionsStore((s) => s.postingLinkErrors);
  const submitError = useCreatorSubmissionsStore((s) => s.postingLinkSubmitError);
  const submitting = useCreatorSubmissionsStore((s) => s.pendingDecision === 'link-submit');

  const { links, errors: liveErrors } = checkPostingLinks(drafts);
  const lastIndex = drafts.length - 1;
  const lastIsValid = Boolean(drafts[lastIndex]?.trim()) && !liveErrors[lastIndex];
  // The empty field that fades in once the last one is good
  const fields = lastIsValid && drafts.length < MAX_POSTING_LINKS ? [...drafts, ''] : drafts;

  const change = (index, value) => setPostingLinkDraft(index, value);

  // Leaving a field: tidy it up (https:// added) and show what's wrong, if anything.
  // An emptied field folds away unless it's the only one.
  const commit = (index) => {
    const value = (drafts[index] || '').trim();
    if (!value) {
      if (drafts.length > 1 && index < drafts.length) {
        const remaining = drafts.filter((_, i) => i !== index);
        setPostingLinkFields(remaining, checkPostingLinks(remaining).errors);
      }
      return;
    }
    const { link } = checkPostingLink(value);
    if (link && link !== drafts[index]) setPostingLinkDraft(index, link);
    // Recheck with the tidied value so duplicates are caught too
    const next = drafts.map((draft, i) => (i === index ? link || value : draft));
    setPostingLinkError(index, checkPostingLinks(next).errors[index]);
  };

  const remove = (index) => {
    if (drafts.length <= 1) {
      resetPostingLinkForm();
      return;
    }
    const remaining = drafts.filter((_, i) => i !== index);
    setPostingLinkFields(
      remaining,
      remaining.map((_, i) => errors[i >= index ? i + 1 : i] ?? null)
    );
  };

  // Several links pasted at once (one per line, or space-separated) fill the next fields
  const paste = (index, text) => {
    const parts = text.split(/\s+/).filter(Boolean);
    if (parts.length < 2) return false;
    const filled = [...drafts.slice(0, index), ...parts];
    const kept = filled.slice(0, MAX_POSTING_LINKS);
    const tidied = kept.map((draft) => checkPostingLink(draft).link || draft);
    setPostingLinkFields(tidied, checkPostingLinks(tidied).errors);
    if (filled.length > MAX_POSTING_LINKS) {
      setPostingLinkSubmitError(
        `Only ${MAX_POSTING_LINKS} links fit, so the rest of what you pasted was left out.`
      );
    }
    return true;
  };

  const submit = async () => {
    const tidied = drafts.map((draft) => checkPostingLink(draft).link || draft.trim());
    const result = checkPostingLinks(tidied);
    setPostingLinkFields(tidied, result.errors);
    if (result.errors.some(Boolean) || !result.links.length) return false;

    setPendingDecision('link-submit');
    try {
      await axiosInstance.put(POSTING_LINK_URL, {
        submissionId: submission.id,
        postingLinks: result.links,
      });
      await mutateSubmissions();
      resetPostingLinkForm();
      enqueueSnackbar(
        result.links.length > 1 ? 'Links sent for approval' : 'Link sent for approval',
        { variant: 'success' }
      );
      return true;
    } catch (error) {
      // The backend's message names the problem (e.g. "Link 2 is from youtube.com…")
      setPostingLinkSubmitError(error?.message || 'Couldn’t save the link. Please try again.');
      return false;
    } finally {
      setPendingDecision(null);
    }
  };

  return {
    fields,
    errors,
    validCount: links.length,
    submitError,
    submitting,
    change,
    commit,
    remove,
    paste,
    submit,
  };
}
