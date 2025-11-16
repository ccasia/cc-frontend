import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher } from 'src/utils/axios';

export const useGetChildAccounts = () => {
  const { data, isLoading, error } = useSWR(
    '/api/child-account/all',
    fetcher,
    {
      revalidateIfStale: true,
      revalidateOnMount: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const memoizedValue = useMemo(
    () => ({
      childAccounts: data,
      isLoading,
      error,
    }),
    [data, isLoading, error]
  );

  return memoizedValue;
};
