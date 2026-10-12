import { useSWRConfig } from 'swr';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import useSocketContext from 'src/socket/hooks/useSocketContext';

import { notesKeys, markCreatorNotesRead, useCreatorNoteSummaries } from './api';

export default function useCreatorNotes({ campaignId, enabled }) {
  const { socket } = useSocketContext();
  const { mutate } = useSWRConfig();
  const activeCampaignId = enabled ? campaignId : null;
  const { byCreator, mutate: mutateSummary } = useCreatorNoteSummaries(activeCampaignId);

  const [openCreatorId, setOpenCreatorId] = useState(null);
  const openCreatorRef = useRef(null);
  openCreatorRef.current = openCreatorId;

  const markRead = useCallback(
    async (creatorId) => {
      // Clear the badge right away instead of waiting for the round trip.
      mutateSummary(
        (list) => list?.map((s) => (s.creatorId === creatorId ? { ...s, unreadCount: 0 } : s)),
        { revalidate: false }
      );
      try {
        await markCreatorNotesRead(campaignId, creatorId);
      } catch {
        mutateSummary();
      }
    },
    [campaignId, mutateSummary]
  );

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
      mutate(notesKeys.thread(activeCampaignId, creatorId));
      // Mark read before refetching, or the open thread would come back unread.
      if (openCreatorRef.current === creatorId) await markRead(creatorId);
      mutateSummary();
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
  }, [socket, activeCampaignId, mutate, mutateSummary, markRead]);

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
    refreshSummary: mutateSummary,
  };
}
