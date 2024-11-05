import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const useGetTokenExpiry = () => {
  const { data } = useSWR(endpoints.auth.xeroCheckRefreshToken, fetcher);

  const memoizedValue = useMemo(() => ({ data}), [data]);

  return memoizedValue;
};
export default useGetTokenExpiry;
