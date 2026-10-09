import useSWR from 'swr';

import { fetcher } from 'src/utils/axios';

// Shared key, so saving a caption can refresh the history (and the "edited" tag) right away
export const captionHistoryKey = (submissionId) =>
  submissionId ? `/api/submissions/v4/${submissionId}/caption-history` : null;

// Every saved version of a submission's caption (creator + admin edits), newest first
export default function useCaptionHistory(submissionId) {
  const { data, isLoading } = useSWR(captionHistoryKey(submissionId), fetcher, {
    revalidateOnFocus: false,
  });

  return { captionHistory: data?.history || [], captionHistoryLoading: isLoading };
}

// The admin edit behind the current caption, if an admin changed what the creator wrote
export const getAdminCaptionEdit = (captionHistory, caption) => {
  const latest = captionHistory[0];
  if (latest?.authorType !== 'admin') return null;
  return (latest.caption || '').trim() === (caption || '').trim() ? latest : null;
};
