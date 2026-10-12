import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import axiosInstance, { endpoints } from 'src/utils/axios';

const STALE_TIME_MS = 60_000;

const getSubmissionsData = async (campaignId) => {
  const { data } = await axiosInstance.get(endpoints.submission.v4.campaignOverview, {
    params: { campaignId },
  });
  return data;
};

/**
 * @param {string} campaignId
 * @returns {{
 *   submissions: object[],
 *   isPending: boolean,
 *   isError: boolean,
 *   error: unknown,
 *   mutateSubmissions: () => Promise<unknown>,
 * }}
 */
const useGetSubmissions = (campaignId) => {
  const queryClient = useQueryClient();
  const queryKey = ['submissions', campaignId];

  const { data, isPending, isError, error } = useQuery({
    queryKey,
    queryFn: () => getSubmissionsData(campaignId),
    enabled: !!campaignId,
    // The viewer remounts parts of itself per creator; without this each switch refetched the
    // whole list. Changes still land right away: own actions invalidate it (mutateSubmissions)
    // and other people's arrive over the socket (see CampaignCreatorSubmissions).
    staleTime: STALE_TIME_MS,
  });

  const mutateSubmissions = useCallback(
    () => queryClient.invalidateQueries({ queryKey }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, campaignId]
  );

  return {
    submissions: data?.submissions || [],
    isPending,
    isError,
    error,
    mutateSubmissions,
  };
};

export default useGetSubmissions;
