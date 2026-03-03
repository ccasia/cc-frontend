import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';


const useGetAvgAgreementResponseDetails = ({ startDate, endDate, creditTiers = [] } = {}) => {
  const url = useMemo(() => {
    if (!startDate || !endDate) return null;
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    creditTiers.forEach((t) => params.append('creditTiers', t));
    return `${endpoints.analytics.avgAgreementResponseDetails}?${params}`;
  }, [startDate, endDate, creditTiers]);

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
