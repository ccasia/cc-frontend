/* eslint-disable */
import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'src/routes/hooks';
import Stack from '@mui/material/Stack';
import PropTypes from 'prop-types';
import { Typography } from '@mui/material';
import ChatHeaderCompose from '../chat-header-compose';
import ChatMessageInput from '../chat-message-input';
import ChatMessageList from '../chat-message-list';
import useSocketContext from 'src/socket/hooks/useSocketContext';
import { useAuthContext } from 'src/auth/hooks';
import { useSearchParams } from 'src/routes/hooks';
import { markMessagesAsSeen, useTotalUnreadCount, useGetAllThreads } from 'src/api/chat';

const ThreadMessages = ({ threadId }) => {
  const { socket } = useSocketContext();
  // const [message, setMessage] = useState([]);
  const searchParams = useSearchParams();
  const selectedConversationId = searchParams.get('id') || '';
  const { id } = useParams();
  const [latestMessages, setLatestMessages] = useState({});
  const [threadMessages, setThreadMessages] = useState({});
  const { user } = useAuthContext();
  const { triggerRefetch } = useTotalUnreadCount();
  const { threads, threadrefetch } = useGetAllThreads();
  const [campaignStatus, setCampaignStatus] = useState(null);
  // const { message, loading, error } = useGetMessagesFromThread(threadId);

  
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
    console.log("Threasds stt", thread)
    // Cleanup on component unmount
    return () => {
      socket?.off('message');
      socket?.off('existingMessages');
      //  socket?.off('latestMessage');
      // socket?.off('room');
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
    <Stack sx={{ width: 1, height: 1, overflow: 'hidden' }}>
      <ChatHeaderCompose currentUserId={user.id} threadId={threadId} />
      <ChatMessageList messages={messages} />
     
      { isGroup && campaignStatus === 'COMPLETED' ? (
      <Typography variant="body2" color="text.secondary" align="center" sx={{ 
        fontFamily: (theme) => theme.typography.fontPrimaryFamily,
        letterSpacing: 2,  padding:"20px", fontSize: '12px' 
        }}>
        The campaign has ended.
      </Typography>
       ) : (
      <ChatMessageInput threadId={threadId} onSendMessage={handleSendMessage} />
      )}
    </Stack>
  );
};

ThreadMessages.propTypes = {
  threadId: PropTypes.string.isRequired,
};

export default ThreadMessages;
