import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const useGetCreatorSatisfaction = (options = {}) => {
  const { creditTiers = [] } = options;

  const url = useMemo(() => {
    const base = endpoints.analytics.creatorSatisfaction;
    if (creditTiers.length > 0) {
      const params = new URLSearchParams();
      creditTiers.forEach((t) => params.append('creditTiers', t));
      return `${base}?${params}`;
    }
    return base;
  }, [creditTiers]);

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
