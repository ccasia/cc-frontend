import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const options = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

export const useGetCampaignById = (id) => {
  const endpoint = id ? endpoints.campaign.getCampaignById(id) : null;
  const { data, error, mutate, isLoading } = useSWR(endpoint, fetcher, options);

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

export const useGetCampaignByIdScoped = (id, usePublicEndpoint = false, isDemo = false) => {
  let endpoint = null;
  if (id) {
    if (isDemo) {
      endpoint = endpoints.clientDemo.getCampaign(id);
    } else if (usePublicEndpoint) {
      endpoint = endpoints.campaign.getCampaignPitchById(id);
    } else {
      endpoint = endpoints.campaign.getCampaignById(id);
    }
  }

  const { data, error, mutate, isLoading } = useSWR(endpoint, fetcher, options);

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
