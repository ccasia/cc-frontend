// Viewer-only helpers. Shared submission helpers (grouping, labels, status chips) live in ../utils.

import { NEEDS_ACTION } from '../constants';
import { groupByCreator, filterSubmissions } from '../utils';

export const STEPS = ['Review', 'Client', 'Post', 'Check link', 'Done'];

const STEP_INDEX = {
  PENDING_REVIEW: 0,
  SENT_TO_ADMIN: 0,
  CLIENT_FEEDBACK: 0,
  CHANGES_REQUIRED: 0,
  REJECTED: 0,
  SENT_TO_CLIENT: 1,
  APPROVED: 2,
  CLIENT_APPROVED: 2,
  APPROVE_LINK: 3,
  POSTED: 4,
};

export const getStepIndex = (status) => STEP_INDEX[status] ?? 0;

export const isChangesRequested = (status) => ['CHANGES_REQUIRED', 'REJECTED'].includes(status);

export const needsAction = (status) => NEEDS_ACTION.includes(status);

export const firstActionableIndex = (creator) => {
  const index = creator.submissions.findIndex((submission) => needsAction(submission.status));
  return index < 0 ? 0 : index;
};

export const getSubmissionMedia = (submission, versionIndex = 0) => {
  const type = submission?.submissionType?.type;
  const urlsOf = (items) => (items || []).map((item) => item.url).filter(Boolean);

  // `video` is ordered newest first, so [0] is the latest upload
  if (type === 'VIDEO') {
    return {
      kind: 'video',
      urls: urlsOf(submission.video?.slice(versionIndex, versionIndex + 1)),
    };
  }
  if (type === 'PHOTO') return { kind: 'photo', urls: urlsOf(submission.photos) };
  return { kind: 'video', urls: urlsOf(submission.rawFootages) };
};

export const hasMedia = (submission) => getSubmissionMedia(submission).urls.length > 0;

// Creators as the cards show them (same filters), minus those with nothing uploaded yet
export const getViewerCreators = (submissions, filters) =>
  groupByCreator(filterSubmissions(submissions, filters)).filter((creator) =>
    creator.submissions.some(hasMedia)
  );

// Photo sets and raw footage hold several items (photos / clips) stepped through one at a
// time; video submissions have versions instead, so they count 0
const ITEM_NOUN = { PHOTO: 'photo', RAW_FOOTAGE: 'clip' };

export const getItemNoun = (submission) => ITEM_NOUN[submission?.submissionType?.type];

export const getItemCount = (submission) =>
  getItemNoun(submission) ? getSubmissionMedia(submission).urls.length : 0;

// The one URL on screen: the chosen version of a video, or the chosen photo / clip
export const getShownUrl = (submission, versionIndex = 0, itemIndex = 0) => {
  const { urls } = getSubmissionMedia(submission, versionIndex);
  return urls[Math.min(itemIndex, urls.length - 1)];
};

// Uploads (versions) of a video submission, newest first; other types have one
export const getVersionCount = (submission) =>
  submission?.submissionType?.type === 'VIDEO' ? submission.video?.length || 0 : 1;

// Comments are threaded per video upload
export const getCommentVideoId = (submission, versionIndex = 0) =>
  submission?.submissionType?.type === 'VIDEO' ? submission.video?.[versionIndex]?.id : undefined;

// Same "mm:ss" / "hh:mm:ss" format the v4 comment threads store and display
export const formatTimestamp = (timeInSeconds) => {
  const totalSeconds = Math.floor(Math.max(0, Number(timeInSeconds) || 0));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value) => value.toString().padStart(2, '0');

  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
};

export const parseTimestamp = (timestamp) => {
  const parts = (timestamp || '').split(':').map(Number);
  if (parts.some(Number.isNaN)) return 0;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
};

// "0:12 tighten the cut" → { timestamp: '00:12', text: 'tighten the cut' }, so a reply
// can point at a moment the same way new feedback does
export const extractLeadingTimestamp = (input) => {
  const match = input.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s+([\s\S]*)$/);
  if (!match) return { timestamp: null, text: input };
  return { timestamp: formatTimestamp(parseTimestamp(match[1])), text: match[2].trim() };
};

// Reasons the client gave in their latest change request, to start the admin's from
// (same as the legacy getInitialReasons)
export const getClientReasons = (submission) => {
  if (submission?.status !== 'CLIENT_FEEDBACK') return [];
  const clientRequest = (submission.feedback || []).find(
    (item) => item.admin?.role === 'client' && item.type === 'REQUEST'
  );
  return clientRequest?.reasons || [];
};

export const isCommentResolved = (comment) =>
  Boolean(comment?.resolvedByUserId || comment?.resolvedAt);

// Top-level comments followed by their replies
export const flattenComments = (comments) =>
  comments.flatMap((comment) => [comment, ...(comment.replies || [])]);

// Admin + client comments the creator hasn't received yet and that are selected for them
export const getUnsentFeedback = (comments) =>
  flattenComments(comments).filter(
    (comment) =>
      !comment.deletedAt &&
      comment.user?.role !== 'creator' &&
      !comment.isSentToCreator &&
      comment.isVisibleToCreator !== false
  );

// Thread rows carry this attribute so a comment can be scrolled into view after posting
export const COMMENT_ID_ATTR = 'data-comment-id';

// The review panel's scroll area (thread scrolling and the "new comments" pill measure it)
export const REVIEW_SCROLL_ATTR = 'data-review-scroll';

// New thread rows expand in from 0 height (~200ms); scrolling before that only brings a
// sliver into view and stops at the comment above
const REVEAL_DELAY_MS = 250;
const REVEAL_MARGIN_PX = 16;

// Scrolls the review panel so a comment is fully in view, once it has finished expanding.
// Scrolls the panel itself: scrollIntoView would also scroll the rows' clipping wrappers.
export const revealComment = (commentId) => {
  if (!commentId) return;
  setTimeout(() => {
    const element = document.querySelector(`[${COMMENT_ID_ATTR}="${commentId}"]`);
    const scroller = element?.closest(`[${REVIEW_SCROLL_ATTR}]`);
    if (!element || !scroller) return;

    const box = element.getBoundingClientRect();
    const view = scroller.getBoundingClientRect();
    let offset = 0;
    if (box.bottom > view.bottom - REVEAL_MARGIN_PX) {
      offset = box.bottom - view.bottom + REVEAL_MARGIN_PX;
    } else if (box.top < view.top + REVEAL_MARGIN_PX) {
      offset = box.top - view.top - REVEAL_MARGIN_PX;
    }
    if (offset) scroller.scrollBy({ top: offset, behavior: 'smooth' });
  }, REVEAL_DELAY_MS);
};
