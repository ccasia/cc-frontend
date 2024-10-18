import React from 'react';
import PropTypes from 'prop-types';

import { Box, Stack, Dialog, Button, Typography } from '@mui/material';

import { useResponsive } from 'src/hooks/use-responsive';

import Iconify from 'src/components/iconify';

import CampaignPitchTextModal from './campaign-pitch-text-modal';
import CampaignPitchVideoModal from './campaign-pitch-video.modal';

const CampaignPitchOptionsModal = ({ open, handleClose, campaign, text, video }) => {
  const smUp = useResponsive('sm', 'down');

  return (
    <>
      <Dialog open={open} onClose={handleClose} fullScreen={smUp}>
        <Stack direction={{ xs: 'column', sm: 'row' }} p={2} gap={2}>
          <Box
            sx={{
              width: 200,
              height: 200,
              bgcolor: (theme) =>
                theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[300],
              borderRadius: 2,
              position: 'relative',
              '&:hover': {
                border: 1,
                borderColor: 'text.secondary',
              },
            }}
            component={Button}
            onClick={() => {
              handleClose();
              text.onTrue();
            }}
          >
            <Stack
              alignItems="center"
              justifyContent="center"
              spacing={0.5}
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <Iconify icon="streamline:script-2-solid" width={30} />
              <Typography variant="subtitle1">Text</Typography>
            </Stack>
          </Box>
          <Box
            sx={{
              width: 200,
              height: 200,
              bgcolor: (theme) =>
                theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[300],
              borderRadius: 2,
              position: 'relative',
              '&:hover': {
                border: 1,
                borderColor: 'text.secondary',
              },
            }}
            component={Button}
            onClick={() => {
              handleClose();
              video.onTrue();
            }}
          >
            <Stack
              alignItems="center"
              justifyContent="center"
              spacing={0.5}
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <Iconify icon="ph:video-fill" width={30} />
              <Typography>Video</Typography>
            </Stack>
          </Box>
        </Stack>
      </Dialog>

      <CampaignPitchTextModal open={text.value} handleClose={text.onFalse} campaign={campaign} />
      <CampaignPitchVideoModal open={video.value} handleClose={video.onFalse} campaign={campaign} />
    </>
  );
};

export default CampaignPitchOptionsModal;

CampaignPitchOptionsModal.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  campaign: PropTypes.object,
  text: PropTypes.func,
  video: PropTypes.func,
};
