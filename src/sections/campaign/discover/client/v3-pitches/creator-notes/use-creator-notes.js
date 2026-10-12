import { useQueryClient } from '@tanstack/react-query';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import useSocketContext from 'src/socket/hooks/useSocketContext';

import { creatorNoteKeys, useCreatorNoteSummaries, useMarkCreatorNotesRead } from './api';

export default function useCreatorNotes({ campaignId, enabled }) {
  const { socket } = useSocketContext();
  const queryClient = useQueryClient();
  const activeCampaignId = enabled ? campaignId : null;
  const byCreator = useCreatorNoteSummaries(activeCampaignId);
  const { mutate: markRead, mutateAsync: markReadAsync } =
    useMarkCreatorNotesRead(activeCampaignId);

  const [openCreatorId, setOpenCreatorId] = useState(null);
  const openCreatorRef = useRef(null);
  openCreatorRef.current = openCreatorId;

  const openNotes = useCallback(
    (creatorId) => {
      setOpenCreatorId(creatorId);
      markRead(creatorId);
    },
    [markRead]
  );

  const closeNotes = useCallback(() => setOpenCreatorId(null), []);

  useEffect(() => {
    if (!socket || !activeCampaignId) return undefined;

    // Admin-only room; the server checks campaign access before letting us in.
    const join = () => socket.emit('join-campaign-notes', activeCampaignId);

    const sync = async ({ campaignId: eventCampaignId, creatorId }) => {
      if (eventCampaignId !== activeCampaignId) return;
      queryClient.invalidateQueries({
        queryKey: creatorNoteKeys.thread(activeCampaignId, creatorId),
      });
      // Mark read before refetching, or the open thread would come back unread.
      if (openCreatorRef.current === creatorId) {
        await markReadAsync(creatorId).catch(() => {});
      }
      queryClient.invalidateQueries({ queryKey: creatorNoteKeys.summary(activeCampaignId) });
    };

    join();
    // Rooms do not survive a reconnect.
    socket.on('connect', join);
    socket.on('creator-note:created', sync);
    socket.on('creator-note:pin-updated', sync);

    return () => {
      socket.off('connect', join);
      socket.off('creator-note:created', sync);
      socket.off('creator-note:pin-updated', sync);
      socket.emit('leave-campaign-notes', activeCampaignId);
    };
  }, [socket, activeCampaignId, queryClient, markReadAsync]);

  const unreadTotal = useMemo(
    () => [...byCreator.values()].reduce((sum, s) => sum + (s.unreadCount || 0), 0),
    [byCreator]
  );

  return {
    enabled: Boolean(activeCampaignId),
    byCreator,
    unreadTotal,
    openCreatorId,
    openNotes,
    closeNotes,
  };
}
