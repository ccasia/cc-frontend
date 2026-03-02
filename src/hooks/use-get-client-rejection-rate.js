import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';


const useGetClientRejectionRate = ({ startDate, endDate } = {}) => {
  const url = useMemo(() => {
    const base = endpoints.analytics.clientRejectionRate;
    if (startDate && endDate) {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      return `${base}?${params}`;
    }
    return base;
  }, [startDate, endDate]);

  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000,
  });

  return useMemo(
    () => ({
      avgRate: data?.data?.avgRate ?? 0,
      breakdown: data?.data?.breakdown ?? [],
      isLoading,
      isError: error,
    }),
    [data, isLoading, error]
  );
};

export default useGetClientRejectionRate;
