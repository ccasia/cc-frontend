import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';


const useGetPitchRateCreators = ({ startDate, endDate } = {}) => {
  const url = useMemo(() => {
    if (!startDate || !endDate) return null;
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    return `${endpoints.analytics.pitchRateCreators}?${params}`;
  }, [startDate, endDate]);

  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000,
  });

  return useMemo(
    () => ({
      creators: data?.data?.creators || [],
      avgDays: data?.data?.avgDays,
      count: data?.data?.count || 0,
      isLoading,
      isError: error,
    }),
    [data, isLoading, error]
  );
};

export default useGetPitchRateCreators;
