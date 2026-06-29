import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

// Fetches creators that belong to the selected bookmark lists (union). When no
// lists are selected the SWR key is null, so no request is made.
const useGetDiscoveryListCreators = (selectedListIds = []) => {
  const listIds = Array.isArray(selectedListIds) ? selectedListIds.filter(Boolean) : [];
  const key = listIds.length
    ? `${endpoints.discovery.bookmarkListCreators}?listIds=${listIds.join(',')}`
    : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
    keepPreviousData: true,
  });

  return useMemo(
    () => ({
      listCreators: data?.data || [],
      total: data?.total || 0,
      isLoading,
      isValidating,
      isError: error,
      mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );
};

export default useGetDiscoveryListCreators;
