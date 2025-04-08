import React from 'react';
import PropTypes from 'prop-types';

import { Box, Modal, Button, Avatar, Typography } from '@mui/material';

const ChatArchiveModal = ({ open, onClose, onArchive, archivedChats, threadId }) => {
  const isArchived = archivedChats.includes(threadId);

  // const ChatArchiveModal = ({ open, onClose, onArchive, archivedChats, threadId }) => {
  //   const isArchived = archivedChats.includes(threadId);

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          height: 284,
          bgcolor: '#F4F4F4',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
        }}
      >
        {/* Emoji Avatar */}
        <Avatar
          src="/assets/images/chat/archive.png"
          alt="archive"
          sx={{
            width: 80,
            height: 80,
            margin: '0 auto 16px',
            backgroundColor: '#ffeb3b',
          }}
        />

        {/* Confirmation Text */}
        <Typography variant="body1" sx={{ mb: 2 }}>
          {isArchived
            ? 'Are you sure you want to unarchive this chat?'
            : 'Are you sure you want to archive this chat?'}
        </Typography>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={onArchive}
            sx={{
              fontSize: 14,
              fontWeight: 600,
              height: 43,
              backgroundColor: '#3A3A3C',
              borderBottom: '3px solid #282424',
              '&:hover': {
                backgroundColor: '#706c6c',
              },
            }}
          >
            {isArchived ? 'Unarchive Chat' : 'Archive Chat'}
          </Button>
          <Button 
          fullWidth 
          onClick={onClose} 
          sx={{ 
              fontWeight: 'bold', 
              fontSize: 14,
              height: 43,
              backgroundColor: '#FFFFFF',
              border: '1px solid #E7E7E7',
              borderBottom: '3px solid #E7E7E7',
              '&:hover': {
                backgroundColor: '#f2f2f2',
                borderBottom: '3px solid #e7e7e7',
              },
            }}>
            Cancel
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ChatArchiveModal;

ChatArchiveModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onArchive: PropTypes.func,
  archivedChats: PropTypes.array,
  threadId: PropTypes.string,
};
