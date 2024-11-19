import PropTypes from 'prop-types';

import Box from '@mui/material/Box';

import Scrollbar from 'src/components/scrollbar';
//  import Lightbox, { useLightBox } from 'src/components/lightbox';

import { useMessagesScroll } from './hooks';
import ChatMessageItem from './chat-message-item';

// ----------------------------------------------------------------------

export default function ChatMessageList({ messages }) {
  const { messagesEndRef } = useMessagesScroll(messages);

  //  console.log(messages);
  return (
    <Scrollbar ref={messagesEndRef} sx={{ px: 3, py: 0.1, height: 1 }}>
      <Box sx={{ mt: 2 }}>
        {messages.map((message, idx) => (
          <ChatMessageItem key={idx} message={message}/>
        ))}
      </Box>
    </Scrollbar>
  );
}

ChatMessageList.propTypes = {
  messages: PropTypes.array,
  //  threadId: PropTypes.string,
  // participants: PropTypes.array,
};
