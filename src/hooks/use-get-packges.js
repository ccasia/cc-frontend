import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const useGetPackages = (includeArchived = false) => {
  const url = includeArchived ? `${endpoints.package.root}?includeArchived=true` : endpoints.package.root;

  const { data, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: true,
    revalidateOnMount: true,
    revalidateOnReconnect: true,
    revalidateIfStale: true,
  });

  const memoizedValue = useMemo(() => ({ data, isLoading, mutate }), [data, isLoading, mutate]);

  return memoizedValue;
};

export default useGetPackages;
