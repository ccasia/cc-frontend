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
  alpha,
  Button,
  Dialog,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import useSocketContext from 'src/socket/hooks/useSocketContext';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFUpload, RHFTextField } from 'src/components/hook-form';

const CampaignFirstDraft = ({ campaign, timeline, submission, getDependency, fullSubmission }) => {
  // eslint-disable-next-line no-unused-vars
  const [preview, setPreview] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(false);
  const dependency = getDependency(submission?.id);
  const { socket } = useSocketContext();
  const [progress, setProgress] = useState(0);
  const display = useBoolean();

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
      mutate(endpoints.campaign.creator.getCampaign(campaign.id));
    } catch (error) {
      enqueueSnackbar('Failed to submit draft', {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  });

  const previousSubmission = useMemo(
    () => fullSubmission?.find((item) => item?.id === dependency?.dependentSubmissionId),
    [fullSubmission, dependency]
  );

  useEffect(() => {
    if (socket) {
      socket.on('progress', (data) => {
        if (submission?.id === data.submissionId) {
          setIsProcessing(true);
          setProgress(data.progress);

          if (data.progress === 100) {
            mutate(endpoints.campaign.creator.getCampaign(campaign?.id));
            setIsProcessing(false);
            reset();
            setPreview('');
            localStorage.removeItem('preview');
          } else if (progress === 0) {
            setIsProcessing(false);
            reset();
            setPreview('');
            localStorage.removeItem('preview');
          }
        }
      });
    }
    return () => {
      socket.off('progress');
    };
  }, [socket, submission, reset, progress, campaign]);

  const handleCancel = () => {
    if (isProcessing) {
      socket.emit('cancel-processing', { submissionId: submission.id });
      setIsProcessing(false);
      setProgress(0);
      localStorage.removeItem('preview');
    }
  };

  return (
    previousSubmission?.status === 'APPROVED' && (
      <Box>
        {submission?.status === 'PENDING_REVIEW' && (
          <Box
            component={Paper}
            position="relative"
            p={10}
            sx={{
              bgcolor: (theme) => alpha(theme.palette.success.main, 0.15),
            }}
          >
            <Stack gap={1.5} alignItems="center">
              <Iconify icon="mdi:tick-circle-outline" color="success.main" width={40} />
              <Typography variant="subtitle2" color="text.secondary">
                Your agreement submission is submitted
              </Typography>
            </Stack>
          </Box>
        )}
        {submission?.status === 'IN_PROGRESS' && (
          <>
            {isProcessing ? (
              <>
                <LinearProgress variant="determinate" value={progress} />
                <Button onClick={() => handleCancel()}>Cancel</Button>
              </>
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
          <>
            <Box textAlign="center">
              {submission && (
                <video autoPlay controls width="80%" style={{ borderRadius: 10 }}>
                  <source src={submission?.content} />
                </video>
              )}
            </Box>
            <Box p={2}>
              <Typography variant="h6">Changes Required</Typography>
              <Typography
                variant="subtitle1"
                color="text.secondary"
                sx={{ whiteSpace: 'pre-line' }}
              >
                {submission?.feedback?.content}
              </Typography>
            </Box>
          </>
        )}
        {submission?.status === 'APPROVED' && (
          <Stack justifyContent="center" alignItems="center" spacing={2}>
            <Image src="/assets/approve.svg" sx={{ width: 250 }} />
            <Typography variant="subtitle2">Your First Draft has been approved.</Typography>
            <Button onClick={display.onTrue}>Preview Draft</Button>
          </Stack>
        )}
        <Dialog open={display.value} onClose={display.onFalse} fullWidth maxWidth="md">
          <DialogTitle>Agreement</DialogTitle>
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

export default CampaignFirstDraft;

CampaignFirstDraft.propTypes = {
  campaign: PropTypes.object,
  timeline: PropTypes.object,
  submission: PropTypes.object,
  getDependency: PropTypes.func,
  fullSubmission: PropTypes.array,
};
