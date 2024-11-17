import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

export const useGetTemplate = (id) => {
  const { data, isLoading, error } = useSWR(
    id ? endpoints.agreementTemplate.byId(id) : endpoints.agreementTemplate.all,
    fetcher,
    {
      revalidateIfStale: true,
      // revalidateOnMount: true,
      revalidateOnReconnect: true,
      // revalidateOnFocus: true,
    }
  );

  const memoizedValue = useMemo(() => ({ data, isLoading, error }), [data, isLoading, error]);

  return memoizedValue;
};
