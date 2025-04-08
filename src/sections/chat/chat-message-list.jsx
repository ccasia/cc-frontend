import PropTypes from 'prop-types';

import Box from '@mui/material/Box';

import Scrollbar from 'src/components/scrollbar';
//  import Lightbox, { useLightBox } from 'src/components/lightbox';

import { useMessagesScroll } from './hooks';
import ChatMessageItem from './chat-message-item';

// ----------------------------------------------------------------------

// Helper function to determine if messages should be grouped
const shouldGroupMessages = (currentMsg, prevMsg, timeThresholdMs = 60000) => {
  if (!prevMsg || !currentMsg) return false;
  
  // Only group messages from the same sender who is not the current user
  if (currentMsg.senderId !== prevMsg.senderId) return false;
  
  // Calculate time difference between messages
  const currentTime = new Date(currentMsg.createdAt).getTime();
  const prevTime = new Date(prevMsg.createdAt).getTime();
  
  // Group if messages are within the time threshold (default: 60 seconds)
  return currentTime - prevTime <= timeThresholdMs;
};

export default function ChatMessageList({ messages }) {
  const { messagesEndRef } = useMessagesScroll(messages);

  return (
    <Scrollbar 
      ref={messagesEndRef} 
      sx={{ 
        px: 3, 
        py: 0.1, 
        height: '100%', // Use 100% height instead of fixed height
        flexGrow: 0,
      }}
    >
      <Box sx={{ mt: 2, mb: 2 }}>
        {messages.map((message, index) => {
          const prevMessage = index > 0 ? messages[index - 1] : null;
          const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
          
          const isGrouped = shouldGroupMessages(message, prevMessage);
          const isLastInGroup = isGrouped && 
            (!nextMessage || !shouldGroupMessages(nextMessage, message));
          
          // Check if this is the very last message in the entire chat
          const isLastMessage = index === messages.length - 1;
          
          return (
            <ChatMessageItem 
              key={message.id} 
              message={message} 
              isGrouped={isGrouped}
              isLastInGroup={isLastInGroup}
              isLastMessage={isLastMessage}
            />
          );
        })}
      </Box>
    </Scrollbar>
  );
}

ChatMessageList.propTypes = {
  messages: PropTypes.array,
  //  threadId: PropTypes.string,
  // participants: PropTypes.array,
};
