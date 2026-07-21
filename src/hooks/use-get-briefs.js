import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const useGetBriefs = (options) => {
  const { data, error, isLoading, mutate } = useSWR(endpoints.campaignBrief.list, fetcher, options);

  return useMemo(
    () => ({
      briefs: data || [],
      isLoading,
      isError: error,
      mutate,
    }),
    [data, isLoading, error, mutate]
  );
};

export default useGetBriefs;
