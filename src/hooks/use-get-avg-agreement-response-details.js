import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const toLocalDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const useGetAvgAgreementResponseDetails = ({ startDate, endDate } = {}) => {
  const url = useMemo(() => {
    if (!startDate || !endDate) return null;
    const params = new URLSearchParams({
      startDate: toLocalDate(startDate),
      endDate: toLocalDate(endDate),
    });
    return `${endpoints.analytics.avgAgreementResponseDetails}?${params}`;
  }, [startDate, endDate]);

  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000,
  });

  return useMemo(
    () => ({
      avg: data?.data?.avg ?? null,
      count: data?.data?.count || 0,
      fastest: data?.data?.fastest || null,
      slowest: data?.data?.slowest || null,
      isLoading,
      isError: error,
    }),
    [data, isLoading, error]
  );
};

export default useGetAvgAgreementResponseDetails;
