import React from 'react';
import PropTypes from 'prop-types';

import { grey } from '@mui/material/colors';
import {
  Box,
  Stack,
  Avatar,
  Dialog,
  Typography,
  IconButton,
  DialogTitle,
  ListItemText,
  DialogContent,
} from '@mui/material';

import { useResponsive } from 'src/hooks/use-responsive';

import Iconify from 'src/components/iconify';

const UploadFileTypeModal = ({ submission, campaign, open, handleClose, onSelectType }) => {
  const smUp = useResponsive('up', 'sm');

  // Get current submission status and uploaded files
  const hasVideo = submission?.video?.length > 0;
  const hasRawFootage = submission?.rawFootages?.length > 0;
  const hasPhotos = submission?.photos?.length > 0;

  const fileTypes = [
    {
      type: 'video',
      icon: 'solar:video-library-bold',
      title: 'Draft Video',
      description: 'Upload your main draft video for the campaign',
      isUploaded: hasVideo,
      disabled: hasVideo || submission?.status === 'PENDING_REVIEW',
    },
    {
      type: 'rawFootage',
      icon: 'solar:camera-bold',
      title: 'Raw Footage',
      description: 'Upload raw, unedited footage from your shoot',
      isUploaded: hasRawFootage,
      disabled: hasRawFootage || submission?.status === 'PENDING_REVIEW',
    },
    {
      type: 'photos',
      icon: 'solar:gallery-wide-bold',
      title: 'Photos',
      description: 'Upload photos from your campaign shoot',
      isUploaded: hasPhotos,
      disabled: hasPhotos || submission?.status === 'PENDING_REVIEW',
    },
  ];

  // Filter based on campaign settings and submission status
  const filteredFileTypes = fileTypes.filter((type) => {
    if (type.type === 'rawFootage' && !campaign.rawFootage) return false;
    if (type.type === 'photos' && !campaign.photos) return false;
    return true;
  });

  return (
    <Dialog open={open} fullScreen={!smUp} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="flex-start" gap={2}>
          <Typography
            variant="h5"
            sx={{
              fontFamily: 'Instrument Serif, serif',
              fontSize: { xs: '1.8rem', sm: '2.4rem' },
              fontWeight: 550,
            }}
          >
            What would you like to upload? 📤
          </Typography>

          <IconButton
            onClick={handleClose}
            sx={{
              ml: 'auto',
              color: '#636366',
            }}
          >
            <Iconify icon="hugeicons:cancel-01" width={20} />
          </IconButton>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Submit all the deliverables so our admins can start reviewing your draft!
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
          {filteredFileTypes.map((type) => (
            <Box
              key={type.type}
              sx={{
                position: 'relative',
                border: 1,
                p: 2,
                borderRadius: 2,
                borderColor: type.isUploaded ? '#5abc6f' : grey[100],
                transition: 'all .2s ease',
                width: {
                  xs: '100%',
                  sm: `${100 / filteredFileTypes.length}%`,
                },
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                opacity: type.disabled ? 0.5 : 1,
                cursor: type.disabled ? 'not-allowed' : 'pointer',
                '&:hover': {
                  // eslint-disable-next-line no-nested-ternary
                  borderColor: type.disabled
                    ? type.isUploaded
                      ? '#5abc6f'
                      : grey[100]
                    : grey[700],
                  transform: type.disabled ? 'none' : 'scale(1.05)',
                },
              }}
              onClick={() => {
                if (!type.disabled) {
                  handleClose();
                  onSelectType(type.type);
                }
              }}
            >
              {type.isUploaded && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -10,
                    right: -10,
                    bgcolor: '#5abc6f',
                    borderRadius: '50%',
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    zIndex: 1,
                  }}
                >
                  <Iconify icon="eva:checkmark-fill" sx={{ color: 'white', width: 20 }} />
                </Box>
              )}
              {type.disabled && submission?.status === 'PENDING_REVIEW' && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -10,
                    right: -10,
                    bgcolor: grey[500],
                    borderRadius: '50%',
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    zIndex: 1,
                  }}
                >
                  <Iconify icon="eva:lock-fill" sx={{ color: 'white', width: 20 }} />
                </Box>
              )}
              <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Avatar
                  sx={{
                    bgcolor: type.isUploaded ? '#5abc6f' : '#203ff5',
                    mb: 2,
                  }}
                >
                  <Iconify icon={type.icon} />
                </Avatar>

                <ListItemText
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  primary={type.title}
                  secondary={
                    // eslint-disable-next-line no-nested-ternary
                    type.disabled && submission?.status === 'PENDING_REVIEW'
                      ? 'Submission under review'
                      : type.isUploaded
                        ? 'Already uploaded'
                        : type.description
                  }
                  primaryTypographyProps={{
                    variant: 'body1',
                    fontWeight: 'bold',
                    gutterBottom: true,
                    sx: { mb: 1 },
                  }}
                  secondaryTypographyProps={{
                    color: 'text.secondary',
                    lineHeight: 1.2,
                    sx: {
                      minHeight: '2.4em',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    },
                  }}
                />
              </Box>
            </Box>
          ))}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default UploadFileTypeModal;

UploadFileTypeModal.propTypes = {
  submission: PropTypes.object,
  campaign: PropTypes.object,
  onSelectType: PropTypes.func,
  open: PropTypes.bool,
  handleClose: PropTypes.func,
};
