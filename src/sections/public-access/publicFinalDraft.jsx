/* eslint-disable jsx-a11y/media-has-caption */
import dayjs from 'dayjs';
import * as Yup from 'yup';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
/* eslint-disable no-undef */
import React, { useMemo, useState } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';

import { LoadingButton } from '@mui/lab';
import Avatar from '@mui/material/Avatar';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Box,
  Grid,
  Chip,
  Stack,
  Modal,
  Button,
  Dialog,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import FormProvider from 'src/components/hook-form/form-provider';
import EmptyContent from 'src/components/empty-content/empty-content';
import { RHFTextField, RHFMultiSelect } from 'src/components/hook-form';

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

const PublicFinalDraft = ({ campaign, submission, creator }) => {
  const [type, setType] = useState('approve');
  const approve = useBoolean();
  const request = useBoolean();
  const [openFeedbackModal, setOpenFeedbackModal] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const { user } = useAuthContext();

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

  const isDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.patch(endpoints.public.clientFeedback, {
        ...data,
        submissionId: submission.id,
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
    <Dialog
      open={open}
      onClose={onclose}
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth: '500px',
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 2,
        }}
      >
        Approve Confirmation
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Stack spacing={2}>
          <DialogContentText>Are you sure you want to submit now?</DialogContentText>

          {/* Show schedule if set */}
          {watch('schedule.startDate') && watch('schedule.endDate') && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Schedule:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  bgcolor: 'grey.100',
                  p: 1.5,
                  borderRadius: 1,
                }}
              >
                {`${dayjs(watch('schedule.startDate')).format('MMM D, YYYY')} - ${dayjs(watch('schedule.endDate')).format('MMM D, YYYY')}`}
              </Typography>
            </Box>
          )}

          {/* Show feedback comment */}
          {watch('feedback') && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Feedback:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  bgcolor: 'grey.100',
                  p: 1.5,
                  borderRadius: 1,
                  maxHeight: '100px',
                  overflowY: 'auto',
                }}
              >
                {watch('feedback')}
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 2 }}>
        <Button
          onClick={onclose}
          size="small"
          sx={{
            bgcolor: 'white',
            border: 1,
            borderRadius: 0.8,
            borderColor: '#e7e7e7',
            borderBottom: 3,
            borderBottomColor: '#e7e7e7',
            color: 'text.primary',
            '&:hover': {
              bgcolor: '#f5f5f5',
              borderColor: '#e7e7e7',
            },
            textTransform: 'none',
            px: 2.5,
            py: 1.2,
            fontSize: '0.875rem',
            minWidth: '80px',
            height: '45px',
          }}
        >
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
          sx={{
            bgcolor: '#2e6c56',
            color: 'white',
            borderBottom: 3,
            borderBottomColor: '#1a3b2f',
            borderRadius: 0.8,
            px: 2.5,
            py: 1.2,
            '&:hover': {
              bgcolor: '#2e6c56',
              opacity: 0.9,
            },
            fontSize: '0.875rem',
            minWidth: '80px',
            height: '45px',
            textTransform: 'none',
          }}
        >
          Submit
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );

  const confirmationRequestModal = (open, onclose) => (
    <Dialog
      open={open}
      onClose={onclose}
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth: '500px',
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 2,
        }}
      >
        Confirm Change Request
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Stack spacing={2}>
          <DialogContentText>
            Are you sure you want to submit this change request?
          </DialogContentText>

          {/* Show selected reasons if any */}
          {watch('reasons')?.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Selected Reasons:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {watch('reasons').map((reason, index) => (
                  <Chip
                    key={index}
                    label={reason}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Show feedback comment */}
          {watch('feedback') && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Feedback:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  bgcolor: 'grey.100',
                  p: 1.5,
                  borderRadius: 1,
                  maxHeight: '100px',
                  overflowY: 'auto',
                }}
              >
                {watch('feedback')}
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 2 }}>
        <Button
          onClick={onclose}
          size="small"
          sx={{
            bgcolor: 'white',
            border: 1,
            borderRadius: 0.8,
            borderColor: '#e7e7e7',
            borderBottom: 3,
            borderBottomColor: '#e7e7e7',
            color: 'text.primary',
            '&:hover': {
              bgcolor: '#f5f5f5',
              borderColor: '#e7e7e7',
            },
            textTransform: 'none',
            px: 2.5,
            py: 1.2,
            fontSize: '0.875rem',
            minWidth: '80px',
            height: '45px',
          }}
        >
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          size="small"
          disabled={isDisabled}
          onClick={() => {
            setValue('type', 'request');
            onSubmit();
          }}
          sx={{
            bgcolor: '#2e6c56',
            color: 'white',
            borderBottom: 3,
            borderBottomColor: '#1a3b2f',
            borderRadius: 0.8,
            px: 2.5,
            py: 1.2,
            '&:hover': {
              bgcolor: '#2e6c56',
              opacity: 0.9,
            },
            fontSize: '0.875rem',
            minWidth: '80px',
            height: '45px',
            textTransform: 'none',
            '&:disabled': {
              display: 'none',
            },
          }}
        >
          Submit
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );

  // const handleOpenFeedbackModal = () => setOpenFeedbackModal(true);
  // const handleCloseFeedbackModal = () => setOpenFeedbackModal(false);

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
        <Grid item xs={12}>
          <Box p={{ xs: 1, sm: 1.5 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 1, sm: 3 }}
              sx={{ mb: 3, mt: -2 }}
            >
              <Stack spacing={0.5}>
                <Stack direction="row" spacing={0.5}>
                  <Typography
                    variant="caption"
                    sx={{ color: '#8e8e93', fontSize: '0.875rem', fontWeight: 550 }}
                  >
                    Date Submitted:
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: '#221f20', fontSize: '0.875rem', fontWeight: 500 }}
                  >
                    {submission?.submissionDate
                      ? dayjs(submission?.submissionDate).format('ddd, D MMM YYYY')
                      : '-'}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={0.5}>
                  <Typography
                    variant="caption"
                    sx={{ color: '#8e8e93', fontSize: '0.875rem', fontWeight: 550 }}
                  >
                    Reviewed On:
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: '#221f20', fontSize: '0.875rem', fontWeight: 500 }}
                  >
                    {submission?.isReview
                      ? dayjs(submission?.updatedAt).format('ddd, D MMM YYYY')
                      : 'Pending Review'}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>

            {/* Feedback History Button */}
            {/* <Box sx={{ display: 'flex', mb: 2 }}>
              <Button 
                onClick={handleOpenFeedbackModal} 
                variant="outlined" 
                size="small"
                sx={{
                  boxShadow: 2,
                }}
              >
                View Feedback History
              </Button>
            </Box> */}

            {/* Commented out feedback history modal */}
            {/* <Modal
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
            </Modal> */}

            {submission?.status === 'NOT_STARTED' && <EmptyContent title="Not Started" />}
            {submission?.status === 'IN_PROGRESS' && <EmptyContent title="No Submission" />}
            {(submission?.status === 'PENDING_REVIEW' || submission?.status === 'APPROVED') && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box
                    sx={{
                      p: { xs: 2, sm: 3 },
                      mb: 2,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box display="flex" flexDirection="column" gap={2}>
                      {/* User Profile Section */}
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar
                          src={creator?.user?.photoURL}
                          alt={creator?.user?.name}
                          sx={{
                            width: 40,
                            height: 40,
                            border: '1px solid #e7e7e7',
                          }}
                        >
                          {creator?.user?.name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontSize: '1.05rem',
                            mt: -2.5,
                          }}
                        >
                          {creator?.user?.name}
                        </Typography>
                      </Stack>

                      {/* Content Section */}
                      <Box sx={{ pl: 7 }}>
                        {/* Description Section */}
                        <Box sx={{ mt: -3.5 }}>
                          <Typography
                            variant="body1"
                            sx={{
                              fontSize: '0.95rem',
                              color: '#48484A',
                            }}
                          >
                            <strong>Description:</strong> {submission?.caption}
                          </Typography>
                        </Box>

                        {/* Video Thumbnail Section */}
                        <Box
                          sx={{
                            position: 'relative',
                            cursor: 'pointer',
                            width: { xs: '100%', sm: '300px' },
                            height: { xs: '200px', sm: '169px' },
                            borderRadius: 2,
                            overflow: 'hidden',
                            boxShadow: 3,
                            mt: 2,
                          }}
                          onClick={() => setVideoModalOpen(true)}
                        >
                          <Box
                            component="video"
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: 2,
                            }}
                          >
                            <source src={submission?.content} />
                          </Box>
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: 'rgba(0, 0, 0, 0.4)',
                              borderRadius: 2,
                            }}
                          >
                            <VisibilityIcon sx={{ color: 'white', fontSize: 32 }} />
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {submission?.status === 'PENDING_REVIEW' && (
                    <Box
                      sx={{
                        p: { xs: 2, sm: 3 },
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      {submission.publicFeedback
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                        .map((feedback, index) => (
                          <Box
                            key={index}
                            mb={2}
                            p={2}
                            border={1}
                            borderColor="grey.300"
                            borderRadius={1}
                            display="flex"
                            alignItems="flex-start"
                            flexDirection="column"
                          >
                            {/* Title for Client Feedback */}
                            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: 2 }}>
                              Client Feedback
                            </Typography>
                            {/* Use company logo or fallback avatar */}
                            <Avatar
                              src={campaign?.company?.logoURL || '/default-avatar.png'}
                              alt={campaign?.company?.name || 'Company'}
                              sx={{ mr: 2, mb: 2 }}
                            />
                            <Box
                              flexGrow={1}
                              sx={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}
                            >
                              <Typography
                                variant="subtitle1"
                                sx={{ fontWeight: 'bold', marginBottom: '2px' }}
                              >
                                {campaign?.company?.name || 'Unknown Company'}
                              </Typography>

                              {/* Feedback Content */}
                              <Box sx={{ textAlign: 'left', mt: 1 }}>
                                {feedback.content.split('\n').map((line, i) => (
                                  <Typography key={i} variant="body2">
                                    {line}
                                  </Typography>
                                ))}

                                {/* Display reasons if available */}
                                {feedback.reasons && feedback.reasons.length > 0 && (
                                  <Box mt={1} sx={{ textAlign: 'left' }}>
                                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                      {feedback.reasons.map((reason, idx) => (
                                        <Box
                                          key={idx}
                                          sx={{
                                            border: '1.5px solid #e7e7e7',
                                            borderBottom: '4px solid #e7e7e7',
                                            borderRadius: 1,
                                            p: 0.5,
                                            display: 'inline-flex',
                                          }}
                                        >
                                          <Chip
                                            label={reason}
                                            size="small"
                                            color="default"
                                            variant="outlined"
                                            sx={{
                                              border: 'none',
                                              color: '#8e8e93',
                                              fontSize: '0.75rem',
                                              padding: '1px 2px',
                                            }}
                                          />
                                        </Box>
                                      ))}
                                    </Stack>
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          </Box>
                        ))}

                      {type === 'approve' && (
                        <FormProvider methods={methods} onSubmit={onSubmit}>
                          <Stack gap={2}>
                            <Stack
                              alignItems={{ xs: 'stretch', sm: 'center' }}
                              direction={{ xs: 'column', sm: 'row' }}
                              gap={1.5}
                              justifyContent="end"
                            >
                              <Button
                                onClick={() => {
                                  setType('request');
                                  setValue('type', 'request');
                                  setValue('feedback', '');
                                }}
                                disabled={isDisabled}
                                size="small"
                                variant="contained"
                                sx={{
                                  bgcolor: 'white',
                                  border: 1,
                                  borderRadius: 0.8,
                                  borderColor: '#e7e7e7',
                                  borderBottom: 3,
                                  borderBottomColor: '#e7e7e7',
                                  color: 'black',
                                  '&:hover': {
                                    bgcolor: 'error.lighter',
                                    borderColor: '#e7e7e7',
                                  },
                                  '&:disabled': {
                                    display: 'none',
                                  },
                                  textTransform: 'none',
                                  px: 2.5,
                                  py: 1.2,
                                  fontSize: '0.875rem',
                                  minWidth: '80px',
                                  height: '45px',
                                }}
                              >
                                Add a feedback
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
                          <FormProvider methods={methods} onSubmit={onSubmit} disabled={isDisabled}>
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

                              <Stack
                                alignItems={{ xs: 'stretch', sm: 'center' }}
                                direction={{ xs: 'column', sm: 'row' }}
                                gap={1.5}
                                alignSelf="end"
                              >
                                <Button
                                  onClick={() => {
                                    setType('approve');
                                    setValue('type', 'approve');
                                    setValue('feedback', '');
                                    setValue('reasons', []);
                                  }}
                                  size="small"
                                  sx={{
                                    bgcolor: 'white',
                                    border: 1,
                                    borderRadius: 0.8,
                                    borderColor: '#e7e7e7',
                                    borderBottom: 3,
                                    borderBottomColor: '#e7e7e7',
                                    color: 'text.primary',
                                    '&:hover': {
                                      bgcolor: '#f5f5f5',
                                      borderColor: '#e7e7e7',
                                    },
                                    textTransform: 'none',
                                    px: 2.5,
                                    py: 1.2,
                                    fontSize: '0.875rem',
                                    minWidth: '80px',
                                    height: '45px',
                                  }}
                                >
                                  Back
                                </Button>
                                <LoadingButton
                                  variant="contained"
                                  size="small"
                                  onClick={request.onTrue}
                                  sx={{
                                    bgcolor: '#2e6c56',
                                    color: 'white',
                                    borderBottom: 3,
                                    borderBottomColor: '#1a3b2f',
                                    borderRadius: 0.8,
                                    px: 2.5,
                                    py: 1.2,
                                    '&:hover': {
                                      bgcolor: '#2e6c56',
                                      opacity: 0.9,
                                    },
                                    fontSize: '0.875rem',
                                    minWidth: '80px',
                                    height: '45px',
                                    textTransform: 'none',
                                  }}
                                >
                                  Submit
                                </LoadingButton>
                              </Stack>
                            </Stack>

                            {confirmationRequestModal(request.value, request.onFalse)}
                          </FormProvider>
                        </>
                      )}
                    </Box>
                  )}
                </Grid>
              </Grid>
            )}
            {submission?.status === 'CHANGES_REQUIRED' && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  {/* Video Box */}
                  <Box
                    sx={{
                      p: { xs: 2, sm: 3 },
                      mb: 2,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box display="flex" flexDirection="column" gap={2}>
                      {/* User Profile Section */}
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar
                          src={creator?.user?.photoURL}
                          alt={creator?.user?.name}
                          sx={{
                            width: 40,
                            height: 40,
                            border: '1px solid #e7e7e7',
                          }}
                        >
                          {creator?.user?.name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontSize: '1.05rem',
                            mt: -2.5,
                          }}
                        >
                          {creator?.user?.name}
                        </Typography>
                      </Stack>
                      {/* Content Section */}
                      <Box sx={{ pl: 7 }}>
                        {/* Description Section */}
                        <Box sx={{ mt: -3.5 }}>
                          <Typography
                            variant="body1"
                            sx={{
                              fontSize: '0.95rem',
                              color: '#48484A',
                            }}
                          >
                            <strong>Description:</strong> {submission?.caption}
                          </Typography>
                        </Box>

                        {/* Video Thumbnail Section */}
                        <Box
                          sx={{
                            position: 'relative',
                            cursor: 'pointer',
                            width: { xs: '100%', sm: '300px' },
                            height: { xs: '200px', sm: '169px' },
                            borderRadius: 2,
                            overflow: 'hidden',
                            boxShadow: 3,
                            mt: 2,
                          }}
                          onClick={() => setVideoModalOpen(true)}
                        >
                          <Box
                            component="video"
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: 2,
                            }}
                          >
                            <source src={submission?.content} />
                          </Box>
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: 'rgba(0, 0, 0, 0.4)',
                              borderRadius: 2,
                            }}
                          >
                            <VisibilityIcon sx={{ color: 'white', fontSize: 32 }} />
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {/* Divider */}
                  <Box
                    sx={{
                      width: '100%',
                      height: '1px',
                      bgcolor: 'divider',
                      my: 3,
                    }}
                  />

                  {submission.publicFeedback
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .map((feedback, index) => (
                      <Box
                        key={index}
                        mb={2}
                        p={2}
                        border={1}
                        borderColor="grey.300"
                        borderRadius={1}
                        display="flex"
                        alignItems="flex-start"
                        flexDirection="column"
                      >
                        {/* Title for Client Feedback */}
                        <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: 2 }}>
                          Client Feedback
                        </Typography>
                        {/* Use company logo or fallback avatar */}
                        <Avatar
                          src={campaign?.company?.logoURL || '/default-avatar.png'}
                          alt={campaign?.company?.name || 'Company'}
                          sx={{ mr: 2, mb: 2 }}
                        />
                        <Box
                          flexGrow={1}
                          sx={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}
                        >
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 'bold', marginBottom: '2px' }}
                          >
                            {campaign?.company?.name || 'Unknown Company'}
                          </Typography>

                          {/* Feedback Content */}
                          <Box sx={{ textAlign: 'left', mt: 1 }}>
                            {feedback.content.split('\n').map((line, i) => (
                              <Typography key={i} variant="body2">
                                {line}
                              </Typography>
                            ))}

                            {/* Display reasons if available */}
                            {feedback.reasons && feedback.reasons.length > 0 && (
                              <Box mt={1} sx={{ textAlign: 'left' }}>
                                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                  {feedback.reasons.map((reason, idx) => (
                                    <Box
                                      key={idx}
                                      sx={{
                                        border: '1.5px solid #e7e7e7',
                                        borderBottom: '4px solid #e7e7e7',
                                        borderRadius: 1,
                                        p: 0.5,
                                        display: 'inline-flex',
                                      }}
                                    >
                                      <Chip
                                        label={reason}
                                        size="small"
                                        color="default"
                                        variant="outlined"
                                        sx={{
                                          border: 'none',
                                          color: '#8e8e93',
                                          fontSize: '0.75rem',
                                          padding: '1px 2px',
                                        }}
                                      />
                                    </Box>
                                  ))}
                                </Stack>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    ))}

                  {/* Admin Feedback */}
                  {submission.feedback
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .map((feedback, index) => (
                      <Box
                        key={index}
                        mb={2}
                        p={2}
                        border={1}
                        borderColor="grey.300"
                        borderRadius={1}
                        display="flex"
                        alignItems="flex-start"
                      >
                        <Avatar
                          src={feedback.admin?.photoURL || '/default-avatar.png'}
                          alt={feedback.admin?.name || 'User'}
                          sx={{ mr: 2 }}
                        />
                        <Box
                          flexGrow={1}
                          sx={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}
                        >
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 'bold', marginBottom: '2px' }}
                          >
                            {feedback.admin?.name || 'Unknown User'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {feedback.admin?.role || 'No Role'}
                          </Typography>
                          <Box sx={{ textAlign: 'left', mt: 1 }}>
                            {feedback.content.split('\n').map((line, i) => (
                              <Typography key={i} variant="body2">
                                {line}
                              </Typography>
                            ))}
                            {feedback.reasons && feedback.reasons.length > 0 && (
                              <Box mt={1} sx={{ textAlign: 'left' }}>
                                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                  {feedback.reasons.map((reason, idx) => (
                                    <Box
                                      key={idx}
                                      sx={{
                                        border: '1.5px solid #e7e7e7',
                                        borderBottom: '4px solid #e7e7e7',
                                        borderRadius: 1,
                                        p: 0.5,
                                        display: 'inline-flex',
                                      }}
                                    >
                                      <Chip
                                        label={reason}
                                        size="small"
                                        color="default"
                                        variant="outlined"
                                        sx={{
                                          border: 'none',
                                          color: '#8e8e93',
                                          fontSize: '0.75rem',
                                          padding: '1px 2px',
                                        }}
                                      />
                                    </Box>
                                  ))}
                                </Stack>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    ))}
                </Grid>

                <Box width={1} textAlign="end">
                  {type === 'approve' && (
                    <Button
                      onClick={() => {
                        setType('request');
                        setValue('type', 'request');
                        setValue('feedback', '');
                      }}
                      disabled={isDisabled}
                      size="small"
                      variant="contained"
                      sx={{
                        bgcolor: 'white',
                        border: 1,
                        borderRadius: 0.8,
                        borderColor: '#e7e7e7',
                        borderBottom: 3,
                        borderBottomColor: '#e7e7e7',
                        color: 'black',
                        '&:hover': {
                          bgcolor: 'error.lighter',
                          borderColor: '#e7e7e7',
                        },
                        '&:disabled': {
                          display: 'none',
                        },
                        textTransform: 'none',
                        px: 2.5,
                        py: 1.2,
                        fontSize: '0.875rem',
                        minWidth: '80px',
                        height: '45px',
                      }}
                    >
                      Add a feedback
                    </Button>
                  )}
                  {confirmationApproveModal(approve.value, approve.onFalse)}

                  {type === 'request' && (
                    <Box mt={1}>
                      {/* <Typography variant="h6" mb={1} mx={1}>
                          Request Changes
                        </Typography> */}
                      <FormProvider methods={methods} onSubmit={onSubmit} disabled={isDisabled}>
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

                          <Stack
                            alignItems={{ xs: 'stretch', sm: 'center' }}
                            direction={{ xs: 'column', sm: 'row' }}
                            gap={1.5}
                            alignSelf="end"
                          >
                            <Button
                              onClick={() => {
                                setType('approve');
                                setValue('type', 'approve');
                                setValue('feedback', '');
                                setValue('reasons', []);
                              }}
                              size="small"
                              sx={{
                                bgcolor: 'white',
                                border: 1,
                                borderRadius: 0.8,
                                borderColor: '#e7e7e7',
                                borderBottom: 3,
                                borderBottomColor: '#e7e7e7',
                                color: 'text.primary',
                                '&:hover': {
                                  bgcolor: '#f5f5f5',
                                  borderColor: '#e7e7e7',
                                },
                                textTransform: 'none',
                                px: 2.5,
                                py: 1.2,
                                fontSize: '0.875rem',
                                minWidth: '80px',
                                height: '45px',
                              }}
                            >
                              Back
                            </Button>
                            <LoadingButton
                              variant="contained"
                              size="small"
                              onClick={request.onTrue}
                              sx={{
                                bgcolor: '#2e6c56',
                                color: 'white',
                                borderBottom: 3,
                                borderBottomColor: '#1a3b2f',
                                borderRadius: 0.8,
                                px: 2.5,
                                py: 1.2,
                                '&:hover': {
                                  bgcolor: '#2e6c56',
                                  opacity: 0.9,
                                },
                                fontSize: '0.875rem',
                                minWidth: '80px',
                                height: '45px',
                                textTransform: 'none',
                              }}
                            >
                              Submit
                            </LoadingButton>
                          </Stack>
                        </Stack>

                        {confirmationRequestModal(request.value, request.onFalse)}
                      </FormProvider>
                    </Box>
                  )}
                </Box>
              </Grid>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Video Modal */}
      <Modal
        open={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        aria-labelledby="video-modal"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '95%', sm: '90%' },
            maxWidth: '1000px',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: { xs: 1, sm: 2 },
            borderRadius: 2,
          }}
        >
          <Box
            component="video"
            autoPlay
            controls
            sx={{
              width: '100%',
              maxHeight: '80vh',
            }}
          >
            <source src={submission?.content} />
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default PublicFinalDraft;

PublicFinalDraft.propTypes = {
  campaign: PropTypes.object,
  submission: PropTypes.object,
  creator: PropTypes.object,
};
