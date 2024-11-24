import PropTypes from 'prop-types';
import EmojiPicker from 'emoji-picker-react';
import Iconify from 'src/components/iconify';
import { useRef, useState, useCallback } from 'react';
import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';
import axiosInstance, { endpoints } from 'src/utils/axios';
import Box from '@mui/material/Box';
import { Button, IconButton, CircularProgress } from '@mui/material';
import Stack from '@mui/material/Stack';
import InputBase from '@mui/material/InputBase';

import FilePreviewModal  from './filePreviewModal';


// ----------------------------------------------------------------------

export default function ChatMessageInput({ disabled, threadId  }) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filePreview, setFilePreview] = useState(null); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
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
      setFile(selectedFile); 
      setFilePreview(previewUrl);  
      setIsModalOpen(true); 
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
        setIsLoading(true);  
        try {
          setIsSending(true); 

          const formData = new FormData();
          formData.append('content', content);
          formData.append('threadId', threadId);
          formData.append('senderId', senderId);
          formData.append('role', role);
          formData.append('name', name);
          formData.append('photoURL', photoURL);
          formData.append('createdAt', createdAt);
          formData.append('file', file);
  
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
            finalContent = data.content.text;  
          }

        } catch (error) {
          console.error('Error uploading file:', error);
        } finally {
          setIsLoading(false);
          setIsSending(false);
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
  
  
  
    // Only proceed if there is content or a file to send
    if (trimmedMessage !== '' || file) {
      sendMessageWithFile(trimmedMessage, file);  
      setMessage('');  
      setFile(null);   
      setFilePreview(null); 
      setIsModalOpen(false); 
    }
  }, [message, file, socket, threadId, user]);
  
  
  

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent default Enter behavior
      handleSendMessage(); // Send the message
    }
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker((prev) => !prev);
  };

  const handleEmojiSelect = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);

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
        borderTop: (theme) => `solid 2px ${theme.palette.divider}`,
        px: 1,
        minHeight: 56,
        maxHeight: 100,
      }}
    >

      <IconButton 
      onClick={toggleEmojiPicker} 
      sx={{ 
        alignSelf: 'center', 
        borderRadius: 1,
        boxShadow: 8,
        }}
      >
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

     <IconButton  component="label" 
      sx={{
        marginRight:"4px",
        alignSelf: 'center',
        borderRadius: 1,
        boxShadow: 8,
        }}
      >
        <Iconify icon="material-symbols:attach-file" /> 
        <input
          type="file"
          hidden
          accept="application/pdf" 
          onChange={handleFileChange} 
        />
      </IconButton>  

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          borderRadius: 1,
          boxShadow: 8, 
          paddingLeft: 2,
          paddingTop: 1,
          paddingBottom: 1,
          flexGrow: 1,
          margin: '4px',
        }}
      >
          <InputBase
            multiline
            value={message}
            onKeyDown={handleKeyDown} 
            onChange={handleChangeMessage}
            placeholder="Type your message here"
            disabled={disabled}
            inputRef={inputRef} 
            sx={{
              maxHeight: 100,
              flexGrow: 1,
              overflow: 'auto',
            }}

          />
        

          <IconButton  component="label">
            <Iconify icon="mdi:camera" /> 
            <input
              type="file"
              hidden
              accept="image/*,video/*" 
              onChange={handleFileChange} 
            />
          </IconButton>     
          <Button  
          color="secondary" 
          onClick={handleSendMessage} 
          sx={{ alignSelf: 'center' }}
          disabled={(!message.trim() && !file) || isSending}
          startIcon={isSending ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isSending ? 'Sending...' : 'Send'}
          </Button>
      </Box>
    </Stack>

    <FilePreviewModal
    open={isModalOpen}
    handleClose={() => setIsModalOpen(false)}
    handleSend={handleSendMessage}
    filePreview={filePreview}
    file={file}
    />
  </>
  );
}

ChatMessageInput.propTypes = {
  disabled: PropTypes.bool,
  threadId: PropTypes.string,
};
