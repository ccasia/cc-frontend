import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const useGetNotificationById = () => {
  const { data, isLoading } = useSWR(endpoints.notification.root, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
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

export default useGetNotificationById;
