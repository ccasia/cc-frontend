import { useEffect } from 'react';

/**
 * Hook to listen for real-time pitch updates via Socket.io
 * Used by both admin and client views to sync outreach and pitch status changes
 */
export default function usePitchSocket({
  socket,
  campaignId,
  onOutreachUpdate,
  onPitchStatusUpdate,
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

    const handlePitchStatusUpdate = (data) => {
      // Skip if this user triggered the update (they already have the latest data)
      if (data.updatedBy === userId) {
        return;
      }

      // Trigger data refresh
      if (data.campaignId === campaignId) {
        onPitchStatusUpdate?.(data);
      }
    };

    // Join the campaign room
    socket.emit('join-campaign', campaignId);

    // Listen for outreach status updates
    socket.on('v3:pitch:outreach-updated', handleOutreachUpdate);

    // Listen for pitch status updates (approve, reject, withdraw, shortlist, etc.)
    socket.on('v3:pitch:status-updated', handlePitchStatusUpdate);

    return () => {
      socket.off('v3:pitch:outreach-updated', handleOutreachUpdate);
      socket.off('v3:pitch:status-updated', handlePitchStatusUpdate);
      socket.emit('leave-campaign', campaignId);
    };
  }, [socket, campaignId, onOutreachUpdate, onPitchStatusUpdate, userId]);
}
