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
    id ? endpoints.campaign.getCampaignById(id) : null,
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

export const useGetCampaignByIdPublic = (id) => {
  const { data, error, mutate, isLoading } = useSWR(
    id ? endpoints.campaign.getCampaignPitchById(id) : null,
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
