import { useMemo, useCallback } from 'react';

import useViewerData from './use-viewer-data';
import { needsAction, getItemCount, getVersionCount, firstActionableIndex } from '../utils';
import {
  setItemIndex,
  setVersionIndex,
  showViewerSubmission,
  useCreatorSubmissionsStore,
} from '../../store/use-creator-submissions-store';

export default function useViewerNavigation() {
  const { creators, creatorIndex, creator, submission, submissionIndex } = useViewerData();
  const versionIndex = useCreatorSubmissionsStore((s) => s.versionIndex);
  const versionCount = getVersionCount(submission);
  const itemIndex = useCreatorSubmissionsStore((s) => s.itemIndex);
  const itemCount = getItemCount(submission);

  const goToSubmission = useCallback(
    (index) => {
      const target = creator?.submissions[index];
      if (!target) return;
      showViewerSubmission({ userId: creator.user.id, submissionId: target.id });
    },
    [creator]
  );

  const goToCreator = useCallback(
    (index) => {
      const target = creators[index];
      if (!target) return;
      showViewerSubmission({
        userId: target.user.id,
        submissionId: target.submissions[firstActionableIndex(target)].id,
      });
    },
    [creators]
  );

  // Versions are newest first, so "older" moves up the index
  const olderVersion = useCallback(() => {
    if (versionIndex < versionCount - 1) setVersionIndex(versionIndex + 1);
  }, [versionIndex, versionCount]);
  const newerVersion = useCallback(() => {
    if (versionIndex > 0) setVersionIndex(versionIndex - 1);
  }, [versionIndex]);
  const prevItem = useCallback(() => {
    if (itemIndex > 0) setItemIndex(itemIndex - 1);
  }, [itemIndex]);
  const nextItem = useCallback(() => {
    if (itemIndex < itemCount - 1) setItemIndex(itemIndex + 1);
  }, [itemIndex, itemCount]);
  // Tapping a photo advances and wraps back to the first, like stories
  const advanceItem = useCallback(() => {
    if (itemCount > 1) setItemIndex((itemIndex + 1) % itemCount);
  }, [itemIndex, itemCount]);

  // ← → (keys, swipes) step through photos / raw footage clips, otherwise through video uploads
  const isItemSet = itemCount > 1;
  const goLeft = isItemSet ? prevItem : olderVersion;
  const goRight = isItemSet ? nextItem : newerVersion;

  // ---- "What's next" once a decision is made ----

  // Another submission from this creator that still needs action
  const nextActionIndex = creator
    ? creator.submissions.findIndex(
        (item, index) => index !== submissionIndex && needsAction(item.status)
      )
    : -1;

  // The next creator after this one (wrapping) who still has something needing action
  const nextActionCreatorIndex = useMemo(() => {
    if (creatorIndex < 0) return -1;
    const offset = Array.from({ length: creators.length - 1 }, (_, i) => i + 1).find((step) =>
      creators[(creatorIndex + step) % creators.length].submissions.some((item) =>
        needsAction(item.status)
      )
    );
    return offset === undefined ? -1 : (creatorIndex + offset) % creators.length;
  }, [creators, creatorIndex]);

  const prevCreator = useCallback(() => goToCreator(creatorIndex - 1), [goToCreator, creatorIndex]);
  const nextCreator = useCallback(() => goToCreator(creatorIndex + 1), [goToCreator, creatorIndex]);

  return {
    goToSubmission,
    olderVersion,
    newerVersion,
    versionIndex,
    versionCount,
    hasOlderVersion: versionIndex < versionCount - 1,
    hasNewerVersion: versionIndex > 0,
    itemIndex,
    itemCount,
    prevItem,
    nextItem,
    advanceItem,
    hasPrevItem: itemIndex > 0,
    hasNextItem: itemIndex < itemCount - 1,
    goLeft,
    goRight,
    prevCreator,
    nextCreator,
    nextActionSubmission: creator?.submissions[nextActionIndex] ?? null,
    goToNextActionSubmission: () => goToSubmission(nextActionIndex),
    nextActionCreator: creators[nextActionCreatorIndex] ?? null,
    goToNextActionCreator: () => goToCreator(nextActionCreatorIndex),
    hasPrevCreator: creatorIndex > 0,
    hasNextCreator: creatorIndex !== -1 && creatorIndex < creators.length - 1,
  };
}
