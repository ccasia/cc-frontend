import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

export const useGetCampaignBrandOption = () => {
  const { data, isLoading } = useSWR(endpoints.company.getOptions, fetcher, {
    revalidateOnFocus: true,
    revalidateOnMount: true,
    revalidateOnReconnect: true,
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
