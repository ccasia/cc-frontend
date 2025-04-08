import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const useGetCompany = () => {
  const { data, isLoading, mutate } = useSWR(endpoints.company.getAll, fetcher, {
    revalidateOnFocus: true,
    revalidateOnMount: true,
    revalidateOnReconnect: true,
    revalidateIfStale: true,
  });

  const memoizedValue = useMemo(() => ({ data, isLoading, mutate }), [data, isLoading, mutate]);

  return memoizedValue;
};

export default useGetCompany;
