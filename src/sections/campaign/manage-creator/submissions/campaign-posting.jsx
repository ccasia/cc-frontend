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
  Tooltip,
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

  // Helper function to get the due date with fallback
  const getDueDate = useMemo(() => {
    // Try multiple date fields in order of preference
    const dateOptions = [
      submission?.dueDate,
      submission?.endDate,
      submission?.startDate
    ].filter(Boolean);

    // Return the first valid date, or null if none are valid
    for (const date of dateOptions) {
      if (date && dayjs(date).isValid()) {
        return dayjs(date);
      }
    }
    
    return null;
  }, [submission?.dueDate, submission?.endDate, submission?.startDate]);

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

  // Preview approved submissions state
  const previewApproved = useBoolean();
  const [tabIndex, setTabIndex] = useState(0);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [selectedRawFootageIndex, setSelectedRawFootageIndex] = useState(0);

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

  // Get approved media from all submissions
  const getApprovedSubmissions = useMemo(() => {
    if (!fullSubmission || !Array.isArray(fullSubmission)) return { videos: [], photos: [], rawFootages: [], caption: '' };

    let allVideos = [];
    let allPhotos = [];
    let allRawFootages = [];
    let caption = '';

    // Look through ALL submissions, not just approved ones
    fullSubmission.forEach(sub => {
      // Get approved videos from any submission
      if (sub.video && Array.isArray(sub.video)) {
        const approvedVideosFromSub = sub.video.filter(v => v.status === 'APPROVED');
        allVideos = [...allVideos, ...approvedVideosFromSub];
      }
      
      // Get approved photos from any submission
      if (sub.photos && Array.isArray(sub.photos)) {
        const approvedPhotosFromSub = sub.photos.filter(p => p.status === 'APPROVED');
        allPhotos = [...allPhotos, ...approvedPhotosFromSub];
      }

      // Get approved raw footages from any submission
      if (sub.rawFootages && Array.isArray(sub.rawFootages)) {
        const approvedRawFootagesFromSub = sub.rawFootages.filter(rf => rf.status === 'APPROVED');
        allRawFootages = [...allRawFootages, ...approvedRawFootagesFromSub];
      }

      // Get caption from any submission that has approved content
      if (sub.caption && !caption && (
        (sub.video && sub.video.some(v => v.status === 'APPROVED')) ||
        (sub.photos && sub.photos.some(p => p.status === 'APPROVED')) ||
        (sub.rawFootages && sub.rawFootages.some(rf => rf.status === 'APPROVED'))
      )) {
        ({ caption } = sub);
      }
    });

    return { videos: allVideos, photos: allPhotos, rawFootages: allRawFootages, caption };
  }, [fullSubmission]);

  // Handlers for preview functionality
  const handlePreviewApprovedSubmissions = () => {
    previewApproved.onTrue();
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
              Due: {getDueDate ? getDueDate.format('MMM DD, YYYY') : 'TBD'}
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                {(getApprovedSubmissions.videos.length > 0 || getApprovedSubmissions.photos.length > 0 || getApprovedSubmissions.rawFootages.length > 0) && (
                  <Button
                    variant="outlined"
                    onClick={handlePreviewApprovedSubmissions}
                    sx={{
                      color: '#1DBF66',
                      borderColor: '#1DBF66',
                      borderBottom: 3.5,
                      borderBottomColor: '#1DBF66',
                      borderRadius: 1.5,
                      px: 2.5,
                      py: 1.2,
                      '&:hover': {
                        bgcolor: 'rgba(29, 191, 102, 0.04)',
                        borderColor: '#1DBF66',
                        borderBottomColor: '#1DBF66',
                      },
                    }}
                  >
                    See Approved Submissions
                  </Button>
                )}
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                  {(getApprovedSubmissions.videos.length > 0 || getApprovedSubmissions.photos.length > 0 || getApprovedSubmissions.rawFootages.length > 0) && (
                    <Button
                      variant="outlined"
                      onClick={handlePreviewApprovedSubmissions}
                      sx={{
                        color: '#203ff5',
                        borderColor: '#203ff5',
                        borderBottom: 3.5,
                        borderBottomColor: '#203ff5',
                        borderRadius: 1.5,
                        px: 2.5,
                        py: 1.2,
                        '&:hover': {
                          bgcolor: 'rgba(32, 63, 245, 0.04)',
                          borderColor: '#203ff5',
                          borderBottomColor: '#203ff5',
                        },
                      }}
                    >
                      Preview Approved Submissions
                    </Button>
                  )}
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

      {/* Preview Approved Submissions Fullscreen Dialog */}
      <Dialog
        open={previewApproved.value}
        onClose={previewApproved.onFalse}
        fullScreen
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            overflow: 'hidden',
            position: 'relative',
          },
        }}
        sx={{
          zIndex: 9999,
          '& .MuiDialog-container': {
            alignItems: 'center',
            justifyContent: 'center',
          },
          '& .MuiDialog-paper': {
            m: 0,
            width: '100%',
            height: '100%',
          },
        }}
      >
        {/* Header Info - Top Left */}
        <Box
          sx={{
            position: 'fixed',
            top: { xs: 10, md: 20 },
            left: { xs: 10, md: 20 },
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1, md: 1.5 },
            borderRadius: '8px',
            p: { xs: 1.5, md: 2 },
            height: { xs: '56px', md: '64px' },
            minWidth: { xs: '200px', md: '240px' },
          }}
        >
          <Box
            sx={{
              width: { xs: 36, md: 40 },
              height: { xs: 36, md: 40 },
              borderRadius: 1,
              bgcolor: '#1DBF66',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Iconify
              icon="eva:checkmark-circle-2-outline"
              sx={{
                color: 'white',
                width: { xs: 18, md: 20 },
                height: { xs: 18, md: 20 },
              }}
            />
          </Box>
          <Stack spacing={0.5}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: '#e7e7e7',
                fontSize: { xs: '13px', md: '14px' },
                lineHeight: 1.3,
              }}
            >
              Approved Submissions
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#85868E',
                fontSize: { xs: '11px', md: '12px' },
                lineHeight: 1.3,
              }}
            >
              {campaign?.name}
            </Typography>
          </Stack>
        </Box>

        {/* Content Type Navigation - Top Center */}
        <Stack
          direction="row"
          spacing={{ xs: 0.5, md: 1 }}
          sx={{
            position: 'fixed',
            top: { xs: 10, md: 20 },
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10000,
          }}
        >
          {/* Videos Button */}
          {getApprovedSubmissions.videos.length > 0 && (
            <Tooltip 
              title={`Approved Videos${getApprovedSubmissions.videos.length > 1 ? ` (${selectedVideoIndex + 1}/${getApprovedSubmissions.videos.length})` : ''}`}
              arrow 
              placement="bottom"
              PopperProps={{
                sx: {
                  zIndex: 10001,
                },
              }}
              slotProps={{
                tooltip: {
                  sx: {
                    bgcolor: 'rgba(0, 0, 0, 0.9)',
                    color: 'white',
                    fontSize: { xs: '11px', md: '12px' },
                    fontWeight: 500,
                  },
                },
                arrow: {
                  sx: {
                    color: 'rgba(0, 0, 0, 0.9)',
                  },
                },
              }}
            >
              <Button
                onClick={() => setTabIndex(0)}
                sx={{
                  minWidth: { xs: '40px', md: '44px' },
                  width: { xs: '40px', md: '44px' },
                  height: { xs: '40px', md: '44px' },
                  p: 0,
                  bgcolor: tabIndex === 0 ? '#1DBF66' : 'transparent',
                  color: '#ffffff',
                  border: '1px solid #28292C',
                  borderRadius: '8px',
                  fontWeight: 650,
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: { xs: '3px', md: '4px' },
                    left: { xs: '3px', md: '4px' },
                    right: { xs: '3px', md: '4px' },
                    bottom: { xs: '3px', md: '4px' },
                    borderRadius: '4px',
                    backgroundColor: 'transparent',
                    transition: 'background-color 0.2s ease',
                    zIndex: -1,
                  },
                  '&:hover::before': {
                    backgroundColor: tabIndex === 0 ? 'transparent' : '#5A5A5C',
                  },
                  '&:hover': {
                    bgcolor: tabIndex === 0 ? '#1DBF66' : 'transparent',
                  },
                }}
              >
                <Iconify icon="eva:video-outline" width={{ xs: 16, md: 18 }} />
              </Button>
            </Tooltip>
          )}

          {/* Photos Button */}
          {getApprovedSubmissions.photos.length > 0 && (
            <Tooltip 
              title={`Approved Photos${getApprovedSubmissions.photos.length > 1 ? ` (${selectedPhotoIndex + 1}/${getApprovedSubmissions.photos.length})` : ''}`}
              arrow 
              placement="bottom"
              PopperProps={{
                sx: {
                  zIndex: 10001,
                },
              }}
              slotProps={{
                tooltip: {
                  sx: {
                    bgcolor: 'rgba(0, 0, 0, 0.9)',
                    color: 'white',
                    fontSize: { xs: '11px', md: '12px' },
                    fontWeight: 500,
                  },
                },
                arrow: {
                  sx: {
                    color: 'rgba(0, 0, 0, 0.9)',
                  },
                },
              }}
            >
              <Button
                onClick={() => {
                  let photoTabIndex = 0;
                  if (getApprovedSubmissions.videos.length > 0) photoTabIndex = 1;
                  setTabIndex(photoTabIndex);
                }}
                sx={{
                  minWidth: { xs: '40px', md: '44px' },
                  width: { xs: '40px', md: '44px' },
                  height: { xs: '40px', md: '44px' },
                  p: 0,
                  bgcolor: tabIndex === (getApprovedSubmissions.videos.length > 0 ? 1 : 0) ? '#1DBF66' : 'transparent',
                  color: '#ffffff',
                  border: '1px solid #28292C',
                  borderRadius: '8px',
                  fontWeight: 650,
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: { xs: '3px', md: '4px' },
                    left: { xs: '3px', md: '4px' },
                    right: { xs: '3px', md: '4px' },
                    bottom: { xs: '3px', md: '4px' },
                    borderRadius: '4px',
                    backgroundColor: 'transparent',
                    transition: 'background-color 0.2s ease',
                    zIndex: -1,
                  },
                  '&:hover::before': {
                    backgroundColor: tabIndex === (getApprovedSubmissions.videos.length > 0 ? 1 : 0) ? 'transparent' : '#5A5A5C',
                  },
                  '&:hover': {
                    bgcolor: tabIndex === (getApprovedSubmissions.videos.length > 0 ? 1 : 0) ? '#1DBF66' : 'transparent',
                  },
                }}
              >
                <Iconify icon="eva:image-outline" width={{ xs: 16, md: 18 }} />
              </Button>
            </Tooltip>
          )}

          {/* Raw Footages Button */}
          {getApprovedSubmissions.rawFootages.length > 0 && (
            <Tooltip 
              title={`Approved Raw Footages${getApprovedSubmissions.rawFootages.length > 1 ? ` (${selectedRawFootageIndex + 1}/${getApprovedSubmissions.rawFootages.length})` : ''}`}
              arrow 
              placement="bottom"
              PopperProps={{
                sx: {
                  zIndex: 10001,
                },
              }}
              slotProps={{
                tooltip: {
                  sx: {
                    bgcolor: 'rgba(0, 0, 0, 0.9)',
                    color: 'white',
                    fontSize: { xs: '11px', md: '12px' },
                    fontWeight: 500,
                  },
                },
                arrow: {
                  sx: {
                    color: 'rgba(0, 0, 0, 0.9)',
                  },
                },
              }}
            >
              <Button
                onClick={() => {
                  let rawFootageTabIndex = 0;
                  if (getApprovedSubmissions.videos.length > 0) rawFootageTabIndex += 1;
                  if (getApprovedSubmissions.photos.length > 0) rawFootageTabIndex += 1;
                  setTabIndex(rawFootageTabIndex);
                }}
                sx={{
                  minWidth: { xs: '40px', md: '44px' },
                  width: { xs: '40px', md: '44px' },
                  height: { xs: '40px', md: '44px' },
                  p: 0,
                  bgcolor: (() => {
                    let rawFootageTabIndex = 0;
                    if (getApprovedSubmissions.videos.length > 0) rawFootageTabIndex += 1;
                    if (getApprovedSubmissions.photos.length > 0) rawFootageTabIndex += 1;
                    return tabIndex === rawFootageTabIndex ? '#1DBF66' : 'transparent';
                  })(),
                  color: '#ffffff',
                  border: '1px solid #28292C',
                  borderRadius: '8px',
                  fontWeight: 650,
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: { xs: '3px', md: '4px' },
                    left: { xs: '3px', md: '4px' },
                    right: { xs: '3px', md: '4px' },
                    bottom: { xs: '3px', md: '4px' },
                    borderRadius: '4px',
                    backgroundColor: 'transparent',
                    transition: 'background-color 0.2s ease',
                    zIndex: -1,
                  },
                  '&:hover::before': {
                    backgroundColor: (() => {
                      let rawFootageTabIndex = 0;
                      if (getApprovedSubmissions.videos.length > 0) rawFootageTabIndex += 1;
                      if (getApprovedSubmissions.photos.length > 0) rawFootageTabIndex += 1;
                      return tabIndex === rawFootageTabIndex ? 'transparent' : '#5A5A5C';
                    })(),
                  },
                  '&:hover': {
                    bgcolor: (() => {
                      let rawFootageTabIndex = 0;
                      if (getApprovedSubmissions.videos.length > 0) rawFootageTabIndex += 1;
                      if (getApprovedSubmissions.photos.length > 0) rawFootageTabIndex += 1;
                      return tabIndex === rawFootageTabIndex ? '#1DBF66' : 'transparent';
                    })(),
                  },
                }}
              >
                <Iconify icon="eva:film-outline" width={{ xs: 16, md: 18 }} />
              </Button>
            </Tooltip>
          )}
        </Stack>

        {/* Close Button - Top Right */}
        <Tooltip 
          title="Close" 
          arrow 
          placement="bottom"
          PopperProps={{
            sx: {
              zIndex: 10001,
            },
          }}
          slotProps={{
            tooltip: {
              sx: {
                bgcolor: 'rgba(0, 0, 0, 0.9)',
                color: 'white',
                fontSize: { xs: '11px', md: '12px' },
                fontWeight: 500,
              },
            },
            arrow: {
              sx: {
                color: 'rgba(0, 0, 0, 0.9)',
              },
            },
          }}
        >
          <Button
            onClick={previewApproved.onFalse}
            sx={{
              position: 'fixed',
              top: { xs: 10, md: 20 },
              right: { xs: 10, md: 20 },
              zIndex: 10000,
              minWidth: { xs: '40px', md: '44px' },
              width: { xs: '40px', md: '44px' },
              height: { xs: '40px', md: '44px' },
              p: 0,
              color: '#ffffff',
              border: '1px solid #28292C',
              borderRadius: '8px',
              fontWeight: 650,
              '&::before': {
                content: '""',
                position: 'absolute',
                top: { xs: '3px', md: '4px' },
                left: { xs: '3px', md: '4px' },
                right: { xs: '3px', md: '4px' },
                bottom: { xs: '3px', md: '4px' },
                borderRadius: '4px',
                backgroundColor: 'transparent',
                transition: 'background-color 0.2s ease',
                zIndex: -1,
              },
              '&:hover::before': {
                backgroundColor: '#5A5A5C',
              },
              '&:hover': {
                bgcolor: 'transparent',
              },
            }}
          >
            <Iconify icon="eva:close-fill" width={{ xs: 20, md: 22 }} />
          </Button>
        </Tooltip>

        {/* Main Content Area */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100vh',
            position: 'fixed',
            top: 0,
            left: 0,
            pt: { xs: '80px', md: '100px' },
            pb: { xs: 2, md: 3 },
            px: { xs: 2, md: 4 },
            gap: { xs: 2, md: 3 },
            overflow: 'hidden',
          }}
        >
          {/* Videos Content */}
          {tabIndex === 0 && getApprovedSubmissions.videos.length > 0 && (
            <>
              {/* Video Container */}
              <Box
                sx={{
                  position: 'relative',
                  width: { 
                    xs: '100%', 
                    md: getApprovedSubmissions.caption ? '60%' : '90%' 
                  },
                  height: { 
                    xs: getApprovedSubmissions.caption ? 'calc(60vh - 80px)' : 'calc(100vh - 120px)', 
                    md: 'calc(100vh - 120px)'
                  },
                  maxWidth: { 
                    xs: '100%', 
                    md: getApprovedSubmissions.caption ? '800px' : '1200px' 
                  },
                  bgcolor: 'black',
                  borderRadius: 2,
                  overflow: 'hidden',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {getApprovedSubmissions.videos.map((video, index) => (
                  index === selectedVideoIndex && (
                    <Box
                      key={`large-${video.id || index}`}
                      component="video"
                      src={video.url}
                      controls
                      autoPlay
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        maxWidth: '100%',
                        maxHeight: '100%',
                      }}
                    />
                  )
                ))}


              </Box>

              {/* Caption Panel - Right Side on Desktop, Bottom on Mobile */}
              {getApprovedSubmissions.caption && (
                <Box
                  sx={{
                    width: { xs: '100%', md: '35%' },
                    maxWidth: { xs: '100%', md: '400px' },
                    height: { 
                      xs: 'calc(40vh - 80px)', 
                      md: 'calc(100vh - 120px)' 
                    },
                    minHeight: { xs: '150px', md: 'auto' },
                    bgcolor: 'transparent',
                    border: '1px solid #28292C',
                    borderRadius: '8px',
                    p: { xs: 2, md: 3 },
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      color: '#ffffff',
                      fontSize: { xs: '13px', md: '14px' },
                      mb: { xs: 1.5, md: 2 },
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      flexShrink: 0,
                    }}
                  >
                    <Iconify
                      icon="solar:text-bold"
                      sx={{
                        width: { xs: 14, md: 16 },
                        height: { xs: 14, md: 16 },
                        color: '#ffffff',
                      }}
                    />
                    Video Caption
                  </Typography>
                  <Box
                    sx={{
                      flex: 1,
                      overflow: 'auto',
                      '&::-webkit-scrollbar': {
                        width: { xs: '4px', md: '6px' },
                      },
                      '&::-webkit-scrollbar-track': {
                        background: 'transparent',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: '#5A5A5C',
                        borderRadius: '3px',
                      },
                      '&::-webkit-scrollbar-thumb:hover': {
                        background: '#6A6A6C',
                      },
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#e7e7e7',
                        fontSize: { xs: '13px', md: '14px' },
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {getApprovedSubmissions.caption}
                    </Typography>
                  </Box>
                </Box>
              )}
            </>
          )}

          {/* Photos Content */}
          {(() => {
            let photoTabIndex = 0;
            if (getApprovedSubmissions.videos.length > 0) photoTabIndex = 1;
            return tabIndex === photoTabIndex && getApprovedSubmissions.photos.length > 0;
          })() && (
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '90%',
                height: 'calc(100vh - 120px)',
                maxWidth: '1200px',
              }}
            >
              {getApprovedSubmissions.photos.map((photo, index) => (
                index === selectedPhotoIndex && (
                  <Box
                    key={`large-photo-${photo.id || index}`}
                    component="img"
                    src={photo.url}
                    alt={`Photo ${index + 1}`}
                    sx={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      borderRadius: 2,
                    }}
                  />
                )
              ))}


            </Box>
          )}

          {/* Raw Footages Content */}
          {(() => {
            let rawFootageTabIndex = 0;
            if (getApprovedSubmissions.videos.length > 0) rawFootageTabIndex += 1;
            if (getApprovedSubmissions.photos.length > 0) rawFootageTabIndex += 1;
            return tabIndex === rawFootageTabIndex && getApprovedSubmissions.rawFootages.length > 0;
          })() && (
            <Box
              sx={{
                position: 'relative',
                width: { 
                  xs: '100%', 
                  md: getApprovedSubmissions.caption ? '60%' : '90%' 
                },
                height: { 
                  xs: getApprovedSubmissions.caption ? 'calc(60vh - 80px)' : 'calc(100vh - 120px)', 
                  md: 'calc(100vh - 120px)'
                },
                maxWidth: { 
                  xs: '100%', 
                  md: getApprovedSubmissions.caption ? '800px' : '1200px' 
                },
                bgcolor: 'black',
                borderRadius: 2,
                overflow: 'hidden',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {getApprovedSubmissions.rawFootages.map((rawFootage, index) => (
                index === selectedRawFootageIndex && (
                  <Box
                    key={`large-rawfootage-${rawFootage.id || index}`}
                    component="video"
                    src={rawFootage.url}
                    controls
                    autoPlay
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      maxWidth: '100%',
                      maxHeight: '100%',
                    }}
                  />
                )
              ))}


            </Box>
          )}
        </Box>

        {/* Screen Edge Navigation Arrows */}
        {/* Left Arrow - Previous */}
        {((tabIndex === 0 && getApprovedSubmissions.videos.length > 1) ||
          ((() => {
            let photoTabIndex = 0;
            if (getApprovedSubmissions.videos.length > 0) photoTabIndex = 1;
            return tabIndex === photoTabIndex && getApprovedSubmissions.photos.length > 1;
          })()) ||
          ((() => {
            let rawFootageTabIndex = 0;
            if (getApprovedSubmissions.videos.length > 0) rawFootageTabIndex += 1;
            if (getApprovedSubmissions.photos.length > 0) rawFootageTabIndex += 1;
            return tabIndex === rawFootageTabIndex && getApprovedSubmissions.rawFootages.length > 1;
          })())) && (
          <Tooltip 
            title="Previous" 
            arrow 
            placement="right"
            PopperProps={{
              sx: {
                zIndex: 10001,
              },
            }}
            slotProps={{
              tooltip: {
                sx: {
                  bgcolor: 'rgba(0, 0, 0, 0.9)',
                  color: 'white',
                  fontSize: { xs: '11px', md: '12px' },
                  fontWeight: 500,
                },
              },
              arrow: {
                sx: {
                  color: 'rgba(0, 0, 0, 0.9)',
                },
              },
            }}
          >
            <Button
              onClick={() => {
                if (tabIndex === 0 && getApprovedSubmissions.videos.length > 1) {
                  setSelectedVideoIndex((prev) => (prev - 1 + getApprovedSubmissions.videos.length) % getApprovedSubmissions.videos.length);
                } else {
                  let photoTabIndex = 0;
                  if (getApprovedSubmissions.videos.length > 0) photoTabIndex = 1;
                  if (tabIndex === photoTabIndex && getApprovedSubmissions.photos.length > 1) {
                    setSelectedPhotoIndex((prev) => (prev - 1 + getApprovedSubmissions.photos.length) % getApprovedSubmissions.photos.length);
                  } else {
                    let rawFootageTabIndex = 0;
                    if (getApprovedSubmissions.videos.length > 0) rawFootageTabIndex += 1;
                    if (getApprovedSubmissions.photos.length > 0) rawFootageTabIndex += 1;
                    if (tabIndex === rawFootageTabIndex && getApprovedSubmissions.rawFootages.length > 1) {
                      setSelectedRawFootageIndex((prev) => (prev - 1 + getApprovedSubmissions.rawFootages.length) % getApprovedSubmissions.rawFootages.length);
                    }
                  }
                }
              }}
              sx={{
                position: 'fixed',
                left: { xs: 10, md: 20 },
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10000,
                minWidth: { xs: '36px', md: '48px' },
                width: { xs: '36px', md: '48px' },
                height: { xs: '36px', md: '48px' },
                p: 0,
                color: '#ffffff',
                bgcolor: 'rgba(40, 41, 44, 0.9)',
                border: '1px solid #28292C',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  bgcolor: 'rgba(40, 41, 44, 1)',
                  transform: 'translateY(-50%) scale(1.05)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <Iconify icon="eva:arrow-ios-back-fill" width={{ xs: 24, md: 28 }} />
            </Button>
          </Tooltip>
        )}

        {/* Right Arrow - Next */}
        {((tabIndex === 0 && getApprovedSubmissions.videos.length > 1) ||
          ((() => {
            let photoTabIndex = 0;
            if (getApprovedSubmissions.videos.length > 0) photoTabIndex = 1;
            return tabIndex === photoTabIndex && getApprovedSubmissions.photos.length > 1;
          })()) ||
          ((() => {
            let rawFootageTabIndex = 0;
            if (getApprovedSubmissions.videos.length > 0) rawFootageTabIndex += 1;
            if (getApprovedSubmissions.photos.length > 0) rawFootageTabIndex += 1;
            return tabIndex === rawFootageTabIndex && getApprovedSubmissions.rawFootages.length > 1;
          })())) && (
          <Tooltip 
            title="Next" 
            arrow 
            placement="left"
            PopperProps={{
              sx: {
                zIndex: 10001,
              },
            }}
            slotProps={{
              tooltip: {
                sx: {
                  bgcolor: 'rgba(0, 0, 0, 0.9)',
                  color: 'white',
                  fontSize: { xs: '11px', md: '12px' },
                  fontWeight: 500,
                },
              },
              arrow: {
                sx: {
                  color: 'rgba(0, 0, 0, 0.9)',
                },
              },
            }}
          >
            <Button
              onClick={() => {
                if (tabIndex === 0 && getApprovedSubmissions.videos.length > 1) {
                  setSelectedVideoIndex((prev) => (prev + 1) % getApprovedSubmissions.videos.length);
                } else {
                  let photoTabIndex = 0;
                  if (getApprovedSubmissions.videos.length > 0) photoTabIndex = 1;
                  if (tabIndex === photoTabIndex && getApprovedSubmissions.photos.length > 1) {
                    setSelectedPhotoIndex((prev) => (prev + 1) % getApprovedSubmissions.photos.length);
                  } else {
                    let rawFootageTabIndex = 0;
                    if (getApprovedSubmissions.videos.length > 0) rawFootageTabIndex += 1;
                    if (getApprovedSubmissions.photos.length > 0) rawFootageTabIndex += 1;
                    if (tabIndex === rawFootageTabIndex && getApprovedSubmissions.rawFootages.length > 1) {
                      setSelectedRawFootageIndex((prev) => (prev + 1) % getApprovedSubmissions.rawFootages.length);
                    }
                  }
                }
              }}
              sx={{
                position: 'fixed',
                right: { xs: 10, md: 20 },
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10000,
                minWidth: { xs: '36px', md: '48px' },
                width: { xs: '36px', md: '48px' },
                height: { xs: '36px', md: '48px' },
                p: 0,
                color: '#ffffff',
                bgcolor: 'rgba(40, 41, 44, 0.9)',
                border: '1px solid #28292C',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  bgcolor: 'rgba(40, 41, 44, 1)',
                  transform: 'translateY(-50%) scale(1.05)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <Iconify icon="eva:arrow-ios-forward-fill" width={{ xs: 24, md: 28 }} />
            </Button>
          </Tooltip>
        )}
      </Dialog>
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
