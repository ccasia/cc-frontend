import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';


const useGetCreatorGrowth = ({ granularity, startDate, endDate, creditTiers = [] } = {}) => {
  const url = useMemo(() => {
    const base = endpoints.analytics.creatorGrowth;
    if (granularity === 'daily' && startDate && endDate) {
      const params = new URLSearchParams({
        granularity: 'daily',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      creditTiers.forEach((t) => params.append('creditTiers', t));
      return `${base}?${params}`;
    }
    if (creditTiers.length > 0) {
      const params = new URLSearchParams();
      creditTiers.forEach((t) => params.append('creditTiers', t));
      return `${base}?${params}`;
    }
    return base;
  }, [granularity, startDate, endDate, creditTiers]);

  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000,
  });

  return useMemo(
    () => ({
      creatorGrowth: data?.data?.creatorGrowth || [],
      demographics: data?.data?.demographics || { gender: [], ageGroups: [], countries: [] },
      granularity: data?.data?.granularity || 'monthly',
      periodComparison: data?.data?.periodComparison || null,
      isLoading,
      isError: error,
    }),
    [data, isLoading, error]
  );
};

export default useGetCreatorGrowth;
