import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

export const useGetSubmissions = (id, campaignId) => {
  const { data, isLoading, mutate } = useSWR(
    `${endpoints.submission.root}?creatorId=${id}&campaignId=${campaignId}`,
    fetcher,
    {
      revalidateIfStale: true,
      revalidateOnFocus: true,
      revalidateOnMount: true,
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

export const useGetPostingSubmissions = () => {
  const { data, isLoading, mutate } = useSWR(
    `${endpoints.submission.all}?onlyValidSocialInsights=true`,
    fetcher,
    {
      // Report data changes daily; refetching on every tab focus only repeats a heavy request
      revalidateIfStale: true,
      revalidateOnFocus: false,
      revalidateOnMount: true,
      revalidateOnReconnect: true,
      dedupingInterval: 60_000,
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
