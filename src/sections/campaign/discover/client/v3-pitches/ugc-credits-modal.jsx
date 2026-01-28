import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useSnackbar } from 'notistack';

import {
  Box,
  Modal,
  Stack,
  Button,
  Avatar,
  TextField,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';

import axiosInstance from 'src/utils/axios';

import Iconify from 'src/components/iconify';

const UGCCreditsModal = ({ open, onClose, pitch, campaign, onSuccess, comments, agreements }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [ugcCredits, setUgCCredits] = useState('');
  
  // Credits are only utilized when agreement is sent
  // ugcLeft = total credits - credits from sent agreements (platform creators only)
  // For credit tier campaigns: credits = ugcVideos * creditPerVideo (stored on shortlisted creator)
  // For regular campaigns: credits = ugcVideos * 1
  const ugcLeft = (() => {
    if (!campaign?.campaignCredits) return 0;

    const isCreditTier = campaign?.isCreditTier === true;

    const sentAgreementUserIds = new Set(
      (agreements || campaign?.creatorAgreement || [])
        .filter(a => a.isSent)
        .map(a => a.userId)
    );

    const utilizedCredits = (campaign?.shortlisted || []).reduce((total, creator) => {
      if (sentAgreementUserIds.has(creator.userId) &&
          creator.user?.creator?.isGuest !== true) {
        const videos = creator.ugcVideos || 0;
        // For credit tier campaigns, use creditPerVideo; for regular campaigns, use 1
        const creditsPerVideo = isCreditTier ? (creator.creditPerVideo || 1) : 1;
        return total + (videos * creditsPerVideo);
      }
      return total;
    }, 0);

    return Math.max(0, campaign.campaignCredits - utilizedCredits);
  })();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (campaign?.submissionVersion !== 'v4' && ugcLeft <= 0) {
      enqueueSnackbar('No credits left. Cannot assign UGC credits.', { variant: 'warning' });
      return;
    }
    if (campaign?.submissionVersion !== 'v4' && (!ugcCredits || Number.isNaN(Number(ugcCredits)) || parseInt(ugcCredits, 10) <= 0)) {
      enqueueSnackbar('Please enter a valid number of UGC credits', { variant: 'error' });
      return;
    }
    
    if (campaign?.submissionVersion === 'v4' && ugcCredits && (Number.isNaN(Number(ugcCredits)) || parseInt(ugcCredits, 10) <= 0)) {
      enqueueSnackbar('Please enter a valid number of UGC credits or leave empty', { variant: 'error' });
      return;
    }
    if (campaign?.submissionVersion !== 'v4' && parseInt(ugcCredits, 10) > ugcLeft) {
      enqueueSnackbar(`You only have ${ugcLeft} credits left. Reduce the assigned credits.`, { variant: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        feedback: 'Pitch approved by admin',
        adminComments: comments,
        campaignVersion: campaign?.submissionVersion,
      };

      if (ugcCredits && !Number.isNaN(Number(ugcCredits)) && parseInt(ugcCredits, 10) > 0) {
        payload.ugcCredits = parseInt(ugcCredits, 10);
      } else if (campaign?.submissionVersion === 'v4') {
        payload.ugcCredits = 1;
      }

      const response = await axiosInstance.patch(`/api/pitch/v3/${pitch.id}/approve`, payload);
      enqueueSnackbar('Pitch approved and UGC credits assigned successfully!', {
        variant: 'success',
      });

      if (onSuccess) {
        onSuccess(response.data.pitch);
      }

      onClose();
    } catch (error) {
      console.error('Error approving pitch with UGC credits:', error);
      enqueueSnackbar(error.response?.data?.message || 'Error approving pitch', {
        variant: 'error',
      });
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

        {/* Credits Left Indicator */}
        {campaign?.submissionVersion !== 'v4' && (
          <Typography
            variant="caption"
            sx={{
              display: 'inline-block',
              mb: 1,
              fontWeight: 600,
              color: ugcLeft > 0 ? 'text.secondary' : 'error.main',
              border: '1px solid',
              borderColor: '#e7e7e7',
              px: 1,
              py: 0.25,
              borderRadius: 1,
            }}
          >
            UGC Credits: {ugcLeft} left
          </Typography>
        )}

        {/* UGC Credits Input */}
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            type="number"
            label={campaign?.submissionVersion === 'v4' ? 'UGC Credits (Optional)' : 'UGC Credits'}
            value={ugcCredits}
            onChange={(e) => setUgCCredits(e.target.value)}
            placeholder="Enter number of credits"
            disabled={isSubmitting || (campaign?.submissionVersion !== 'v4' && ugcLeft <= 0)}
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
              textTransform: 'none',
              minHeight: 42,
              bgcolor: '#ffffff',
              color: '#636366',
              border: '1.5px solid',
              borderColor: '#e7e7e7',
              borderBottom: '3px solid',
              borderBottomColor: '#e7e7e7',
              borderRadius: 1.15,
              fontWeight: 600,
              fontSize: '16px',
              '&:hover': {
                bgcolor: '#e7e7e7',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              // For non-v4 campaigns, check credit limits
              (campaign?.submissionVersion !== 'v4' && ugcLeft <= 0) ||
              (ugcCredits && (Number.isNaN(Number(ugcCredits)) || parseInt(ugcCredits, 10) <= 0)) ||
              (campaign?.submissionVersion !== 'v4' && !ugcCredits) ||
              (campaign?.submissionVersion !== 'v4' && parseInt(ugcCredits, 10) > ugcLeft)
            }
            fullWidth
            sx={{
              textTransform: 'none',
              minHeight: 42,
              bgcolor: '#FFFFFF',
              color: '#1ABF66',
              border: '1.5px solid',
              borderColor: '#E7E7E7',
              borderBottom: '3px solid',
              borderBottomColor: '#E7E7E7',
              borderRadius: 1.15,
              fontWeight: 600,
              fontSize: '16px',
              '&:hover': {
                bgcolor: '#f5f5f5',
                border: '1.5px solid',
                borderColor: '#1ABF66',
                borderBottom: '3px solid',
                borderBottomColor: '#1ABF66',
              },
              '&:disabled': {
                bgcolor: '#e0e0e0',
                color: '#999999',
                borderColor: '#e0e0e0',
                borderBottomColor: '#e0e0e0',
              },
            }}
          >
            {isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Approve'}
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
  comments: PropTypes.string,
  agreements: PropTypes.array,
};

export default UGCCreditsModal;
