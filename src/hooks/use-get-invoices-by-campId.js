import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const useGetInvoicesByCampId = (id) => {
 
  const { data, isLoading } = useSWR(endpoints.invoice.getInvoicesByCampaignId(id), fetcher);

  const memoizedValue = useMemo(
    () => ({
      campaigns: data,
      isLoading,
    }),
    [data, isLoading]
  );

  return memoizedValue;
};
export default useGetInvoicesByCampId;