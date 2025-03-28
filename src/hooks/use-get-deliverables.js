import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher } from 'src/utils/axios';

export const useGetDeliverables = (userId, campaignId) => {
  const { data, mutate, isLoading } = useSWR(
    `/api/submission/deliverables/${userId}/${campaignId}`,
    fetcher
  );

  const memoizedValue = useMemo(() => ({ data, mutate, isLoading }), [data, mutate, isLoading]);

  return memoizedValue;
};
