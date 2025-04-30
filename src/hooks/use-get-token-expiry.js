import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const useGetTokenExpiry = () => {
  const { data, isLoading, mutate } = useSWR(endpoints.invoice.xeroCheckRefreshToken, fetcher);

  const memoizedValue = useMemo(() => ({ data, isLoading, mutate }), [data, isLoading, mutate]);

  return memoizedValue;
};
export default useGetTokenExpiry;
