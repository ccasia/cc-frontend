// Last known header and tab numbers per campaign, so a refresh shows them at once and updates them when fresh data arrives.
const key = (campaignId) => `cc-campaign-summary:${campaignId}`;

export function readCampaignCache(campaignId) {
  if (!campaignId) return {};
  try {
    return JSON.parse(localStorage.getItem(key(campaignId))) || {};
  } catch (error) {
    return {};
  }
}

export function writeCampaignCache(campaignId, patch) {
  if (!campaignId) return;
  try {
    localStorage.setItem(
      key(campaignId),
      JSON.stringify({ ...readCampaignCache(campaignId), ...patch })
    );
  } catch (error) {
    // Storage full or blocked; the header just loads fresh next time.
  }
}

// How many loading rows or cards to show: the last known count for this campaign, so a list
// of 2 does not flash 6 placeholders. Unknown campaigns get the fallback.
export function getSkeletonCount(campaignId, field, { fallback, max }) {
  const known = readCampaignCache(campaignId)[field];
  if (typeof known !== 'number') return fallback;
  return Math.min(Math.max(known, 1), max);
}
