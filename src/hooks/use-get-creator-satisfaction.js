import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const useGetCreatorSatisfaction = () => {
  const url = endpoints.analytics.creatorSatisfaction;

  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000,
  });

  return useMemo(
    () => ({
      trend: data?.data?.trend || [],
      overall: data?.data?.overall || { averageRating: 0, totalResponses: 0, distribution: [] },
      isLoading,
      isError: error,
    }),
    [data, isLoading, error]
  );
};

export default useGetCreatorSatisfaction;
