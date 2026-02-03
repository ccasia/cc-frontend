import { useEffect } from 'react';

/**
 * Hook to listen for real-time pitch outreach status updates via Socket.io
 * Used by both admin and client views to sync outreach status changes
 */
export default function usePitchSocket({
  socket,
  campaignId,
  onOutreachUpdate,
  userId,
}) {
  useEffect(() => {
    if (!socket || !campaignId) {
      return undefined;
    }

    const handleOutreachUpdate = (data) => {
      // Skip if this user triggered the update (they already have the latest data)
      if (data.outreachUpdatedBy === userId) {
        return;
      }

      // Trigger data refresh
      if (data.campaignId === campaignId) {
        onOutreachUpdate?.(data);
      }
    };

    // Join the campaign room
    socket.emit('join-campaign', campaignId);

    // Listen for outreach status updates
    socket.on('v3:pitch:outreach-updated', handleOutreachUpdate);

    return () => {
      socket.off('v3:pitch:outreach-updated', handleOutreachUpdate);
      socket.emit('leave-campaign', campaignId);
    };
  }, [socket, campaignId, onOutreachUpdate, userId]);
}
