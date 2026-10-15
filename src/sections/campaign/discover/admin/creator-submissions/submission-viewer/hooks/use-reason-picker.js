import {
  options_changes,
  posting_link_options_changes,
} from 'src/sections/campaign/discover/admin/submissions/v4/constants';

import { getClientReasons } from '../utils';
import useViewerSubmission from './use-viewer-submission';
import {
  setFeedbackReasons,
  setLinkChangeReasons,
  useCreatorSubmissionsStore,
} from '../../store/use-creator-submissions-store';

/**
 * The two reason pickers and where each keeps its state:
 * - 'link':    sending a posted link back (APPROVE_LINK)
 * - 'creator': sending photos / raw footage back; starts from the client's reasons in a
 *              client feedback round until the admin changes them
 */
export default function useReasonPicker(kind) {
  const submission = useViewerSubmission();
  const linkReasons = useCreatorSubmissionsStore((s) => s.linkChangeReasons);
  const linkError = useCreatorSubmissionsStore((s) => s.linkChangeError);
  const feedbackReasons = useCreatorSubmissionsStore((s) => s.feedbackReasons);
  const feedbackError = useCreatorSubmissionsStore((s) => s.feedbackError);

  if (kind === 'link') {
    return {
      label: "What's wrong with the link?",
      options: posting_link_options_changes,
      selected: linkReasons,
      onChange: setLinkChangeReasons,
      error: linkError ? 'Pick at least one reason.' : '',
    };
  }

  const firstName = submission?.user?.name?.split(' ')[0] || 'the creator';
  return {
    label: 'Reasons for changes',
    options: options_changes,
    selected: feedbackReasons ?? getClientReasons(submission),
    onChange: setFeedbackReasons,
    error: feedbackError ? `Pick at least one reason so ${firstName} knows what to change.` : '',
  };
}
