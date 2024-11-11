import React, { useEffect } from 'react';
import { useGetThreadById } from 'src/api/chat'; // Assuming the hook is in this file
import { Dialog, DialogActions, DialogContent, DialogTitle, CircularProgress, Modal, Typography, Box, Avatar } from '@mui/material';
import { useAuthContext } from 'src/auth/hooks';
import Iconify from 'src/components/iconify';
import Button from '@mui/material/Button';
import { Padding } from '@mui/icons-material';

// Modal Component
const ThreadInfoModal = ({ open, onClose, threadId }) => {
  const user = useAuthContext();
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

  // console.log("User ME", user.user.id)
  // console.log('Thread UserThread:', thread.UserThread);
  thread.UserThread?.forEach((member) => console.log('Member:', member));
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
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Iconify icon="material-symbols:group-outline" style={{ color: 'black', marginRight: '4px' }} />
              <Typography fontWeight="bold" sx={{ fontSize: '0.875rem', color: '#555', margin: '4px 0' }}>
                Total members ({thread.userCount || 0})
              </Typography>
            </Box>

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
                    <Typography variant="body2">  {member.userId === user.user.id ? 'You' : member.user.name}</Typography>
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
        
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px' }}>
       {thread.UserThread?.filter((member) => member.userId !== user.user.id) 
            .map((member) => (
              <Box key={member.userId} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              {/* Avatar */}
              <Avatar
                src={member.user.photoURL} 
                sx={{
                  width: 80,
                  height: 80,
                  mb: 2,
                }}
              />
      
              {/* Member Name and Verified Icon */}
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mr: 0.5 }}>
                  {member?.user.name}
                  <Iconify icon="material-symbols:verified" style={{ color: '#1340FF' }} />
                </Typography>
              </Box>
      
              {/* Member Since */}
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Member since: {member.user.createdAt ? new Date(member.user.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }) : 'Date'}
              </Typography>
            </Box>
        ))}
        </Box>
        )}
      </Box>
    </Box>
  </Modal>
  
  );
};


export default ThreadInfoModal;
