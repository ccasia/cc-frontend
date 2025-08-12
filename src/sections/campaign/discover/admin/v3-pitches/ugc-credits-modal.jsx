import React, { useState } from 'react';
import PropTypes from 'prop-types';

import {
  Box,
  Modal,
  Button,
  Avatar,
  Typography,
  IconButton,
  TextField,
  Stack,
  CircularProgress,
} from '@mui/material';

import { useSnackbar } from 'notistack';
import axiosInstance from 'src/utils/axios';

import Iconify from 'src/components/iconify';

const UGCCreditsModal = ({ open, onClose, pitch, campaign, onSuccess }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [ugcCredits, setUgCCredits] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!ugcCredits || isNaN(ugcCredits) || parseInt(ugcCredits) <= 0) {
      enqueueSnackbar('Please enter a valid number of UGC credits', { variant: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Call the pitch approval endpoint with UGC credits
      const response = await axiosInstance.patch(`/api/pitch/v3/${pitch.id}/approve`, {
        ugcCredits: parseInt(ugcCredits),
        feedback: 'Pitch approved by admin'
      });

      enqueueSnackbar('Pitch approved and UGC credits assigned successfully!', { variant: 'success' });
      
      if (onSuccess) {
        onSuccess(response.data.pitch);
      }
      
      onClose();
    } catch (error) {
      console.error('Error approving pitch with UGC credits:', error);
      enqueueSnackbar(error.response?.data?.message || 'Error approving pitch', { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setUgCCredits('');
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: { xs: '90%', sm: 400 },
          maxWidth: 400,
          bgcolor: 'background.paper',
          borderRadius: 3,
          boxShadow: 24,
          p: 4,
          textAlign: 'center',
        }}
      >
        {/* Close button */}
        <IconButton
          onClick={handleClose}
          disabled={isSubmitting}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'text.secondary',
          }}
        >
          <Iconify icon="mingcute:close-line" width={20} />
        </IconButton>

        {/* Purple Circle with Checkmark Emoji */}
        <Box sx={{ mb: 3 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              margin: '0 auto',
              bgcolor: '#8A5AFE',
              mb: 2,
              fontSize: '2rem',
            }}
          >
            ✅
          </Avatar>
        </Box>

        {/* Title Text - Black */}
        <Typography
          variant="h4"
          sx={{
            mb: 1,
            fontWeight: 700,
            color: '#000000',
            fontFamily: (theme) => theme.typography.fontSecondaryFamily,
            fontSize: { xs: '1.75rem', sm: '2rem' },
          }}
        >
          Assign UGC Credits
        </Typography>

        {/* Subtitle Text - Gray */}
        <Typography
          variant="h6"
          sx={{
            mb: 3,
            fontWeight: 400,
            color: '#666666',
            fontSize: { xs: '0.9rem', sm: '1rem' },
          }}
        >
          How many UGC credits would you like to assign to this creator?
        </Typography>

        {/* Creator Info */}
        <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2} justifyContent="center">
            <Avatar
              src={pitch?.user?.photoURL}
              sx={{ width: 40, height: 40 }}
            >
              {pitch?.user?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                color: '#231F20',
              }}
            >
              {pitch?.user?.name}
            </Typography>
          </Stack>
        </Box>

        {/* UGC Credits Input */}
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            type="number"
            label="UGC Credits"
            value={ugcCredits}
            onChange={(e) => setUgCCredits(e.target.value)}
            placeholder="Enter number of credits"
            disabled={isSubmitting}
            InputProps={{
              startAdornment: (
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    mr: 1,
                    fontWeight: 500,
                  }}
                >
                  Credits:
                </Typography>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&:hover fieldset': {
                  borderColor: '#8A5AFE',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#8A5AFE',
                },
              },
            }}
          />
        </Box>

        {/* Action Buttons */}
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            onClick={handleClose}
            disabled={isSubmitting}
            fullWidth
            sx={{
              borderColor: '#e0e0e0',
              color: '#666666',
              fontWeight: 600,
              py: 1.5,
              '&:hover': {
                borderColor: '#666666',
                bgcolor: '#f5f5f5',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isSubmitting || !ugcCredits || isNaN(ugcCredits) || parseInt(ugcCredits) <= 0}
            fullWidth
            sx={{
              bgcolor: '#8A5AFE',
              color: 'white',
              fontWeight: 600,
              py: 1.5,
              '&:hover': {
                bgcolor: '#7B4FD8',
              },
              '&:disabled': {
                bgcolor: '#e0e0e0',
                color: '#999999',
              },
            }}
          >
            {isSubmitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              'Approve & Assign Credits'
            )}
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
};

UGCCreditsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  pitch: PropTypes.object,
  campaign: PropTypes.object,
  onSuccess: PropTypes.func,
};

export default UGCCreditsModal; 