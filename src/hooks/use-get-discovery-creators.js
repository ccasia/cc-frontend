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
 * @param {string[]} [filters.interests]
 * @param {string} [filters.keyword]
 * @param {string} [filters.hashtag]
 */
const useGetDiscoveryCreators = (filters = {}) => {
  const url = useMemo(() => {
    const params = new URLSearchParams();
    params.set('platform', filters.platform || 'all');
    params.set('page', '1');
    params.set('limit', '50');
    params.set('hydrateMissing', 'true');

    if (filters.gender) params.set('gender', filters.gender);
    if (filters.ageRange) params.set('ageRange', filters.ageRange);
    if (filters.country) params.set('country', filters.country);
    if (filters.city) params.set('city', filters.city);
    if (filters.creditTier) params.set('creditTier', filters.creditTier);
    if (filters.keyword) params.set('keyword', filters.keyword);
    if (filters.hashtag) params.set('hashtag', filters.hashtag);
    if (filters.interests?.length) params.set('interests', JSON.stringify(filters.interests));

    return `${endpoints.discovery.creators}?${params.toString()}`;
  }, [filters]);

  const { data, isLoading, mutate, error } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnMount: true,
    keepPreviousData: false,
  });

  const memoizedValue = useMemo(
    () => ({
      creators: data?.data || [],
      pagination: data?.pagination || null,
      availableLocations: data?.availableLocations || {},
      isLoading,
      mutate,
      isError: error,
    }),
    [data, isLoading, mutate, error]
  );

  return memoizedValue;
};

export default useGetDiscoveryCreators;
