import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

// includeDeleted: also return deleted comments, blanked, so a thread can show
// "Message deleted" in their place (they're left out otherwise)
export const useSubmissionComments = (submissionId, videoId, { includeDeleted = false } = {}) => {
  const params = new URLSearchParams();
  if (videoId) params.set('videoId', videoId);
  if (includeDeleted) params.set('includeDeleted', '1');
  const query = params.toString();

  const url = submissionId
    ? `${endpoints.submission.v4.comments(submissionId)}${query ? `?${query}` : ''}`
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
