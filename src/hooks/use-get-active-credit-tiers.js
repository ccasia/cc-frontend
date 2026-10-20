import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

// Active tier ranges, readable by admins and clients. Master list rows use them to show a creator's
// live tier until approval saves one.
const useGetActiveCreditTiers = () => {
  const { data, isLoading } = useSWR(endpoints.creditTier.active, fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
  });

  return useMemo(() => ({ tiers: data, isLoading }), [data, isLoading]);
};

export default useGetActiveCreditTiers;
