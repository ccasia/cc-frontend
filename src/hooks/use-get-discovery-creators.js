import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

/**
 * @param {Object} filters
 * @param {string} [filters.platform='all']
 * @param {string} [filters.gender]
 * @param {string} [filters.ageRange]
 * @param {string} [filters.country]
 * @param {string} [filters.city]
 * @param {string} [filters.creditTier]
 * @param {string[]} [filters.languages]
 * @param {string[]} [filters.interests]
 * @param {string} [filters.keyword]
 * @param {string} [filters.hashtag]
 * @param {'name'|'followers'} [filters.sortBy]
 * @param {'asc'|'desc'} [filters.sortDirection]
 */
const useGetDiscoveryCreators = (filters = {}) => {
  const page = filters.page || 1;
  const limit = filters.limit || 20;

  const url = useMemo(() => {
    const params = new URLSearchParams();
    params.set('platform', filters.platform || 'all');
    params.set('page', String(page));
    params.set('limit', String(limit));
    params.set('hydrateMissing', 'true');
    params.set('sortBy', filters.sortBy || 'name');
    params.set('sortDirection', filters.sortDirection || 'asc');

    if (filters.gender) params.set('gender', filters.gender);
    if (filters.ageRange) params.set('ageRange', filters.ageRange);
    if (filters.country) params.set('country', filters.country);
    if (filters.city) params.set('city', filters.city);
    if (filters.creditTier) params.set('creditTier', filters.creditTier);
    if (filters.keyword) params.set('keyword', filters.keyword);
    if (filters.hashtag) params.set('hashtag', filters.hashtag);
    if (filters.languages?.length) params.set('languages', JSON.stringify(filters.languages));
    if (filters.interests?.length) params.set('interests', JSON.stringify(filters.interests));

    return `${endpoints.discovery.creators}?${params.toString()}`;
  }, [filters, page, limit]);

  const { data, isLoading, mutate, error } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnMount: true,
    keepPreviousData: true,
  });

  const memoizedValue = useMemo(
    () => ({
      creators: data?.data || [],
      pagination: data?.pagination || null,
      availableLocations: data?.availableLocations || {},
      isLoading,
      pageSize: limit,
      mutate,
      isError: error,
    }),
    [data, isLoading, limit, mutate, error]
  );

  return memoizedValue;
};

export default useGetDiscoveryCreators;
