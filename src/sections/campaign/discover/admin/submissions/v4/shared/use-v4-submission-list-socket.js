import { useEffect } from 'react';

// Lightweight socket hook for accordion-level submission status updates
// Listens for content, submission, and posting events and triggers SWR
// revalidation so status pills update in real-time without requiring
// the accordion to be expanded.
export default function useV4SubmissionListSocket({
  socket,
  campaignId,
  creatorUserId,
  onUpdate,
  userId,
}) {
  useEffect(() => {
    if (!socket || !campaignId) return undefined;

    const handleContentProcessed = (data) => {
      if (data.campaignId !== campaignId) return;
      if (data.creatorId === userId) return;
      if (creatorUserId && data.creatorId !== creatorUserId) return;
      onUpdate?.();
    };

    const handleContentSubmitted = (data) => {
      if (data.campaignId !== campaignId) return;
      if (data.creatorId === userId) return;
      if (creatorUserId && data.creatorId !== creatorUserId) return;
      onUpdate?.();
    };

    const handleSubmissionUpdated = (data) => {
      if (data.campaignId !== campaignId) return;
      onUpdate?.();
    };

    const handlePostingUpdated = (data) => {
      if (data.campaignId !== campaignId) return;
      if (data.creatorId === userId) return;
      if (creatorUserId && data.creatorId !== creatorUserId) return;
      onUpdate?.();
    };

    socket.emit('join-campaign', campaignId);

    socket.on('v4:content:processed', handleContentProcessed);
    socket.on('v4:content:submitted', handleContentSubmitted);
    socket.on('v4:submission:updated', handleSubmissionUpdated);
    socket.on('v4:posting:updated', handlePostingUpdated);

    return () => {
      socket.off('v4:content:processed', handleContentProcessed);
      socket.off('v4:content:submitted', handleContentSubmitted);
      socket.off('v4:submission:updated', handleSubmissionUpdated);
      socket.off('v4:posting:updated', handlePostingUpdated);
      socket.emit('leave-campaign', campaignId);
    };
  }, [socket, campaignId, creatorUserId, onUpdate, userId]);
}
