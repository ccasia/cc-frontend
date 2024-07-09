import { useState, useEffect, useCallback } from 'react';

import axiosInstance, { endpoints } from 'src/utils/axios';

const useGetFirstDraft = (creatorId, campaignId) => {
  const [firstDraft, setFirstDraft] = useState('');

  const getFirstDraft = useCallback(async () => {
    const res = await axiosInstance.get(endpoints.campaign.draft.firstDraft, {
      creatorId,
      campaignId,
    });
    setFirstDraft(res?.data);
  }, [campaignId, creatorId]);

  useEffect(() => {
    getFirstDraft();
  }, [getFirstDraft]);

  //   const { data, error, isLoading } = useSWR(endpoints.campaign.draft.firstDraft, fetcher, {
  //     revalidateIfStale: false,
  //     revalidateOnFocus: false,
  //     revalidateOnReconnect: false,
  //   });

  //   const memoizedValue = useMemo(
  //     () => ({
  //       data,
  //       error,
  //       isLoading,
  //     }),
  //     [data, error, isLoading]
  //   );

  return { firstDraft };
};

export default useGetFirstDraft;
