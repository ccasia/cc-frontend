/* eslint-disable jsx-a11y/media-has-caption */
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import React, { useMemo, useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Stack,
  Paper,
  Alert,
  Button,
  Dialog,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Image from 'src/components/image';
import Label from 'src/components/label';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFUpload, RHFTextField } from 'src/components/hook-form';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent, {
  timelineOppositeContentClasses,
} from '@mui/lab/TimelineOppositeContent';
import dayjs from 'dayjs';

const CampaignFinalDraft = ({ campaign, timeline, submission, getDependency, fullSubmission }) => {
  // eslint-disable-next-line no-unused-vars
  const [preview, setPreview] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressName, setProgressName] = useState('');
  const [loading, setLoading] = useState(false);
  const dependency = getDependency(submission?.id);
  const { socket } = useSocketContext();
  const [progress, setProgress] = useState(0);
  const display = useBoolean();

  console.log(submission?.feedback);

  const { user } = useAuthContext();

  const methods = useForm();

  const { handleSubmit, setValue, reset } = methods;

  const handleRemoveFile = () => {
    setValue('draft', '');
    setPreview('');
    localStorage.removeItem('preview');
  };

  const handleDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];

      // if (file.type !== 'video/mp4') {
      //   enqueueSnackbar(
      //     'Currently, only MP4 video format is supported. Please upload your video in MP4 format.',
      //     {
      //       variant: 'warning',
      //     }
      //   );
      //   return;
      // }

      const newFile = Object.assign(file, {
        preview: URL.createObjectURL(file),
      });

      setPreview(newFile.preview);
      localStorage.setItem('preview', newFile.preview);

      if (file) {
        setValue('draft', newFile, { shouldValidate: true });
      }
    },
    [setValue]
  );

  const onSubmit = handleSubmit(async (value) => {
    setLoading(true);
    const formData = new FormData();
    const newData = { ...value, campaignId: campaign.id, submissionId: submission.id };
    formData.append('data', JSON.stringify(newData));
    formData.append('draftVideo', value.draft);
    try {
      const res = await axiosInstance.post(endpoints.submission.creator.draftSubmission, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      enqueueSnackbar(res.data.message);
      mutate(endpoints.kanban.root);
      mutate(endpoints.campaign.creator.getCampaign(campaign.id));
    } catch (error) {
      console.log(error);
      enqueueSnackbar('Failed to submit draft', {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  });

  const previewSubmission = useMemo(
    () => fullSubmission?.find((item) => item?.id === dependency?.dependentSubmissionId),
    [fullSubmission, dependency]
  );

  useEffect(() => {
    if (socket) {
      socket?.on('progress', (data) => {
        if (submission?.id === data.submissionId) {
          setIsProcessing(true);
          setProgress(data.progress);

          if (data.progress === 100) {
            mutate(`${endpoints.submission.root}?creatorId=${user?.id}&campaignId=${campaign?.id}`);
            setIsProcessing(false);
            reset();
            setPreview('');
            setProgressName('');
            localStorage.removeItem('preview');
          } else if (progress === 0) {
            setIsProcessing(false);
            reset();
            setPreview('');
            setProgressName('');
            localStorage.removeItem('preview');
          }
        }
      });
    }
    return () => {
      socket?.off('progress');
    };
  }, [socket, submission, reset, progress, campaign, user]);

  const handleCancel = () => {
    if (isProcessing) {
      socket?.emit('cancel-processing', { submissionId: submission.id });
      setIsProcessing(false);
      setProgress(0);
      localStorage.removeItem('preview');
    }
  };

  return (
    previewSubmission?.status === 'CHANGES_REQUIRED' && (
      <Box>
        {submission?.status === 'PENDING_REVIEW' && (
          <Stack justifyContent="center" alignItems="center" spacing={2}>
            <Image src="/assets/pending.svg" sx={{ width: 250 }} />
            <Typography variant="subtitle2">Your Final Draft is in review.</Typography>
            <Button onClick={display.onTrue}>Preview Draft</Button>
          </Stack>
        )}
        {submission?.status === 'IN_PROGRESS' && (
          <>
            {isProcessing ? (
              // <Stack gap={1}>
              //   <Typography variant="caption">{progressName && progressName}</Typography>
              //   <LinearProgress variant="determinate" value={progress} />
              //   <Button variant="contained" size="small" onClick={() => handleCancel()}>
              //     Cancel
              //   </Button>
              // </Stack>
              <Stack justifyContent="center" alignItems="center" gap={1}>
                <Box
                  sx={{
                    position: 'relative',
                    display: 'inline-flex',
                  }}
                >
                  <CircularProgress
                    variant="determinate"
                    thickness={5}
                    value={progress}
                    size={200}
                    sx={{
                      ' .MuiCircularProgress-circle': {
                        stroke: (theme) =>
                          theme.palette.mode === 'dark'
                            ? theme.palette.common.white
                            : theme.palette.common.black,
                        strokeLinecap: 'round',
                      },
                    }}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="h3" sx={{ fontWeight: 'bolder', fontSize: 11 }}>
                      {`${Math.round(progress)}%`}
                    </Typography>
                  </Box>
                </Box>
                <Stack gap={1}>
                  <Typography variant="caption">{progressName && progressName}</Typography>
                  {/* <LinearProgress variant="determinate" value={progress} /> */}

                  <Button variant="contained" size="small" onClick={() => handleCancel()}>
                    Cancel
                  </Button>
                </Stack>
              </Stack>
            ) : (
              <FormProvider methods={methods} onSubmit={onSubmit}>
                <Stack gap={2}>
                  {localStorage.getItem('preview') ? (
                    <Box>
                      {/* // eslint-disable-next-line jsx-a11y/media-has-caption */}
                      <video autoPlay controls width="100%" style={{ borderRadius: 10 }}>
                        <source src={localStorage.getItem('preview')} />
                      </video>
                      <Button
                        color="error"
                        variant="outlined"
                        size="small"
                        onClick={handleRemoveFile}
                      >
                        Change Video
                      </Button>
                    </Box>
                  ) : (
                    <RHFUpload
                      name="draft"
                      type="video"
                      onDrop={handleDrop}
                      onRemove={handleRemoveFile}
                    />
                  )}
                  <RHFTextField name="caption" placeholder="Caption" multiline />
                  <LoadingButton loading={loading} variant="contained" type="submit">
                    Submit Draft
                  </LoadingButton>
                </Stack>
              </FormProvider>
            )}
          </>
        )}

        {submission?.status === 'CHANGES_REQUIRED' && (
          <Stack spacing={2}>
            <Box textAlign="center">
              <Box textAlign="center">
                <Button onClick={display.onTrue}>Preview Draft</Button>
              </Box>
            </Box>
            <Alert severity="warning">
              <Typography variant="subtitle2" sx={{ textDecoration: 'underline', mb: 2 }}>
                Changes Required
              </Typography>
              <Timeline
                sx={{
                  [`& .${timelineOppositeContentClasses.root}`]: {
                    flex: 0.2,
                  },
                }}
              >
                {submission?.feedback?.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((feedback, index) => (
                  <TimelineItem key={index}>
                    <TimelineOppositeContent color="textSecondary">
                      <Typography 
                        variant="caption"  // Smaller font size for date
                        sx={{ 
                          fontWeight: index === 0 ? 'bold' : 'normal',
                          opacity: index === 0 ? 1 : 0.7  // Reduced opacity for older feedback dates
                        }}
                      >
                        {dayjs(feedback.createdAt).format('MMM D, YYYY HH:mm')}
                      </Typography>
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineDot />
                      {index !== submission.feedback.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography 
                        variant="subtitle1" 
                        color="text.secondary" 
                        sx={{ 
                          whiteSpace: 'pre-line',
                          fontWeight: index === 0 ? 'bold' : 'normal',
                          opacity: index === 0 ? 1 : 0.7  // Reduced opacity for older feedback content
                        }}
                      >
                        {feedback.content}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center" mt={1}>
                        {feedback.reasons?.map((item, idx) => (
                          <Label 
                            key={idx}
                            sx={{ 
                              fontWeight: index === 0 ? 'bold' : 'normal',
                              opacity: index === 0 ? 1 : 0.7  // Reduced opacity for older feedback reasons
                            }}
                          >
                            {item}
                          </Label>
                        ))}
                      </Stack>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            </Alert>
            {isProcessing ? (
              <Stack justifyContent="center" alignItems="center" gap={1}>
                <Box
                  sx={{
                    position: 'relative',
                    display: 'inline-flex',
                  }}
                >
                  <CircularProgress
                    variant="determinate"
                    thickness={5}
                    value={progress}
                    size={200}
                    sx={{
                      ' .MuiCircularProgress-circle': {
                        stroke: (theme) =>
                          theme.palette.mode === 'dark'
                            ? theme.palette.common.white
                            : theme.palette.common.black,
                        strokeLinecap: 'round',
                      },
                    }}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="h3" sx={{ fontWeight: 'bolder', fontSize: 11 }}>
                      {`${Math.round(progress)}%`}
                    </Typography>
                  </Box>
                </Box>
                <Stack gap={1}>
                  <Typography variant="caption">{progressName && progressName}</Typography>
                  <Button variant="contained" size="small" onClick={() => handleCancel()}>
                    Cancel
                  </Button>
                </Stack>
              </Stack>
            ) : (
              <FormProvider methods={methods} onSubmit={onSubmit}>
                <Stack gap={2}>
                  {localStorage.getItem('preview') ? (
                    <Box>
                      <video autoPlay controls width="100%" style={{ borderRadius: 10 }}>
                        <source src={localStorage.getItem('preview')} />
                      </video>
                      <Button
                        color="error"
                        variant="outlined"
                        size="small"
                        onClick={handleRemoveFile}
                      >
                        Change Video
                      </Button>
                    </Box>
                  ) : (
                    <RHFUpload
                      name="draft"
                      type="video"
                      onDrop={handleDrop}
                      onRemove={handleRemoveFile}
                    />
                  )}
                  <RHFTextField name="caption" placeholder="Caption" multiline />
                  <LoadingButton loading={loading} variant="contained" type="submit">
                    Submit Draft
                  </LoadingButton>
                </Stack>
              </FormProvider>
            )}
          </Stack>
        )}
        {submission?.status === 'APPROVED' && (
          <Stack justifyContent="center" alignItems="center" spacing={2}>
            <Image src="/assets/approve.svg" sx={{ width: 250 }} />
            <Typography variant="subtitle2">Your Final Draft has been approved.</Typography>
            <Button onClick={display.onTrue} variant="outlined" size="small">
              Preview Draft
            </Button>
          </Stack>
        )}

        <Dialog open={display.value} onClose={display.onFalse} fullWidth maxWidth="md">
          <DialogTitle>Final Draft Video</DialogTitle>
          <DialogContent>
            <video autoPlay controls width="100%" style={{ borderRadius: 10 }}>
              <source src={submission?.content} />
            </video>
            <Box
              component={Paper}
              p={1.5}
              my={1}
              sx={{
                bgcolor: (theme) => theme.palette.background.default,
              }}
            >
              <Typography>{submission?.caption}</Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={display.onFalse}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    )
  );
};

export default CampaignFinalDraft;

CampaignFinalDraft.propTypes = {
  campaign: PropTypes.object,
  timeline: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  submission: PropTypes.object,
  getDependency: PropTypes.func,
  fullSubmission: PropTypes.array,
};
