import { useRef, useEffect } from 'react';

import axiosInstance from 'src/utils/axios';

// The backend already recounts on every agreement, pitch and swap change, so this
// safety-net sync runs once per campaign per page load, not on every tab visit.
const syncedIds = new Set();

// Recounts the campaign's credit counters from its sent agreements, then calls
// onSynced so the caller can refetch the campaign.
export default function useSyncCampaignCredits(campaign, onSynced) {
  const onSyncedRef = useRef(onSynced);
  onSyncedRef.current = onSynced;

  const campaignId = campaign?.id;
  const hasCredits = campaign?.campaignCredits != null;

  useEffect(() => {
    if (!campaignId || !hasCredits || syncedIds.has(campaignId)) return;
    syncedIds.add(campaignId);

    axiosInstance
      .post(`/api/campaign/syncCredits/${campaignId}`)
      .then(() => onSyncedRef.current?.())
      .catch((err) => {
        syncedIds.delete(campaignId);
        console.error('Error syncing credits:', err);
      });
  }, [campaignId, hasCredits]);
}
