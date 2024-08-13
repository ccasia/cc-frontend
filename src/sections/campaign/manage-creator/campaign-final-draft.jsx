/* eslint-disable jsx-a11y/media-has-caption */
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import React, { useMemo, useState, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import { Box, Card, Stack, alpha, Paper, Button, Typography } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFUpload, RHFTextField } from 'src/components/hook-form';

const CampaignFinalDraft = ({ campaign, timeline, submission, getDependency, fullSubmission }) => {
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const dependency = getDependency(submission?.id);

  const methods = useForm();

  const { handleSubmit, setValue, reset } = methods;

  const handleRemoveFile = () => {
    setValue('draft', '');
    setPreview('');
  };

  const handleDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];

      const newFile = Object.assign(file, {
        preview: URL.createObjectURL(file),
      });

      setPreview(newFile.preview);

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
      reset();
      setPreview('');
    } catch (error) {
      enqueueSnackbar('Failed to submit draft', {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  });

  const value = useMemo(
    () => fullSubmission?.find((item) => item?.id === dependency?.dependentSubmissionId),
    [fullSubmission, dependency]
  );

  return (
    <>
      {value?.status === 'CHANGES_REQUIRED' && (
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
            <FormProvider methods={methods} onSubmit={onSubmit}>
              <Stack gap={2}>
                {preview ? (
                  <Box>
                    {/* // eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <video autoPlay controls width="100%" style={{ borderRadius: 10 }}>
                      <source src={preview} />
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
                  Submit Final Draft
                </LoadingButton>
              </Stack>
            </FormProvider>
          )}
          {submission?.status === 'APPROVED' && (
            <Stack gap={1.5}>
              <Card
                sx={{
                  bgcolor: (theme) => alpha(theme.palette.success.main, 0.2),
                  p: 1.5,
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Iconify icon="icon-park-twotone:success" color="success.main" width={18} />
                  <Typography variant="subtitle2">
                    You draft submission has been approved
                  </Typography>
                </Stack>
              </Card>
              <Box textAlign="center">
                <video autoPlay controls width="80%" style={{ borderRadius: 10 }}>
                  <source src={submission?.content} />
                </video>
              </Box>
              <Box p={2}>
                <Typography
                  variant="subtitle1"
                  color="text.secondary"
                  sx={{ whiteSpace: 'pre-line' }}
                >
                  {submission?.caption}
                </Typography>
              </Box>
            </Stack>
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
              <FormProvider methods={methods} onSubmit={onSubmit}>
                <Stack gap={2}>
                  {preview ? (
                    <Box>
                      {/* // eslint-disable-next-line jsx-a11y/media-has-caption */}
                      <video autoPlay controls width="100%" style={{ borderRadius: 10 }}>
                        <source src={preview} />
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
                    Submit Final Draft
                  </LoadingButton>
                </Stack>
              </FormProvider>
            </>
          )}
        </Box>
      )}
    </>
  );
};

export default CampaignFinalDraft;

CampaignFinalDraft.propTypes = {
  campaign: PropTypes.object,
  timeline: PropTypes.object,
  submission: PropTypes.object,
  getDependency: PropTypes.func,
  fullSubmission: PropTypes.array,
};
