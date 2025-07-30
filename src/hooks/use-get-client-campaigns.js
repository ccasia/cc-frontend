import useSWR from 'swr';
import { useMemo, useEffect } from 'react';
import { fetcher, endpoints } from 'src/utils/axios';

// Custom hook to get campaigns for a client user
// This will fetch campaigns where:
// 1. The company matches the client's company
// 2. The client is the creator of the campaign (based on session user ID)
const useGetClientCampaigns = () => {
  // We'll use the same endpoint as admin campaigns but filter on the backend by client ID
  const { data, error, isLoading, mutate } = useSWR(endpoints.campaign.getClientCampaigns, fetcher, {
    revalidateOnReconnect: true,
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnMount: true,
  });

  // Add console logs to debug
  useEffect(() => {
    if (data) {
      console.log('Client campaigns data:', data);
    }
    if (error) {
      console.error('Error fetching client campaigns:', error);
    }
  }, [data, error]);

  const memoizedValue = useMemo(
    () => ({
      campaigns: data || [],
      isLoading,
      error,
      mutate,
    }),
    [data, isLoading, error, mutate]
  );

  return memoizedValue;
};

export default useGetClientCampaigns; 