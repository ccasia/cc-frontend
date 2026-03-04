import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const useGetRequireChangesRate = () => {
  const { data, error, isLoading } = useSWR(endpoints.analytics.requireChangesRate, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000,
  });

  return useMemo(
    () => ({
      v2: data?.data?.v2 ?? [],
      v4: data?.data?.v4 ?? [],
      isLoading,
      isError: error,
    }),
    [data, isLoading, error]
  );
};

export default useGetRequireChangesRate;
