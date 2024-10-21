import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

const useGetFirstDraftBySessionID = (campaignId) => {
  const { data, isLoading } = useSWR(
    endpoints.campaign.draft.getFirstDraftForCreator(campaignId),
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnReconnect: false,
      revalidateOnFocus: false,
    }
  );

  const memoizedValue = useMemo(
    () => ({
      data,
      isLoading,
    }),
    [data, isLoading]
  );
  //   );
  return memoizedValue;
};

export default useGetFirstDraftBySessionID;
