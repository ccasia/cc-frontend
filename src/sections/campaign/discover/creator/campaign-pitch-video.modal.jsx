/* eslint-disable no-plusplus */
import axios from 'axios';
import * as Yup from 'yup';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import 'react-quill/dist/quill.snow.css';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import React, { useRef, useState, useEffect } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Stack,
  Paper,
  alpha,
  Button,
  Dialog,
  Typography,
  DialogTitle,
  ListItemText,
  DialogActions,
} from '@mui/material';

import { useResponsive } from 'src/hooks/use-responsive';

import axiosInstance, { endpoints } from 'src/utils/axios';

import useSocketContext from 'src/socket/hooks/useSocketContext';

import Iconify from 'src/components/iconify';
import { RHFUpload } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

const CampaignPitchVideoModal = ({ open, handleClose, campaign }) => {
  const sources = useRef(null);
  const smUp = useResponsive('sm', 'down');
  const [source, setSource] = useState(undefined);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState();
  const { socket } = useSocketContext();

  const schema = Yup.object().shape({
    // pitchVideo: required('Pitch Script is required'),
    pitchVideo: Yup.mixed().required('Pitch video is required'),
  });

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      pitchVideo: '',
    },
  });

  const { handleSubmit, setValue, watch } = methods;

  const onSubmit = handleSubmit(async (data) => {
    // const formData = new FormData();
    // formData.append('campaignId', campaign?.id);
    // formData.append('pitchVideo', data.pitchVideo);

    // try {
    //   setLoading(true);

    //   const res = await axiosInstance.patch(endpoints.campaign.pitch.root, formData, {
    //     headers: {
    //       'Content-Type': 'application/x-www-form-urlencoded',
    //     },
    //   });

    //   enqueueSnackbar(res?.data?.message);
    //   handleClose();
    // } catch (error) {
    //   enqueueSnackbar(error?.message, {
    //     variant: 'error',
    //   });
    // } finally {
    //   setLoading(false);
    // }

    try {
      setLoading(true);
      const res = await axiosInstance.patch(endpoints.campaign.pitch.root, {
        campaignId: campaign.id,
        content: data.pitchVideo,
        type: 'video',
      });
      mutate(endpoints.campaign.getMatchedCampaign);
      enqueueSnackbar(res?.data?.message);
      handleClose();
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  });

  const handleLoadedMetadata = (event) => {
    const videoDuration = event.target.duration;
    setDuration(videoDuration);
  };

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
        setSource(url);
        setValue('pitchVideo', e[0]);
        const formData = new FormData();
        formData.append('campaignId', campaign?.id);
        formData.append('pitchVideo', e[0]);

        sources.current = axios.CancelToken.source();

        try {
          // eslint-disable-next-line no-await-in-loop
          const { data } = await axiosInstance.post('/api/campaign/uploadVideo', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            cancelToken: sources.current.token,
          });

          setValue('pitchVideo', data.publicUrl);
          setSource(data.publicUrl);
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

  const handleRemove = () => {
    if (sources.current) {
      sources.current.cancel('Cancel');
      sources.current = null;
    }
    setSource(undefined);
    setValue('pitchVideo', null);
    socket.off('video-upload', updateProgress);
    socket.off('video-upload-done', uploadDone);
  };

  useEffect(() => {
    socket.on('video-upload', updateProgress);
    socket.on('video-upload-done', uploadDone);

    return () => {
      socket.off('video-upload', updateProgress);
      socket.off('video-upload-done', uploadDone);
    };
  }, [socket]);

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md" fullScreen={smUp}>
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogTitle>
          <ListItemText
            primary="Upload Your Pitching Video"
            secondary="Video should be less than 30 seconds"
            primaryTypographyProps={{
              variant: 'h6',
            }}
            secondaryTypographyProps={{
              variant: 'caption',
            }}
          />
        </DialogTitle>
        <Box p={2}>
          <RHFUpload
            name="pitchVideo"
            type="video"
            onDrop={handleDropSingleFile}
            // onDelete={() => setValue('singleUpload', null, { shouldValidate: true })}
          />
        </Box>
        {source && (
          <Stack p={2} gap={2}>
            <Stack direction="row" justifyContent="space-between" px={4} alignItems="center">
              <Typography variant="h5">Preview</Typography>
              <Button
                startIcon={<Iconify icon="pajamas:remove" />}
                color="error"
                onClick={handleRemove}
              >
                Remove
              </Button>
            </Stack>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              autoPlay
              style={{ width: '90%', borderRadius: 10, margin: 'auto' }}
              controls
              onLoadedMetadata={handleLoadedMetadata}
            >
              <source src={source} />
            </video>
            {progress && progress.some((elem) => elem.campaignId === campaign.id) && (
              <Box
                component={Paper}
                sx={{
                  bgcolor: (theme) => alpha(theme.palette.warning.main, 0.2),
                  p: 1.5,
                  mx: 4,
                }}
              >
                <Typography>
                  Uploading {watch('pitchVideo').path}{' '}
                  {Math.floor(progress.find((item) => item.campaignId === campaign.id).progress)}%
                </Typography>
              </Box>
            )}
          </Stack>
        )}

        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          {/* {progress.some((elem) => elem.campaignId === campaign.id)} */}
          <LoadingButton
            autoFocus
            variant="contained"
            startIcon={<Iconify icon="ph:paper-plane-tilt-bold" width={20} />}
            type="submit"
            loading={loading}
            disabled={progress.some((elem) => elem.campaignId === campaign.id)}
          >
            Pitch
          </LoadingButton>
          {/* {progress && progress.some((elem) => elem.campaignId === campaign.id) ? (
            <LoadingButton
              autoFocus
              variant="contained"
              startIcon={<Iconify icon="ph:paper-plane-tilt-bold" width={20} />}
              type="submit"
              loading={loading}
            >
              Uploading{' '}
              {Math.floor(progress.find((item) => item.campaignId === campaign.id).progress)}%
            </LoadingButton>
          ) : (
            <LoadingButton
              autoFocus
              variant="contained"
              startIcon={<Iconify icon="ph:paper-plane-tilt-bold" width={20} />}
              type="submit"
              loading={loading}
            >
              Pitch
            </LoadingButton>
          )} */}
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
};

export default CampaignPitchVideoModal;

CampaignPitchVideoModal.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  campaign: PropTypes.object,
};
