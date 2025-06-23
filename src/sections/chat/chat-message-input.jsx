import PropTypes from 'prop-types';
import EmojiPicker from 'emoji-picker-react';
import { useRef, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { Button } from '@mui/material';
import Stack from '@mui/material/Stack';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';
import FileThumbnail from 'src/components/file-thumbnail';

// ----------------------------------------------------------------------

function ChatMessageInput({ disabled, onSendMessage }) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);

  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleSendMessage = useCallback(() => {
    const trimmedMessage = message.trim();
    if (trimmedMessage !== '' || attachedFiles.length > 0) {
      onSendMessage({
        content: trimmedMessage,
        attachments: attachedFiles,
      });
      setMessage('');
      setAttachedFiles([]);
    }
  }, [message, attachedFiles, onSendMessage]);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
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
    inputRef.current.focus();
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map((file) => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    }));
    
    setAttachedFiles((prev) => [...prev, ...newFiles]);
    event.target.value = '';
  };

  const handleRemoveFile = (index) => {
    setAttachedFiles((prev) => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <Box>
      {/* File Attachments Preview */}
      {attachedFiles.length > 0 && (
        <Box
          sx={{
            p: 1,
            borderTop: (theme) => `solid 1px ${theme.palette.divider}`,
            bgcolor: 'background.neutral',
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Attachments ({attachedFiles.length})
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {attachedFiles.map((file, index) => (
              <Chip
                key={index}
                avatar={
                  <FileThumbnail
                    file={file.type}
                    sx={{ width: 20, height: 20 }}
                  />
                }
                label={`${file.name} (${formatFileSize(file.size)})`}
                onDelete={() => handleRemoveFile(index)}
                variant="outlined"
                size="small"
                sx={{ maxWidth: 200 }}
              />
            ))}
          </Stack>
        </Box>
      )}

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
        <Stack direction="row" alignItems="center">
          <IconButton onClick={toggleEmojiPicker} sx={{ alignSelf: 'center' }}>
            <Iconify icon="eva:smiling-face-fill" />
          </IconButton>
          
          <IconButton onClick={handleFileSelect} sx={{ alignSelf: 'center' }}>
            <Iconify icon="eva:attach-2-fill" />
          </IconButton>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </Stack>

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
        <Button color="secondary" onClick={handleSendMessage} sx={{ alignSelf: 'center' }}>
          Send
        </Button>
      </Stack>
    </Box>
  );
}

ChatMessageInput.propTypes = {
  disabled: PropTypes.bool,
  onSendMessage: PropTypes.func.isRequired,
};

export default ChatMessageInput;
