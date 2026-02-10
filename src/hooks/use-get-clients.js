import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

/**
 * Hook to fetch clients by company ID
 * @param {string} companyId - The company ID to fetch clients for
 * @returns {object} - { clients, isLoading, error, mutate }
 */
const useGetClients = (companyId) => {
  const { data, isLoading, error, mutate } = useSWR(
    companyId ? endpoints.company.getClients(companyId) : null,
    fetcher,
    {
      revalidateIfStale: true,
      revalidateOnMount: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  const memoizedValue = useMemo(
    () => ({
      clients: data || [],
      isLoading,
      error,
      mutate,
    }),
    [data, isLoading, error, mutate]
  );

  return memoizedValue;
};

export default useGetClients;
