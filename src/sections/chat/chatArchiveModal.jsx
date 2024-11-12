import React from 'react';
import PropTypes from 'prop-types';

import { Box, Modal, Button, Avatar, Typography } from '@mui/material';

const ChatArchiveModal = ({ open, onClose, onArchive, archivedChats, threadId }) => {
  const isArchived = archivedChats.includes(threadId);
  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 300,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
          textAlign: 'center',
        }}
      >
        {/* Emoji Avatar */}
        <Avatar
          src="/assets/images/chat/archive.png"
          alt="archive"
          sx={{
            width: 60,
            height: 60,
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
              fontWeight: 'bold',
              backgroundColor: '#000',
              '&:hover': {
                backgroundColor: '#333',
              },
            }}
          >
            {isArchived ? 'Unarchive Chat' : 'Archive Chat'}
          </Button>
          <Button variant="outlined" fullWidth onClick={onClose} sx={{ fontWeight: 'bold' }}>
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
  archivedChats: PropTypes.func,
  threadId: PropTypes.string,
};
