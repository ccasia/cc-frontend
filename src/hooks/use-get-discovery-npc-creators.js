import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const useGetDiscoveryNpcCreators = (filters = {}) => {
  const page = filters.page || 1;
  const limit = filters.limit || 20;

  const url = useMemo(() => {
    const params = new URLSearchParams();
    params.set('platform', filters.platform || 'all');
    params.set('page', String(page));
    params.set('limit', String(limit));

    if (filters.keyword) params.set('keyword', filters.keyword);
    if (filters.followers != null && filters.followers !== '') {
      params.set('followers', String(filters.followers));
    }

    return `${endpoints.discovery.nonPlatformCreators}?${params.toString()}`;
  }, [filters, page, limit]);

  const { data, isLoading, mutate, error } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnMount: true,
    keepPreviousData: true,
  });

  return useMemo(
    () => ({
      creators: data?.data || [],
      pagination: data?.pagination || null,
      isLoading,
      mutate,
      isError: error,
    }),
    [data, isLoading, mutate, error]
  );
};

export default useGetDiscoveryNpcCreators;
