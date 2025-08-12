import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Stack,
  Dialog,
  Typography,
  IconButton,
  DialogTitle,
  DialogActions,
  DialogContent,
  LinearProgress,
  CircularProgress,
} from '@mui/material';

import socket from 'src/hooks/socket';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFUpload, RHFTextField } from 'src/components/hook-form';

const UploadDraftVideoModal = ({
  submissionId,
  campaign,
  open,
  onClose,
  previousSubmission,
  totalUGCVideos,
  submission,
  deliverablesData,
}) => {
  const methods = useForm({
    defaultValues: {
      draftVideo: [],
      caption: previousSubmission?.caption || '',
    },
  });

  const { deliverableMutate } = deliverablesData;

  const { handleSubmit, reset } = methods;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const videosToUpdateCount =
    totalUGCVideos ||
    submission?.video.filter((x) => x.status === 'REVISION_REQUESTED')?.length ||
    previousSubmission?.video.filter((x) => x.status === 'REVISION_REQUESTED')?.length ||
    1;

  const validateFileCount = (files) => {
    if (previousSubmission?.status === 'CHANGES_REQUIRED') {
      if (files.length !== videosToUpdateCount) {
        enqueueSnackbar(
          `Please upload exactly ${videosToUpdateCount} video${videosToUpdateCount > 1 ? 's' : ''}.`,
          { variant: 'error' }
        );
        return false;
      }
    }
    return true;
  };

  const isV3 = campaign?.origin === 'CLIENT';

  // Socket.io progress handling
  useEffect(() => {
    if (!socket || !submissionId) return;

    const handleProgress = (data) => {
      console.log('Progress received:', data);
      setUploadProgress((prev) => {
        const exists = prev.some((item) => item.fileName === data.fileName);

        if (exists) {
          return prev.map((item) =>
            item.fileName === data.fileName ? { ...item, ...data } : item
          );
        }
        return [...prev, data];
      });
    };

    socket.on('progress', handleProgress);

    return () => {
      socket.off('progress', handleProgress);
    };
  }, [socket, submissionId]);

  // Check if all uploads are complete
  const checkProgress = useCallback(() => {
    if (uploadProgress?.length && uploadProgress?.every((x) => x.progress === 100)) {
      const timer = setTimeout(() => {
        setIsProcessing(false);
        reset();
        setUploadProgress([]);
        
        // Refresh data
        mutate(endpoints.kanban.root);
        deliverableMutate();
        mutate(endpoints.campaign.creator.getCampaign(campaign?.id));
        
        enqueueSnackbar('Upload completed successfully!', { variant: 'success' });
      }, 2000);

      return () => {
        clearTimeout(timer);
      };
    }
    return null;
  }, [uploadProgress, reset, campaign?.id, deliverableMutate]);

  useEffect(() => {
    checkProgress();
  }, [checkProgress]);

  const onSubmit = handleSubmit(async (data) => {
    if (!data?.draftVideo?.length) {
      enqueueSnackbar(`Upload a video in order to proceed`, {
        variant: 'error',
      });
      return;
    }

    if (!validateFileCount(data.draftVideo)) {
      return;
    }

    if (totalUGCVideos && data.draftVideo.length !== totalUGCVideos) {
      enqueueSnackbar(`You need to upload ${totalUGCVideos} UGC Videos`, {
        variant: 'error',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setIsProcessing(true);
      setUploadProgress([]);
      
      const formData = new FormData();
      const newData = { caption: data.caption, submissionId };
      formData.append('data', JSON.stringify(newData));

      // Handle multiple files
      if (data.draftVideo && data.draftVideo.length > 0) {
        data.draftVideo.forEach((file) => {
          formData.append('draftVideo', file);
        });
      }
      
      console.log('CAMPAIGN:', campaign);
      console.log('isV3:', isV3);
      const endpoint = isV3
        ? endpoints.submission.v3.submitDraft
        : endpoints.submission.creator.draftSubmission;
      console.log('Using endpoint:', endpoint);
      
      await axiosInstance.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      enqueueSnackbar('Draft videos are processing');
      // Close modal immediately so creator can see progress on main page
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to upload draft videos';
      enqueueSnackbar(errorMessage, { variant: 'error' });
      setIsProcessing(false);
    } finally {
      setIsSubmitting(false);
    }
  });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k**i).toFixed(2))  } ${  sizes[i]}`;
  };

  const truncateText = (text, maxLength) =>
    text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle sx={{ bgcolor: '#f4f4f4' }}>
        <Stack direction="row" alignItems="center" gap={2}>
          <Typography
            variant="h5"
            sx={{
              fontFamily: 'Instrument Serif, serif',
              fontSize: { xs: '1.8rem', sm: '2.4rem' },
              fontWeight: 550,
            }}
          >
            Upload Draft Videos
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{
              ml: 'auto',
              color: '#636366',
            }}
          >
            <Iconify icon="hugeicons:cancel-01" width={20} />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ bgcolor: '#f4f4f4', pt: 3 }}>
        {/* Progress Display */}
        {isProcessing && uploadProgress.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, color: '#221f20' }}>
              Processing Uploads...
            </Typography>
            <Stack spacing={2}>
              {uploadProgress.map((currentFile) => (
                <Box
                  sx={{ p: 3, bgcolor: 'background.neutral', borderRadius: 2 }}
                  key={currentFile.fileName}
                >
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      {currentFile?.type?.startsWith('video') ? (
                        <Box
                          sx={{
                            width: 120,
                            height: 68,
                            borderRadius: 1,
                            overflow: 'hidden',
                            position: 'relative',
                            bgcolor: 'background.paper',
                            boxShadow: (theme) => theme.customShadows.z8,
                          }}
                        >
                          <Box
                            sx={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: 'background.neutral',
                            }}
                          >
                            <Iconify
                              icon="solar:video-library-bold"
                              width={24}
                              sx={{ color: 'text.secondary' }}
                            />
                          </Box>
                        </Box>
                      ) : (
                        <Box
                          component="img"
                          src="/assets/icons/files/ic_img.svg"
                          sx={{ width: 40, height: 40 }}
                        />
                      )}

                      <Stack spacing={1} flexGrow={1}>
                        <Typography variant="subtitle2" noWrap>
                          {truncateText(currentFile?.fileName || 'Processing file...', 50)}
                        </Typography>
                        <Stack spacing={1}>
                          <LinearProgress
                            variant="determinate"
                            value={currentFile?.progress || 0}
                            sx={{
                              height: 6,
                              borderRadius: 1,
                              bgcolor: 'background.paper',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 1,
                                bgcolor: currentFile?.progress === 100 ? 'success.main' : 'primary.main',
                              },
                            }}
                          />
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {currentFile?.progress === 100 ? (
                                <Box
                                  component="span"
                                  sx={{ color: 'success.main', fontWeight: 600 }}
                                >
                                  Processing Complete
                                </Box>
                              ) : (
                                `Processing... ${currentFile?.progress || 0}%`
                              )}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {formatFileSize(currentFile?.fileSize || 0)}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Stack>
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {campaign?.ads && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: 'warning.main',
                bgcolor: 'warning.lighter',
                p: 1.5,
                borderRadius: 1,
                fontWeight: 500,
              }}
            >
              <Iconify
                icon="solar:bell-bing-bold-duotone"
                width={16}
                sx={{ mr: 0.5, verticalAlign: 'text-bottom' }}
              />
              UGC Draft Videos may also be used as Ads.
            </Typography>
          </Box>
        )}

        {totalUGCVideos && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: 'info.main',
                bgcolor: 'info.lighter',
                p: 1.5,
                borderRadius: 1,
                fontWeight: 500,
              }}
            >
              <Iconify
                icon="solar:info-circle-bold-duotone"
                width={16}
                sx={{ mr: 0.5, verticalAlign: 'text-bottom' }}
              />
              You are required to upload <span style={{ color: 'info.main', fontWeight: 600 }}>{totalUGCVideos} UGC {totalUGCVideos === 1 ? 'Video' : 'Videos'}.</span>
            </Typography>
          </Box>
        )}

        {previousSubmission?.status === 'CHANGES_REQUIRED' && (
          <Typography variant="body2" sx={{ color: 'warning.main', mb: 2 }}>
            Please upload exactly {videosToUpdateCount} video{videosToUpdateCount > 1 ? 's' : ''} as
            requested by the admin.
          </Typography>
        )}

        <FormProvider methods={methods}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" sx={{ color: '#636366', mb: 1 }}>
                Upload Videos{' '}
                <Box component="span" sx={{ color: 'error.main' }}>
                  *
                </Box>
              </Typography>
              <RHFUpload
                name="draftVideo"
                type="video"
                multiple
                accept={{ 'video/*': [] }}
                maxFiles={videosToUpdateCount}
              />
            </Box>
            <RHFTextField
              name="caption"
              label="Caption"
              multiline
              rows={3}
              sx={{ bgcolor: 'white', borderRadius: 1 }}
            />
          </Stack>
        </FormProvider>
      </DialogContent>
      <DialogActions sx={{ bgcolor: '#f4f4f4' }}>
        <LoadingButton
          fullWidth
          loading={isSubmitting}
          loadingPosition="center"
          loadingIndicator={<CircularProgress color="inherit" size={24} />}
          variant="contained"
          onClick={onSubmit}
          disabled={isProcessing}
          sx={{
            bgcolor: '#203ff5',
            color: 'white',
            borderBottom: 3.5,
            borderBottomColor: '#112286',
            borderRadius: 1.5,
            px: 2.5,
            py: 1.2,
            '&:hover': {
              bgcolor: '#203ff5',
              opacity: 0.9,
            },
          }}
        >
          {isProcessing ? 'Processing...' : 'Upload Videos'}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default UploadDraftVideoModal;

UploadDraftVideoModal.propTypes = {
  submissionId: PropTypes.string,
  campaign: PropTypes.object,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  previousSubmission: PropTypes.object,
  totalUGCVideos: PropTypes.number,
  submission: PropTypes.object,
  deliverablesData: PropTypes.object,
};
