import { useEffect } from 'react';
import { enqueueSnackbar } from 'notistack';

export default function useSubmissionSocket({
  socket,
  submission,
  campaign,
  onUpdate,
  localActionInProgress,
  userId,
  hasPhotos = false,
  hasRawFootage = false
}) {
  useEffect(() => {
    if (!socket || !campaign?.id) {
      return undefined;
    }

    const handleSubmissionUpdate = (data) => {
      if (data.submissionId === submission.id) {
        const isOwnAction = data.userId === userId;
        const shouldBlock = localActionInProgress || isOwnAction;

        if (!shouldBlock) {
          setTimeout(() => {
            onUpdate?.(true);
          }, 100);
        }

        const actionMessages = {
          'approve': 'Submission approved',
          'reject': 'Submission rejected',
          'request_revision': 'Changes requested',
          'posting_link_approve': 'Posting link approved',
          'posting_link_reject': 'Posting link rejected'
        };

        const message = actionMessages[data.action] || 'Submission updated';
        if (data.byClient) {
          enqueueSnackbar(`${message} by client`, { variant: 'info' });
        } else {
          enqueueSnackbar(message, { variant: 'info' });
        }
      }
    };

    const handleContentSubmitted = (data) => {
      if (data.submissionId === submission.id) {
        if (data.hasVideo) {
          onUpdate?.();
          enqueueSnackbar('New video draft submitted', { variant: 'info' });
        } else if ((hasPhotos && data.hasPhotos) || (hasRawFootage && data.hasRawFootage)) {
          onUpdate?.();
          const contentType = hasPhotos ? 'photos' : 'raw footage';
          enqueueSnackbar(`New ${contentType} submitted`, { variant: 'info' });
        }
      }
    };

    const handlePostingUpdated = (data) => {
      if (data.submissionId === submission.id) {
        if (!localActionInProgress) {
          setTimeout(() => {
            onUpdate?.(true);
          }, 100);
          enqueueSnackbar('Posting link updated', { variant: 'info' });
        }
      }
    };

    const handleContentProcessed = (data) => {
      if (data.submissionId === submission.id) {
        onUpdate?.(undefined, { revalidate: true });
        if (data.hasRawFootage) {
          enqueueSnackbar('Raw footage is now ready for review', { variant: 'success' });
        } else if (data.hasVideo) {
          enqueueSnackbar('Video is now ready for review', { variant: 'success' });
        } else if (data.hasPhotos) {
          enqueueSnackbar('Photos are now ready for review', { variant: 'success' });
        }
      }
    };

    socket.emit('join-campaign', campaign.id);

    socket.on('v4:submission:updated', handleSubmissionUpdate);
    socket.on('v4:content:submitted', handleContentSubmitted);
    socket.on('v4:posting:updated', handlePostingUpdated);
    socket.on('v4:content:processed', handleContentProcessed);

    return () => {
      socket.off('v4:submission:updated', handleSubmissionUpdate);
      socket.off('v4:content:submitted', handleContentSubmitted);
      socket.off('v4:posting:updated', handlePostingUpdated);
      socket.off('v4:content:processed', handleContentProcessed);
      socket.emit('leave-campaign', campaign.id);
    };
  }, [socket, submission?.id, campaign?.id, onUpdate, localActionInProgress, userId, hasPhotos, hasRawFootage]);
}
