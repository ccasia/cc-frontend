import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

const useGetOverview = () => {
  const { user } = useAuthContext();

  // OPTIMIZED: Reduce unnecessary re-fetches for better performance
  const { data, isLoading } = useSWR(endpoints.overview.root(user?.id), fetcher, {
    revalidateOnFocus: false,
    revalidateOnMount: true,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    dedupingInterval: 30000, // Cache for 30 seconds
  });

  const memoizedValue = useMemo(
    () => ({
      data,
      isLoading,
    }),
    [data, isLoading]
  );

  return memoizedValue;
};

export default useGetOverview;
