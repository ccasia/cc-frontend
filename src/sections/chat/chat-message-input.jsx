import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';

//  import useSocketContext from 'src/socket/hooks/useSocketContext';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

//  const socket = io({transports:['polling'],reconnect:true,path:'/api/socket.io'});

export default function ChatMessageInput({
  disabled,
  onSendMessage,
}) {
  //  const router = useRouter();

  //  const { socket } = useSocketContext();

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
            maxHeight: 100,
            flexGrow: 1,
            overflow: 'auto',
          }}
        />

        <IconButton onClick={handleSendMessage} sx={{ alignSelf: 'center' }}>
          <Iconify icon="tabler:send" width={18} />
        </IconButton>
      </Stack>

      {/* <Button onclick={socketMessage}>Send </Button> */}
      {/* <input type="file" ref={fileRef} style={{ display: 'none' }} /> */}
    </>
  );
}

ChatMessageInput.propTypes = {
  disabled: PropTypes.bool,
  onSendMessage: PropTypes.func.isRequired,
};
