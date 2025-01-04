import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

const useGetOverview = () => {
  const { user } = useAuthContext();

  const { data, isLoading } = useSWR(endpoints.overview.root(user?.id), fetcher, {
    revalidateOnFocus: true,
    revalidateOnMount: true,
    revalidateOnReconnect: true,
    revalidateIfStale: true,
  });

  const memoizedValue = useMemo(
    () => ({
      data,
      isLoading,
    }),
    [data, isLoading]
  );

  return memoizedValue;
};

export default useGetOverview;
