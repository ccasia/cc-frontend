import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const useGetRoles = () => {
  const { data, isLoading } = useSWR(endpoints.roles.root, fetcher, {
    revalidateOnMount: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
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

export default useGetRoles;
