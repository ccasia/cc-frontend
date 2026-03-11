import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';


const useGetMediaKitActivation = ({ startDate, endDate, creditTiers = [] } = {}) => {
  const url = useMemo(() => {
    const base = endpoints.analytics.mediaKitActivation;
    if (startDate && endDate) {
      const params = new URLSearchParams({
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
  }, [startDate, endDate, creditTiers]);

  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000,
  });

  return useMemo(
    () => ({
      platforms: data?.data?.platforms || [],
      uniqueConnected: data?.data?.uniqueConnected ?? 0,
      isLoading,
      isError: error,
    }),
    [data, isLoading, error]
  );
};

export default useGetMediaKitActivation;
