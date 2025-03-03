import PropTypes from 'prop-types';
import React, { useEffect, useMemo } from 'react';

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
import { useGetSubmissions } from 'src/hooks/use-get-submission';

import useSocketContext from 'src/socket/hooks/useSocketContext';

import Iconify from 'src/components/iconify';
import { enqueueSnackbar } from 'notistack';

const FirstDraftFileTypeModal = ({ submission, campaign, open, handleClose, onSelectType }) => {
  const smUp = useResponsive('up', 'sm');
  const { socket } = useSocketContext();
  const { mutate: submissionMutate } = useGetSubmissions(
    submission?.userId,
    submission?.campaignId
  );

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

  useEffect(() => {
    if (socket) {
      socket.on('updateSubmission', () => {
        submissionMutate();
      });
    }

    return () => {
      socket?.off('updateSubmission', submissionMutate);
    };
  }, [socket, submissionMutate]);

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
                  borderColor: type.disabled ? grey[700] : grey[700],
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

const FinalDraftFileTypeModal = ({
  submission,
  previousSubmission,
  open,
  handleClose,
  onSelectType,
  deliverablesData,
}) => {
  const smUp = useResponsive('up', 'sm');

  const { deliverables } = deliverablesData;

  const { socket } = useSocketContext();

  const { mutate: submissionMutate } = useGetSubmissions(
    submission?.userId,
    submission?.campaignId
  );

  const deliverablesToUpdate = useMemo(() => {
    const videosToUpdate = deliverables?.videos.filter((x) => x.status === 'REVISION_REQUESTED');

    const rawFootageToUpdate = deliverables?.rawFootages.filter(
      (x) => x.status === 'REVISION_REQUESTED'
    );
    const photosToUpdate = deliverables?.photos.filter((x) => x.status === 'REVISION_REQUESTED');

    return { videosToUpdate, rawFootageToUpdate, photosToUpdate };
  }, [deliverables]);

  // Check if the required files have been uploaded in the current submission
  const hasUploadedRequiredVideos = deliverablesToUpdate.videosToUpdate.length
    ? deliverables?.videos?.length === deliverablesToUpdate.videosToUpdate.length
    : false;

  const hasUploadedRequiredRawFootage =
    deliverablesToUpdate.rawFootageToUpdate.length > 0
      ? deliverables?.rawFootages?.length === deliverablesToUpdate.rawFootageToUpdate.length
      : false;

  const hasUploadedRequiredPhotos =
    deliverablesToUpdate.photosToUpdate.length > 0
      ? deliverables?.photos?.length === deliverablesToUpdate.photosToUpdate.length
      : false;

  const fileTypes = [
    {
      type: 'video',
      icon: 'solar:video-library-bold',
      title: 'Draft Video',
      description:
        deliverablesToUpdate.videosToUpdate.length > 0
          ? `Re-upload ${deliverablesToUpdate.videosToUpdate.length} draft video(s)`
          : 'Upload your main draft video for the campaign',
      needsUpdate: deliverablesToUpdate.videosToUpdate.length > 0,
      isUploaded: hasUploadedRequiredVideos,
      disabled: hasUploadedRequiredVideos || submission?.status === 'PENDING_REVIEW',
      count: deliverablesToUpdate.videosToUpdate.length,
    },
    {
      type: 'rawFootage',
      icon: 'solar:camera-bold',
      title: 'Raw Footage',
      description:
        deliverablesToUpdate.rawFootageToUpdate.length > 0
          ? `Re-upload ${deliverablesToUpdate.rawFootageToUpdate.length} raw footage file(s)`
          : 'Upload raw, unedited footage from your shoot',
      needsUpdate: deliverablesToUpdate.rawFootageToUpdate.length > 0,
      isUploaded: hasUploadedRequiredRawFootage,
      disabled: hasUploadedRequiredRawFootage || submission?.status === 'PENDING_REVIEW',
      count: deliverablesToUpdate.rawFootageToUpdate.length,
    },
    {
      type: 'photos',
      icon: 'solar:gallery-wide-bold',
      title: 'Photos',
      description:
        deliverablesToUpdate.photosToUpdate.length > 0
          ? `Re-upload ${deliverablesToUpdate.photosToUpdate.length} photo(s)`
          : 'Upload photos from your campaign shoot',
      needsUpdate: deliverablesToUpdate.photosToUpdate.length > 0,
      isUploaded: hasUploadedRequiredPhotos,
      disabled: hasUploadedRequiredPhotos || submission?.status === 'PENDING_REVIEW',
      count: deliverablesToUpdate.photosToUpdate.length,
    },
  ];

  // Only show file types that need updates
  const filteredFileTypes = fileTypes.filter((type) => {
    if (type.type === 'video' && deliverablesToUpdate.videosToUpdate.length > 0) return true;
    if (type.type === 'rawFootage' && deliverablesToUpdate.rawFootageToUpdate.length > 0)
      return true;
    if (type.type === 'photos' && deliverablesToUpdate.photosToUpdate.length > 0) return true;
    return false;
  });

  useEffect(() => {
    if (socket) {
      socket.on('updateSubmission', () => {
        submissionMutate();
      });
    }

    return () => {
      socket?.off('updateSubmission', submissionMutate);
    };
  }, [socket, submissionMutate]);

  return (
    <Dialog open={open} fullScreen={!smUp} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="flex-start" gap={2}>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontFamily: 'Instrument Serif, serif',
                fontSize: { xs: '1.8rem', sm: '2.4rem' },
                fontWeight: 550,
              }}
            >
              Re-upload Required Files 📤
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Please re-upload all the files that require changes based on admin feedback.
            </Typography>
          </Box>

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
      </DialogTitle>
      <DialogContent>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
          gap={2}
          pb={4}
          mt={2}
        >
          {filteredFileTypes.map((type) => (
            <Box
              key={type.type}
              sx={{
                position: 'relative',
                border: 1,
                p: 2,
                borderRadius: 2,
                borderColor: type.isUploaded ? '#5abc6f' : '#ff3b30',
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
                  borderColor: type.disabled ? '#5abc6f' : '#ff3b30',
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
              {type.isUploaded ? (
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
              ) : (
                type.needsUpdate && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -10,
                      right: -10,
                      bgcolor: '#ff3b30',
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
                    <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
                      {type.count}
                    </Typography>
                  </Box>
                )
              )}
              <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Avatar
                  sx={{
                    bgcolor: type.isUploaded ? '#5abc6f' : '#ff3b30',
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
                  secondary={type.isUploaded ? 'Already uploaded' : type.description}
                  primaryTypographyProps={{
                    variant: 'body1',
                    fontWeight: 'bold',
                    gutterBottom: true,
                    sx: { mb: 1 },
                  }}
                  secondaryTypographyProps={{
                    color: type.isUploaded ? 'success.main' : 'error.main',
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

export { FirstDraftFileTypeModal, FinalDraftFileTypeModal };

FirstDraftFileTypeModal.propTypes = {
  submission: PropTypes.object,
  campaign: PropTypes.object,
  onSelectType: PropTypes.func,
  open: PropTypes.bool,
  handleClose: PropTypes.func,
};

FinalDraftFileTypeModal.propTypes = {
  submission: PropTypes.object,
  previousSubmission: PropTypes.object,
  onSelectType: PropTypes.func,
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  deliverablesData: PropTypes.object,
};
