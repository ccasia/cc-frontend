import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

/**
 * Optimized hook for dashboard statistics
 * This should ideally call a backend endpoint that returns aggregated stats
 * For now, it provides a structure that can be easily migrated to a backend endpoint
 */
const useDashboardStats = () => {
  // TODO: Replace with dedicated backend endpoint: /api/dashboard/stats
  // This endpoint should return pre-aggregated data instead of fetching all creators/campaigns
  const { data, error, isLoading } = useSWR(
    endpoints.dashboard?.stats || null, // Will be null until endpoint is created
    fetcher,
    {
      revalidateOnFocus: false, // Don't refetch on window focus for dashboard
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );

  return useMemo(
    () => ({
      stats: data,
      isLoading,
      isError: error,
    }),
    [data, isLoading, error]
  );
};

export default useDashboardStats;

