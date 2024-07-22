// import useSWR from 'swr';
import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const useGetCampaignPitch = () => {
  const { data, error, isLoading } = useSWR(endpoints.campaign.pitch.getCampaign, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const memoizedValue = useMemo(
    () => ({
      data,
      error,
      isLoading,
    }),
    [data, error, isLoading]
  );

  return memoizedValue;
};

export default useGetCampaignPitch;
