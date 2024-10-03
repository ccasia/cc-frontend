import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const useGetBrandByCampaignId = (id) => {
  const { data, isLoading } = useSWR(endpoints.company.getBrandsByClientId(id), fetcher, {
    revalidateOnReconnect: true,
    revalidateOnFocus: true,
    revalidateOnMount: true,
  });

  const memoizedValue = useMemo(
    () => ({
      data,
      isLoading,
    }),
    [data, isLoading]
  );

  return memoizedValue;
};

export default useGetBrandByCampaignId;
