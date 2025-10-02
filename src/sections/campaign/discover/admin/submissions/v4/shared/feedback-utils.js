/*
 * Helper function to determine visibility and permissions for feedback actions
 *
 * VISIBILITY RULES:
 * 1. Admins see feedback actions when submission is PENDING_REVIEW or CLIENT_FEEDBACK
 * 2. Clients see feedback actions when submission is SENT_TO_CLIENT
 * 3. Request Change button: visible when content is visible AND not in client feedback
 * 4. Approve button: visible when NOT in client feedback AND NOT in request mode
 * 5. Admin-only actions: only admins see client feedback response buttons
 */
export function getFeedbackActionsVisibility({
  isClient,
  submission,
  clientVisible,
  isClientFeedback,
  action
}) {
  const showFeedbackActions =
    (!isClient && (submission.status === 'PENDING_REVIEW' || submission.status === 'CLIENT_FEEDBACK')) ||
    (isClient && submission.status === 'SENT_TO_CLIENT');

  const showRequestChangeButton = clientVisible && !isClientFeedback && action !== 'request_revision';

  const showChangeRequestForm = action === 'request_revision' && clientVisible;

  const showApproveButton = !isClientFeedback && action !== 'request_revision';

  const showAdminClientFeedbackActions = !isClient && isClientFeedback && action !== 'request_revision';

  const showReasonsDropdown = action === 'request_revision' || action === 'request_changes';

  return {
    showFeedbackActions,
    showRequestChangeButton,
    showChangeRequestForm,
    showApproveButton,
    showAdminClientFeedbackActions,
    showReasonsDropdown
  };
}

export function getDefaultFeedback(isClientFeedback, submission, mediaKey = 'video') {
  if (isClientFeedback) {
    const requestFeedbacks = submission.feedback?.filter(fb => fb.type === 'REQUEST') || [];
    const latestRequestFeedback = requestFeedbacks[0];
    return latestRequestFeedback?.content || submission[mediaKey]?.[0]?.feedback || '';
  }
  return '';
}

export function getInitialReasons(isClientFeedback, submission) {
  if (isClientFeedback && submission.feedback && submission.feedback.length > 0) {
    const clientRequestFeedbacks = submission.feedback.filter(fb =>
      fb.admin?.role === 'client' && fb.type === 'REQUEST'
    );
    const latestClientFeedback = clientRequestFeedbacks[0];
    return latestClientFeedback?.reasons || [];
  }
  return [];
}
