import dayjs from 'dayjs';
import * as Yup from 'yup';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { io } from 'socket.io-client';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import React, { useState, useEffect, useCallback } from 'react';

import { Box, Card, Stack, alpha, Button, Typography, ListItemText } from '@mui/material';
import {
  Timeline,
  TimelineItem,
  LoadingButton,
  TimelineContent,
  TimelineConnector,
  TimelineSeparator,
  timelineItemClasses,
} from '@mui/lab';

import useGetFirstDraftBySessionID from 'src/hooks/use-get-first-draft-for-creator';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFUpload, RHFTextField } from 'src/components/hook-form';

const CampaignMyTasks = ({ campaign }) => {
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [taskId, setTimelineId] = useState('');

  const { data } = useGetFirstDraftBySessionID(campaign.id);

  const isSubmittedFirstDraft = data?.status === 'Submitted';

  const schema = Yup.object().shape({
    // draft: Yup.string().required(),
    caption: Yup.string().required(),
  });

  const methods = useForm({
    defaultValues: {
      draft: null,
      caption: '',
    },
    resolver: yupResolver(schema),
  });

  const { setValue, handleSubmit, reset } = methods;

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
    const newData = { ...value, campaignId: campaign.id, taskId };
    formData.append('data', JSON.stringify(newData));
    formData.append('firstDraftVideo', value.draft);
    try {
      const res = await axiosInstance.post(endpoints.campaign.draft.submitFirstDraft, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      enqueueSnackbar(res.data.message);
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

  useEffect(() => {
    const socket = io();
    socket.on('draft', (value) => {
      mutate(endpoints.campaign.draft.getFirstDraftForCreator(campaign.id));
    });
  }, [campaign]);

  return (
    <Box sx={{ maxWidth: 900 }} component={Card}>
      <Timeline
        sx={{
          [`& .${timelineItemClasses.root}:before`]: {
            flex: 0,
            padding: 0,
          },
        }}
      >
        {campaign?.campaignTask
          .sort((a, b) => dayjs(a.endDate).diff(dayjs(b.endDate)))
          .map((timeline, index) => (
            <TimelineItem>
              <TimelineSeparator>
                <Label sx={{ mt: 0.5 }}>{index + 1}</Label>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <ListItemText
                  primary={
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      spacing={1}
                      alignItems={{ md: 'center' }}
                      mb={2}
                    >
                      <Typography variant="subtitle2">{timeline.task}</Typography>
                      <Box flexGrow={1}>
                        {timeline.status === 'NOT_STARTED' && <Label>{timeline.status}</Label>}
                        {timeline.status === 'IN_PROGRESS' && (
                          <Label color="success">{timeline.status}</Label>
                        )}
                      </Box>
                      <Typography variant="caption">
                        Due: {dayjs(timeline.endDate).format('ddd LL')}
                      </Typography>
                    </Stack>
                  }
                  secondaryTypographyProps={{
                    variant: 'caption',
                    color: 'text.disabled',
                  }}
                />
                {timeline.status === 'IN_PROGRESS' && (
                  <FormProvider methods={methods} onSubmit={onSubmit}>
                    <Stack gap={2}>
                      {preview ? (
                        <Box maxWidth={800}>
                          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
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
                      <LoadingButton
                        loading={loading}
                        variant="contained"
                        type="submit"
                        onClick={() => setTimelineId(timeline.id)}
                      >
                        Submit Draft
                      </LoadingButton>
                    </Stack>
                  </FormProvider>
                )}
                {timeline.status === 'PENDING_REVIEW' && isSubmittedFirstDraft && (
                  <Box
                    component={Card}
                    height={200}
                    sx={{
                      bgcolor: (theme) => alpha(theme.palette.success.main, 0.13),
                      position: 'relative',
                    }}
                  >
                    <Stack
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%,-50%)',
                      }}
                      direction="row"
                      gap={1}
                      alignItems="center"
                    >
                      <Iconify icon="mdi:tick-circle-outline" width={16} />
                      <Typography variant="subtitle1">Submitted for review</Typography>
                    </Stack>
                  </Box>
                )}
                {dayjs(timeline.startDate) < dayjs() && dayjs() <= dayjs(timeline.endDate) && (
                  <Button size="small" variant="outlined" color="primary" sx={{ mt: 1 }}>
                    Manage
                  </Button>
                )}
              </TimelineContent>
            </TimelineItem>
          ))}
      </Timeline>
    </Box>
  );
};

export default CampaignMyTasks;

CampaignMyTasks.propTypes = {
  campaign: PropTypes.object,
};
