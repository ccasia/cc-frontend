import React, { useEffect } from 'react';
import { useGetThreadById } from 'src/api/chat'; // Assuming the hook is in this file
import { Dialog, DialogActions, DialogContent, DialogTitle, CircularProgress, Modal, Typography, Box, Avatar } from '@mui/material';
import Iconify from 'src/components/iconify';
import Button from '@mui/material/Button';

// Modal Component
const ThreadInfoModal = ({ open, onClose, threadId }) => {
  const { thread, loading, error } = useGetThreadById(threadId);
  if (!open) return null; 

  console.log("Threads", thread)

  if (error) {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>Error</DialogTitle>
        <DialogContent>
          <Typography variant="body1">There was an error loading the thread information.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  const isGroup = thread?.isGroup; // Assuming the thread object has an isGroup boolean

  // If the thread data is available
  return (
    <Modal
    open={open}
    onClose={onClose}
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <Box
      sx={{
        backgroundColor: '#F4F4F4',
        width: '90%',
        maxWidth: '550px',
        borderRadius: '20px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '80vh',
        boxShadow: 24,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px',
          borderBottom: '1px solid #ccc',
        }}
      >
        <Typography variant="h6">{isGroup ? 'Group Info' : 'Chat Info'}</Typography>
        <Button
          onClick={onClose}
          sx={{
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            minWidth: 'unset',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          &times;
        </Button>
      </Box>

      {/* Content */}
      <Box
        sx={{
          margin: '24px',
          padding: '10px',
          borderRadius: '8px',
          overflowY: 'auto',
          backgroundColor: '#FFFFFF',
        }}
      >
        {isGroup ? (
          <>
            {/* Group Chat Info */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
              <Avatar src={thread.photoURL} sx={{ width: 60, height: 60, marginBottom: '8px' }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', margin: '8px 0' }}>
                {thread.title || 'Group Name'}
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', color: '#555', margin: '4px 0' }}>
                Group created on: {thread.createdAt || 'Date'}
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', color: '#555', margin: '4px 0' }}>
                Total members ({thread.userCount || 0})
              </Typography>
            </Box>

            {/* Members List */}
            <Box
              sx={{
                maxHeight: '300px',
                overflowY: 'auto',
                paddingRight: '8px',
              }}
            >
              {thread.UserThread?.map((member) => (
                <Box
                  key={member.userId}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid #eee',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar src={member.user.photoURL} sx={{ width: 30, height: 30, marginRight: '8px' }} />
                    <Typography variant="body2">{member.user.name}</Typography>
                  </Box>
                  {member.user.role === 'admin' && (
                    <Typography variant="caption" sx={{ color: '#555' }}>
                      ADMIN
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </>
        ) : (
          // Single Chat Info
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '8px' }}>
              Chat with {thread?.UserThread[0]?.user?.name || 'User Name'}
            </Typography>
            <Typography sx={{ fontSize: '0.875rem', color: '#555' }}>
              Start date: {thread?.createdAt || 'Date'}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  </Modal>
  
  );
};


export default ThreadInfoModal;
