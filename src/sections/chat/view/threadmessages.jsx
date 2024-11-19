/* eslint-disable */
import React, { useEffect, useState, useCallback } from 'react';
import axiosInstance, { endpoints } from 'src/utils/axios';
//  import { useParams } from 'src/routes/hooks';
import Stack from '@mui/material/Stack';
import PropTypes from 'prop-types';
import { Divider, Typography } from '@mui/material';
import ChatHeaderCompose from '../chat-header-compose';
import ChatMessageInput from '../chat-message-input';
import ChatMessageList from '../chat-message-list';
import useSocketContext from 'src/socket/hooks/useSocketContext';
import { useAuthContext } from 'src/auth/hooks';
import { markMessagesAsSeen, useTotalUnreadCount} from 'src/api/chat';

const ThreadMessages = ({ threadId, currentuserInThreads }) => {
  const { socket } = useSocketContext();
  const [threadMessages, setThreadMessages] = useState({});
  const { user } = useAuthContext();
  const { triggerRefetch } = useTotalUnreadCount();
  
  const [campaignStatus, setCampaignStatus] = useState(null);
 
  

  useEffect(() => {
    socket?.emit('room', threadId);
    console.log("Connected to room", threadId);
    
    socket?.on('message', (message) => {
      console.log('Received raw message from socket:', message);


      const formattedMessage = {
        ...message,
        content: message.content,
        file: message.file || null, 
      };
  
      console.log('Recievied Formatted message:', formattedMessage); 
  
      console.log("complete message", message)

      // Update the thread messages in state
      setThreadMessages((prevThreadMessages) => {
        const { threadId: messageThreadId } = message;
        console.log('Updating messages for threadId:', messageThreadId);
    
        return {
          ...prevThreadMessages,
          [messageThreadId]: [
            ...(prevThreadMessages[messageThreadId] || []),
            formattedMessage,
          ],
        };
      });
    
      // Mark the message as seen if it's for the current thread
      if (message.threadId === threadId) {
        markAsSeen();
      }
    });
    // Listen for existing messages
    socket?.on('existingMessages', ({ threadId, oldMessages }) => {
      console.log("Listening for existing messages")
      setThreadMessages((prevThreadMessages) => ({
        ...prevThreadMessages,
        [threadId]: oldMessages,
      }));
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

    const thread = currentuserInThreads?.find((t) => t.id === threadId);
    if (thread && thread.campaign) {
      setCampaignStatus(thread.campaign.status);
    }

    return () => {
      socket?.off('latestMessage');
      socket?.off('existingMessages');
    };
  }, [socket, threadId]);

 

  const messages = threadMessages[threadId] || [];
  const thread = currentuserInThreads?.find((t) => t.id === threadId);
  const isGroup = thread?.isGroup;

  return (
    <Stack sx={{ width: 1, height: 1, overflow: 'hidden' }}>
      <ChatHeaderCompose currentUserId={user.id} threadId={threadId} currentuserInThreads={currentuserInThreads} />

      <Divider sx={{ width: '97%', mx: 'auto' }} />

      <ChatMessageList messages={messages} />

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
        <ChatMessageInput 
        threadId={threadId} 
        />
      )}
    </Stack>
  );
};

ThreadMessages.propTypes = {
  threadId: PropTypes.string.isRequired,
};

export default ThreadMessages;
