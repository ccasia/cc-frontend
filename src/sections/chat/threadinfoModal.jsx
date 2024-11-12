import React from 'react';
import { useState } from 'react';
import { useGetThreadById } from 'src/api/chat'; // Assuming the hook is in this file
import PropTypes from 'prop-types';

import Button from '@mui/material/Button';
import {
  Box,
  Modal,
  Dialog,
  Avatar,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
} from '@mui/material';

import { Box, Modal, Dialog, Avatar, Typography, DialogTitle, DialogActions, DialogContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from 'src/auth/hooks';
import axiosInstance, { endpoints } from 'src/utils/axios';
import Iconify from 'src/components/iconify';

// Modal Component
const ThreadInfoModal = ({ open, onClose, threadId}) => {
  const user = useAuthContext();
  const { thread, loading, error } = useGetThreadById(threadId);
  const [otherUserId, setOtherUserId] = useState(null);
  const navigate = useNavigate();
 

  const createThread = async () => {
    const currentUserId = user.user.id;
    const otherUserId = thread.UserThread?.find(member => member.userId !== currentUserId)?.userId;

    if (!otherUserId) {
      console.error('No valid other user found in the group.');
      return;
    }
  try {
   
    const existingThreadResponse = await axiosInstance.get(endpoints.threads.getAll);
    const existingThread = existingThreadResponse.data.find((thread) => {
      const userIdsInThread = thread.UserThread.map((userThread) => userThread.userId);
      return (
        userIdsInThread.includes(currentUserId) &&
        userIdsInThread.includes(otherUserId) &&
        !thread.isGroup 
      );
    });

    if (existingThread) {
      navigate(`/dashboard/chat/thread/${existingThread.id}`);
    } else {
     
      const response = await axiosInstance.post(endpoints.threads.create, {
        title: `Chat between ${user.name} & ${otherUserName}`, 
        description: '',
        userIds: [currentUserId, otherUserId], 
        isGroup: false, 
      });

      mutate(endpoints.threads.getAll); 
      navigate(`/dashboard/chat/thread/${response.data.id}`);
      onClose();
    }
  } catch (error) {
    console.error('Error creating thread:', error);
  }
  };
  
  if (!open) return null;


  if (error) {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>Error</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            There was an error loading the thread information.
          </Typography>
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

  // thread.UserThread?.forEach((member) => console.log('Member:', member));
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
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <Avatar src={thread.photoURL} sx={{ width: 60, height: 60, marginBottom: '8px' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', margin: '8px 0' }}>
                  {thread.title}
                </Typography>
                <Typography sx={{ fontSize: '0.875rem', color: '#555', margin: '4px 0' }}>
                  Group created on: {thread.createdAt}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Iconify
                    icon="material-symbols:group-outline"
                    style={{ color: 'black', marginRight: '4px' }}
                  />
                  <Typography
                    fontWeight="bold"
                    sx={{ fontSize: '0.875rem', color: '#555', margin: '4px 0' }}
                  >
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
                      <Avatar
                        src={member.user.photoURL}
                        sx={{ width: 30, height: 30, marginRight: '8px' }}
                      />
                      <Typography variant="body2">
                        {' '}
                        {member.userId === user.user.id ? 'You' : member.user.name}
                      </Typography>
                    </Box>
                    {member.user.role === 'admin' &&  member.userId !== user.user.id && (
                      <>
                      <Typography variant="caption" sx={{ color: '#555' }}>
                        ADMIN
                      </Typography>
                      <Button 
                      onClick={createThread}
                      disabled={member.userId === user.user.id}
                      variant='oulined' sx={{ 
                      color: '#1340FF',
                      boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.2)', // Add a shadow effect
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.1)', // Optional: Light background color on hover
                        boxShadow: '0px 6px 8px rgba(0, 0, 0, 0.3)', // Optional: Add a stronger shadow on hover
                      }
                    }}>
                      Message
                    </Button>
                    </>
                  
                  )}
                  </Box>
                ))}
              </Box>
            </>
          ) : (
            // Single Chat Info

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '8px',
              }}
            >
              {thread.UserThread?.filter((member) => member.userId !== user.user.id).map(
                (member) => (
                  <Box
                    key={member.userId}
                    sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}
                  >
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
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        mb: 1,
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mr: 0.5 }}>
                        {member?.user.name}
                        <Iconify icon="material-symbols:verified" style={{ color: '#1340FF' }} />
                      </Typography>
                    </Box>

                    {/* Member Since */}
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Member since:{' '}
                      {member.user.createdAt
                        ? new Date(member.user.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'Date'}
                    </Typography>
                  </Box>
                )
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default ThreadInfoModal;

ThreadInfoModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  threadId: PropTypes.string,
};
