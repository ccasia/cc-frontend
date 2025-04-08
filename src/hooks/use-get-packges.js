import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const useGetPackages = () => {
  const { data, isLoading, mutate } = useSWR(endpoints.package.root, fetcher, {
    revalidateOnFocus: true,
    revalidateOnMount: true,
    revalidateOnReconnect: true,
    revalidateIfStale: true,
  });

  const memoizedValue = useMemo(() => ({ data, isLoading, mutate }), [data, isLoading, mutate]);

  return memoizedValue;
};

export default useGetPackages;
