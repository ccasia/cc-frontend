import PropTypes from 'prop-types';
import { EmojiPicker, Emoji } from 'react-emoji-search';
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);


  const isEmoji = (char) => 
     char.length === 1 && char !== ' ' // Single-length characters are typically emojis
  ;
  const handleEmojiClick = (emoji) => {
    setMessage(prevMessage => prevMessage + emoji); // Append emoji to the message
    setShowEmojiPicker(false); // Hide emoji picker after selection
  };
  
  const handleSendMessage = useCallback(
    (event) => {
      if (event.type === 'click' || (event.type === 'keyup' && event.key === 'Enter' && !event.shiftKey)) {
        if (message.trim() !== '') {
          console.log('message sent:', message);
          onSendMessage(message);
          setMessage('');
        }
      } else if (event.type === 'keyup' && event.key === 'Enter' && event.shiftKey) {
        event.preventDefault(); 
        setMessage((prevMessage) => prevMessage); 
      }
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
        {/* <IconButton sx={{ alignSelf: 'center' }}>
          <Iconify icon="eva:smiling-face-fill" />

        </IconButton> */}

        <IconButton onClick={() => setShowEmojiPicker((prev) => !prev)} sx={{ alignSelf: 'center' }}>
          <Iconify icon="eva:smiling-face-fill" />
        </IconButton>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div
          style={{
            position: 'absolute',
            bottom: 60,
            width: '400px', 
            height: '250px', 
            overflowY: 'auto', 
            backgroundColor: '#fff', 
            border: '1px solid #ddd',
            borderRadius: '8px',
            zIndex: 1000,
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)', 
          }}
        >
          <EmojiPicker onEmojiClick={handleEmojiClick} emojiSize={24} emojiSpacing={8} />
        </div>
        )}
      
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
