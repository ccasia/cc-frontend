import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';


const useGetCreatorGrowth = ({ granularity, startDate, endDate } = {}) => {
  const url = useMemo(() => {
    const base = endpoints.analytics.creatorGrowth;
    if (granularity === 'daily' && startDate && endDate) {
      const params = new URLSearchParams({
        granularity: 'daily',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      return `${base}?${params}`;
    }
    return base;
  }, [granularity, startDate, endDate]);

  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000,
  });

  return useMemo(
    () => ({
      creatorGrowth: data?.data?.creatorGrowth || [],
      demographics: data?.data?.demographics || { gender: [], ageGroups: [] },
      granularity: data?.data?.granularity || 'monthly',
      periodComparison: data?.data?.periodComparison || null,
      isLoading,
      isError: error,
    }),
    [data, isLoading, error]
  );
};

export default useGetCreatorGrowth;
