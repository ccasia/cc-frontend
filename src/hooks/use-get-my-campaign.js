import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

// For Creator Only
export const useGetMyCampaign = (userId) => {
  const { data, isLoading } = useSWR(endpoints.creators.getMyCampaigns(userId), fetcher);

  const memoizedValue = useMemo(() => ({ data, isLoading }), [data, isLoading]);

  return memoizedValue;
};
