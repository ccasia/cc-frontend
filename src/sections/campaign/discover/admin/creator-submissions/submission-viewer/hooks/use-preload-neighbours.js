import { useEffect } from 'react';

import useViewerData from './use-viewer-data';
import { preloadMedia } from '../media-cache';
import { getSubmissionMedia, firstActionableIndex } from '../utils';

// Warms this creator's other submissions and the submission up/down would open on
// the previous/next creator, so those switches start with a known shape and a warm cache.
export default function usePreloadNeighbours() {
  const { creators, creatorIndex, submission } = useViewerData();

  // Every photo of the open set, so flipping through it is instant
  useEffect(() => {
    if (submission?.submissionType?.type !== 'PHOTO') return;
    getSubmissionMedia(submission).urls.forEach((url) => preloadMedia({ kind: 'photo', url }));
  }, [submission]);

  useEffect(() => {
    if (creatorIndex < 0) return;

    const targets = [...creators[creatorIndex].submissions];
    [creatorIndex - 1, creatorIndex + 1].forEach((index) => {
      const neighbour = creators[index];
      if (neighbour) targets.push(neighbour.submissions[firstActionableIndex(neighbour)]);
    });

    targets.forEach((target) => {
      const { kind, urls } = getSubmissionMedia(target);
      preloadMedia({ kind, url: urls[0] });
    });
  }, [creators, creatorIndex]);
}
