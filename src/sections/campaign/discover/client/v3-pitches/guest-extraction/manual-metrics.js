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

const isConnectedOn = (creator, platform) => {
  const instagram = Boolean(creator?.isFacebookConnected || creator?.instagramUser);
  const tiktok = Boolean(creator?.isTiktokConnected || creator?.tiktokUser);
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
