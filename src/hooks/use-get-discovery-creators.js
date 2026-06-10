import { useMemo } from 'react';
import useSWRInfinite from 'swr/infinite';

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
const buildDiscoveryCreatorsUrl = (filters = {}, page = 1, limit = 20) => {
  const hydrateMissing = filters.hydrateMissing !== false;
  const params = new URLSearchParams();
  params.set('platform', filters.platform || 'all');
  params.set('page', String(page));
  params.set('limit', String(limit));
  params.set('hydrateMissing', hydrateMissing ? 'true' : 'false');
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
};

export const buildDiscoveryCreatorsExportUrl = (filters = {}) => {
  const params = new URLSearchParams();
  params.set('platform', filters.platform || 'all');
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

  return `${endpoints.discovery.creatorsExportData}?${params.toString()}`;
};

const useGetDiscoveryCreators = (filters = {}) => {
  const limit = filters.limit || 20;

  const getKey = useMemo(
    () => (pageIndex, previousPageData) => {
      if (previousPageData) {
        const previousPagination = previousPageData.pagination;
        const previousTotal = previousPagination?.total || 0;
        const previousPage = previousPagination?.page || pageIndex;
        const previousLimit = previousPagination?.limit || limit;

        if (previousPage * previousLimit >= previousTotal) {
          return null;
        }
      }

      return buildDiscoveryCreatorsUrl(filters, pageIndex + 1, limit);
    },
    [filters, limit]
  );

  const { data, isLoading, isValidating, size, setSize, mutate, error } = useSWRInfinite(
    getKey,
    fetcher,
    {
      revalidateFirstPage: false,
      revalidateOnFocus: false,
      revalidateOnMount: true,
      keepPreviousData: true,
    }
  );

  const creators = useMemo(() => (data ? data.flatMap((page) => page?.data || []) : []), [data]);

  const firstPage = data?.[0] || null;
  const lastPage = data?.[data.length - 1] || null;
  const pagination = lastPage?.pagination || firstPage?.pagination || null;
  const total = pagination?.total || 0;
  const loadedCount = creators.length;
  const pageLimit = pagination?.limit || limit;
  const lastLoadedPage = pagination?.page || 0;
  const isLoadingMore = Boolean(isValidating && data && typeof data[size - 1] === 'undefined');
  // Reached the end when we've loaded every result OR the last loaded page already
  // satisfies the same page-count stop condition getKey uses. The second clause is
  // essential for keyword/hashtag searches, where the live content re-check drops rows
  // so loadedCount can never catch up to the DB pre-filter total — without it the
  // load-more effect would spin forever and freeze the page.
  const isReachingEnd = Boolean(
    pagination && (loadedCount >= total || lastLoadedPage * pageLimit >= total)
  );

  const memoizedValue = useMemo(
    () => ({
      creators,
      pagination,
      availableLocations: firstPage?.availableLocations || {},
      isLoading,
      isLoadingMore,
      isValidating,
      isReachingEnd,
      size,
      setSize,
      pageSize: limit,
      mutate,
      isError: error,
    }),
    [
      creators,
      pagination,
      firstPage,
      isLoading,
      isLoadingMore,
      isValidating,
      isReachingEnd,
      size,
      setSize,
      limit,
      mutate,
      error,
    ]
  );

  return memoizedValue;
};

export default useGetDiscoveryCreators;
