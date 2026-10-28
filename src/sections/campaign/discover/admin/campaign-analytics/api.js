import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import axiosInstance, { endpoints } from 'src/utils/axios';

import {
  featuredVideosKey,
  useFeaturedVideos,
} from 'src/sections/campaign/discover/client/overview/api';

/**
 * A star targets either a submission post ({ submissionId, postUrl }) or a manual entry
 * ({ manualEntryId }). postUrl must be the exact string the server stored.
 */
export const featuredKey = ({ submissionId, postUrl, manualEntryId }) =>
  manualEntryId ? `manual|${manualEntryId}` : `${submissionId}|${postUrl}`;

const requestBody = ({ submissionId, postUrl, manualEntryId, featured }) =>
  manualEntryId ? { manualEntryId, featured } : { submissionId, postUrl, featured };

export function useFeaturedVideoKeys(campaignId, { enabled = true } = {}) {
  const { data } = useFeaturedVideos(campaignId, { enabled });
  return useMemo(() => new Set((data || []).map(featuredKey)), [data]);
}

/** Stars or unstars one post. The star flips straight away and rolls back if the request fails. */
export function useSetFeaturedVideo(campaignId) {
  const queryClient = useQueryClient();
  const queryKey = featuredVideosKey(campaignId);

  return useMutation({
    mutationFn: (vars) =>
      axiosInstance
        .put(endpoints.campaign.featuredVideos(campaignId), requestBody(vars))
        .then((res) => res.data),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      const key = featuredKey(vars);
      queryClient.setQueryData(queryKey, (list = []) => {
        const rest = list.filter((v) => featuredKey(v) !== key);
        // Placeholder until the refetch brings the stats.
        return vars.featured ? [...rest, { id: key, ...requestBody(vars) }] : rest;
      });
      return { previous };
    },
    onError: (_error, _vars, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}
