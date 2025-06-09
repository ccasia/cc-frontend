import * as yup from 'yup';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import React, { useMemo, useState, useEffect } from 'react';

import {
  Box,
  Chip,
  Stack,
  Dialog,
  Button,
  Avatar,
  Tooltip,
  Divider,
  Container,
  TextField,
  Typography,
  IconButton,
  DialogTitle,
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

const CampaignPostingMobile = ({ campaign, submission, getDependency, fullSubmission }) => {
  const dependency = getDependency(submission?.id);
  const dialog = useBoolean();
  const { user, dispatch } = useAuthContext();
  const router = useRouter();

  const invoiceId = campaign?.invoice?.find((invoice) => invoice?.creatorId === user?.id)?.id;

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

  // Preview approved submissions state
  const previewApproved = useBoolean();
  const [tabIndex, setTabIndex] = useState(0);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [selectedRawFootageIndex, setSelectedRawFootageIndex] = useState(0);

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

  const renderGuide = (
    <Dialog 
      open={dialog.value} 
      onClose={dialog.onFalse}
      fullScreen
      sx={{
        '& .MuiDialog-paper': {
          bgcolor: '#f8f9fa',
        },
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: '1px solid #e0e0e0',
        bgcolor: 'white',
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          How to Post on Instagram
        </Typography>
        <IconButton onClick={dialog.onFalse} size="small">
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <Container maxWidth="sm" sx={{ py: 3 }}>
          <Stack spacing={2}>
            {guideSteps.map((step, index) => (
              <Box
                key={index}
                sx={{
                  p: 2,
                  bgcolor: 'white',
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                }}
              >
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: '#203ff5',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}
                  </Box>
                  <Typography variant="body2" sx={{ flex: 1, lineHeight: 1.6 }}>
                    {step}
                  </Typography>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Container>
      </DialogContent>
    </Dialog>
  );

  const renderRejectMessage = (
    <Box sx={{ mt: 2 }}>
      {submission.feedback
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map((feedback, index) => (
          <Box
            key={index}
            sx={{
              mb: 2,
              p: 2,
              bgcolor: 'white',
              borderRadius: 2,
              border: '1px solid #e0e0e0',
            }}
          >
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Avatar
                src={feedback.admin?.photoURL || '/default-avatar.png'}
                alt={feedback.admin?.name || 'User'}
                sx={{ width: 40, height: 40 }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {feedback.admin?.name || 'Unknown User'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  {feedback.admin?.role || 'No Role'}
                </Typography>
                <Box sx={{ mb: 1 }}>
                  {feedback.content.split('\n').map((line, i) => (
                    <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>
                      {line}
                    </Typography>
                  ))}
                </Box>
                {feedback.reasons && feedback.reasons.length > 0 && (
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 1 }}>
                    {feedback.reasons.map((reason, idx) => (
                      <Chip
                        key={idx}
                        label={reason}
                        size="small"
                        sx={{
                          bgcolor: '#f5f5f5',
                          color: '#666',
                          border: '1px solid #e0e0e0',
                          fontSize: '0.75rem',
                        }}
                      />
                    ))}
                  </Stack>
                )}
              </Box>
            </Stack>
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
      const res = await axiosInstance.post(endpoints.submission.creator.postSubmission, {
        ...data,
        submissionId: submission?.id,
      });
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Ensure we have a proper response before proceeding
      if (res?.data) {
        mutate(`${endpoints.submission.root}?creatorId=${user?.id}&campaignId=${campaign?.id}`);
        mutate(endpoints.kanban.root);
        mutate(endpoints.campaign.creator.getCampaign(campaign.id));
        reset();
        setSubmitStatus('success');
        
        // Optional: Show success message if available
        if (res.data.message) {
          enqueueSnackbar(res.data.message, { variant: 'success' });
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.error('Error submitting posting link:', error);
      
      if (error?.response?.status === 403 || error?.message === 'Forbidden') {
        dispatch({
          type: 'LOGOUT',
        });
        enqueueSnackbar('Your session is expired. Please re-login', {
          variant: 'error',
        });
        return;
      }
      
      // Better error handling
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          'Error submitting post link';
      
      enqueueSnackbar(errorMessage, {
        variant: 'error',
      });
      setSubmitStatus('error');
    }
  });

  const handleCloseSubmitDialog = () => {
    setShowSubmitDialog(false);
    setSubmitStatus('');
  };

  const handleGoToInvoice = () => {
    router.push(paths.dashboard.finance.invoiceDetail(invoiceId));
  };

  return (
    <>
      {previewSubmission?.status === 'APPROVED' && (
        <Container maxWidth="sm" sx={{ py: 2, px: 3 }}>
          <Stack spacing={3}>
            {/* Header */}
            <Stack spacing={1} sx={{ mb: -1 }}>
              <Button
                color="inherit"
                startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={20} />}
                onClick={() => router.back()}
                sx={{
                  alignSelf: 'flex-start',
                  color: '#636366',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  ml: -1,
                }}
              >
                Overview
              </Button>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 600,
                  fontSize: '1.5rem',
                  color: '#221f20',
                  mt: 1, 
                }}
              >
                Posting Link Submission 🔗
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Submit your Instagram post link to complete the campaign
              </Typography>
            </Stack>

            <Divider sx={{ mb: 1 }} />

            <Stack gap={2}>
              {submission?.status !== 'PENDING_REVIEW' && submission?.status !== 'APPROVED' && (
                <Box>
                  <Typography variant="body1" sx={{ color: '#221f20', mb: 2 }}>
                    Let&apos;s wrap up this campaign by submitting your posting link on your socials! 🥳
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#221f20', mb: 2, fontWeight: 600 }}>
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
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
                        width: { xs: '100%', sm: 'auto' },
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
                      width: { xs: '100%', sm: 'auto' },
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
                  onClick={handleGoToInvoice}
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
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
                          width: { xs: '100%', sm: 'auto' },
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
                        width: { xs: '100%', sm: 'auto' },
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
          </Stack>
        </Container>
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

        {/* Content Summary - Top Center */}
        {/* <Box
          sx={{
            position: 'fixed',
            top: { xs: 10, md: 20 },
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10000,
            bgcolor: 'rgba(40, 41, 44, 0.9)',
            border: '1px solid #28292C',
            borderRadius: '12px',
            px: { xs: 2, md: 3 },
            py: { xs: 1, md: 1.5 },
            backdropFilter: 'blur(10px)',
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            {getApprovedSubmissions.videos.length > 0 && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Iconify icon="eva:video-outline" width={16} sx={{ color: '#1DBF66' }} />
                <Typography variant="caption" sx={{ color: '#e7e7e7', fontSize: '12px' }}>
                  {getApprovedSubmissions.videos.length}
                </Typography>
              </Stack>
            )}
            {getApprovedSubmissions.photos.length > 0 && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Iconify icon="eva:image-outline" width={16} sx={{ color: '#1DBF66' }} />
                <Typography variant="caption" sx={{ color: '#e7e7e7', fontSize: '12px' }}>
                  {getApprovedSubmissions.photos.length}
                </Typography>
              </Stack>
            )}
            {getApprovedSubmissions.rawFootages.length > 0 && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Iconify icon="eva:film-outline" width={16} sx={{ color: '#1DBF66' }} />
                <Typography variant="caption" sx={{ color: '#e7e7e7', fontSize: '12px' }}>
                  {getApprovedSubmissions.rawFootages.length}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Box> */}

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

        {/* Main Content Area - Unified Scrollable View */}
        <Box
          sx={{
            position: 'fixed',
            top: { xs: '80px', md: '100px' },
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'auto',
            px: { xs: 2, md: 4 },
            py: { xs: 2, md: 3 },
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
          <Stack spacing={{ xs: 3, md: 4 }} sx={{ maxWidth: '1200px', mx: 'auto' }}>
            {/* Videos Section */}
            {getApprovedSubmissions.videos.length > 0 && (
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <Iconify icon="eva:video-outline" width={20} sx={{ color: '#1DBF66' }} />
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#ffffff',
                      fontSize: { xs: '16px', md: '18px' },
                      fontWeight: 600,
                    }}
                  >
                    Videos ({getApprovedSubmissions.videos.length})
                  </Typography>
                </Stack>
                <Stack spacing={2}>
                  {getApprovedSubmissions.videos.map((video, index) => (
                    <Box
                      key={`video-${video.id || index}`}
                      sx={{
                        bgcolor: 'black',
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid #28292C',
                      }}
                    >
                      <Box
                        component="video"
                        src={video.url}
                        controls
                        sx={{
                          width: '100%',
                          height: { xs: '250px', md: '400px' },
                          objectFit: 'contain',
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Photos Section */}
            {getApprovedSubmissions.photos.length > 0 && (
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <Iconify icon="eva:image-outline" width={20} sx={{ color: '#1DBF66' }} />
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#ffffff',
                      fontSize: { xs: '16px', md: '18px' },
                      fontWeight: 600,
                    }}
                  >
                    Photos ({getApprovedSubmissions.photos.length})
                  </Typography>
                </Stack>
                <Stack spacing={2}>
                  {getApprovedSubmissions.photos.map((photo, index) => (
                    <Box
                      key={`photo-${photo.id || index}`}
                      sx={{
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid #28292C',
                        bgcolor: 'black',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: { xs: '250px', md: '400px' },
                      }}
                    >
                      <Box
                        component="img"
                        src={photo.url}
                        alt={`Photo ${index + 1}`}
                        sx={{
                          maxWidth: '100%',
                          maxHeight: { xs: '250px', md: '400px' },
                          objectFit: 'contain',
                          borderRadius: 2,
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Raw Footages Section */}
            {getApprovedSubmissions.rawFootages.length > 0 && (
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <Iconify icon="eva:film-outline" width={20} sx={{ color: '#1DBF66' }} />
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#ffffff',
                      fontSize: { xs: '16px', md: '18px' },
                      fontWeight: 600,
                    }}
                  >
                    Raw Footages ({getApprovedSubmissions.rawFootages.length})
                  </Typography>
                </Stack>
                <Stack spacing={2}>
                  {getApprovedSubmissions.rawFootages.map((rawFootage, index) => (
                    <Box
                      key={`rawfootage-${rawFootage.id || index}`}
                      sx={{
                        bgcolor: 'black',
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid #28292C',
                      }}
                    >
                      <Box
                        component="video"
                        src={rawFootage.url}
                        controls
                        sx={{
                          width: '100%',
                          height: { xs: '250px', md: '400px' },
                          objectFit: 'contain',
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Caption Section */}
            {getApprovedSubmissions.caption && (
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <Iconify icon="solar:text-bold" width={20} sx={{ color: '#1DBF66' }} />
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#ffffff',
                      fontSize: { xs: '16px', md: '18px' },
                      fontWeight: 600,
                    }}
                  >
                    Caption
                  </Typography>
                </Stack>
                <Box
                  sx={{
                    bgcolor: 'rgba(40, 41, 44, 0.6)',
                    border: '1px solid #28292C',
                    borderRadius: 2,
                    p: { xs: 2, md: 3 },
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      color: '#e7e7e7',
                      fontSize: { xs: '14px', md: '16px' },
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {getApprovedSubmissions.caption}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Bottom Spacing */}
            <Box sx={{ height: { xs: 20, md: 40 } }} />
          </Stack>
        </Box>


      </Dialog>
    </>
  );
};

CampaignPostingMobile.propTypes = {
  campaign: PropTypes.object,
  submission: PropTypes.object,
  getDependency: PropTypes.func,
  fullSubmission: PropTypes.array,
};

export default CampaignPostingMobile; 