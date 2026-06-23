import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

// Fetches the account's bookmark lists (with creator counts) and a flat list of
// memberships, exposing a Map keyed by `${creatorUserId}-${platform}` -> Set<listId>
// so cards can show which lists a creator already belongs to.
const useGetDiscoveryBookmarkLists = () => {
  const { data, error, isLoading, mutate } = useSWR(endpoints.discovery.bookmarkLists, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  return useMemo(() => {
    const lists = data?.lists || [];
    const memberships = data?.memberships || [];

    const membershipsByRowKey = new Map();
    memberships.forEach((membership) => {
      const rowKey = `${membership.creatorUserId}-${membership.platform}`;
      if (!membershipsByRowKey.has(rowKey)) {
        membershipsByRowKey.set(rowKey, new Set());
      }
      membershipsByRowKey.get(rowKey).add(membership.listId);
    });

    return {
      lists,
      memberships,
      membershipsByRowKey,
      isLoading,
      isError: error,
      mutate,
    };
  }, [data, error, isLoading, mutate]);
};

export default useGetDiscoveryBookmarkLists;
