import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

export const useGetCampaignByCreatorId = () => {
  const { data, isLoading } = useSWR(endpoints.campaign.creator.shortListedCampaign, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnMount: true,
  });

  const memoizedValue = useMemo(() => ({ data, isLoading }), [data, isLoading]);

  return memoizedValue;
};

// export default useGetCampaignByCreatorId;
