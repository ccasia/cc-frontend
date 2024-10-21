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
        content: source?.find((item) => item.campaignId === campaign?.id)?.url,
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

        setSource((prev) => [...prev, { campaignId: campaign.id, url }]);

        // setSource((prev) =>
        //   prev.map((item) => (item.campaignId === campaign.id ? { ...item, url } : item))
        // );
        setSourceName(e[0].path);

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

          if (data.publicUrl) {
            setValue('pitchVideo', data.publicUrl);
          }

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
      // setSource(data.video);
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

  const handleRemove = () => {
    if (sources.current) {
      sources.current.cancel('Cancel');
      sources.current = null;
    }
    setSource((prev) => prev.filter((item) => item?.campaignId !== campaign.id));
    // setSource(undefined);
    setValue('pitchVideo', '');
    socket?.off('video-upload', updateProgress);
    socket?.off('video-upload-done', uploadDone);
  };

  useEffect(() => {
    socket?.on('video-upload', updateProgress);
    socket?.on('video-upload-done', updateVideo);

    return () => {
      socket?.off('video-upload', updateProgress);
      socket?.off('video-upload-done', updateVideo);
    };
  }, [socket, updateVideo]);

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
                  // if (source?.find((item) => item.campaignId === campaign.id)?.url) {
                  //   confirm.onTrue();
                  // } else {
                  handleClose();
                  // handleRemove();
                  // }
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
            />
          </Box>

          <DialogActions>
            <LoadingButton
              autoFocus
              variant="contained"
              startIcon={<Iconify icon="ph:paper-plane-tilt-bold" width={20} />}
              type="submit"
              loading={loading}
              disabled={progress.some((elem) => elem.campaignId === campaign.id) || !a}
            >
              Pitch
            </LoadingButton>
          </DialogActions>
        </FormProvider>
      </Dialog>
      <Dialog open={confirm.value} onClose={confirm.onFalse}>
        <DialogTitle>You have a uploaded video</DialogTitle>
        <DialogContent>Confirm to remove ?</DialogContent>
        <DialogActions>
          <Button onClick={confirm.onFalse} size="small" variant="outlined">
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            color="error"
            onClick={() => {
              setValue('pitchVideo', null);
              setSource((prev) => prev.filter((item) => item?.campaignId !== campaign.id));
              // setSource('');
              handleClose();
              confirm.onFalse();
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CampaignPitchVideoModal;

CampaignPitchVideoModal.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  campaign: PropTypes.object,
};
