import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import axiosInstance from 'src/utils/axios';

const base = (campaignId) => `/api/campaign/${campaignId}/creator-notes`;

export const creatorNoteKeys = {
  all: (campaignId) => ['creatorNotes', campaignId],
  summary: (campaignId) => ['creatorNotes', campaignId, 'summary'],
  thread: (campaignId, creatorId) => ['creatorNotes', campaignId, 'thread', creatorId],
};

const get = (url) => axiosInstance.get(url).then((res) => res.data);

export function useCreatorNoteSummaries(campaignId) {
  const { data } = useQuery({
    queryKey: creatorNoteKeys.summary(campaignId),
    queryFn: () => get(`${base(campaignId)}/summary`),
    enabled: !!campaignId,
  });

  return useMemo(() => new Map((data || []).map((s) => [s.creatorId, s])), [data]);
}

export function useCreatorNoteThread(campaignId, creatorId) {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: creatorNoteKeys.thread(campaignId, creatorId),
    queryFn: () => get(`${base(campaignId)}/${creatorId}`),
    enabled: !!campaignId && !!creatorId,
  });

  return { thread: data, error, isLoading, refetch };
}

// Posting or pinning changes both the thread and the row summary, so refetch everything for the campaign.
const useInvalidateCampaignNotes = (campaignId) => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: creatorNoteKeys.all(campaignId) });
};

export function usePostCreatorNote(campaignId, creatorId) {
  const invalidate = useInvalidateCampaignNotes(campaignId);

  return useMutation({
    mutationFn: (body) =>
      axiosInstance.post(`${base(campaignId)}/${creatorId}`, body).then((res) => res.data),
    onSuccess: invalidate,
  });
}

export function useSetCreatorNotePinned(campaignId, creatorId) {
  const invalidate = useInvalidateCampaignNotes(campaignId);

  return useMutation({
    mutationFn: ({ noteId, pinned }) =>
      axiosInstance
        .patch(`${base(campaignId)}/${creatorId}/notes/${noteId}/pin`, { pinned })
        .then((res) => res.data),
    onSuccess: invalidate,
  });
}

export function useSetCreatorNotesFollowing(campaignId, creatorId) {
  const queryClient = useQueryClient();
  const key = creatorNoteKeys.thread(campaignId, creatorId);

  return useMutation({
    mutationFn: (following) =>
      axiosInstance
        .put(`${base(campaignId)}/${creatorId}/follow`, { following })
        .then((res) => res.data),
    onMutate: async (following) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData(key, (current) => current && { ...current, following });
      return { previous };
    },
    onError: (_error, _following, context) => queryClient.setQueryData(key, context?.previous),
  });
}

export function useMarkCreatorNotesRead(campaignId) {
  const queryClient = useQueryClient();
  const key = creatorNoteKeys.summary(campaignId);

  return useMutation({
    mutationFn: (creatorId) => axiosInstance.post(`${base(campaignId)}/${creatorId}/read`),
    // Clear the badge right away instead of waiting for the round trip.
    onMutate: async (creatorId) => {
      await queryClient.cancelQueries({ queryKey: key });
      queryClient.setQueryData(key, (list) =>
        list?.map((s) => (s.creatorId === creatorId ? { ...s, unreadCount: 0 } : s))
      );
    },
    onError: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}
