import { useMemo } from 'react';

import { filterSubmissions } from '../../utils';
import useGetSubmissions from '../../hooks/use-get-submissions';
import { useCreatorSubmissionsStore } from '../../store/use-creator-submissions-store';

/**
 * The submission open in the viewer, for components deep in the panel. A plain lookup by id
 * (useViewerData regroups every creator, too heavy to call per comment), with the same rule:
 * null when the list filters hide it.
 */
export default function useViewerSubmission() {
  const campaignId = useCreatorSubmissionsStore((s) => s.campaignId);
  const submissionId = useCreatorSubmissionsStore((s) => s.viewerSubmissionId);
  const search = useCreatorSubmissionsStore((s) => s.search);
  const statusFilter = useCreatorSubmissionsStore((s) => s.statusFilter);
  const typeFilter = useCreatorSubmissionsStore((s) => s.typeFilter);

  // Same query as the card list, so react-query serves it from cache
  const { submissions } = useGetSubmissions(campaignId);

  return useMemo(() => {
    const submission = submissions?.find((item) => item.id === submissionId);
    if (!submission) return null;
    const isShown = filterSubmissions([submission], { search, statusFilter, typeFilter }).length;
    return isShown ? submission : null;
  }, [submissions, submissionId, search, statusFilter, typeFilter]);
}
