import useSWR from 'swr';
import { useMemo } from 'react';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// The full platform creator list is large: no refetch on focus, and pass
// enabled = false until the picker that needs it opens.
export const useGetAllCreators = (enabled = true) => {
  const { data, isLoading } = useSWR(enabled ? endpoints.creators.getCreators : null, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000,
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
