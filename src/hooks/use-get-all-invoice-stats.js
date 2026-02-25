import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

/**
 * Hook to fetch aggregated invoice statistics for all invoices
 * Used for finance dashboard tab counts
 */
const useGetAllInvoiceStats = () => {
  const { data, isLoading, error, mutate } = useSWR(endpoints.invoice.getStats, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000, // Cache for 5 seconds
  });

  const memoizedValue = useMemo(() => {
    let stats = null;
    
    if (data) {
      if (data.success && data.data) {
        stats = data.data;
      } else if (data.data) {
        stats = data.data;
      } else if (data.counts) {
        stats = data;
      }
    }
    
    return {
      stats,
      isLoading,
      error,
      mutate,
    };
  }, [data, isLoading, error, mutate]);

  return memoizedValue;
};

export default useGetAllInvoiceStats;

