import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const useGetTokenExpiry = () => {
  const { data, isLoading } = useSWR(endpoints.invoice.xeroCheckRefreshToken, fetcher);

  const memoizedValue = useMemo(() => ({ data, isLoading }), [data, isLoading]);

  return memoizedValue;
};
export default useGetTokenExpiry;
