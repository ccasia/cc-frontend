import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

// Superadmin BD-oversight aggregate: pipeline snapshot, per-BD-person
// conversion table, and won/lost deal value per currency.
// `dateRange` is the { startDate, endDate } ISO pair from the dashboard's
// time-range filter; omit it for all-time.
const useGetBdOverview = (dateRange) => {
  const url = useMemo(() => {
    const base = endpoints.campaignBrief.bdOverview;
    if (!dateRange?.startDate || !dateRange?.endDate) return base;
    const params = new URLSearchParams({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });
    return `${base}?${params}`;
  }, [dateRange]);

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000,
  });

  return useMemo(
    () => ({
      pipeline: data?.pipeline || [],
      people: data?.people || [],
      valueTotals: data?.valueTotals || {},
      currencies: data?.currencies || [],
      isLoading,
      isError: error,
      mutate,
    }),
    [data, isLoading, error, mutate]
  );
};

export default useGetBdOverview;
