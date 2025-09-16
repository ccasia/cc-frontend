/* eslint-disable */
import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'src/routes/hooks';
import Stack from '@mui/material/Stack';
import PropTypes from 'prop-types';
import { Box, Divider, Typography } from '@mui/material';
import ChatHeaderCompose from '../chat-header-compose';
import ChatMessageInput from '../chat-message-input';
import ChatMessageList from '../chat-message-list';
import useSocketContext from 'src/socket/hooks/useSocketContext';
import { useAuthContext } from 'src/auth/hooks';
import {
  markMessagesAsSeen,
  useTotalUnreadCount,
  useGetAllThreads,
  sendMessageInThread,
} from 'src/api/chat';
import { useResponsive } from 'src/hooks/use-responsive';

const ThreadMessages = ({ threadId, isClient }) => {
  const { socket } = useSocketContext();
  const [latestMessages, setLatestMessages] = useState({});
  const [threadMessages, setThreadMessages] = useState({});
  const [optimisticMessages, setOptimisticMessages] = useState({});
  const { user } = useAuthContext();
  const { triggerRefetch } = useTotalUnreadCount();
  const { threads, threadrefetch } = useGetAllThreads();
  const [campaignStatus, setCampaignStatus] = useState(null);
  const smDown = useResponsive('down', 'sm');

  useEffect(() => {
    // Listen for existing messages
    socket?.on('existingMessages', ({ threadId, oldMessages }) => {
      setThreadMessages((prevThreadMessages) => ({
        ...prevThreadMessages,
        [threadId]: oldMessages,
      }));
    });

    // Join the room
    socket?.emit('room', threadId);

    // Listen for incoming messages
    socket?.on('message', (message) => {
      setThreadMessages((prevThreadMessages) => {
        const { threadId: messageThreadId } = message;
        const currentMessages = prevThreadMessages[messageThreadId] || [];

        // Check if message already exists (avoid duplicates)
        const messageExists = currentMessages.some((msg) => {
          // Check by ID first (most reliable)
          if (msg.id && message.id && msg.id === message.id) {
            return true;
          }

          // Check by content, sender, and time proximity for messages without ID
          const contentMatch = msg.content === message.content;
          const senderMatch = msg.senderId === message.senderId;
          const timeMatch =
            Math.abs(new Date(msg.createdAt).getTime() - new Date(message.createdAt).getTime()) <
            3000; // 3 second window

          return contentMatch && senderMatch && timeMatch;
        });

        if (messageExists) {
          return prevThreadMessages;
        }

        return {
          ...prevThreadMessages,
          [messageThreadId]: [...currentMessages, message],
        };
      });

      // Remove optimistic message if it exists (when real message arrives)
      if (message.senderId === user.id) {
        setOptimisticMessages((prev) => {
          const threadOptimistic = prev[message.threadId] || [];
          const filtered = threadOptimistic.filter((opt) => {
            // More sophisticated matching for optimistic messages
            const contentMatch = opt.content === message.content;
            const timeMatch =
              Math.abs(new Date(opt.createdAt).getTime() - new Date(message.createdAt).getTime()) <
              10000; // 10 second window
            const senderMatch = opt.senderId === message.senderId;

            return !(contentMatch && senderMatch && timeMatch);
          });

          return {
            ...prev,
            [message.threadId]: filtered,
          };
        });
      }

      if (message.threadId === threadId) {
        markAsSeen();
      }
    });

    const markAsSeen = async () => {
      try {
        await markMessagesAsSeen(threadId);
        triggerRefetch();
      } catch (error) {
        console.error('Failed to mark messages as seen:', error);
      }
    };

    markAsSeen();

    const thread = threads?.find((t) => t.id === threadId);
    if (thread && thread.campaign) {
      setCampaignStatus(thread.campaign.status);
    }

    // Cleanup on component unmount
    return () => {
      socket?.off('message');
      socket?.off('existingMessages');
    };
  }, [socket, threadId, user.id]);

  const generateOptimisticId = () => `optimistic-${Date.now()}-${Math.random()}`;

  const createOptimisticMessage = (messageData, attachments = []) => {
    const { id: senderId, role, name, photoURL } = user;
    const isLegacyFormat = typeof messageData === 'string';
    const content = isLegacyFormat ? messageData : messageData.content;

    const optimisticMessage = {
      id: generateOptimisticId(),
      content,
      senderId,
      threadId,
      createdAt: new Date().toISOString(),
      sender: { role, name, photoURL },
      isOptimistic: true,
    };

    // Add file preview for attachments
    if (attachments.length > 0) {
      const firstAttachment = attachments[0];
      optimisticMessage.file = firstAttachment.preview || URL.createObjectURL(firstAttachment.file);
      optimisticMessage.fileType = firstAttachment.type;
      optimisticMessage.isOptimisticFile = true; // Flag to identify optimistic file
    }

    return optimisticMessage;
  };

  const handleSendMessage = useCallback(
    async (messageData) => {
      const { id: senderId, role, name, photoURL } = user;
      const createdAt = new Date().toISOString();

      // Handle both old format (string) and new format (object with content and attachments)
      const isLegacyFormat = typeof messageData === 'string';
      const content = isLegacyFormat ? messageData : messageData.content;
      const attachments = isLegacyFormat ? [] : messageData.attachments || [];

      // Create optimistic message for instant UI update
      const optimisticMessage = createOptimisticMessage(messageData, attachments);

      // Add optimistic message immediately
      setOptimisticMessages((prev) => ({
        ...prev,
        [threadId]: [...(prev[threadId] || []), optimisticMessage],
      }));

      try {
        if (attachments.length > 0) {
          // For media messages, send via API but show optimistic update
          await sendMessageInThread(threadId, messageData);

          // Remove optimistic message after a short delay to allow real message to arrive
          setTimeout(() => {
            setOptimisticMessages((prev) => ({
              ...prev,
              [threadId]: (prev[threadId] || []).filter((msg) => msg.id !== optimisticMessage.id),
            }));
          }, 2000); // 2 second delay

          threadrefetch();
        } else {
          // For text-only messages, use socket for real-time communication
          socket?.emit('sendMessage', {
            senderId,
            threadId,
            content,
            role,
            name,
            photoURL,
            createdAt,
          });
          threadrefetch();
        }
      } catch (error) {
        console.error('Failed to send message:', error);

        // Remove optimistic message on error
        setOptimisticMessages((prev) => ({
          ...prev,
          [threadId]: (prev[threadId] || []).filter((msg) => msg.id !== optimisticMessage.id),
        }));
      }
    },
    [socket, threadId, user, threadrefetch]
  );

  // Combine real messages with optimistic messages
  const realMessages = threadMessages[threadId] || [];
  const optimisticMessagesForThread = optimisticMessages[threadId] || [];
  const allMessages = [...realMessages, ...optimisticMessagesForThread].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const thread = threads?.find((t) => t.id === threadId);
  const isGroup = thread?.isGroup;

  return (
    <Stack
      sx={{
        width: 1,
        height: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <ChatHeaderCompose currentUserId={user.id} threadId={threadId} isClient={isClient} />

      <Divider sx={{ width: '97%', mx: 'auto' }} />

      <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <ChatMessageList messages={allMessages} />
      </Box>

      {isGroup && campaignStatus === 'COMPLETED' ? (
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{
            fontFamily: (theme) => theme.typography.fontPrimaryFamily,
            letterSpacing: 2,
            padding: '20px',
            fontSize: '12px',
          }}
        >
          The campaign has ended.
        </Typography>
      ) : (
        <Box
          sx={
            smDown && {
              position: !isClient && 'fixed',
              bottom: 10,
              width: 1,
              px: !isClient && 1,
              zIndex: 111,
              // bgcolor: '#FFF',
              left: 0,
            }
          }
        >
          <Box
            sx={
              smDown && {
                px: 2,
                border: 1,
                borderRadius: 2,
                borderColor: '#E7E7E7',
                boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
              }
            }
          >
            <ChatMessageInput threadId={threadId} onSendMessage={handleSendMessage} />
          </Box>
        </Box>
      )}
    </Stack>
  );
};

ThreadMessages.propTypes = {
  threadId: PropTypes.string.isRequired,
  isClient: PropTypes.bool,
};

export default ThreadMessages;
