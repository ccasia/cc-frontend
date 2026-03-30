import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const useSubmissionComments = (submissionId, videoId) => {
  const url = submissionId
    ? `${endpoints.submission.v4.comments(submissionId)}${videoId ? `?videoId=${videoId}` : ''}`
    : null;

  const { data, isLoading, error, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
  });

  return useMemo(
    () => ({
      comments: data || [],
      commentsLoading: isLoading,
      commentsError: error,
      commentsMutate: mutate,
    }),
    [data, isLoading, error, mutate]
  );
};
