import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import axiosInstance, { endpoints } from 'src/utils/axios';

const getSubmissionsData = async (campaignId, userId) => {
  const params = new URLSearchParams();
  if (campaignId) params.append('campaignId', campaignId);
  if (userId) params.append('userId', userId);

  const { data } = await axiosInstance.get(`${endpoints.submission.v4.getSubmissions}?${params}`);
  return data;
};

/**
 * @param {string} campaignId
 * @param {string} [userId]
 * @returns {{
 *   submissions: object[],
 *   grouped: object,
 *   total: number,
 *   isPending: boolean,
 *   isError: boolean,
 *   error: unknown,
 *   mutateSubmissions: () => Promise<unknown>,
 * }}
 */
const useGetSubmissions = (campaignId, userId) => {
  const queryClient = useQueryClient();
  const queryKey = ['submissions', campaignId, userId];

  const { data, isPending, isError, error } = useQuery({
    queryKey,
    queryFn: () => getSubmissionsData(campaignId, userId),
    enabled: !!campaignId,
  });

  const mutateSubmissions = useCallback(
    () => queryClient.invalidateQueries({ queryKey }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, campaignId, userId]
  );

  return {
    submissions: data?.submissions || [],
    grouped: data?.grouped || {},
    total: data?.total || 0,
    isPending,
    isError,
    error,
    mutateSubmissions,
  };
};

export default useGetSubmissions;
