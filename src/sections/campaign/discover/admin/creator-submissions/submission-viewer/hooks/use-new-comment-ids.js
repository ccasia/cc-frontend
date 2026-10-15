import { useMemo, useEffect } from 'react';

import { flattenComments } from '../utils';

// Same key as the legacy admin panel, so "seen" carries over between the two UIs
const storageKeyFor = (submissionId, videoId) => `admin_lastViewed_${submissionId}_${videoId}`;

const readLastViewed = (key) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? new Date(stored).getTime() : 0;
  } catch (error) {
    return 0;
  }
};

const markViewed = (key) => {
  try {
    localStorage.setItem(key, new Date().toISOString());
  } catch (error) {
    // Storage unavailable — everything just stays "new"
  }
};

const SEEN_AFTER_MS = 3000;

/**
 * Client and creator comments added since this admin last looked at the upload. The cut-off is
 * read once per upload, so dots stay put while you're here; leaving (or ~3s of looking) marks
 * the thread as seen for next time.
 */
export default function useNewCommentIds(submissionId, videoId, comments, isLoading) {
  const key = storageKeyFor(submissionId, videoId ?? 'all');
  const lastViewed = useMemo(() => readLastViewed(key), [key]);

  const newIds = useMemo(
    () =>
      new Set(
        flattenComments(comments)
          .filter(
            (comment) =>
              !comment.deletedAt &&
              ['client', 'creator'].includes(comment.user?.role) &&
              new Date(comment.createdAt).getTime() > lastViewed
          )
          .map((comment) => comment.id)
      ),
    [comments, lastViewed]
  );

  useEffect(() => {
    if (isLoading) return undefined;
    const timer = setTimeout(() => markViewed(key), SEEN_AFTER_MS);
    return () => {
      clearTimeout(timer);
      markViewed(key);
    };
  }, [key, isLoading]);

  return newIds;
}
