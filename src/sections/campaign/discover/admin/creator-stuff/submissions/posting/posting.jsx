import dayjs from 'dayjs';
import * as yup from 'yup';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import React, { useMemo, useState, useEffect } from 'react';

import { LoadingButton } from '@mui/lab';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import {
  Box,
  Grid,
  Stack,
  Paper,
  Button,
  Dialog,
  Avatar,
  TextField,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';
import EmptyContent from 'src/components/empty-content/empty-content';

const Posting = ({ 
  campaign, 
  submission, 
  creator, 
  isV3 = false,
  // Individual client approval handlers (for consistency, but posting doesn't have individual media)
  handleClientApproveVideo,
  handleClientApprovePhoto,
  handleClientApproveRawFootage,
  handleClientRejectVideo,
  handleClientRejectPhoto,
  handleClientRejectRawFootage,
}) => {
  const dialogApprove = useBoolean();
  const dialogReject = useBoolean();
  const { user } = useAuthContext();
  const [feedback, setFeedback] = useState('');
  const [csmLink, setCsmLink] = useState('');
  const loading = useBoolean();
  const adminSubmissionLoading = useBoolean();
  const postingDate = useBoolean();
  const [date, setDate] = useState({
    dueDate: submission?.endDate,
  });
  const loadingDate = useBoolean();

  const [dateError, setDateError] = useState({ dueDate: null });

  // Get user role for workflow
  const userRole = user?.role || 'admin';
  const [adminSubmittedThisSession, setAdminSubmittedThisSession] = useState(false);

  // Form schema for admin submission
  const adminSubmissionSchema = yup.object().shape({
    postingLink: yup.string().required('Posting Link is required.'),
  });

  const adminSubmissionMethods = useForm({
    resolver: yupResolver(adminSubmissionSchema),
    defaultValues: {
      postingLink: '',
    },
  });

  const { handleSubmit: handleAdminSubmit, reset: resetAdminForm, watch: watchAdminForm } = adminSubmissionMethods;
  const adminPostingLinkValue = watchAdminForm('postingLink');

  const onSubmit = async (type) => {
    let res;
    try {
      loading.onTrue();
      if (type === 'APPROVED') {
        // Use V2 endpoint only
        res = await axiosInstance.patch(endpoints.submission.admin.posting, {
          submissionId: submission?.id,
          status: 'APPROVED'
        });
        dialogApprove.onFalse();
      } else {
        // Use V2 endpoint only
        res = await axiosInstance.patch(endpoints.submission.admin.posting, {
          submissionId: submission?.id,
          status: 'REJECTED',
          feedback,
          feedbackId: submission?.feedback?.id,
        });
        dialogReject.onFalse();
      }
      mutate(
        (key) =>
          typeof key === 'string' &&
          key.includes(endpoints.submission.root) &&
          key.includes(`campaignId=${campaign?.id}`),
        undefined,
        { revalidate: true }
      );
      // 2) Deliverables (if any hooks consume this)
      mutate(
        (key) =>
          typeof key === 'string' &&
          key.includes('/api/deliverables') &&
          key.includes(`campaignId=${campaign?.id}`),
        undefined,
        { revalidate: true }
      );
      setFeedback('');
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    } finally {
      loading.onFalse();
    }
  };

  // Admin submission function
  const onAdminSubmit = handleAdminSubmit(async (data) => {
    try {
      adminSubmissionLoading.onTrue();
      const res = await axiosInstance.post(endpoints.submission.admin.adminPostSubmission, {
        postingLinks: [data.postingLink],
        submissionId: submission?.id,
        creatorId: creator?.user?.id,
      });
      
      mutate(
        `${endpoints.submission.root}?creatorId=${creator?.user?.id}&campaignId=${campaign?.id}`
      );
      resetAdminForm();
      setAdminSubmittedThisSession(true);
      enqueueSnackbar(res?.data?.message || 'Posting link submitted successfully for review');
    } catch (error) {
      enqueueSnackbar(error?.message || 'Error submitting posting link', {
        variant: 'error',
      });
    } finally {
      adminSubmissionLoading.onFalse();
    }
  });

  const handleChangeDate = async (data) => {
    try {
      loadingDate.onTrue();
      const res = await axiosInstance.patch('/api/submission/posting', {
        endDate: data.dueDate,
        submissionId: submission.id,
      });

      mutate(
        `${endpoints.submission.root}?creatorId=${creator?.user?.id}&campaignId=${campaign?.id}`
      );
      postingDate.onFalse();
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    } finally {
      loadingDate.onFalse();
    }
  };

  useEffect(() => {
    if (dayjs(date.dueDate).isBefore(dayjs(), 'date')) {
      setDateError((prev) => ({ ...prev, dueDate: 'Due Date cannot be in the past' }));
    } else {
      setDateError((prev) => ({ ...prev, dueDate: null }));
    }
  }, [date]);

  const isDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced' || submission?.status === 'APPROVED',
    [user, submission?.status]
  );

  // Check if user is admin (not superadmin) and can submit for creator
  const canAdminSubmit = useMemo(() => 
     user?.admin && 
           user?.admin?.mode !== 'god' && 
           submission?.status === 'IN_PROGRESS' &&
           true // Note: Will add proper check when submittedByAdminId field is added to database
  , [user, submission]);

  // Check if current user can approve (based on who submitted)
  const canApprove = useMemo(() => {
    if (isDisabled) return false;
    
    // Hide approve/reject buttons if admin submitted this session
    if (adminSubmittedThisSession && submission?.status === 'PENDING_REVIEW') {
      return false;
    }
    
    // Note: Will implement proper role-based approval when submittedByAdminId field is added
    return user?.admin;
  }, [user, submission, isDisabled, adminSubmittedThisSession]);

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      <Grid container spacing={2} sx={{ width: '100%' }}>
        <Grid item xs={12}>
          <Box component={Paper} p={1.5} mb={2}>
            <Stack
              direction="row"
              spacing={3}
              sx={{ mb: 3, mt: -2 }}
              alignItems="center"
              justifyContent="space-between"
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
                    Due:
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: '#221f20', fontSize: '0.875rem', fontWeight: 500 }}
                  >
                    {submission?.dueDate
                      ? dayjs(submission?.dueDate).format('ddd, D MMM YYYY')
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
                    {(() => {
                      if (submission?.completedAt) return dayjs(submission.completedAt).format('ddd, D MMM YYYY');
                      if (submission?.isReview) return dayjs(submission.updatedAt).format('ddd, D MMM YYYY');
                      return '-';
                    })()}
                  </Typography>
                </Stack>
              </Stack>
              {!(false && userRole === 'admin' && submission?.status === 'SENT_TO_SUPERADMIN') && (
                <Button
                  variant="outlined"
                  onClick={postingDate.onTrue}
                  disabled={isDisabled}
                  sx={{
                    '&:disabled': {
                      display: 'none',
                    },
                  }}
                >
                  Change Posting Date
                </Button>
              )}
            </Stack>
          </Box>

          {submission?.status === 'NOT_STARTED' && !submission?.content && !(submission?.videos && submission.videos.length > 0) && <EmptyContent title="No submission." />}
          {submission?.status === 'REJECTED' && !submission?.content && !(submission?.videos && submission.videos.length > 0) && (
            <EmptyContent title="Waiting for another submission." />
          )}
          {submission?.status === 'IN_PROGRESS' && canAdminSubmit && (
            <Box component={Paper} p={2.5} mb={2}>            
              <FormProvider methods={adminSubmissionMethods} onSubmit={onAdminSubmit}>
                <Stack spacing={2}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'flex-end' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                        Posting Link{' '}
                        <Box component="span" sx={{ color: 'error.main' }}>
                          *
                        </Box>
                      </Typography>
                      <TextField
                        name="postingLink"
                        placeholder="Submit for your creator"
                        fullWidth
                        variant="outlined"
                        {...adminSubmissionMethods.register('postingLink')}
                        sx={{
                          bgcolor: '#ffffff',
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': {
                              borderColor: '#203ff5',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#203ff5',
                            },
                          },
                        }}
                      />
                    </Box>
                    <LoadingButton
                      onClick={onAdminSubmit}
                      variant="contained"
                      loading={adminSubmissionLoading.value}
                      disabled={!adminPostingLinkValue}
                      startIcon={<Iconify icon="material-symbols:send" />}
                      sx={{
                        bgcolor: adminPostingLinkValue ? '#203ff5' : '#b0b0b1',
                        color: '#ffffff',
                        borderBottom: 3.5,
                        borderBottomColor: adminPostingLinkValue ? '#112286' : '#9e9e9f',
                        borderRadius: 1.5,
                        px: 3,
                        py: 1.5,
                        height: '56px',
                        fontWeight: 600,
                        '&:hover': {
                          bgcolor: adminPostingLinkValue ? '#203ff5' : '#b0b0b1',
                          opacity: adminPostingLinkValue ? 0.9 : 1,
                        },
                        textTransform: 'none',
                        minWidth: { xs: '100%', sm: '160px' },
                      }}
                    >
                      Submit for Creator
                    </LoadingButton>
                  </Stack>
                </Stack>
              </FormProvider>
            </Box>
          )}          {submission?.status === 'PENDING_REVIEW' && (
            <>
              {/* Temporarily disabled for testing */}
              <Box
                component={Paper}
                p={1.5}
                sx={{
                  maxWidth: '100%',
                  overflow: 'visible',
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    mt: -3,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    pb: 1,
                    width: '100%',
                    overflow: 'visible',
                    position: 'relative',
                  }}
                >
                  <Box display="flex" flexDirection="column" gap={-5}>
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
                      <Box>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontSize: '1.05rem',
                          }}
                        >
                          {creator?.user?.name}
                        </Typography>
                        {/* Temporarily disabled for testing */}
                      </Box>
                    </Stack>

                    <Box
                      sx={{
                        pl: 7,
                        maxWidth: '100%',
                        overflow: 'visible',
                      }}
                    >
                      <Box
                        sx={{
                          mt: -4.5,
                          maxWidth: '100%',
                          wordBreak: 'break-all',
                        }}
                      >
   
{(() => {
                          if (submission?.videos && submission.videos.length > 0) {
                            return (
                              <Stack spacing={1.5} sx={{ mt: 1, mb: 2 }}>
                                {submission.videos.map((link, index) => (
                                  <Box 
                                    key={index} 
                                    sx={{
                                      padding: '8px 12px',
                                      backgroundColor: '#f8f9fa',
                                      borderRadius: '8px',
                                      border: '1px solid #e9ecef',
                                      transition: 'all 0.2s ease',
                                      '&:hover': {
                                        backgroundColor: '#e3f2fd',
                                        borderColor: '#2196f3',
                                        transform: 'translateY(-1px)',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                      }
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      component="a"
                                      href={link}
                                      target="_blank"
                                      rel="noopener"
                                      sx={{
                                        wordBreak: 'break-all',
                                        overflowWrap: 'break-word',
                                        color: 'primary.main',
                                        textDecoration: 'none',
                                        fontWeight: 500,
                                        fontSize: 14,
                                        '&:hover': {
                                          textDecoration: 'underline',
                                          color: 'primary.dark',
                                        },
                                        maxWidth: '100%',
                                        display: 'inline-block',
                                      }}
                                    >
                                      {link}
                                    </Typography>
                                  </Box>
                                ))}
                              </Stack>
                            );
                          }
                          
                          if (submission?.content) {
                            return (
                              <Typography
                                variant="body2"
                                component="a"
                                href={submission.content}
                                target="_blank"
                                rel="noopener"
                                sx={{
                                  wordBreak: 'break-all',
                                  overflowWrap: 'break-word',
                                  color: 'primary.main',
                                  textDecoration: 'none',
                                  '&:hover': {
                                    textDecoration: 'underline',
                                  },
                                  maxWidth: '100%',
                                  display: 'inline-block',
                                }}
                              >
                                {submission.content}
                              </Typography>
                            );
                          }
                          
                          return null;
                        })()}
                        {false && userRole === 'admin' && (submission?.status === 'PENDING_REVIEW' || submission?.status === 'CHANGES_REQUIRED') && (
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 1.5 }}>
                            <TextField fullWidth placeholder="Paste posting link" value={csmLink} onChange={(e) => setCsmLink(e.target.value)} />
                            <Button
                              variant="contained"
                              disabled={!csmLink}
                              sx={{
                                bgcolor: '#203ff5',
                                color: 'white',
                                borderBottom: 3.5,
                                borderBottomColor: '#112286',
                                borderRadius: 1.5,
                                px: 3,
                                py: 1.2,
                                minWidth: 120,
                                textTransform: 'none',
                                fontWeight: 600,
                                '&:hover': {
                                  bgcolor: '#203ff5',
                                  opacity: 0.9,
                                },
                              }}
                              onClick={async () => {
                                try {
                                  loading.onTrue();
                                  await axiosInstance.post(`${endpoints.submission.root}/posting/submit-link/csm`, { submissionId: submission.id, link: csmLink });
                                  setCsmLink('');
                                  mutate(
                                    (key) => typeof key === 'string' && key.includes(endpoints.submission.root) && key.includes(`campaignId=${campaign?.id}`),
                                    undefined,
                                    { revalidate: true }
                                  );
                                  enqueueSnackbar('Posting link submitted for superadmin review', { variant: 'success' });
                                } catch (err) {
                                  enqueueSnackbar('Failed to submit link', { variant: 'error' });
                                } finally {
                                  loading.onFalse();
                                }
                              }}
                            >
                              Submit
                            </Button>
                          </Stack>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
              <Stack my={2} textAlign="end" direction="row" spacing={1.5} justifyContent="end">

                

                
                {/* Show different buttons based on user role and submission status */}
                {false && userRole === 'client' && (submission?.displayStatus === 'PENDING_REVIEW' || submission?.status === 'SENT_TO_CLIENT') && submission?.status !== 'APPROVED' ? (
                  // Client buttons for V3
                  <>

                    <Button
                      onClick={dialogReject.onTrue}
                      disabled={isDisabled}
                      size="small"
                      variant="contained"
                      sx={{
                        bgcolor: '#FFFFFF',
                        border: 1.5,
                        borderRadius: 1.15,
                        borderColor: '#e7e7e7',
                        borderBottom: 3,
                        borderBottomColor: '#e7e7e7',
                        color: '#D4321C',
                        '&:hover': {
                          bgcolor: '#f5f5f5',
                          borderColor: '#D4321C',
                        },
                        textTransform: 'none',
                        px: 2.5,
                        py: 1.2,
                        fontSize: '1rem',
                        fontWeight: 600,
                        minWidth: '80px',
                        height: '45px',
                      }}
                    >
                      Request a change
                    </Button>
                    <LoadingButton
                      size="small"
                      onClick={dialogApprove.onTrue}
                      disabled={isDisabled}
                      variant="contained"
                      loading={loading.value}
                      sx={{
                        bgcolor: '#FFFFFF',
                        color: '#1ABF66',
                        border: '1.5px solid',
                        borderColor: '#e7e7e7',
                        borderBottom: 3,
                        borderBottomColor: '#e7e7e7',
                        borderRadius: 1.15,
                        px: 2.5,
                        py: 1.2,
                        fontWeight: 600,
                        '&:hover': {
                          bgcolor: '#f5f5f5',
                          borderColor: '#1ABF66',
                        },
                        fontSize: '1rem',
                        minWidth: '80px',
                        height: '45px',
                        textTransform: 'none',
                      }}
                    >
                      Approve
                    </LoadingButton>
                  </>
                ) : (
                  // Admin buttons (V2 style) - hide when CHANGES_REQUIRED, show only when actionable
                  submission?.status !== 'APPROVED' && submission?.status !== 'CHANGES_REQUIRED' && (submission?.content || (submission?.videos && submission.videos.length > 0)) && !(false && userRole === 'admin' && submission?.status === 'SENT_TO_SUPERADMIN') && (
                  <>
                {false && userRole === 'admin' && submission?.status === 'SENT_TO_SUPERADMIN' && (
                  <Box sx={{
                    px: 1.25,
                    py: 0.5,
                    borderRadius: 1,
                    bgcolor: 'rgba(138,90,254,0.08)',
                    color: '#8a5afe',
                    fontWeight: 700,
                    border: '1px solid',
                    borderColor: 'rgba(138,90,254,0.24)'
                  }}>
                    SENT_TO_SUPERADMIN
                  </Box>
                )}
                <Button
                  onClick={dialogReject.onTrue}
                  disabled={isDisabled}
                  size="small"
                  variant="contained"
                  sx={{
                    bgcolor: '#FFFFFF',
                    border: 1.5,
                    borderRadius: 1.15,
                    borderColor: '#e7e7e7',
                    borderBottom: 3,
                    borderBottomColor: '#e7e7e7',
                    color: '#D4321C',
                    '&:hover': {
                      bgcolor: '#f5f5f5',
                      borderColor: '#D4321C',
                    },
                    textTransform: 'none',
                    px: 2.5,
                    py: 1.2,
                    fontSize: '1rem',
                    fontWeight: 600,
                    minWidth: '80px',
                    height: '45px',
                  }}
                >
                  Reject
                </Button>
                <LoadingButton
                  size="small"
                  onClick={dialogApprove.onTrue}
                  disabled={isDisabled}
                  variant="contained"
                  loading={loading.value}
                  sx={{
                    bgcolor: '#FFFFFF',
                    color: '#1ABF66',
                    border: '1.5px solid',
                    borderColor: '#e7e7e7',
                    borderBottom: 3,
                    borderBottomColor: '#e7e7e7',
                    borderRadius: 1.15,
                    px: 2.5,
                    py: 1.2,
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: '#f5f5f5',
                      borderColor: '#1ABF66',
                    },
                    fontSize: '1rem',
                    minWidth: '80px',
                    height: '45px',
                    textTransform: 'none',
                  }}
                >
                  Approve
                </LoadingButton>
                  </>
                )
                )}
              </Stack>
            </>
          )}
          {submission?.isReview && submission?.status === 'APPROVED' && (
            <Box component={Paper} p={1.5}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box display="flex" flexDirection="column">
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
                    <Stack>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontSize: '1.05rem',
                        }}
                      >
                        {creator?.user?.name}
                      </Typography>
                      <Box sx={{ mt: 0 }}>
                        <Typography
                          variant="body2"
                          component="a"
                          href={submission?.content}
                          target="_blank"
                          rel="noopener"
                          sx={{
                            wordBreak: 'break-word',
                            color: 'primary.main',
                            textDecoration: 'none',
                            '&:hover': {
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          {submission?.content}
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </Box>
              </Box>
            </Box>
          )}
        </Grid>
      </Grid>
      <Dialog
        open={dialogApprove.value}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: '500px',
            borderRadius: 2,
            margin: '16px',
            overflowX: 'hidden',
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
          Approve Posting ✨
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Stack spacing={2}>
            <DialogContentText sx={{ fontSize: '0.925rem', fontWeight: 500 }}>
              Are you sure you want to approve this posting?
            </DialogContentText>
            <DialogContentText sx={{ fontSize: '0.925rem', fontWeight: 500 }}>
              Once approved, this action cannot be undone.
            </DialogContentText>

            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              {submission?.videos && submission.videos.length > 0 ? (
                <Stack spacing={1.5}>
                  {submission.videos.map((link, index) => (
                    <Box 
                      key={index}
                      sx={{
                        padding: '10px 14px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        border: '1px solid #e9ecef',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: '#e3f2fd',
                          borderColor: '#2196f3',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }
                      }}
                    >
                      <Typography
                        variant="body2"
                        component="a"
                        href={link}
                        target="_blank"
                        rel="noopener"
                        sx={{
                          wordBreak: 'break-word',
                          color: 'primary.main',
                          textDecoration: 'none',
                          fontWeight: 500,
                          fontSize: 14,
                          '&:hover': {
                            textDecoration: 'underline',
                            color: 'primary.dark',
                          },
                        }}
                      >
                        {link}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography
                  variant="body2"
                  component="a"
                  href={submission?.content}
                  target="_blank"
                  rel="noopener"
                  sx={{
                    wordBreak: 'break-word',
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  {submission?.content}
                </Typography>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 2 }}>
          <Button
            onClick={dialogApprove.onFalse}
            size="small"
            sx={{
              bgcolor: 'white',
              border: 1.5,
              borderRadius: 1.15,
              borderColor: '#e7e7e7',
              borderBottom: 3,
              borderBottomColor: '#e7e7e7',
              color: 'text.primary',
              '&:hover': {
                bgcolor: '#f5f5f5',
                borderColor: '#231F20',
              },
              textTransform: 'none',
              px: 2.5,
              py: 1.2,
              fontSize: '0.9rem',
              minWidth: '80px',
              height: '45px',
            }}
          >
            Cancel
          </Button>
          <LoadingButton
            onClick={() => {
              onSubmit('APPROVED');
            }}
            size="small"
            variant="contained"
            loading={loading.value}
            sx={{
              bgcolor: '#FFFFFF',
              color: '#1ABF66',
              border: '1.5px solid',
              borderColor: '#e7e7e7',
              borderBottom: 3,
              borderBottomColor: '#e7e7e7',
              borderRadius: 1.15,
              px: 2.5,
              py: 1.2,
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#f5f5f5',
                borderColor: '#1ABF66',
              },
              fontSize: '0.9rem',
              minWidth: '80px',
              height: '45px',
              textTransform: 'none',
            }}
          >
            Confirm
          </LoadingButton>
        </DialogActions>
      </Dialog>
      <Dialog
        open={dialogReject.value}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: '500px',
            borderRadius: 2,
            margin: '16px',
            overflowX: 'hidden',
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
          Reject Posting 🫣
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Stack spacing={2}>
            <DialogContentText sx={{ fontSize: '0.925rem', fontWeight: 500 }}>
              Are you sure you want to reject this posting?
            </DialogContentText>
            <DialogContentText sx={{ fontSize: '0.925rem', fontWeight: 500 }}>
              Please provide a feedback for the creator.
            </DialogContentText>
            <TextField
              label="Provide a feedback"
              onChange={(e) => setFeedback(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 2 }}>
          <Button
            onClick={dialogReject.onFalse}
            size="small"
            sx={{
              bgcolor: 'white',
              border: 1.5,
              borderRadius: 1.15,
              borderColor: '#e7e7e7',
              borderBottom: 3,
              borderBottomColor: '#e7e7e7',
              color: 'text.primary',
              '&:hover': {
                bgcolor: '#f5f5f5',
                borderColor: '#231F20',
              },
              textTransform: 'none',
              px: 2.5,
              py: 1.2,
              fontSize: '0.9rem',
              minWidth: '80px',
              height: '45px',
            }}
          >
            Cancel
          </Button>
          <LoadingButton
            onClick={() => {
              onSubmit('REJECTED');
            }}
            size="small"
            variant="contained"
            loading={loading.value}
            sx={{
              bgcolor: '#FFFFFF',
              color: '#1ABF66',
              border: '1.5px solid',
              borderColor: '#e7e7e7',
              borderBottom: 3,
              borderBottomColor: '#e7e7e7',
              borderRadius: 1.15,
              px: 2.5,
              py: 1.2,
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#f5f5f5',
                borderColor: '#1ABF66',
              },
              fontSize: '0.9rem',
              minWidth: '80px',
              height: '45px',
              textTransform: 'none',
            }}
          >
            Confirm
          </LoadingButton>
        </DialogActions>
      </Dialog>
      <Dialog
        open={postingDate.value}
        onClose={postingDate.onFalse}
        PaperProps={{
          sx: {
            borderRadius: 1,
          },
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography
            sx={{ fontFamily: (theme) => theme.typography.fontSecondaryFamily }}
            variant="h4"
          >
            Change Due Date
          </Typography>
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack direction={{ sm: 'row' }} gap={2} py={1}>
              <DatePicker
                label="Due Date"
                value={dayjs(date.dueDate)}
                onChange={(val) => setDate((prev) => ({ ...prev, dueDate: val }))}
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!dateError.dueDate,
                    helperText: dateError.dueDate,
                  },
                }}
                minDate={dayjs()}
              />
            </Stack>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined">Cancel</Button>
          <LoadingButton
            variant="contained"
            onClick={() => handleChangeDate(date)}
            disabled={!!dateError.dueDate}
            loading={loadingDate.value}
          >
            Change
          </LoadingButton>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default Posting;

Posting.propTypes = {
  campaign: PropTypes.object.isRequired,
  submission: PropTypes.object.isRequired,
  creator: PropTypes.object.isRequired,
  isV3: PropTypes.bool,
  // Individual client approval handlers
  handleClientApproveVideo: PropTypes.func,
  handleClientApprovePhoto: PropTypes.func,
  handleClientApproveRawFootage: PropTypes.func,
  handleClientRejectVideo: PropTypes.func,
  handleClientRejectPhoto: PropTypes.func,
  handleClientRejectRawFootage: PropTypes.func,
};
