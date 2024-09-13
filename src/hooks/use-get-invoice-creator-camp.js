import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const useGetInvoiceByCreatorAndCampaign = (creatorId, campaignId) => {
  const { data, isLoading } = useSWR(
    endpoints.invoice.getInvoicesByCreatorAndCampiagn(creatorId, campaignId),
    fetcher
  );

  const memoizedValue = useMemo(
    () => ({
      invoice: data,
      isLoading,
    }),
    [data, isLoading]
  );

  return memoizedValue;
};
export default useGetInvoiceByCreatorAndCampaign;
