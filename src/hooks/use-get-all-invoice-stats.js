import useSWR from 'swr';
import { useMemo } from 'react';
import { fetcher, endpoints } from 'src/utils/axios';

/**
 * Hook to fetch aggregated invoice statistics for all invoices
 * Used for finance dashboard tab counts
 */
const useGetAllInvoiceStats = () => {
  const { data, isLoading, error } = useSWR(endpoints.invoice.getStats, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000, // Cache for 30 seconds
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
    };
  }, [data, isLoading, error]);

  return memoizedValue;
};

export default useGetAllInvoiceStats;

