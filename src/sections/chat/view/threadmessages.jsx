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
import { markMessagesAsSeen, useTotalUnreadCount, useGetAllThreads } from 'src/api/chat';
import { useResponsive } from 'src/hooks/use-responsive';

const ThreadMessages = ({ threadId }) => {
  const { socket } = useSocketContext();
  const [latestMessages, setLatestMessages] = useState({});
  const [threadMessages, setThreadMessages] = useState({});
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
        return {
          ...prevThreadMessages,
          [messageThreadId]: [...(prevThreadMessages[messageThreadId] || []), message],
        };
      });
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
  }, [socket, threadId]);

  const handleSendMessage = useCallback(
    (content) => {
      const { id: senderId, role, name, photoURL } = user;
      const createdAt = new Date().toISOString();
      threadrefetch;
      socket?.emit('sendMessage', { senderId, threadId, content, role, name, photoURL, createdAt });
    },
    [socket, threadId, user, threadrefetch]
  );

  const messages = threadMessages[threadId] || [];
  const thread = threads?.find((t) => t.id === threadId);
  const isGroup = thread?.isGroup;

  return (
    <Stack sx={{ width: 1, height: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <ChatHeaderCompose currentUserId={user.id} threadId={threadId} />

      <Divider sx={{ width: '97%', mx: 'auto' }} />

      <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <ChatMessageList messages={messages} />
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
              position: 'fixed',
              bottom: 10,
              width: 1,
              px: 1,
              zIndex: 111,
              bgcolor: '#FFF',
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
};

export default ThreadMessages;
