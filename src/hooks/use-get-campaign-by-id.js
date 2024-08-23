import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const options = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

export const useGetCampaignById = (id) => {
  const { data, error, isLoading } = useSWR(
    endpoints.campaign.getCampaignById(id),
    fetcher,
    options
  );

  console.log(data);

  const memoizedValue = useMemo(
    () => ({
      campaign: data,
      campaignError: error,
      campaignLoading: isLoading,
    }),
    [data, error, isLoading]
  );

  return memoizedValue;
};
