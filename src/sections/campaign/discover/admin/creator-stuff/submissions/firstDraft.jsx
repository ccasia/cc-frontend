/* eslint-disable jsx-a11y/media-has-caption */
import dayjs from 'dayjs';
import * as Yup from 'yup';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
/* eslint-disable no-undef */
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';

import Timeline from '@mui/lab/Timeline';
import { LoadingButton } from '@mui/lab';
import { blue } from '@mui/material/colors';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineItem from '@mui/lab/TimelineItem';
import CloseIcon from '@mui/icons-material/Close';
import CommentIcon from '@mui/icons-material/Comment';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import ChangeCircleIcon from '@mui/icons-material/ChangeCircle';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import {
  Box,
  Grid,
  Chip,
  Paper,
  Stack,
  Modal,
  Button,
  Dialog,
  Typography,
  IconButton,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Label from 'src/components/label';
import FormProvider from 'src/components/hook-form/form-provider';
import EmptyContent from 'src/components/empty-content/empty-content';
import { RHFTextField, RHFDatePicker, RHFMultiSelect } from 'src/components/hook-form';

const options_changes = [
  'Missing caption requirements',
  'Inverted logo',
  'Inverted brand name',
  'Audio not audible',
  'Video too dark',
  'Video too bright',
  'Mismatch of audio and video',
  'Frozen video',
  'Background too loud',
  'Voiceover not clear',
  'Audio not a good fit',
  'Audio too loud',
  'Speling in subtitles',
];

const FirstDraft = ({ campaign, submission, creator }) => {
  console.log(submission);
  const [type, setType] = useState('approve');
  const approve = useBoolean();
  const request = useBoolean();
  const [openFeedbackModal, setOpenFeedbackModal] = useState(false);

  const requestSchema = Yup.object().shape({
    feedback: Yup.string().required('This field is required'),
    type: Yup.string(),
  });

  const normalSchema = Yup.object().shape({
    feedback: Yup.string().required('Comment is required.'),
    schedule: Yup.object().shape({
      startDate: Yup.string().required('Start Date is required.'),
      endDate: Yup.string().required('End Date is required.'),
    }),
  });

  const methods = useForm({
    resolver: type === 'request' ? yupResolver(requestSchema) : yupResolver(normalSchema),
    defaultValues: {
      feedback: 'Thank you for submitting',
      type: '',
      reasons: [],
      schedule: {
        startDate: null,
        endDate: null,
      },
    },
  });

  const {
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { isSubmitting },
  } = methods;

  const scheduleStartDate = watch('schedule.startDate');

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.patch(endpoints.submission.admin.draft, {
        ...data,
        submissionId: submission.id,
        userId: creator?.user?.id,
      });
      mutate(
        `${endpoints.submission.root}?creatorId=${creator?.user?.id}&campaignId=${campaign?.id}`
      );
      enqueueSnackbar(res?.data?.message);
      approve.onFalse();
      request.onFalse();
      reset();
    } catch (error) {
      enqueueSnackbar('Error submitting', {
        variant: 'error',
      });
      approve.onFalse();
      request.onFalse();
    }
  });

  const confirmationApproveModal = (open, onclose) => (
    <Dialog open={open} onClose={onclose}>
      <DialogTitle>Approve Confirmation</DialogTitle>
      <DialogContent>
        <DialogContentText>Are you sure you want to submit now?</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onclose} variant="outlined" size="small">
          Cancel
        </Button>

        <LoadingButton
          onClick={() => {
            setValue('type', 'approve');
            onSubmit();
          }}
          variant="contained"
          size="small"
          loading={isSubmitting}
        >
          Confirm
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );

  const confirmationRequestModal = (open, onclose) => (
    <Dialog open={open} onClose={onclose}>
      <DialogTitle>Request Confirmation</DialogTitle>
      <DialogContent>
        <DialogContentText>Are you sure you want to submit now?</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onclose} variant="outlined" size="small">
          Cancel
        </Button>
        <LoadingButton
          onClick={() => {
            setValue('type', 'request');
            onSubmit();
          }}
          variant="contained"
          size="small"
          loading={isSubmitting}
        >
          Confirm
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );

  const handleOpenFeedbackModal = () => setOpenFeedbackModal(true);
  const handleCloseFeedbackModal = () => setOpenFeedbackModal(false);

  // Sort feedback by date, most recent first
  const sortedFeedback = React.useMemo(() => {
    if (submission?.feedback) {
      return [...submission.feedback].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return [];
  }, [submission?.feedback]);

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Box component={Paper} p={1.5}>
            <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2}>
              <Stack spacing={1} justifyContent="space-evenly">
                <Typography variant="subtitle2">Due Date</Typography>
                <Typography variant="subtitle2">Status</Typography>
                <Typography variant="subtitle2">Date Submission</Typography>
                <Typography variant="subtitle2">Review on</Typography>
              </Stack>
              <Stack spacing={1} justifyContent="space-evenly">
                <Typography variant="subtitle2" color="text.secondary">
                  {dayjs(submission?.dueDate).format('ddd LL')}
                </Typography>
                <Label>{submission?.status}</Label>
                <Typography variant="subtitle2" color="text.secondary">
                  {submission?.submissionDate
                    ? dayjs(submission?.submissionDate).format('ddd LL')
                    : '-'}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  {submission?.isReview ? dayjs(submission?.updatedAt).format('ddd LL') : '-'}
                </Typography>
              </Stack>
            </Box>
            {/* New centered button for opening the modal */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button onClick={handleOpenFeedbackModal} variant="outlined" size="small">
                View Feedback History
              </Button>
            </Box>

            {/* Feedback History Modal */}
            <Modal
              open={openFeedbackModal}
              onClose={handleCloseFeedbackModal}
              aria-labelledby="feedback-history-modal"
              aria-describedby="feedback-history-description"
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: { xs: '95%', sm: '90%' },
                  maxWidth: 600,
                  maxHeight: '90vh',
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  boxShadow: 24,
                  p: 0,
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography id="feedback-history-modal" variant="h6" component="h2">
                    Feedback History
                  </Typography>
                  <IconButton onClick={handleCloseFeedbackModal} size="small">
                    <CloseIcon />
                  </IconButton>
                </Box>
                <Box
                  sx={{ p: { xs: 2, sm: 3 }, maxHeight: 'calc(90vh - 60px)', overflowY: 'auto' }}
                >
                  {sortedFeedback.length > 0 ? (
                    <Timeline
                      position="right"
                      sx={{
                        [`& .MuiTimelineItem-root:before`]: {
                          flex: 0,
                          padding: 0,
                        },
                      }}
                    >
                      {sortedFeedback.map((feedback, index) => (
                        <TimelineItem key={index}>
                          <TimelineOppositeContent
                            sx={{
                              display: { xs: 'none', sm: 'block' },
                              flex: { sm: 0.2 },
                            }}
                            color="text.secondary"
                          >
                            {dayjs(feedback.createdAt).format('MMM D, YYYY HH:mm')}
                          </TimelineOppositeContent>
                          <TimelineSeparator>
                            <TimelineDot
                              sx={{
                                bgcolor: feedback.type === 'COMMENT' ? 'primary.main' : blue[700],
                              }}
                            >
                              {feedback.type === 'COMMENT' ? <CommentIcon /> : <ChangeCircleIcon />}
                            </TimelineDot>
                            {index < sortedFeedback.length - 1 && <TimelineConnector />}
                          </TimelineSeparator>
                          <TimelineContent sx={{ py: '12px', px: 2 }}>
                            <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                {feedback.type === 'COMMENT' ? 'Comment' : 'Change Request'}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                {feedback.content}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: { xs: 'block', sm: 'none' }, mb: 1 }}
                              >
                                {dayjs(feedback.createdAt).format('MMM D, YYYY HH:mm')}
                              </Typography>
                              {feedback.reasons && feedback.reasons.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                    Reasons for changes:
                                  </Typography>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {feedback.reasons.map((reason, idx) => (
                                      <Chip
                                        key={idx}
                                        label={reason}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                      />
                                    ))}
                                  </Box>
                                </Box>
                              )}
                            </Paper>
                          </TimelineContent>
                        </TimelineItem>
                      ))}
                    </Timeline>
                  ) : (
                    <Typography>No feedback history available.</Typography>
                  )}
                </Box>
              </Box>
            </Modal>
          </Box>
        </Grid>
        <Grid item xs={12} md={9}>
          {submission?.status === 'NOT_STARTED' && <EmptyContent title="Not Started" />}
          {submission?.status === 'IN_PROGRESS' && <EmptyContent title="No Submission" />}
          {(submission?.status === 'PENDING_REVIEW' || submission?.status === 'APPROVED') && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                  <Box
                    component="video"
                    autoPlay
                    controls
                    sx={{
                      maxHeight: '60vh',
                      width: { xs: '70vw', sm: 'auto' },
                      borderRadius: 2,
                      boxShadow: 3,
                    }}
                  >
                    <source src={submission?.content} />
                  </Box>
                  {/* <video
                  autoPlay
                  style={{ width: '100%', borderRadius: 10, margin: 'auto' }}
                  controls
                >
                  <source src={submission?.content} />
                </video> */}
                  <Box component={Paper} p={1.5} width={1}>
                    <Typography variant="caption" color="text.secondary">
                      Caption
                    </Typography>
                    <Typography variant="subtitle1">{submission?.caption}</Typography>
                  </Box>
                </Box>
              </Grid>
              {submission?.status === 'PENDING_REVIEW' && (
                <Grid item xs={12}>
                  <Box component={Paper} p={1.5}>
                    {type === 'approve' && (
                      <FormProvider methods={methods} onSubmit={onSubmit}>
                        <Stack gap={1} mb={2}>
                          <Typography variant="subtitle1" mb={1} mx={1}>
                            Schedule This Post
                          </Typography>
                          <Stack direction="row" gap={3}>
                            <RHFDatePicker
                              name="schedule.startDate"
                              label="Start Date"
                              minDate={dayjs()}
                            />
                            <RHFDatePicker
                              name="schedule.endDate"
                              label="End Date"
                              minDate={dayjs(scheduleStartDate)}
                            />
                          </Stack>
                        </Stack>
                        <Typography variant="subtitle1" mb={1} mx={1}>
                          Comment For Creator
                        </Typography>
                        <Stack gap={2}>
                          <RHFTextField
                            name="feedback"
                            multiline
                            minRows={5}
                            placeholder="Comment"
                          />
                          <Stack alignItems="center" direction="row" gap={1} alignSelf="end">
                            <Typography
                              component="a"
                              onClick={() => {
                                setType('request');
                                setValue('type', 'request');
                                setValue('feedback', '');
                              }}
                              sx={{
                                color: (theme) => theme.palette.text.secondary,
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                '&:hover': {
                                  color: (theme) => theme.palette.text.primary,
                                },
                              }}
                              variant="caption"
                            >
                              Request a change
                            </Typography>
                            <Button
                              variant="contained"
                              size="small"
                              color="primary"
                              onClick={approve.onTrue}
                            >
                              Approve
                            </Button>
                          </Stack>
                        </Stack>
                        {confirmationApproveModal(approve.value, approve.onFalse)}
                      </FormProvider>
                    )}
                    {type === 'request' && (
                      <>
                        <Typography variant="h6" mb={1} mx={1}>
                          Request Changes
                        </Typography>
                        <FormProvider methods={methods} onSubmit={onSubmit}>
                          <Stack gap={2}>
                            <RHFMultiSelect
                              name="reasons"
                              checkbox
                              chip
                              options={options_changes.map((item) => ({
                                value: item,
                                label: item,
                              }))}
                              label="Reasons"
                            />
                            <RHFTextField
                              name="feedback"
                              multiline
                              minRows={5}
                              placeholder="Feedback"
                            />

                            <Stack alignItems="center" direction="row" gap={1} alignSelf="end">
                              <Typography
                                component="a"
                                onClick={() => {
                                  setType('approve');
                                  setValue('type', 'approve');
                                  setValue('feedback', '');
                                  setValue('reasons', []);
                                }}
                                sx={{
                                  color: (theme) => theme.palette.text.secondary,
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  '&:hover': {
                                    color: (theme) => theme.palette.text.primary,
                                  },
                                }}
                                variant="caption"
                              >
                                Back
                              </Typography>
                              <Button variant="contained" size="small" onClick={request.onTrue}>
                                Submit
                              </Button>
                            </Stack>
                          </Stack>

                          {confirmationRequestModal(request.value, request.onFalse)}
                        </FormProvider>
                      </>
                    )}
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
          {submission?.status === 'CHANGES_REQUIRED' && (
            <Grid item xs={12}>
              <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                <Box
                  component="video"
                  autoPlay
                  controls
                  sx={{
                    maxHeight: '60vh',
                    width: { xs: '70vw', sm: 'auto' },
                    borderRadius: 2,
                    boxShadow: 3,
                  }}
                >
                  <source src={submission?.content} />
                </Box>

                <Box component={Paper} p={1.5} width={1}>
                  <Typography variant="caption" color="text.secondary">
                    Caption
                  </Typography>
                  <Typography variant="subtitle1">{submission?.caption}</Typography>
                </Box>
              </Box>
            </Grid>
            // <Box component={Paper} position="relative" p={10}>
            //   <Stack gap={1.5} alignItems="center">
            //     <Image src="/assets/approve.svg" width={200} />
            //     <ListItemText
            //       primary="First Draft has been reviewed"
            //       secondary="You can view the changes in Final Draft tab."
            //       sx={{
            //         textAlign: 'center',
            //       }}
            //       primaryTypographyProps={{
            //         variant: 'subtitle2',
            //         // color: 'text.secondary',
            //       }}
            //       secondaryTypographyProps={{
            //         variant: 'caption',
            //       }}
            //     />
            //   </Stack>
            // </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default FirstDraft;

FirstDraft.propTypes = {
  campaign: PropTypes.object,
  submission: PropTypes.object,
  creator: PropTypes.object,
};
