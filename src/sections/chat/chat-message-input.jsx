import PropTypes from 'prop-types';
import EmojiPicker from 'emoji-picker-react';
import { useRef, useState, useCallback } from 'react';
import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';
import axiosInstance, { endpoints } from 'src/utils/axios';
import Box from '@mui/material/Box';
import { Button } from '@mui/material';
import Stack from '@mui/material/Stack';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function ChatMessageInput({ disabled, threadId  }) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filePreview, setFilePreview] = useState(null); 
  const {user} = useAuthContext();
  const { socket } = useSocketContext();

  const inputRef = useRef(null); // Reference to the input field

 
   // Handle message input change
   const handleChangeMessage = (e) => {
    setMessage(e.target.value);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const previewUrl = URL.createObjectURL(selectedFile);
      setFile(selectedFile);  // Update the file state
      setFilePreview(previewUrl);  // Set the file preview
    }
  };

  // Handle the message send button click
  const handleSendMessage = useCallback(() => {
    const trimmedMessage = message.trim();
  
    // Async function to handle message sending logic
    const sendMessageWithFile = async (content, file) => {
      const { id: senderId, role, name, photoURL } = user;
      const createdAt = new Date().toISOString();
  
      let finalContent = content;
      let fileTypeCheck= null;
  
      if (file) {
        fileTypeCheck = file.type || null;
        setIsLoading(true);  // Show loading indicator while uploading
        try {
          const formData = new FormData();
          formData.append('content', content);
          formData.append('threadId', threadId);
          formData.append('senderId', senderId);
          formData.append('role', role);
          formData.append('name', name);
          formData.append('photoURL', photoURL);
          formData.append('createdAt', createdAt);
          formData.append('file', file); // Attach file to the formData
  
          const response = await axiosInstance.post(endpoints.threads.sendMessage, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              console.log(`File upload progress: ${percent}%`);
            },
          });
  
          const data = response.data;
          console.log('File upload response:', data);
          console.log("final text", finalContent);
  
          if (data.content?.file) {
            finalContent = data.content.text;  // Update content if file was processed
          }
        } catch (error) {
          console.error('Error uploading file:', error);
        } finally {
          setIsLoading(false);  // Hide loading indicator
        }
      }
  
      // Emit the message to the server (socket)
      socket?.emit('sendMessage', {
        senderId,
        threadId,
        content: finalContent,
        file,
        fileType: fileTypeCheck,
        role,
        name,
        photoURL,
        createdAt,
      });
    };
  
    console.log("Sending file:", file);
  
    // Only proceed if there is content or a file to send
    if (trimmedMessage !== '' || file) {
      sendMessageWithFile(trimmedMessage, file);  // Send the message with the content and file
      setMessage('');  // Reset message input
      setFile(null);   // Reset file input
      setFilePreview(null); // Reset file preview
    }
  }, [message, file, socket, threadId, user]);
  
  
  
  // const handleSendMessage = useCallback(() => {
  //   const trimmedMessage = message.trim();
  //   console.count("counter");

  //   console.log("Sending message with content:", trimmedMessage);
  //   console.log("Sending file:", file);
  //   if (trimmedMessage !== '' || file) {
  //     onSendMessage(trimmedMessage, file);  
  //     setMessage('');  
  //     setFile(null);  
  //     setFilePreview(null);
  //   }
  // }, [message, file, onSendMessage]);

  

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent default Enter behavior
      handleSendMessage(); // Send the message
    }
  };

  // const handleChangeMessage = useCallback((event) => {
  //   setMessage(event.target.value);
  // }, []);

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
        placeholder="Type your message here"
        disabled={disabled}
        inputRef={inputRef} // Attach the ref to the input field
        sx={{
          maxHeight: 100,
          flexGrow: 1,
          overflow: 'auto',
        }}

      />
     {filePreview && (
        <Box
          sx={{
            maxWidth: 100,
            maxHeight: 100,
            overflow: 'hidden',
            borderRadius: 1,
            mb: 2,
          }}
        >
          <img
            src={filePreview}
            alt="File Preview"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </Box>
      )}
      
        <Button variant="outlined" component="label" color="secondary" sx={{ alignSelf: 'center' }}>
        Upload File
        <input
          type="file"
          hidden
          onChange={handleFileChange}  // Update the file state
        />
      </Button>
      <Button  
      color="secondary" 
      onClick={handleSendMessage} 
      sx={{ alignSelf: 'center' }}
      disabled={!message.trim() && !file} 
      >
        Send
      </Button>
    </Stack>
  );
}

ChatMessageInput.propTypes = {
  disabled: PropTypes.bool,
  onSendMessage: PropTypes.func.isRequired,
};
