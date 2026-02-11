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

import CampaignPitchTextModal from './pitch/pitch-text-modal';
import CampaignPitchVideoModal from './pitch/pitch-video-modal';

const CampaignPitchOptionsModal = ({ open, handleClose, campaign, text, video, mutate }) => {
  const smUp = useResponsive('sm', 'down');
  const { user } = useAuthContext();

  const hasDraft = useMemo(
    () => campaign?.pitch?.find((item) => item.userId === user?.id && item.status === 'draft'),
    [campaign, user]
  );
  const handlePitchClick = () => {
    handleClose();
    if (hasDraft) {
      text.onTrue();
    } else {
      handlePitch();
    }
  };

  const handlePitch = () => {
    // Check if user is in the target list for media kit requirement
    const targetUserIds = [
      'cm8gvqtcv01hwph01uof2u9xu',
      'cm4132k9p00wb54qgcrs71v0t',
      'cmauqo8oy03ioky0157sbr2jg',
      'cm8jxuuvy0272ph01nr0h7din',
      'cm5b5p0zu00r2ylfpo241kqki',
      'cmewrex4p054ipx01u5xqkqhj',
      'cm7oe0q15005bms010ujmjb3r',
      'cm44lei3t00si132zq87a5lan',
      'cm9kzqz1u00ziqe01q2tsdptg',
      'cmj9pz1n40a3hs40154b31l90',
      'cm8mh5ic5032sph011r87rw4e',
      'cm40womsf001k54qg4epuacmu',
      'cm4utxiyv02mu9wevfkpyt8qj',
      'cmj7kdxxi05sqs401pro45vik',
      'cmj21yl0102ghpc01xmy9zkwa',
      'cm3pyp3vm006qm9m8qm1ep02d',
      'cm4ey6g9401w4trd2ip0zf1et',
      'cmh0bsyrv0bftp301prsp7y2k',
      'cm857tk4w03rhmr01r0pjlxkq',
      'cmang4buw01afn7010m7uzuni',
      'cmbvekkhd00sxqh01ittftmd4',
      'cmdgbxxdx01l7mc01xz9bx3v8',
      'cm5q6r86y007p11jxkphbe7ht',
    ];
    const isTargetUser = targetUserIds.includes(user?.id);
    
    // Check if media kit is connected
    const hasMediaKit = user?.creator && 
      (user.creator.isFacebookConnected || user.creator.isTiktokConnected);
    
    // Check if payment details are completed
    const hasPaymentDetails = user?.creator?.isFormCompleted && user?.paymentForm?.bankAccountName;
    
    // For target users, check both media kit and payment details
    if (isTargetUser && (!hasMediaKit || !hasPaymentDetails)) {
      return;
    }
    
    // For non-target users, only check payment details (original behavior)
    if (!isTargetUser && (!user?.creator?.isFormCompleted || !user?.paymentForm?.bankAccountName)) {
      return;
    }

    text.onTrue();
    handleClose();
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
              mb: 2,
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
        mutate={mutate}
      />
      <CampaignPitchVideoModal open={video.value} handleClose={video.onFalse} campaign={campaign} mutate={mutate} />

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
  mutate: PropTypes.func,
};
