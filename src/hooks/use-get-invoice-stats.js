import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const useGetInvoiceStats = (campaignId) => {
  const { data, isLoading, error } = useSWR(
    campaignId ? endpoints.invoice.getStatsByCampaign(campaignId) : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );

  const memoizedValue = useMemo(
    () => ({
      stats: data?.data,
      isLoading,
      error,
    }),
    [data, isLoading, error]
  );

  return memoizedValue;
};

export default useGetInvoiceStats;

