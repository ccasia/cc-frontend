import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher } from 'src/utils/axios';

const useGetMessageInsights = () => {
  const { data, isLoading } = useSWR('/api/system-settings/whatsapp-insight', fetcher);

  const memoizedValue = useMemo(() => ({ data, isLoading }), [data, isLoading]);

  return memoizedValue;
};

export default useGetMessageInsights;
