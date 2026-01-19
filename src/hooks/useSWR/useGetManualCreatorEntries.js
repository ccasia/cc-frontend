import useSWR from 'swr';
import axios from 'axios';
import { useMemo } from 'react';

/**
 * Hook to fetch manual creator entries for a campaign
 * @param {string} campaignId - Campaign ID
 * @returns {object} SWR data object with entries
 */
export const useGetManualCreatorEntries = (campaignId) => {
  const url = campaignId ? `/api/campaign/${campaignId}/manual-creators` : null;

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
    () => ({
      entries: data?.data || [],
      isLoading,
      error,
      mutate,
    }),
    [data, isLoading, error, mutate]
  );

  return memoizedValue;
};

export default useGetManualCreatorEntries;
