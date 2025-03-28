import PropTypes from 'prop-types';
import React, { useMemo } from 'react';

import { grey } from '@mui/material/colors';
import {
  Box,
  Stack,
  Dialog,
  Typography,
  IconButton,
  DialogTitle,
  ListItemText,
  DialogContent,
} from '@mui/material';

import { useResponsive } from 'src/hooks/use-responsive';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import AvatarIcon from 'src/components/avatar-icon/avatar-icon';

import CampaignPitchTextModal from './pitch/pitch-text-modal';
import CampaignPitchVideoModal from './pitch/pitch-video-modal';

const CampaignPitchOptionsModal = ({ open, handleClose, campaign, text, video }) => {
  const smUp = useResponsive('sm', 'down');
  const { user } = useAuthContext();

  const hasDraft = useMemo(
    () => campaign?.draftPitch && campaign.draftPitch.find((item) => item.userId === user?.id),
    [campaign, user]
  );
  const handlePitchClick = () => {
    handleClose();
    if (hasDraft) {
      text.onTrue();
    } else {
      // Open the pitch options
      // (This is the existing functionality when clicking "Pitch Yourself")
    }
  };

  return (
    <>
      <Dialog 
        open={open && !text.value && !video.value}
        fullScreen={smUp} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#F4F4F4',
            position: 'relative',
            minHeight: 'auto',
            width: 'auto',
          },
        }}
      >
        <IconButton 
          onClick={handleClose}
          sx={{ 
            position: 'absolute',
            right: 8,
            top: 4,
            zIndex: 1,
            width: 64,
            height: 64,
            color: '#636366',
          }}
        >
          <Iconify icon="hugeicons:cancel-01" width={20} />
        </IconButton>

        <DialogTitle sx={{ pt: 8, pb: 0 }}>
          <Box sx={{ width: '100%', borderBottom: '1px solid', borderColor: 'divider', mb: 3 }} />
          <Typography 
            variant="h4" 
            sx={{ 
              fontFamily: 'Instrument Serif', 
              fontWeight: 440, 
              fontSize: { 
                xs: '1.5rem', 
                sm: '1.75rem',
                md: '2rem',
              }, 
              mb: 2
            }}
          >
            How would you like to pitch yourself? 👀
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', sm: 'center' }}
            gap={2}
            pb={4}
            mt={1}
          >
            <Box
              sx={{
                border: 0.8,
                p: 3,
                bgcolor: 'common.white',
                borderRadius: 1,
                borderColor: '#EBEBEB',
                transition: 'all .2s ease',
                width: { xs: '100%', sm: 'auto' },
                height: '180px',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  borderColor: grey[700],
                  cursor: 'pointer',
                },
              }}
              component="div"
              onClick={() => {
                handleClose();
                text.onTrue();
              }}
            >
              {/* <AvatarIcon icon="solar:document-bold" /> */}
              <Box
                component="img"
                src="/assets/icons/components/ic_letterpitch.svg"
                sx={{ width: 48, height: 48 }}
              />
              <ListItemText
                sx={{
                  mt: 2,
                }}
                primary="Letter Pitch"
                secondary="Write a short letter on how you'd be fit for the campaign!"
                primaryTypographyProps={{
                  variant: 'body1',
                  fontWeight: 'bold',
                  gutterBottom: 1,
                }}
                secondaryTypographyProps={{
                  color: 'text.secondary',
                  lineHeight: 1.2,
                }}
              />
            </Box>
            <Box
              sx={{
                border: 0.8,
                p: 3,
                bgcolor: 'common.white',
                borderRadius: 1,
                borderColor: '#EBEBEB',
                transition: 'all .2s ease',
                width: { xs: '100%', sm: 'auto' },
                height: '180px',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  borderColor: grey[700],
                  cursor: 'pointer',
                },
              }}
              onClick={() => {
                handleClose();
                video.onTrue();
              }}
            >
              {/* <AvatarIcon icon="akar-icons:video" /> */}
              <Box
                component="img"
                src="/assets/icons/components/ic_videopitch.svg"
                sx={{ width: 48, height: 48 }}
              />
              <ListItemText
                sx={{
                  mt: 2,
                }}
                primary="Video Pitch"
                secondary="Record a short video message on how you'd fit for the campaign!"
                primaryTypographyProps={{
                  variant: 'body1',
                  fontWeight: 'bold',
                  gutterBottom: 1,
                }}
                secondaryTypographyProps={{
                  color: 'text.secondary',
                  lineHeight: 1.2,
                }}
              />
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>
      
      <CampaignPitchTextModal 
        open={text.value} 
        handleClose={text.onFalse} 
        campaign={campaign} 
        onBack={() => {
          text.onFalse();
        }}
      />
      <CampaignPitchVideoModal 
        open={video.value} 
        handleClose={video.onFalse} 
        campaign={campaign} 
      />
    </>
  );
};

export default CampaignPitchOptionsModal;

CampaignPitchOptionsModal.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  campaign: PropTypes.object,
  text: PropTypes.object,
  video: PropTypes.object,
};
