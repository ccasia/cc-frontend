import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';


const useGetCreatorGrowthCreators = ({ startDate, endDate, creditTiers = [] } = {}) => {
  const url = useMemo(() => {
    if (!startDate || !endDate) return null;
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    creditTiers.forEach((t) => params.append('creditTiers', t));
    return `${endpoints.analytics.creatorGrowthCreators}?${params}`;
  }, [startDate, endDate, creditTiers]);

  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000,
  });

  return useMemo(
    () => ({
      creators: data?.data?.creators || [],
      genderBreakdown: data?.data?.genderBreakdown || { male: 0, female: 0, nonBinary: 0 },
      count: data?.data?.count || 0,
      isLoading,
      isError: error,
    }),
    [data, isLoading, error]
  );
};

export default useGetCreatorGrowthCreators;
