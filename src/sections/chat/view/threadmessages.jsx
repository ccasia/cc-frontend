/* eslint-disable */ 
import React from 'react';
import Stack from '@mui/material/Stack';
import PropTypes from 'prop-types';
import ChatMessageInput from '../chat-message-input';
import ChatMessageList from '../chat-message-list';




const ThreadMessages = ({ threadId }) => {
  // const messages = useGetMessagesFromThread(threadId);
  // const sendmessage = sendMessageInThread(threadId);


  return (

    <Stack sx={{ width: 1, height: 1, overflow: 'hidden' }}>
      <ChatMessageList
        threadId={threadId}
        // messages={messages || []}
        // messages={messages?.messages || []}
        // participants={[]} 
      />

      <ChatMessageInput
        threadId={threadId}
        // onSendMessage={handleSendMessage}
      />
    </Stack>
  );
};

ThreadMessages.propTypes = {
    threadId: PropTypes.object.isRequired,
  };

export default ThreadMessages;

