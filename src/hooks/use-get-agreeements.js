import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

export const useGetAgreements = (campaignId) => {
  const { data, isLoading, mutate } = useSWR(
    endpoints.campaign.creatorAgreement(campaignId),
    fetcher,
    {
      revalidateOnMount: true,
      revalidateIfStale: true,
      revalidateOnReconnect: true,
    }
  );

  const memoizedValue = useMemo(
    () => ({
      data,
      isLoading,
      mutate,
    }),
    [data, isLoading, mutate]
  );

  return memoizedValue;
};
