import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const useGetClientHistory = (id) => {
  const { data, isLoading, mutate } = useSWR(`${endpoints.package.history}/${id}`, fetcher, {
    revalidateIfStale: true,
    revalidateOnMount: true,
  });

  const memoizedValue = useMemo(
    () => ({
      data,
      isLoading,
      mutate,
    }),
    [data, isLoading, mutate]
  );

  return memoizedValue;
};

export default useGetClientHistory;
