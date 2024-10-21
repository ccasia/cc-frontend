import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const useGetDefaultTimeLine = () => {
  const { data, isLoading } = useSWR(endpoints.campaign.timeline.defaultTimeline, fetcher, {
    revalidateIfStale: true,
    revalidateOnMount: true,
    revalidateOnFocus: true,
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

export default useGetDefaultTimeLine;
