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

// Photos in a photo set; 0 for other types
export const getPhotoCount = (submission) =>
  submission?.submissionType?.type === 'PHOTO' ? getSubmissionMedia(submission).urls.length : 0;

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
