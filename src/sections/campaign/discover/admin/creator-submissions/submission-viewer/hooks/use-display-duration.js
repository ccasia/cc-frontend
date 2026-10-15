import { getShownUrl } from '../utils';
import { getCachedDuration } from '../media-cache';
import { useCreatorSubmissionsStore } from '../../store/use-creator-submissions-store';

// The video's length, known before it loads when preloading already saw its metadata.
// The store resets duration to 0 on every switch; without this the toolbar shows 00:00,
// the feedback dots have nothing to position against, and the timestamp drag has no limit.
export default function useDisplayDuration(submission) {
  const duration = useCreatorSubmissionsStore((s) => s.duration);
  const versionIndex = useCreatorSubmissionsStore((s) => s.versionIndex);
  const itemIndex = useCreatorSubmissionsStore((s) => s.itemIndex);

  if (duration > 0) return duration;
  return getCachedDuration(getShownUrl(submission, versionIndex, itemIndex)) ?? 0;
}
