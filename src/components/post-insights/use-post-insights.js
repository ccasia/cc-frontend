import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import axiosInstance from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';

const baseKey = (campaignId) => ['post-insights', campaignId];

// Screenshots can change the post's analytics numbers, so the analytics rows reload too.
const reloadPostData = (queryClient, campaignId) =>
  Promise.all(
    [baseKey(campaignId), ['socialInsightSnapshots', campaignId], ['postScrapes', campaignId]].map(
      (queryKey) => queryClient.invalidateQueries({ queryKey })
    )
  );

export const postInsightsKey = (submissionId, postUrl) => `${submissionId}::${postUrl}`;

/**
 * Reloads when someone else adds or removes screenshots on this campaign. Admins get the event
 * through the campaign room the analytics page joins, creators through their own user room.
 */
function usePostInsightsLiveUpdates(campaignId, { submissionId, enabled }) {
  const { socket } = useSocketContext() ?? {};
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !campaignId || !enabled) return undefined;

    const handleUpdated = (data) => {
      if (data?.campaignId !== campaignId) return;
      if (submissionId && data.submissionId !== submissionId) return;
      // The person who made the change already reloads after their own request.
      if (data.actorId && data.actorId === user?.id) return;
      reloadPostData(queryClient, campaignId);
    };

    socket.on('post-insights:updated', handleUpdated);
    return () => socket.off('post-insights:updated', handleUpdated);
  }, [socket, campaignId, submissionId, enabled, user?.id, queryClient]);
}

// Pass submissionId to load one submission (creators). Leave it out to load the whole campaign (admins).
export function usePostInsights(campaignId, { submissionId, enabled = true } = {}) {
  const query = useQuery({
    queryKey: [...baseKey(campaignId), submissionId ?? 'all'],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/campaign/${campaignId}/post-insights`, {
        params: submissionId ? { submissionId } : undefined,
      });
      return res.data;
    },
    enabled: !!campaignId && enabled,
  });

  usePostInsightsLiveUpdates(campaignId, { submissionId, enabled });

  const byPost = new Map(
    (query.data ?? []).map((row) => [postInsightsKey(row.submissionId, row.postUrl), row])
  );
  return { ...query, byPost };
}

// Adds screenshots to the post. The server re-reads the values from all of them.
export function useAddPostInsightScreenshots(campaignId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ submissionId, postUrl, files }) => {
      const formData = new FormData();
      formData.append('submissionId', submissionId);
      formData.append('postUrl', postUrl);
      files.forEach((file) => formData.append('screenshots', file));
      const res = await axiosInstance.put(`/api/campaign/${campaignId}/post-insights`, formData);
      return res.data;
    },
    onSuccess: () => reloadPostData(queryClient, campaignId),
  });
}

export function useRemovePostInsightScreenshot(campaignId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, url }) =>
      axiosInstance.delete(`/api/campaign/${campaignId}/post-insights/${id}/screenshots`, {
        data: { url },
      }),
    onSuccess: () => reloadPostData(queryClient, campaignId),
  });
}

// An admin uses the lower screenshot numbers (approve: true) or keeps the current ones.
export function useReviewPostInsightMetrics(campaignId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, approve }) => {
      const res = await axiosInstance.post(
        `/api/campaign/${campaignId}/post-insights/${id}/metrics-review`,
        { approve }
      );
      return res.data;
    },
    onSuccess: () => reloadPostData(queryClient, campaignId),
  });
}
