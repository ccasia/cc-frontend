import useSWR from 'swr';
import { useMemo } from 'react';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

export const useGetAllCreators = () => {
  const { data, isLoading } = useSWR(endpoints.creators.getCreators, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    revalidateOnMount: true,
  });

  const memoizedValue = useMemo(() => ({ data, isLoading }), [data, isLoading]);

  return memoizedValue;
};

export const shortlistCreator = async (data) => {
  const res = await axiosInstance.post(endpoints.campaign.shortlistCreator, data);
  return res;
};

export const shortlistGuestCreator = async (data) => {
  const res = await axiosInstance.post(endpoints.campaign.guestShortListCreator, data);
  return res;
};
