import dayjs from 'dayjs';
import * as yup from 'yup';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import React, { useMemo, useState, useEffect } from 'react';

import {
  Box,
  List,
  Chip,
  Stack,
  Dialog,
  Button,
  Avatar,
  ListItem,
  TextField,
  Typography,
  IconButton,
  DialogTitle,
  ListItemText,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';

const guideSteps = [
  'Log in to Instagram.',
  'Create a new post by tapping the "+" icon.',
  'Upload or capture your content and edit it as needed.',
  'Add a caption, hashtags, tags, or location.',
  'Tap "Share" to publish the post.',
  'Navigate to your profile and find the post.',
  'Open the post, tap the three dots (⋯), and select "Copy Link".',
  'Paste the copied link into the designated text field in your application.',
  'Submit the link to complete the process.',
];

const LoadingDots = () => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === '...') return '';
        return `${prev}.`;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return <span>{dots}</span>;
};

const CampaignPosting = ({ campaign, submission, getDependency, fullSubmission }) => {
  const dependency = getDependency(submission?.id);
  const dialog = useBoolean();
  const { user, dispatch } = useAuthContext();

  const invoiceId = campaign?.invoice?.find((invoice) => invoice?.creatorId === user?.id)?.id;

  const router = useRouter();

  const previewSubmission = useMemo(() => {
    const finalDraftSubmission = fullSubmission?.find(
      (item) => item?.id === dependency?.dependentSubmissionId
    );
    const firstDraftSubmission = fullSubmission?.find(
      (item) => item?.id === finalDraftSubmission?.dependentOn[0]?.dependentSubmissionId
    );

    if (firstDraftSubmission?.status === 'APPROVED') {
      return firstDraftSubmission;
    }
    return finalDraftSubmission;
  }, [fullSubmission, dependency]);

  const schema = yup.object().shape({
    postingLink: yup.string().required('Posting Link is required.'),
  });

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      postingLink: '',
    },
  });

  const { handleSubmit, reset, watch } = methods;

  const [openPostingModal, setOpenPostingModal] = useState(false);

  const postingLinkValue = watch('postingLink');

  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  const renderGuide = (
    <Dialog open={dialog.value} onClose={dialog.onFalse}>
      <DialogTitle>
        <Typography variant="h5" gutterBottom>
          Steps to Post on Instagram and Copy Link
        </Typography>
      </DialogTitle>
      <DialogContent>
        <List>
          {guideSteps.map((step, index) => (
            <ListItem key={index}>
              <ListItemText primary={`Step ${index + 1}: ${step}`} />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button size="small" onClick={dialog.onFalse}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );

  // const renderPostingTimeline = (
  //   <Alert severity="success">
  //     <Typography variant="subtitle1">Draft Approved! Next Step: Post Your Deliverable</Typography>
  //     <Typography variant="subtitle2">
  //       You can now post your content between {dayjs(submission?.startDate).format('D MMMM, YYYY')}{' '}
  //       and {dayjs(submission?.endDate).format('D MMMM, YYYY')}
  //     </Typography>
  //   </Alert>
  // );

  const renderRejectMessage = (
    <Box mt={2}>
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
            <Box flexGrow={1} sx={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', marginBottom: '2px' }}>
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
    </Box>
  );

  const onSubmit = handleSubmit(async (data) => {
    setOpenPostingModal(false);
    setShowSubmitDialog(true);
    setSubmitStatus('submitting');

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await axiosInstance.post(endpoints.submission.creator.postSubmission, {
        ...data,
        submissionId: submission?.id,
      });
      await new Promise((resolve) => setTimeout(resolve, 1500));
      // enqueueSnackbar(res?.data?.message);
      mutate(`${endpoints.submission.root}?creatorId=${user?.id}&campaignId=${campaign?.id}`);
      mutate(endpoints.kanban.root);
      mutate(endpoints.campaign.creator.getCampaign(campaign.id));
      reset();
      setSubmitStatus('success');
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      if (error?.message === 'Forbidden') {
        dispatch({
          type: 'LOGOUT',
        });
        enqueueSnackbar('Your session is expired. Please re-login', {
          variant: 'error',
        });
        return;
      }
      // enqueueSnackbar('Error submitting post link', {
      //   variant: 'error',
      // });
      setSubmitStatus('error');
    }
  });

  const handleCloseSubmitDialog = () => {
    setShowSubmitDialog(false);
    setSubmitStatus('');
  };

  return (
    <>
      {previewSubmission?.status === 'APPROVED' && (
        <Box p={1.5} sx={{ pb: 0 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
              mt: { xs: 0, sm: -2 },
              ml: { xs: 0, sm: -1.2 },
              textAlign: { xs: 'center', sm: 'left' },
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#221f20' }}>
              Posting Link Submission 🔗
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Due: {dayjs(submission?.endDate).format('MMM DD, YYYY')}
            </Typography>
          </Box>

          <Box
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
              mb: 3,
              mx: -1.5,
            }}
          />

          <Stack gap={2}>
            {submission?.status !== 'PENDING_REVIEW' && submission?.status !== 'APPROVED' && (
              <Box>
                <Typography variant="body1" sx={{ color: '#221f20', mb: 2, ml: -1 }}>
                  Let&apos;s wrap up this campaign by submitting your posting link on your socials! 🥳
                </Typography>
                <Typography variant="body2" sx={{ color: '#221f20', mb: 2, ml: -1, fontWeight: 600 }}>
                  {' '}
                  <Box
                    component="span"
                    sx={{ color: 'primary.main', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={dialog.onTrue}
                  >
                    Show Guide
                  </Box>
                </Typography>
              </Box>
            )}
          </Stack>

          {submission?.status === 'PENDING_REVIEW' && (
            <Stack justifyContent="center" alignItems="center" spacing={2}>
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  bgcolor: '#f4b84a',
                  fontSize: '50px',
                  mb: -2,
                }}
              >
                ⏳
              </Box>
              <Stack spacing={1} alignItems="center">
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: 'Instrument Serif, serif',
                    fontSize: { xs: '1.5rem', sm: '2.5rem' },
                    fontWeight: 550,
                  }}
                >
                  In Review
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: '#636366',
                    mt: -1,
                  }}
                >
                  Your posting link is being reviewed.
                </Typography>
              </Stack>
            </Stack>
          )}

          {submission?.status === 'IN_PROGRESS' && (
            <Stack spacing={1}>
              {/* {renderPostingTimeline} */}
              <Box
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  mb: 2,
                  mt: 24,
                  mx: -1.5,
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  onClick={() => setOpenPostingModal(true)}
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
                  Submit Link
                </Button>
              </Box>
            </Stack>
          )}

          {submission?.status === 'APPROVED' && (
            <Stack justifyContent="center" alignItems="center" spacing={2}>
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  bgcolor: '#e0fe52',
                  fontSize: '50px',
                  mb: -2,
                }}
              >
                🥳
              </Box>
              <Stack spacing={1} alignItems="center">
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: 'Instrument Serif, serif',
                    fontSize: { xs: '1.5rem', sm: '2.5rem' },
                    fontWeight: 550,
                  }}
                >
                  Completed!
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: '#636366',
                    mt: -1,
                  }}
                >
                  Your posting has been approved.
                </Typography>
              </Stack>
              <Button
                variant="contained"
                onClick={() => router.push(paths.dashboard.finance.invoiceDetail(invoiceId))}
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
                View Invoice
              </Button>
            </Stack>
          )}

          {submission?.status === 'REJECTED' && (
            <>
              {renderRejectMessage}
              <Stack spacing={1} my={1.5}>
                <Box
                  sx={{
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    mt: 2,
                    mb: 2,
                    mx: -1.5,
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    onClick={() => setOpenPostingModal(true)}
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
                    Submit New Link
                  </Button>
                </Box>
              </Stack>
            </>
          )}
        </Box>
      )}

      <Dialog
        open={openPostingModal}
        fullWidth
        maxWidth={false}
        sx={{
          maxWidth: '780px',
          margin: 'auto',
          width: '90%',
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: '#f4f4f4',
          }}
        >
          <Stack direction="row" alignItems="center" gap={2}>
            <Typography
              variant="h5"
              sx={{
                fontFamily: 'Instrument Serif, serif',
                fontSize: { xs: '2rem', sm: '2.4rem' },
                fontWeight: 550,
              }}
            >
              Submit Link
            </Typography>
            <IconButton
              onClick={() => setOpenPostingModal(false)}
              sx={{
                ml: 'auto',
                '& svg': {
                  width: 24,
                  height: 24,
                  color: '#636366',
                },
              }}
            >
              <Iconify icon="hugeicons:cancel-01" width={24} />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent
          sx={{
            bgcolor: '#f4f4f4',
          }}
        >
          <FormProvider methods={methods} onSubmit={onSubmit}>
            <Stack spacing={2} alignItems="flex-start">
              <Typography variant="subtitle2" sx={{ mb: -0.5, ml: 0.25 }}>
                Posting Link{' '}
                <Box component="span" sx={{ color: 'error.main' }}>
                  *
                </Box>
              </Typography>
              <TextField
                name="postingLink"
                placeholder="Link"
                fullWidth
                variant="outlined"
                {...methods.register('postingLink')}
                sx={{
                  bgcolor: '#ffffff',
                }}
              />
              <Button
                variant="contained"
                size="medium"
                type="submit"
                sx={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  bgcolor: postingLinkValue ? '#203ff5' : '#b0b0b1 !important',
                  color: '#ffffff !important',
                  borderBottom: 3.5,
                  borderBottomColor: postingLinkValue ? '#112286' : '#9e9e9f',
                  borderRadius: 1.5,
                  px: 2.5,
                  py: 1.2,
                  mb: 3.5,
                  mt: 2,
                  ml: 'auto',
                  alignSelf: 'flex-end',
                  '&:hover': {
                    bgcolor: postingLinkValue ? '#203ff5' : '#b0b0b1',
                    opacity: postingLinkValue ? 0.9 : 1,
                  },
                }}
                disabled={!postingLinkValue}
              >
                Complete Campaign
              </Button>
            </Stack>
          </FormProvider>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showSubmitDialog}
        maxWidth="xs"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            width: { xs: '95%', sm: '400px' },
            margin: { xs: '16px', sm: '32px' },
          },
        }}
      >
        <DialogContent>
          <Stack spacing={{ xs: 2, sm: 3 }} alignItems="center" sx={{ py: { xs: 2, sm: 4 } }}>
            {submitStatus === 'submitting' && (
              <>
                <Box
                  sx={{
                    width: { xs: 80, sm: 100 },
                    height: { xs: 80, sm: 100 },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    bgcolor: '#f4b84a',
                    fontSize: { xs: '40px', sm: '50px' },
                    mb: -2,
                  }}
                >
                  🛫
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    display: 'flex',
                    fontFamily: 'Instrument Serif, serif',
                    fontSize: { xs: '1.5rem', sm: '2.5rem' },
                    fontWeight: 550,
                    textAlign: 'center',
                  }}
                >
                  Submitting link
                  <LoadingDots />
                </Typography>
              </>
            )}
            {submitStatus === 'success' && (
              <>
                <Box
                  sx={{
                    width: { xs: 80, sm: 100 },
                    height: { xs: 80, sm: 100 },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    bgcolor: '#e0fe52',
                    fontSize: { xs: '40px', sm: '50px' },
                    mb: -2,
                  }}
                >
                  🥳
                </Box>
                <Stack spacing={1} alignItems="center">
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: 'Instrument Serif, serif',
                      fontSize: { xs: '1.5rem', sm: '2.5rem' },
                      fontWeight: 550,
                      textAlign: 'center',
                    }}
                  >
                    Campaign Completed
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: '#636366',
                      mt: -1,
                      textAlign: 'center',
                    }}
                  >
                    Woohoo! You have completed this campaign!
                  </Typography>
                </Stack>
              </>
            )}
            {submitStatus === 'error' && (
              <>
                <Box
                  sx={{
                    width: { xs: 60, sm: 80 },
                    height: { xs: 60, sm: 80 },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    bgcolor: 'error.lighter',
                    fontSize: { xs: '30px', sm: '40px' },
                    mb: { xs: 1, sm: 2 },
                  }}
                >
                  <Iconify
                    icon="mdi:error"
                    sx={{
                      width: { xs: 40, sm: 60 },
                      height: { xs: 40, sm: 60 },
                      color: 'error.main',
                    }}
                  />
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: 'Instrument Serif, serif',
                    fontSize: { xs: '1.5rem', sm: '1.8rem' },
                    fontWeight: 550,
                    textAlign: 'center',
                  }}
                >
                  Submission Failed
                </Typography>
              </>
            )}
          </Stack>
        </DialogContent>
        {(submitStatus === 'success' || submitStatus === 'error') && (
          <DialogActions sx={{ pb: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
            <Button
              onClick={handleCloseSubmitDialog}
              variant="contained"
              fullWidth
              sx={{
                bgcolor: '#3a3a3c',
                color: '#ffffff',
                borderBottom: 3.5,
                borderBottomColor: '#202021',
                borderRadius: 1.5,
                mt: -4,
                px: { xs: 2, sm: 2.5 },
                py: { xs: 1, sm: 1.2 },
                fontSize: { xs: '0.875rem', sm: '1rem' },
                '&:hover': {
                  bgcolor: '#3a3a3c',
                  opacity: 0.9,
                },
              }}
            >
              Done
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {renderGuide}
    </>
  );
};

export default CampaignPosting;

CampaignPosting.propTypes = {
  campaign: PropTypes.object,
  submission: PropTypes.object,
  getDependency: PropTypes.func,
  fullSubmission: PropTypes.array,
};
