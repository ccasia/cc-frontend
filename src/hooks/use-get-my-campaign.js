import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

// For Creator Only
export const useGetMyCampaign = (userId) => {
  const { data, isLoading, mutate } = useSWR(endpoints.creators.getMyCampaigns(userId), fetcher);

  const memoizedValue = useMemo(() => ({ data, isLoading, mutate }), [data, isLoading, mutate]);

  return memoizedValue;
};
