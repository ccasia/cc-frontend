import useSWR from 'swr';
import { useMemo } from 'react';

import axiosInstance from 'src/utils/axios';

const base = (campaignId) => `/api/campaign/${campaignId}/creator-notes`;

export const notesKeys = {
  summary: (campaignId) => `${base(campaignId)}/summary`,
  thread: (campaignId, creatorId) => `${base(campaignId)}/${creatorId}`,
};

const fetcher = (url) => axiosInstance.get(url).then((res) => res.data);

const swrOptions = { revalidateOnFocus: false };

export function useCreatorNoteSummaries(campaignId) {
  const { data, mutate } = useSWR(
    campaignId ? notesKeys.summary(campaignId) : null,
    fetcher,
    swrOptions
  );

  const byCreator = useMemo(() => new Map((data || []).map((s) => [s.creatorId, s])), [data]);

  return { byCreator, mutate };
}

export function useCreatorNoteThread(campaignId, creatorId) {
  const { data, error, isLoading, mutate } = useSWR(
    campaignId && creatorId ? notesKeys.thread(campaignId, creatorId) : null,
    fetcher,
    swrOptions
  );

  return { thread: data, error, isLoading, mutate };
}

export const postCreatorNote = (campaignId, creatorId, body) =>
  axiosInstance.post(notesKeys.thread(campaignId, creatorId), body).then((res) => res.data);

export const setCreatorNotePinned = (campaignId, creatorId, noteId, pinned) =>
  axiosInstance
    .patch(`${notesKeys.thread(campaignId, creatorId)}/notes/${noteId}/pin`, { pinned })
    .then((res) => res.data);

export const markCreatorNotesRead = (campaignId, creatorId) =>
  axiosInstance.post(`${notesKeys.thread(campaignId, creatorId)}/read`);

export const setCreatorNotesFollowing = (campaignId, creatorId, following) =>
  axiosInstance
    .put(`${notesKeys.thread(campaignId, creatorId)}/follow`, { following })
    .then((res) => res.data);
