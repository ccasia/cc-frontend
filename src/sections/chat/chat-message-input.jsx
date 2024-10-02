import PropTypes from 'prop-types';
import { useState, useCallback, useRef } from 'react';
import Stack from '@mui/material/Stack';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Iconify from 'src/components/iconify';
import EmojiPicker from 'emoji-picker-react';

// ----------------------------------------------------------------------

export default function ChatMessageInput({ disabled, onSendMessage }) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);


//   const isEmoji = (char) => 
//      char.length === 1 && char !== ' ' // Single-length characters are typically emojis
//   ;
//   const handleEmojiClick = (emoji) => {
//     setMessage(prevMessage => prevMessage + emoji); // Append emoji to the message
//     setShowEmojiPicker(false); // Hide emoji picker after selection
//   };
  
//   const handleSendMessage = useCallback(
//     (event) => {
//       if (event.type === 'click' || (event.type === 'keyup' && event.key === 'Enter' && !event.shiftKey)) {
//         if (message.trim() !== '') {
//           console.log('message sent:', message);
//           onSendMessage(message);
//           setMessage('');
//         }
//       } else if (event.type === 'keyup' && event.key === 'Enter' && event.shiftKey) {
//         event.preventDefault(); 
//         setMessage((prevMessage) => prevMessage); 
//       }
//     },
//     [message, onSendMessage]
//   );
  

  const inputRef = useRef(null); // Reference to the input field

  const handleSendMessage = useCallback(() => {
    const trimmedMessage = message.trim(); // Remove unnecessary spaces
    if (trimmedMessage !== '') {
      onSendMessage(trimmedMessage);
      setMessage(''); // Clear the message after sending
    }
  }, [message, onSendMessage]);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent default Enter behavior
      handleSendMessage(); // Send the message
    }
  };

  const handleChangeMessage = useCallback((event) => {
    setMessage(event.target.value);
  }, []);

  const toggleEmojiPicker = () => {
    setShowEmojiPicker((prev) => !prev);
  };

  const handleEmojiSelect = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);

    // Refocus the input field after selecting an emoji
    inputRef.current.focus();
  };

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

//         <IconButton onClick={() => setShowEmojiPicker((prev) => !prev)} sx={{ alignSelf: 'center' }}>
//           <Iconify icon="eva:smiling-face-fill" />
//         </IconButton>

//         {/* Emoji Picker */}
//         {showEmojiPicker && (
//           <div
//           style={{
//             position: 'absolute',
//             bottom: 60,
//             width: '400px', 
//             height: '250px', 
//             overflowY: 'auto', 
//             backgroundColor: '#fff', 
//             border: '1px solid #ddd',
//             borderRadius: '8px',
//             zIndex: 1000,
//             boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)', 
//           }}
//         >
//           <EmojiPicker onEmojiClick={handleEmojiClick} emojiSize={24} emojiSpacing={8} />
//         </div>
//         )}
      

        <IconButton onClick={toggleEmojiPicker} sx={{ alignSelf: 'center' }}>
          <Iconify icon="eva:smiling-face-fill" />
        </IconButton>

        {showEmojiPicker && (
          <Box
            sx={{
              position: 'absolute',
              bottom: '60px',
              left: '10px',
              bgcolor: 'background.paper',
              boxShadow: 3,
              borderRadius: 1,
              p: 1,
              zIndex: 1000,
            }}
          >
            <EmojiPicker onEmojiClick={handleEmojiSelect} />
          </Box>
        )}
        <InputBase
          multiline
          value={message}
          onKeyDown={handleKeyDown} // Handles sending the message only on Enter
          onChange={handleChangeMessage}
          placeholder="Type a message"
          disabled={disabled}
          inputRef={inputRef} // Attach the ref to the input field
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
    </>
  );
}

ChatMessageInput.propTypes = {
  disabled: PropTypes.bool,
  onSendMessage: PropTypes.func.isRequired,
};
