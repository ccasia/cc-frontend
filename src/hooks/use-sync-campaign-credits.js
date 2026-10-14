import { useRef, useEffect } from 'react';

import axiosInstance from 'src/utils/axios';

// Recounts the campaign's credit counters from its sent agreements once per campaign,
// then calls onSynced so the caller can refetch the campaign.
export default function useSyncCampaignCredits(campaign, onSynced) {
  const onSyncedRef = useRef(onSynced);
  onSyncedRef.current = onSynced;

  const campaignId = campaign?.id;
  const hasCredits = campaign?.campaignCredits != null;

  useEffect(() => {
    if (!campaignId || !hasCredits) return;

    axiosInstance
      .post(`/api/campaign/syncCredits/${campaignId}`)
      .then(() => onSyncedRef.current?.())
      .catch((err) => console.error('Error syncing credits:', err));
  }, [campaignId, hasCredits]);
}
