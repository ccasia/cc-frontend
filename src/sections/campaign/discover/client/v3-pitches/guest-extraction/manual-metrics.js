/**
 * Hand-entered Followers and ER for a platform creator whose fetch failed.
 *
 * Mirrors the backend rule in `updatePlatformCreatorMetrics`: the pitch
 * carries a `metricsFailureCode`, no fetch is still running, the creator is
 * not a guest, and no account is connected on the pitch platform.
 */

const isGuestPitch = (pitch) => {
  const email = pitch?.user?.email;
  return (
    Boolean(email?.includes('@tempmail.com') || email?.startsWith('guest_')) ||
    pitch?.user?.creator?.isGuest === true
  );
};

// A connected account counts only once its stats are saved. A token-only row
// has no numbers, so the admin may type them.
const isConnectedOn = (creator, platform) => {
  const instagram = creator?.instagramUser?.followers_count != null;
  const tiktok = creator?.tiktokUser?.follower_count != null;
  if (platform === 'instagram') return instagram;
  if (platform === 'tiktok') return tiktok;
  return instagram || tiktok;
};

export function canEditFailedMetrics(pitch) {
  if (!pitch || pitch._isShortlistedOnly) return false;
  if (pitch.pendingExtractionId || !pitch.metricsFailureCode) return false;
  if (isGuestPitch(pitch)) return false;
  return !isConnectedOn(pitch.user?.creator, pitch.selectedPlatform);
}
