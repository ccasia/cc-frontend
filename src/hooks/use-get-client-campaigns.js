import useSWR from 'swr';
import { useMemo } from 'react';
import { fetcher, endpoints } from 'src/utils/axios';

// Custom hook to get campaigns for a client user
// This will fetch campaigns where:
// 1. The company matches the client's company
// 2. The client is the creator of the campaign (based on session user ID)
const useGetClientCampaigns = () => {
  // We'll use the same endpoint as admin campaigns but filter on the backend by client ID
  const { data, isLoading, mutate } = useSWR(endpoints.campaign.getClientCampaigns, fetcher, {
    revalidateOnReconnect: true,
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnMount: true,
  });

  const memoizedValue = useMemo(
    () => ({
      campaigns: data || [],
      isLoading,
      mutate,
    }),
    [data, isLoading, mutate]
  );

  return memoizedValue;
};

export default useGetClientCampaigns; 