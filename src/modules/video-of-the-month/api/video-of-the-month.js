import useSWR from 'swr';
import { useMemo } from 'react';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// Currently curated videos (admin table).
export const useGetVideosOfTheMonth = () => {
  const { data, isLoading, error, mutate } = useSWR(endpoints.videoOfTheMonth.list, fetcher, {
    revalidateOnFocus: false,
  });

  return useMemo(
    () => ({
      videos: data ?? [],
      isLoading,
      error,
      mutate,
    }),
    [data, isLoading, error, mutate]
  );
};

// Submissions a CS user can feature (those with a non-empty videos[]).
// `search` matches campaign or creator name server-side.
export const useSearchFeaturableSubmissions = (search) => {
  const url = search
    ? `${endpoints.videoOfTheMonth.submissions}?search=${encodeURIComponent(search)}`
    : endpoints.videoOfTheMonth.submissions;

  const { data, isLoading, error } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });

  return useMemo(
    () => ({
      submissions: data ?? [],
      isLoading,
      error,
    }),
    [data, isLoading, error]
  );
};

export const featureVideo = async ({ submissionId, videoIndex, order }) => {
  const res = await axiosInstance.post(endpoints.videoOfTheMonth.create, {
    submissionId,
    videoIndex,
    order,
  });
  return res.data;
};

export const updateFeaturedVideo = async (id, payload) => {
  const res = await axiosInstance.patch(endpoints.videoOfTheMonth.update(id), payload);
  return res.data;
};

export const removeFeaturedVideo = async (id) => {
  const res = await axiosInstance.delete(endpoints.videoOfTheMonth.delete(id));
  return res.data;
};
