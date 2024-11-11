import React from 'react';
import { Modal, Typography, Box, Button, Avatar } from '@mui/material';

const NotificationModal = ({ open, onClose, onConfirm}) => {
    const handleConfirm = () => {
        onConfirm();
        onClose();
      };
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
          src="/assets/images/notification/markread.png"
          alt="archive"
          sx={{
            width: 60,
            height: 60,
            margin: '0 auto 16px',
            backgroundColor: '#ffeb3b', 
          }}
        >
        </Avatar>

        {/* Confirmation Text */}
        <Typography variant="body1" sx={{ mb: 2 }}>
         Are you sure you want to mark all notifications?  
        </Typography>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={handleConfirm}
            sx={{
              fontWeight: 'bold',
              backgroundColor: '#000',
              '&:hover': {
                backgroundColor: '#333',
              },
            }}
          >
            Yes
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={onClose}
            sx={{ fontWeight: 'bold' }}
          >
            Cancel
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default NotificationModal;
