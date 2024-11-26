/* eslint-disable no-plusplus */
import axios from 'axios';
import * as Yup from 'yup';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import 'react-quill/dist/quill.snow.css';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import React, { useRef, useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Stack,
  Button,
  Dialog,
  Divider,
  IconButton,
  DialogTitle,
  ListItemText,
  DialogActions,
  DialogContent,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Iconify from 'src/components/iconify';
import UploadPitch from 'src/components/pitch/upload-pitch';
import AvatarIcon from 'src/components/avatar-icon/avatar-icon';
import FormProvider from 'src/components/hook-form/form-provider';

const CampaignPitchVideoModal = ({ open, handleClose, campaign }) => {
  const sources = useRef(null);
  const smUp = useResponsive('sm', 'down');
  const [source, setSource] = useState([]);
  const [sourceName, setSourceName] = useState('');
  const [progress, setProgress] = useState([]);
  const [size, setSize] = useState('');
  const [loading, setLoading] = useState(false);
  const { socket } = useSocketContext();
  const confirm = useBoolean();
  const { user } = useAuthContext();
  const removeVideo = useBoolean();

  const schema = Yup.object().shape({
    pitchVideo: Yup.string().required('Pitch video is required'),
  });

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      pitchVideo: '',
    },
  });

  const { handleSubmit, setValue, watch } = methods;

  const a = watch('pitchVideo');

  const onSubmit = handleSubmit(async (data) => {
    try {
      setLoading(true);
      const res = await axiosInstance.patch(endpoints.campaign.pitch.root, {
        campaignId: campaign.id,
        content: source.find((item) => item.campaignId === campaign?.id)?.url,
        type: 'video',
        status: 'undecided',
      });

      mutate(endpoints.auth.me);
      mutate(endpoints.campaign.getMatchedCampaign);
      enqueueSnackbar(res?.data?.message);
      confirm.onFalse();
      handleClose();
    } catch (error) {
      console.error('Error submitting pitch:', error);
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  });

  const handleDropSingleFile = async (e) => {
    if (e) {
      const url = URL.createObjectURL(e[0]);

      // Create a video element to read the duration
      const videoElement = document.createElement('video');
      videoElement.src = url;

      // eslint-disable-next-line consistent-return
      videoElement.addEventListener('loadedmetadata', async () => {
        if (videoElement.duration >= 30) {
          enqueueSnackbar('Video is too long. Please make sure the video is 30 seconds or less', {
            variant: 'warning',
          });
          return;
        }

        setSource((prev) => [...prev, { campaignId: campaign?.id, url }]);
        setSourceName(e[0].path);

        const formData = new FormData();
        formData.append('campaignId', campaign?.id);
        formData.append('pitchVideo', e[0]);

        sources.current = axios.CancelToken.source();

        try {
          // eslint-disable-next-line no-await-in-loop
          await axiosInstance.post('/api/campaign/uploadVideo', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            cancelToken: sources.current.token,
          });

          // if (data.publicUrl) {
          //   setValue('pitchVideo', data.publicUrl);
          // }

          // setSource(data.publicUrl);
        } catch (error) {
          if (axios.isCancel(error)) {
            console.log('Request canceled:', error.message);
          } else {
            console.error('Error:', error);
          }
        }
      });
    }
  };

  const updateProgress = (data) => {
    setProgress((prev) => {
      const existingData = prev.some((item) => item?.campaignId === data.campaignId);

      if (existingData) {
        return prev.map((val) =>
          val.campaignId === data.campaignId ? { ...val, progress: data.progress } : val
        );
      }
      return [...prev, { campaignId: data.campaignId, progress: data.progress }];
    });
  };

  const uploadDone = (data) => {
    setProgress((prev) => prev.filter((item) => item.campaignId !== data.campaignId));
  };

  const updateVideo = useCallback(
    (data) => {
      setProgress((prev) => prev.filter((item) => item.campaignId !== data.campaignId));
      setSource((prev) =>
        prev.map((item) =>
          item.campaignId === data.campaignId ? { ...item, url: data.video } : item
        )
      );
      setSize(data.size);
      setValue('pitchVideo', data.video);
    },
    [setValue]
  );

  const handleProgress = () => {
    if (progress && progress.some((elem) => elem.campaignId === campaign.id)) {
      return {
        progress: `${Math.floor(progress.find((item) => item.campaignId === campaign.id).progress)}%`,
      };
    }
    return null;
  };

  const handleRemove = async () => {
    if (sources.current) {
      sources.current.cancel('Cancel');
      sources.current = null;
    }
    try {
      removeVideo.onTrue();
      await axiosInstance.patch('/api/campaign/removePitchVideo', {
        userId: user.id,
        campaignId: campaign.id,
      });
      setSource((prev) => prev.filter((item) => item.campaignId !== campaign.id));
      setValue('pitchVideo', null);
      socket?.off('video-upload', updateProgress);
      socket?.off('video-upload-done', uploadDone);
    } catch (error) {
      enqueueSnackbar('Error removing video', {
        variant: 'error',
      });
    } finally {
      removeVideo.onFalse();
    }
  };

  useEffect(() => {
    socket?.on('video-upload', updateProgress);
    socket?.on('video-upload-done', updateVideo);

    return () => {
      socket?.off('video-upload', updateProgress);
      socket?.off('video-upload-done', updateVideo);
    };
  }, [socket, updateVideo]);

  const modalConfirmation = (
    <Dialog
      open={confirm.value}
      onClose={confirm.onFalse}
      PaperProps={{
        sx: {
          width: '400px',
          maxHeight: '200px',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1.2, fontSize: '1.25rem' }}>You have a uploaded video</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            fontWeight: 500,
            color: 'text.secondary',
            fontSize: '0.95rem',
            pb: 1,
          }}
        >
          Confirm to remove ?
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'flex-end' }}>
        <Button
          onClick={confirm.onFalse}
          variant="outlined"
          sx={{
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
            padding: { xs: '6px 12px', sm: '8px 16px' },
            height: { xs: '32px', sm: '36px' },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            setValue('pitchVideo', null);
            setSource('');
            handleClose();
            confirm.onFalse();
          }}
          sx={{
            background: 'linear-gradient(to bottom, #7d54fe, #5131ff)',
            color: 'white',
            border: '1px solid #3300c3',
            '&:hover': {
              background: 'linear-gradient(to bottom, #6a46e5, #4628e6)',
            },
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
            padding: { xs: '6px 12px', sm: '8px 16px' },
            height: { xs: '32px', sm: '36px' },
          }}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <>
      <Dialog open={open} fullWidth maxWidth="md" fullScreen={smUp}>
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <DialogTitle>
            <Stack direction="row" alignItems="center" gap={2}>
              <AvatarIcon icon="akar-icons:video" />
              <ListItemText
                primary="Video Pitch"
                secondary="Record a short video message on how you’d fit for the campaign!"
                primaryTypographyProps={{
                  variant: 'h5',
                  fontWeight: 'bold',
                }}
                secondaryTypographyProps={{
                  variant: 'body1',
                  color: 'text.secondary',
                  lineHeight: 1.2,
                }}
              />

              <IconButton
                onClick={() => {
                  handleClose();
                }}
              >
                <Iconify icon="hugeicons:cancel-01" width={20} />
              </IconButton>
            </Stack>
          </DialogTitle>

          <Divider
            sx={{
              width: '95%',
              mx: 'auto',
            }}
          />

          <Box p={2}>
            <UploadPitch
              name="pitchVideo"
              type="video"
              onDrop={handleDropSingleFile}
              handleProgress={handleProgress}
              source={source?.find((item) => item.campaignId === campaign.id)?.url}
              sourceName={sourceName}
              remove={handleRemove}
              size={size}
              removeVideo={removeVideo}
            />
          </Box>

          <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'flex-end' }}>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  handleClose();
                  handleRemove();
                }}
                sx={{
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  padding: { xs: '6px 12px', sm: '8px 16px' },
                  height: { xs: '32px', sm: '36px' },
                }}
              >
                Cancel
              </Button>
              <LoadingButton
                autoFocus
                variant="contained"
                type="submit"
                loading={loading}
                disabled={progress.some((elem) => elem.campaignId === campaign.id) || !a}
                sx={{
                  backgroundColor: '#203ff5',
                  color: 'white',
                  borderBottom: '3px solid',
                  borderBottomColor: (progress.some((elem) => elem.campaignId === campaign.id) || !a) ? 'rgba(0, 0, 0, 0.12)' : '#1429a0',
                  '&:hover': {
                    backgroundColor: '#4259f7',
                  },
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  padding: { xs: '6px 12px', sm: '8px 16px' },
                  height: { xs: '32px', sm: '36px' },
                }}
              >
                Send Pitch
              </LoadingButton>
            </Box>
          </DialogActions>
        </FormProvider>
      </Dialog>
      {modalConfirmation}
    </>
  );
};

export default CampaignPitchVideoModal;

CampaignPitchVideoModal.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  campaign: PropTypes.object,
};
