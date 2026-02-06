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

export const useCheckCreatorNps = (enabled = true) => {
  const { data, isLoading, mutate } = useSWR(
    enabled ? endpoints.npsFeedback.checkCreator : null,
    fetcher
  );

  return useMemo(() => ({
    shouldShowNps: data?.showNPS || false,
    isLoading,
    mutate,
  }), [data, isLoading, mutate]);
};

export const useGetNpsFeedbackStats = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString
    ? `${endpoints.npsFeedback.stats}?${queryString}`
    : endpoints.npsFeedback.stats;

  const { data, isLoading } = useSWR(url, fetcher, { keepPreviousData: true });

  return useMemo(() => ({
    stats: data,
    isLoading,
  }), [data, isLoading]);
};
