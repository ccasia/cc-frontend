export function resolveTierPlatformForDisplay(row, campaign) {
  const direct =
    row?.selectedPlatform ??
    row?.shortlistedCreator?.selectedPlatform ??
    row?.user?.shortlisted?.[0]?.selectedPlatform;
  if (direct === 'tiktok') return 'tiktok';
  if (direct === 'instagram') return 'instagram';

  const userId = row?.userId ?? row?.user?.id;
  if (userId && Array.isArray(campaign?.shortlisted)) {
    const sc = campaign.shortlisted.find((s) => s.userId === userId);
    if (sc?.selectedPlatform === 'tiktok') return 'tiktok';
    if (sc?.selectedPlatform === 'instagram') return 'instagram';
  }

  return 'instagram';
}
