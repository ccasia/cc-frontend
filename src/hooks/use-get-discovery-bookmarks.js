import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const useGetDiscoveryBookmarks = () => {
  const { data, error, isLoading, mutate } = useSWR(endpoints.discovery.bookmarks, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  return useMemo(() => {
    const bookmarks = data?.bookmarks || [];

    return {
      bookmarkedCreators: data?.data || [],
      bookmarks,
      bookmarkedRowKeys: bookmarks.map(
        (bookmark) => `${bookmark.creatorUserId}-${bookmark.platform}`
      ),
      total: data?.total || 0,
      isLoading,
      isError: error,
      mutate,
    };
  }, [data, error, isLoading, mutate]);
};

export default useGetDiscoveryBookmarks;
