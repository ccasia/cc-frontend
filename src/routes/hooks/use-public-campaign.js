import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const options = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

export const useGetCampaignById = (id) => {
  const { data, error, mutate, isLoading } = useSWR(
    endpoints.campaign.getCampaignPitchById(id),
    fetcher,
    options
  );

  const memoizedValue = useMemo(
    () => ({
      campaign: data,
      campaignError: error,
      campaignLoading: isLoading,
      mutate,
    }),
    [data, error, isLoading, mutate]
  );

  return memoizedValue;
};
