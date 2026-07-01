import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

// Fetches the campaigns created by the current client_demo session.
const useGetDemoCampaigns = () => {
  const { data, error, isLoading, mutate } = useSWR(
    endpoints.clientDemo.listCampaigns,
    fetcher,
    {
      revalidateOnReconnect: true,
      revalidateIfStale: true,
      revalidateOnFocus: true,
      revalidateOnMount: true,
    }
  );

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

export default useGetDemoCampaigns;
