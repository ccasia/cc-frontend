import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher } from 'src/utils/axios';

export function useGetCreatorLogistic(campaignId) {
  const URL = campaignId ? `/api/logistics/creator/campaign/${campaignId}` : null;

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  const memoizedValue = useMemo(
    () => ({
      logistic: data,
      logisticLoading: isLoading,
      logisticError: error,
      logisticValidating: isValidating,
      logisticEmpty: !isLoading && !data,
      mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );
  
  return memoizedValue;
}
