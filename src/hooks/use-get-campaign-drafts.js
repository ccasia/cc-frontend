import useSWR from 'swr';
import { useMemo, useCallback } from 'react';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { clearCampaignDraftSnapshots } from 'src/sections/campaign/create/utils/campaign-draft-storage';

/**
 * Saved campaign-creation drafts, fetched outside the create dialog so the
 * discover header can show a count and open the picker on its own.
 *
 * The endpoint is guarded by isSuperAdmin on the backend, so pass `enabled`
 * false for anyone else rather than letting SWR retry a 403.
 */
const useGetCampaignDrafts = (enabled = true, userId) => {
  const { data, isLoading, error, mutate } = useSWR(
    enabled ? endpoints.campaignCreationDrafts.root : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Mirrors deleteDraft() in use-campaign-draft-autosave.js -- the server record
  // and the local snapshot mirror have to go together.
  const deleteDraft = useCallback(
    async (id) => {
      await axiosInstance.delete(endpoints.campaignCreationDrafts.delete(id));
      await clearCampaignDraftSnapshots(userId, id);
      await mutate();
    },
    [mutate, userId]
  );

  return useMemo(
    () => ({
      drafts: data?.drafts || [],
      isLoading,
      error,
      mutate,
      deleteDraft,
    }),
    [data, isLoading, error, mutate, deleteDraft]
  );
};

export default useGetCampaignDrafts;
