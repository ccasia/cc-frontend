import { useMemo } from 'react';

import { needsAction, getViewerCreators } from '../utils';
import useGetSubmissions from '../../hooks/use-get-submissions';
import { useCreatorSubmissionsStore } from '../../store/use-creator-submissions-store';

export default function useViewerData() {
  const campaignId = useCreatorSubmissionsStore((s) => s.campaignId);
  const userId = useCreatorSubmissionsStore((s) => s.viewerUserId);
  const submissionId = useCreatorSubmissionsStore((s) => s.viewerSubmissionId);
  const search = useCreatorSubmissionsStore((s) => s.search);
  const statusFilter = useCreatorSubmissionsStore((s) => s.statusFilter);
  const typeFilter = useCreatorSubmissionsStore((s) => s.typeFilter);

  // Same query as the card list, so react-query serves it from cache
  const { submissions, isPending, mutateSubmissions } = useGetSubmissions(campaignId);

  return useMemo(() => {
    const creators = getViewerCreators(submissions, { search, statusFilter, typeFilter });
    const creatorIndex = creators.findIndex((c) => c.user.id === userId);
    const creator = creators[creatorIndex] ?? null;
    const submissionIndex = creator
      ? creator.submissions.findIndex((s) => s.id === submissionId)
      : -1;
    const pendingTotal = creators.reduce(
      (sum, c) => sum + c.submissions.filter((s) => needsAction(s.status)).length,
      0
    );

    return {
      creators,
      creatorIndex,
      creator,
      submissionIndex,
      submission: creator?.submissions[submissionIndex] ?? null,
      pendingTotal,
      isPending,
      mutateSubmissions,
    };
  }, [
    submissions,
    search,
    statusFilter,
    typeFilter,
    userId,
    submissionId,
    isPending,
    mutateSubmissions,
  ]);
}
