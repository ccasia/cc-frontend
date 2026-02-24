import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const toLocalDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const useGetCreatorEarnings = ({ startDate, endDate } = {}) => {
  const url = useMemo(() => {
    const base = endpoints.analytics.creatorEarnings;
    if (startDate && endDate) {
      const params = new URLSearchParams({
        startDate: toLocalDate(startDate),
        endDate: toLocalDate(endDate),
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
      creators: data?.data?.creators || [],
      totalPaidAmount: data?.data?.totalPaidAmount || 0,
      isLoading,
      isError: error,
    }),
    [data, isLoading, error]
  );
};

export default useGetCreatorEarnings;
