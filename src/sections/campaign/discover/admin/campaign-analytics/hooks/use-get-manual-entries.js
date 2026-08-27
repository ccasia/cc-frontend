import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import axiosInstance from 'src/utils/axios';

const getManualEntriesData = async (url) => {
  const { data: res } = await axiosInstance.get(url);

  return res;
};

/**
 * @param {string} campaignId - The campaign unique id.
 */
const useGetManualEntries = (campaignId) => {
  const url = `/api/campaign/${campaignId}/manual-creators`;

  const queryClient = useQueryClient();

  const { data, isSuccess, isPending } = useQuery({
    queryKey: ['manualEntries', campaignId],
    queryFn: () => getManualEntriesData(url),
    enabled: !!campaignId,
  });

  const mutateManualEntries = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['manualEntries', campaignId] }),
    [queryClient, campaignId]
  );

  return { manualEntries: data?.data || [], isSuccess, isPending, mutateManualEntries };
};

export default useGetManualEntries;
