import PropTypes from 'prop-types';
import React, { useEffect } from 'react';

import { Box, Popover } from '@mui/material';

import { useHandleThread } from 'src/hooks/zustands/useHandleThread';

import ChatNav from 'src/sections/chat/chat-nav';
import ThreadMessages from 'src/sections/chat/view/threadmessages';

const ChatModal = ({ open, onClose, anchorEl }) => {
  // const [threadId, setThreadId] = useState(null);
  const threadId = useHandleThread((state) => state.threadId);
  const setThreadId = useHandleThread((state) => state.setThreadId);

  useEffect(() => {
    const id = localStorage.getItem('threadId');
    setThreadId(id);
  }, [setThreadId]);

  return (
    <Popover
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      transformOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      slotProps={{
        paper: {
          sx: {
            marginTop: -1,
          },
        },
      }}
    >
      <Box sx={{ bgcolor: 'transparent', minWidth: 320, height: 500, p: 0.5 }}>
        {threadId ? (
          <ThreadMessages threadId={threadId} isClient />
        ) : (
          <ChatNav contacts={[]} isClient setThreadId={setThreadId} />
        )}
      </Box>
    </Popover>
  );
};

export default ChatModal;

ChatModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  anchorEl: PropTypes.object,
};
