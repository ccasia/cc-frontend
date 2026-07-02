import useSWR from 'swr';
import axios from 'axios';
import { useMemo } from 'react';

import { DEMO_CAMPAIGN_ID } from 'src/_mock/_demo-campaign';

const noop = () => {};

/**
 * Hook to fetch manual creator entries for a campaign
 * @param {string} campaignId - Campaign ID
 * @returns {object} SWR data object with entries
 */
export const useGetManualCreatorEntries = (campaignId) => {
  // Demo campaign: no manual entries, and no live API call.
  const isDemoCampaign = campaignId === DEMO_CAMPAIGN_ID;
  const url = campaignId && !isDemoCampaign ? `/api/campaign/${campaignId}/manual-creators` : null;

  const { data, error, isLoading, mutate } = useSWR(
    url,
    async (apiUrl) => {
      const response = await axios.get(apiUrl);
      return response.data;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      shouldRetryOnError: true,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  const memoizedValue = useMemo(
    () =>
      isDemoCampaign
        ? { entries: [], isLoading: false, error: undefined, mutate: noop }
        : { entries: data?.data || [], isLoading, error, mutate },
    [isDemoCampaign, data, isLoading, error, mutate]
  );

  return memoizedValue;
};

export default useGetManualCreatorEntries;
