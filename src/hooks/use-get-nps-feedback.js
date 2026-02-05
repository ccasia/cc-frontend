import { useMemo } from 'react';
import useSWR from 'swr';

import { fetcher, endpoints } from 'src/utils/axios';

export const useGetNpsFeedback = (params) => {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `${endpoints.npsFeedback.root}?${queryString}` : endpoints.npsFeedback.root;

  const { data, isLoading, mutate } = useSWR(url, fetcher);

  return useMemo(() => ({
    feedback: data?.data || [],
    total: data?.total || 0,
    isLoading,
    mutate,
  }), [data, isLoading, mutate]);
};

export const useGetNpsFeedbackStats = () => {
  const { data, isLoading } = useSWR(endpoints.npsFeedback.stats, fetcher);

  return useMemo(() => ({
    stats: data,
    isLoading,
  }), [data, isLoading]);
};
