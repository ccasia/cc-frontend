// import { sub } from 'date-fns';
import PropTypes from 'prop-types';
import { useRef, useState, useEffect, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
//  import Button from '@mui/material/Button'
//  import { socket } from 'src/layouts/dashboard/index'
//  import { io } from 'socket.io-client';
//  import { paths } from 'src/routes/paths';
//  import { socket } from 'src/socket';
//  import { useRouter } from 'src/routes/hooks';
//  import { useAuthContext } from 'src/auth/hooks';
//  import uuidv4 from 'src/utils/uuidv4';

//  import { sendMessageInThread } from 'src/api/chat';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

//  const socket = io({transports:['polling'],reconnect:true,path:'/api/socket.io'});

export default function ChatMessageInput({
  // recipients,
  // onAddRecipients,
  disabled,
  threadId,
  onSendMessage,
  // selectedConversationId,
}) {
  //  const router = useRouter();

  //  const { user } = useAuthContext();

  const fileRef = useRef(null);
  const { socket } = useSocketContext();

  const [message, setMessage] = useState('');

  const handleSendMessage = useCallback(
    (event) => {
      if (event.type === 'click' && message.trim() !== '') {
        console.log('message sent', message);
        onSendMessage(message);
        setMessage('');
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [message, onSendMessage]
  );

  // Handle message input change
  const handleChangeMessage = useCallback((event) => {
    setMessage(event.target.value);
  }, []);

  // Listen for incoming messages
  useEffect(() => {
    const handleIncomingMessage = (data) => {};

    socket?.on('message', handleIncomingMessage);
    return () => {
      socket?.off('message', handleIncomingMessage);
    };
  }, [socket]);

  // const handleChangeMessage = useCallback((event) => {
  //   setMessage(event.target.value);
  // }, []);

  return (
    <>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="normal"
        overflow="hidden"
        sx={{
          borderTop: (theme) => `solid 1px ${theme.palette.divider}`,
          px: 1,
          minHeight: 56,
          // height: 56,
          maxHeight: 100,
        }}
      >
        <IconButton sx={{ alignSelf: 'center' }}>
          <Iconify icon="eva:smiling-face-fill" />
        </IconButton>
        <InputBase
          multiline
          value={message}
          onKeyUp={handleSendMessage}
          onChange={handleChangeMessage}
          placeholder="Type a message"
          disabled={disabled}
          // startAdornment={
          //   <IconButton>
          //     <Iconify icon="eva:smiling-face-fill" />
          //   </IconButton>
          // }
          // endAdornment={
          //   <Stack direction="row" sx={{ flexShrink: 0 }}>
          //     {/* <IconButton onClick={handleAttach}>
          //     <Iconify icon="solar:gallery-add-bold" />
          //   </IconButton>
          //   <IconButton onClick={handleAttach}>
          //     <Iconify icon="eva:attach-2-fill" />
          //   </IconButton> */}
          //     {/* <IconButton>
          //     <Iconify icon="solar:microphone-bold" />
          //   </IconButton> */}

          //     <IconButton onClick={handleSendMessage}>
          //       <Iconify icon="tabler:send" width={18} />
          //     </IconButton>
          //   </Stack>
          // }
          sx={{
            // height: 56,
            maxHeight: 100,
            // flexShrink: 0,
            // borderTop: (theme) => `solid 1px ${theme.palette.divider}`,
            flexGrow: 1,
            overflow: 'auto',
          }}
        />

        <IconButton onClick={handleSendMessage} sx={{ alignSelf: 'center' }}>
          <Iconify icon="tabler:send" width={18} />
        </IconButton>
      </Stack>

      {/* <Button onclick={socketMessage}>Send </Button> */}
      <input type="file" ref={fileRef} style={{ display: 'none' }} />
    </>
  );
}

ChatMessageInput.propTypes = {
  disabled: PropTypes.bool,
  threadId: PropTypes.string,
  onSendMessage: PropTypes.func.isRequired,
  // recipients: PropTypes.array,
  // selectedConversationId: PropTypes.string,
};
