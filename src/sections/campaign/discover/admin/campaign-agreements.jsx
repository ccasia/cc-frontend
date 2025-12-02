import dayjs from 'dayjs';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { useMemo, useState, useEffect } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Table,
  Stack,
  Button,
  Dialog,
  Avatar,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
  IconButton,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
import { useGetAgreements } from 'src/hooks/use-get-agreeements';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content';
import { RHFTextField } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

import CampaignAgreementEdit from './campaign-agreement-edit';

// Convert AgreementDialog to a full component with approve/reject functionality
const AgreementDialog = ({ open, onClose, url, agreement, campaign, onApprove, onReject }) => {
  const isPendingReview = agreement?.submission?.status === 'PENDING_REVIEW';
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const feedbackDialog = useBoolean();
  const { user } = useAuthContext();

  const isDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );

  const methods = useForm({
    defaultValues: {
      feedback: '',
    },
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const handleApproveAgreement = async () => {
    try {
      setApproveLoading(true);
      const res = await axiosInstance.patch(endpoints.submission.admin.agreement, {
        campaignId: campaign?.id,
        status: 'approve',
        userId: agreement?.userId,
        submissionId: agreement?.submission?.id,
        submission: agreement?.submission,
      });
      mutate(endpoints.campaign.creatorAgreement(agreement?.campaignId));
      // Also refresh V3 pitches data to update pitch status
      mutate(`/api/pitch/v3?campaignId=${campaign?.id}`);
      // Also refresh submissions data
      if (onApprove) {
        onApprove();
      }
      onClose();
      enqueueSnackbar(res?.data?.message || 'Agreement approved successfully');
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to approve agreement', { variant: 'error' });
    } finally {
      setApproveLoading(false);
    }
  };

  const onSubmitFeedback = handleSubmit(async (data) => {
    try {
      setRejectLoading(true);
      const res = await axiosInstance.patch(endpoints.submission.admin.agreement, {
        campaignId: campaign?.id,
        status: 'reject',
        userId: agreement?.userId,
        submissionId: agreement?.submission?.id,
        feedback: data.feedback,
        submission: agreement?.submission,
      });

      mutate(endpoints.campaign.creatorAgreement(agreement?.campaignId));
      // Also refresh V3 pitches data to update pitch status
      mutate(`/api/pitch/v3?campaignId=${campaign?.id}`);
      // Also refresh submissions data
      if (onReject) {
        onReject();
      }
      feedbackDialog.onFalse();
      onClose();
      reset();
      enqueueSnackbar(res?.data?.message || 'Agreement rejected successfully');
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to reject agreement', { variant: 'error' });
    } finally {
      setRejectLoading(false);
    }
  });

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#F4F4F4' } }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ position: 'relative' }}>
            <Typography
              component="div"
              sx={{
                fontFamily: 'Instrument Serif',
                fontSize: '40px',
                fontWeight: 400,
                mb: -2,
                mt: -1,
              }}
            >
              Agreement
            </Typography>
            {agreement?.submission?.status === 'PENDING_REVIEW' && (
              <Typography
                variant="body2"
                sx={{
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  display: 'inline-block',
                  px: 1.5,
                  py: 0.5,
                  fontSize: '0.75rem',
                  border: '1px solid',
                  borderBottom: '3px solid',
                  borderRadius: 0.8,
                  bgcolor: 'white',
                  color: '#FFC702',
                  borderColor: '#FFC702',
                  mt: 1.5,
                }}
              >
                PENDING APPROVAL
              </Typography>
            )}
            {agreement?.submission?.status === 'APPROVED' && (
              <Typography
                variant="body2"
                sx={{
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  display: 'inline-block',
                  px: 1.5,
                  py: 0.5,
                  fontSize: '0.75rem',
                  border: '1px solid',
                  borderBottom: '3px solid',
                  borderRadius: 0.8,
                  bgcolor: 'white',
                  color: '#1ABF66',
                  borderColor: '#1ABF66',
                  mt: 1.5,
                }}
              >
                APPROVED
              </Typography>
            )}
            {agreement?.isSent && !agreement?.submission?.status && (
              <Typography
                variant="body2"
                sx={{
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  display: 'inline-block',
                  px: 1.5,
                  py: 0.5,
                  fontSize: '0.75rem',
                  border: '1px solid',
                  borderBottom: '3px solid',
                  borderRadius: 0.8,
                  bgcolor: 'white',
                  color: '#8A5AFE',
                  borderColor: '#8A5AFE',
                  mt: 1.5,
                }}
              >
                SENT TO CREATOR
              </Typography>
            )}

            <IconButton
              aria-label="close"
              onClick={onClose}
              sx={{
                position: 'absolute',
                right: 0,
                top: 0,
                color: '#637381',
                padding: 1.5,
                width: 48,
                height: 48,
                '&:hover': {
                  bgcolor: 'rgba(99, 115, 129, 0.08)',
                },
              }}
            >
              <Iconify icon="eva:close-fill" width={24} height={24} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <iframe
            src={agreement?.submission?.content || url}
            title="Agreement"
            style={{ width: '100%', height: '600px', border: 'none' }}
          />
        </DialogContent>
        {isPendingReview && (
          <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'flex-end', gap: -1 }}>
            <Button
              variant="contained"
              onClick={feedbackDialog.onTrue}
              disabled={isDisabled || rejectLoading}
              sx={{
                textTransform: 'none',
                minHeight: 42,
                minWidth: 100,
                bgcolor: '#ffffff',
                color: '#D4321C',
                border: '1.5px solid',
                borderColor: '#e7e7e7',
                borderBottom: '3px solid',
                borderBottomColor: '#e7e7e7',
                borderRadius: 1.15,
                fontWeight: 600,
                fontSize: '16px',
                '&:hover': {
                  bgcolor: '#f5f5f5',
                  border: '1.5px solid',
                  borderColor: '#D4321C',
                  borderBottom: '3px solid',
                  borderBottomColor: '#D4321C',
                },
                '&.Mui-disabled': {
                  border: '1.5px solid #e7e7e7',
                  borderBottom: '3px solid #e7e7e7',
                },
              }}
            >
              Reject
            </Button>
            <LoadingButton
              variant="contained"
              onClick={handleApproveAgreement}
              loading={approveLoading}
              disabled={isDisabled}
              sx={{
                textTransform: 'none',
                minHeight: 42,
                minWidth: 100,
                bgcolor: '#FFFFFF',
                color: '#1ABF66',
                border: '1.5px solid',
                borderColor: '#E7E7E7',
                borderBottom: '3px solid',
                borderBottomColor: '#E7E7E7',
                borderRadius: 1.15,
                fontWeight: 600,
                fontSize: '16px',
                '&:hover': {
                  bgcolor: '#f5f5f5',
                  border: '1.5px solid',
                  borderColor: '#1ABF66',
                  borderBottom: '3px solid',
                  borderBottomColor: '#1ABF66',
                },
                '&.Mui-disabled': {
                  border: '1.5px solid #e7e7e7',
                  borderBottom: '3px solid #e7e7e7',
                },
              }}
            >
              Approve
            </LoadingButton>
          </DialogActions>
        )}
      </Dialog>

      <Dialog open={feedbackDialog.value} onClose={feedbackDialog.onFalse} maxWidth="xs" fullWidth>
        <FormProvider methods={methods} onSubmit={onSubmitFeedback}>
          <DialogTitle>Feedback</DialogTitle>
          <DialogContent>
            <Box pt={2}>
              <RHFTextField
                name="feedback"
                label="Feedback"
                placeholder="Reason to reject"
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                reset();
                feedbackDialog.onFalse();
              }}
              variant="contained"
              sx={{
                textTransform: 'none',
                minHeight: 42,
                minWidth: 100,
                bgcolor: '#ffffff',
                color: '#636366',
                border: '1.5px solid',
                borderColor: '#e7e7e7',
                borderBottom: '3px solid',
                borderBottomColor: '#e7e7e7',
                borderRadius: 1.15,
                fontWeight: 600,
                fontSize: '16px',
                '&:hover': {
                  bgcolor: '#e7e7e7',
                },
              }}
            >
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              variant="contained"
              loading={isSubmitting || rejectLoading}
              disabled={isDisabled}
              sx={{
                textTransform: 'none',
                minHeight: 42,
                minWidth: 100,
                bgcolor: '#2e6c56',
                color: '#fff',
                border: 'none',
                borderBottom: '3px solid',
                borderBottomColor: '#202021',
                borderRadius: 1.15,
                fontWeight: 600,
                fontSize: '16px',
                '&:hover': {
                  bgcolor: '#1e4a3a',
                },
                '&:disabled': {
                  display: 'none',
                },
              }}
            >
              Submit
            </LoadingButton>
          </DialogActions>
        </FormProvider>
      </Dialog>
    </>
  );
};

// Update the propTypes definition
AgreementDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  url: PropTypes.string,
  agreement: PropTypes.object,
  campaign: PropTypes.object,
  onApprove: PropTypes.func,
  onReject: PropTypes.func,
};

const CampaignAgreements = ({ campaign }) => {
  const { data, isLoading } = useGetAgreements(campaign?.id);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

  const dialog = useBoolean();
  const editDialog = useBoolean();
  const feedbackDialog = useBoolean();
  const [selectedUrl, setSelectedUrl] = useState('');
  const [selectedAgreement, setSelectedAgreement] = useState(null);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  const { user } = useAuthContext();

  const smUp = useResponsive('up', 'sm');

  // Toggle sort direction
  const handleToggleSort = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  const methods = useForm({
    defaultValues: {
      feedback: '',
    },
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  // Fetch submissions to get PENDING_REVIEW status
  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!campaign?.id) return;

      try {
        const response = await axiosInstance.get(
          `${endpoints.submission.root}?campaignId=${campaign.id}`
        );
        setSubmissions(response.data);
      } catch (error) {
        console.error('Error fetching submissions:', error);
      } finally {
        setLoadingSubmissions(false);
      }
    };

    fetchSubmissions();
  }, [campaign?.id]);

  // Combine the agreements data with submission status
  const combinedData = useMemo(() => {
    if (!data || !submissions || loadingSubmissions) return data;

    return data.map((agreement) => {
      const agreementSubmission = submissions.find(
        (sub) => sub.userId === agreement.userId && sub.submissionType?.type === 'AGREEMENT_FORM'
      );

      return {
        ...agreement,
        submission: agreementSubmission,
      };
    });
  }, [data, submissions, loadingSubmissions]);

  const filteredData = useMemo(() => {
    if (!combinedData) return [];

    let result = [];

    if (selectedFilter === 'pending') {
      result = combinedData.filter((item) => !item.isSent);
    } else if (selectedFilter === 'sent') {
      result = combinedData.filter((item) => item.isSent);
    } else {
      result = combinedData;
    }

    // Sort by creator name
    return [...result].sort((a, b) => {
      const nameA = (a.user?.name || '').toLowerCase();
      const nameB = (b.user?.name || '').toLowerCase();

      return sortDirection === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
  }, [combinedData, selectedFilter, sortDirection]);

  const handleViewAgreement = (url, item) => {
    setSelectedUrl(url);
    setSelectedAgreement(item);
    dialog.onTrue();
  };

  const handleEditAgreement = (agreement) => {
    setSelectedAgreement(agreement);
    editDialog.onTrue();
  };

  const handleSendAgreement = async (item) => {
    try {
      // Use different endpoints based on whether it's a resend or initial send
      const endpoint = item.isSent
        ? endpoints.campaign.resendAgreement
        : endpoints.campaign.sendAgreement;

      // For resend, use different payload format
      const payload = item.isSent ? { userId: item.userId, campaignId: item.campaignId } : item;

      const res = await axiosInstance.patch(endpoint, payload);
      mutate(endpoints.campaign.creatorAgreement(item?.campaignId));
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      enqueueSnackbar(error?.message, { variant: 'error' });
    }
  };

  const handleApproveAgreement = async (item) => {
    try {
      setApproveLoading(true);
      const res = await axiosInstance.patch(endpoints.submission.admin.agreement, {
        campaignId: campaign?.id,
        status: 'approve',
        userId: item?.userId,
        submissionId: item?.submission?.id,
        submission: item?.submission,
      });
      mutate(endpoints.campaign.creatorAgreement(item?.campaignId));
      // Also refresh V3 pitches data to update pitch status
      mutate(`/api/pitch/v3?campaignId=${campaign?.id}`);
      // Also refresh submissions data
      const response = await axiosInstance.get(
        `${endpoints.submission.root}?campaignId=${campaign.id}`
      );
      setSubmissions(response.data);
      enqueueSnackbar(res?.data?.message || 'Agreement approved successfully');
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to approve agreement', { variant: 'error' });
    } finally {
      setApproveLoading(false);
    }
  };

  const handleOpenRejectDialog = (agreement) => {
    setSelectedAgreement(agreement);
    feedbackDialog.onTrue();
  };

  const onSubmitFeedback = handleSubmit(async (formData) => {
    try {
      setRejectLoading(true);
      const res = await axiosInstance.patch(endpoints.submission.admin.agreement, {
        campaignId: campaign?.id,
        status: 'reject',
        userId: selectedAgreement?.userId,
        submissionId: selectedAgreement?.submission?.id,
        feedback: formData.feedback,
        submission: selectedAgreement?.submission,
      });

      mutate(endpoints.campaign.creatorAgreement(selectedAgreement?.campaignId));
      // Also refresh V3 pitches data to update pitch status
      mutate(`/api/pitch/v3?campaignId=${campaign?.id}`);
      // Also refresh submissions data
      const response = await axiosInstance.get(
        `${endpoints.submission.root}?campaignId=${campaign.id}`
      );
      setSubmissions(response.data);
      feedbackDialog.onFalse();
      reset();
      enqueueSnackbar(res?.data?.message || 'Agreement rejected successfully');
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to reject agreement', { variant: 'error' });
    } finally {
      setRejectLoading(false);
    }
  });

  const isDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );

  if (isLoading || loadingSubmissions) {
    return <div>Loading...</div>; // A loading message while the data is being fetched
  }

  if (!filteredData || filteredData.length < 1) {
    return <EmptyContent title="No agreements found" />;
  }

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Stack direction="column" spacing={2}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          justifyContent="flex-start"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          sx={{ mb: 1 }}
        >
          {/* Alphabetical Sort Button */}
          <Button
            onClick={handleToggleSort}
            endIcon={
              <Stack direction="row" alignItems="center" spacing={0.5}>
                {sortDirection === 'asc' ? (
                  <Stack direction="column" alignItems="center" spacing={0}>
                    <Typography
                      variant="caption"
                      sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 700 }}
                    >
                      A
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 400 }}
                    >
                      Z
                    </Typography>
                  </Stack>
                ) : (
                  <Stack direction="column" alignItems="center" spacing={0}>
                    <Typography
                      variant="caption"
                      sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 400 }}
                    >
                      Z
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 700 }}
                    >
                      A
                    </Typography>
                  </Stack>
                )}
                <Iconify
                  icon={
                    sortDirection === 'asc' ? 'eva:arrow-downward-fill' : 'eva:arrow-upward-fill'
                  }
                  width={12}
                />
              </Stack>
            }
            sx={{
              px: 1.5,
              py: 0.75,
              height: '42px',
              color: '#637381',
              fontWeight: 600,
              fontSize: '0.875rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: 1,
              textTransform: 'none',
              whiteSpace: 'nowrap',
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: 'transparent',
                color: '#221f20',
              },
            }}
          >
            Alphabetical
          </Button>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{ width: { xs: '100%', md: 'auto' } }}
          >
            {/* <Button
              fullWidth={!mdUp}
              onClick={() => setSelectedFilter('all')}
              sx={{
                px: 1.5,
                py: 2.5,
                height: '42px',
                border: '1px solid #e7e7e7',
                borderBottom: '3px solid #e7e7e7',
                borderRadius: 1,
                fontSize: '0.85rem',
                fontWeight: 600,
                textTransform: 'none',
                ...(selectedFilter === 'all'
                  ? {
                      color: '#203ff5',
                      bgcolor: 'rgba(32, 63, 245, 0.04)',
                    }
                  : {
                      color: '#637381',
                      bgcolor: 'transparent',
                    }),
                '&:hover': {
                  bgcolor: selectedFilter === 'all' ? 'rgba(32, 63, 245, 0.04)' : 'transparent',
                },
              }}
            >
              All
            </Button>

            <Button
              fullWidth={!mdUp}
              onClick={() => setSelectedFilter('pending')}
              sx={{
                px: 1.5,
                py: 2.5,
                height: '42px',
                border: '1px solid #e7e7e7',
                borderBottom: '3px solid #e7e7e7',
                borderRadius: 1,
                fontSize: '0.85rem',
                fontWeight: 600,
                textTransform: 'none',
                ...(selectedFilter === 'pending'
                  ? {
                      color: '#203ff5',
                      bgcolor: 'rgba(32, 63, 245, 0.04)',
                    }
                  : {
                      color: '#637381',
                      bgcolor: 'transparent',
                    }),
                '&:hover': {
                  bgcolor: selectedFilter === 'pending' ? 'rgba(32, 63, 245, 0.04)' : 'transparent',
                },
              }}
            >
              {`Pending (${pendingCount})`}
            </Button>

            <Button
              fullWidth={!mdUp}
              onClick={() => setSelectedFilter('sent')}
              sx={{
                px: 1.5,
                py: 2.5,
                height: '42px',
                border: '1px solid #e7e7e7',
                borderBottom: '3px solid #e7e7e7',
                borderRadius: 1,
                fontSize: '0.85rem',
                fontWeight: 600,
                textTransform: 'none',
                ...(selectedFilter === 'sent'
                  ? {
                      color: '#203ff5',
                      bgcolor: 'rgba(32, 63, 245, 0.04)',
                    }
                  : {
                      color: '#637381',
                      bgcolor: 'transparent',
                    }),
                '&:hover': {
                  bgcolor: selectedFilter === 'sent' ? 'rgba(32, 63, 245, 0.04)' : 'transparent',
                },
              }}
            >
              {`Sent (${sentCount})`}
            </Button> */}
          </Stack>
        </Stack>

        <TableContainer
          sx={{
            width: '100%',
            minWidth: { xs: '100%', sm: 800 },
            position: 'relative',
            bgcolor: 'transparent',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Table size={smUp ? 'medium' : 'small'}>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    py: { xs: 0.5, sm: 1 },
                    px: { xs: 1, sm: 2 },
                    color: '#221f20',
                    fontWeight: 600,
                    width: { xs: '25%', sm: 220 },
                    minWidth: { xs: 120, sm: 220 },
                    borderRadius: '10px 0 0 10px',
                    bgcolor: '#f5f5f5',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Creator
                </TableCell>
                {smUp && (
                  <TableCell
                    sx={{
                      py: 1,
                      color: '#221f20',
                      fontWeight: 600,
                      width: { xs: '20%', sm: 220 },
                      minWidth: { xs: 140, sm: 220 },
                      bgcolor: '#f5f5f5',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Creator&apos;s Email
                  </TableCell>
                )}
                <TableCell
                  sx={{
                    py: 1,
                    color: '#221f20',
                    fontWeight: 600,
                    width: { xs: '25%', sm: 150 },
                    minWidth: { xs: 110, sm: 150 },
                    bgcolor: '#f5f5f5',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Issue Date
                </TableCell>
                <TableCell
                  sx={{
                    py: 1,
                    color: '#221f20',
                    fontWeight: 600,
                    width: { xs: '15%', sm: 80 },
                    minWidth: { xs: 90, sm: 80 },
                    bgcolor: '#f5f5f5',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Status
                </TableCell>
                <TableCell
                  sx={{
                    py: 1,
                    color: '#221f20',
                    fontWeight: 600,
                    width: { xs: '20%', sm: 95 },
                    minWidth: { xs: 85, sm: 95 },
                    bgcolor: '#f5f5f5',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Price
                </TableCell>
                <TableCell
                  sx={{
                    py: 1,
                    color: '#221f20',
                    fontWeight: 600,
                    width: { xs: '15%', sm: 80 },
                    minWidth: { xs: 70, sm: 80 },
                    borderRadius: '0 10px 10px 0',
                    bgcolor: '#f5f5f5',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Agreement PDF
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((item) => {
                const isAmountValid = !Number.isNaN(
                  parseFloat(item?.user?.shortlisted[0]?.amount?.toString()) ||
                    parseFloat(item?.amount?.toString())
                );

                const isPendingReview = item?.submission?.status === 'PENDING_REVIEW';

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={{ xs: 1 }}>
                        <Avatar
                          src={item?.user?.photoURL}
                          alt={item?.user?.name}
                          sx={{
                            width: { xs: 32, sm: 40 },
                            height: { xs: 32, sm: 40 },
                            border: '2px solid',
                            borderColor: 'background.paper',
                            boxShadow: (theme) => theme.customShadows.z8,
                          }}
                        >
                          {item?.user?.name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Stack spacing={0.5}>
                          <Typography variant="body2">{item?.user?.name}</Typography>
                          {!smUp && !item?.user?.email?.endsWith('@tempmail.com') && (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {item?.user?.email}
                            </Typography>
                          )}
                        </Stack>
                      </Stack>
                    </TableCell>
                    {smUp && (
                      <TableCell>
                        {item?.user?.email?.endsWith('@tempmail.com') ? '' : item?.user?.email}
                      </TableCell>
                    )}
                    <TableCell
                      sx={{
                        width: { xs: '25%', sm: 150 },
                        minWidth: { xs: 110, sm: 150 },
                      }}
                    >
                      <Stack spacing={0.5} alignItems="start">
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: { xs: '0.7rem', sm: '0.875rem' },
                          }}
                        >
                          {dayjs(item?.updatedAt).format('LL')}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#8e8e93',
                            display: 'block',
                            fontSize: { xs: '0.7rem', sm: '0.875rem' },
                            mt: '-2px',
                          }}
                        >
                          {dayjs(item?.updatedAt).format('LT')}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        let statusText = 'Pending';
                        let statusStyles = {
                          color: '#f19f39',
                          borderColor: '#f19f39',
                        };

                        if (isPendingReview) {
                          statusText = 'PENDING APPROVAL';
                          statusStyles = {
                            color: '#FFC702',
                            borderColor: '#FFC702',
                          };
                        } else if (item?.submission?.status === 'APPROVED') {
                          statusText = 'APPROVED';
                          statusStyles = {
                            color: '#1ABF66',
                            borderColor: '#1ABF66',
                          };
                        } else if (item?.isSent) {
                          statusText = 'Sent To Creator';
                          statusStyles = {
                            color: '#8A5AFE',
                            borderColor: '#8A5AFE',
                          };
                        }

                        return (
                          <Typography
                            variant="body2"
                            sx={{
                              textTransform: 'uppercase',
                              fontWeight: 700,
                              display: 'inline-block',
                              px: { xs: 0.6, sm: 1.5 },
                              py: { xs: 0.2, sm: 0.5 },
                              fontSize: { xs: '0.6rem', sm: '0.75rem' },
                              border: '1px solid',
                              borderBottom: '3px solid',
                              borderRadius: 0.8,
                              bgcolor: 'white',
                              whiteSpace: 'nowrap',
                              ...statusStyles,
                            }}
                          >
                            {statusText}
                          </Typography>
                        );
                      })()}
                    </TableCell>
                    <TableCell
                      sx={{
                        width: { xs: '20%', sm: 95 },
                        minWidth: { xs: 85, sm: 95 },
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: { xs: '0.7rem', sm: '0.875rem' },
                        }}
                      >
                        {isAmountValid ? (
                          <>
                            {item?.user?.shortlisted[0]?.currency ? (
                              <>
                                {`${item?.user?.shortlisted[0]?.currency} 
                                ${parseFloat(item?.amount?.toString()) || parseFloat(item?.user?.shortlisted[0]?.amount?.toString())}`}
                              </>
                            ) : (
                              <>{`${item?.user?.shortlisted[0]?.currency} ${parseFloat(item?.amount?.toString())}`}</>
                            )}
                          </>
                        ) : (
                          'Not Set'
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {smUp ? (
                        <Stack direction="row" gap={1}>
                          {item?.agreementUrl && (
                            <Button
                              onClick={() => handleViewAgreement(item?.agreementUrl, item)}
                              size="small"
                              variant="contained"
                              sx={{
                                px: 1.5,
                                py: 2,
                                bgcolor: '#ffffff',
                                color: '#221f20',
                                border: '1.5px solid',
                                borderColor: '#e7e7e7',
                                borderBottom: '3px solid',
                                borderBottomColor: '#e7e7e7',
                                borderRadius: 1.15,
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                textTransform: 'none',
                                '&:hover': {
                                  bgcolor: '#f5f5f5',
                                  border: '1.5px solid',
                                  borderColor: '#221f20',
                                  borderBottom: '3px solid',
                                  borderBottomColor: '#221f20',
                                },
                              }}
                            >
                              View
                            </Button>
                          )}

                          {!item.isSent ? (
                            // For pending (not sent) agreements, show Send Agreement button
                            <Button
                              onClick={() => handleEditAgreement(item)}
                              disabled={isDisabled}
                              size="small"
                              variant="contained"
                              startIcon={
                                <Iconify
                                  icon="bx:send"
                                  sx={{
                                    color: '#fff',
                                  }}
                                />
                              }
                              sx={{
                                px: 2,
                                py: 2,
                                bgcolor: '#1340FF',
                                color: '#ffffff',
                                border: '1.5px solid #1340FF',
                                borderBottom: '3px solid',
                                borderBottomColor: '#00000073',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                textTransform: 'none',
                                whiteSpace: 'nowrap',
                                '&:hover': {
                                  bgcolor: '#0a2dd9',
                                },
                                '&.Mui-disabled': {
                                  bgcolor: 'rgba(19, 64, 255, 0.5)',
                                  color: '#ffffff',
                                },
                              }}
                            >
                              Send Agreement
                            </Button>
                          ) : (
                            // For sent agreements, show Edit Amount and action buttons
                            <>
                              <Button
                                onClick={() => handleEditAgreement(item)}
                                disabled={isDisabled}
                                size="small"
                                variant="contained"
                                sx={{
                                  px: 1.5,
                                  py: 2,
                                  bgcolor: '#ffffff',
                                  color: '#221f20',
                                  border: '1.5px solid',
                                  borderColor: '#e7e7e7',
                                  borderBottom: '3px solid',
                                  borderBottomColor: '#e7e7e7',
                                  borderRadius: 1.15,
                                  fontSize: '0.85rem',
                                  fontWeight: 600,
                                  textTransform: 'none',
                                  whiteSpace: 'nowrap',
                                  '&:hover': {
                                    bgcolor: '#f5f5f5',
                                    border: '1.5px solid',
                                    borderColor: '#221f20',
                                    borderBottom: '3px solid',
                                    borderBottomColor: '#221f20',
                                  },
                                  '&.Mui-disabled': {
                                    border: '1.5px solid #e7e7e7',
                                    borderBottom: '3px solid #e7e7e7',
                                  },
                                }}
                              >
                                Edit Amount
                              </Button>

                              {isPendingReview ? (
                                <>
                                  <Button
                                    onClick={() => handleOpenRejectDialog(item)}
                                    size="small"
                                    variant="contained"
                                    disabled={isDisabled || rejectLoading}
                                    sx={{
                                      px: 2,
                                      py: 2,
                                      bgcolor: '#ffffff',
                                      color: '#D4321C',
                                      border: '1.5px solid',
                                      borderColor: '#e7e7e7',
                                      borderBottom: '3px solid',
                                      borderBottomColor: '#e7e7e7',
                                      borderRadius: 1,
                                      fontSize: '0.85rem',
                                      fontWeight: 600,
                                      textTransform: 'none',
                                      '&:hover': {
                                        bgcolor: '#f5f5f5',
                                        border: '1.5px solid',
                                        borderColor: '#D4321C',
                                        borderBottom: '3px solid',
                                        borderBottomColor: '#D4321C',
                                      },
                                      '&.Mui-disabled': {
                                        border: '1.5px solid #e7e7e7',
                                        borderBottom: '3px solid #e7e7e7',
                                      },
                                    }}
                                  >
                                    Reject
                                  </Button>
                                  <LoadingButton
                                    onClick={() => handleApproveAgreement(item)}
                                    size="small"
                                    variant="contained"
                                    loading={approveLoading}
                                    disabled={isDisabled}
                                    sx={{
                                      px: 2,
                                      py: 2,
                                      bgcolor: '#FFFFFF',
                                      color: '#1ABF66',
                                      border: '1.5px solid',
                                      borderColor: '#E7E7E7',
                                      borderBottom: '3px solid',
                                      borderBottomColor: '#E7E7E7',
                                      borderRadius: 1,
                                      fontSize: '0.85rem',
                                      fontWeight: 600,
                                      textTransform: 'none',
                                      '&:hover': {
                                        bgcolor: '#f5f5f5',
                                        border: '1.5px solid',
                                        borderColor: '#1ABF66',
                                        borderBottom: '3px solid',
                                        borderBottomColor: '#1ABF66',
                                      },
                                      '&.Mui-disabled': {
                                        border: '1.5px solid #e7e7e7',
                                        borderBottom: '3px solid #e7e7e7',
                                      },
                                    }}
                                  >
                                    Approve
                                  </LoadingButton>
                                </>
                              ) : (
                                <Button
                                  onClick={() => handleSendAgreement(item)}
                                  size="small"
                                  variant="contained"
                                  startIcon={
                                    <Iconify
                                      icon="bx:send"
                                      sx={{
                                        color:
                                          isDisabled || !isAmountValid
                                            ? 'rgba(19, 64, 255, 0.5)'
                                            : '#1340FF',
                                      }}
                                    />
                                  }
                                  disabled={isDisabled || !isAmountValid}
                                  sx={{
                                    px: 1.5,
                                    py: 2,
                                    bgcolor: '#FFFFFF',
                                    color: '#1340FF',
                                    border: '1.5px solid',
                                    borderColor: '#E7E7E7',
                                    borderBottom: '3px solid',
                                    borderBottomColor: '#E7E7E7',
                                    borderRadius: 1.15,
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    '&:hover': {
                                      bgcolor: '#f5f5f5',
                                      border: '1.5px solid',
                                      borderColor: '#1340FF',
                                      borderBottom: '3px solid',
                                      borderBottomColor: '#1340FF',
                                    },
                                    '&.Mui-disabled': {
                                      border: '1.5px solid #e7e7e7',
                                      borderBottom: '3px solid #e7e7e7',
                                      color: 'rgba(19, 64, 255, 0.5)',
                                    },
                                  }}
                                >
                                  {item.isSent ? 'Resend' : 'Send'}
                                </Button>
                              )}
                            </>
                          )}
                        </Stack>
                      ) : (
                        <Stack direction="row" gap={1}>
                          <IconButton onClick={() => handleViewAgreement(item?.agreementUrl, item)}>
                            <Iconify icon="hugeicons:view" />
                          </IconButton>
                          <IconButton
                            color="warning"
                            onClick={() => handleEditAgreement(item)}
                            disabled={isDisabled}
                          >
                            <Iconify icon="iconamoon:edit-light" />
                          </IconButton>

                          {isPendingReview ? (
                            <>
                              <IconButton
                                color="error"
                                onClick={() => handleOpenRejectDialog(item)}
                                disabled={isDisabled || rejectLoading}
                              >
                                <Iconify icon="solar:close-circle-bold" />
                              </IconButton>
                              <IconButton
                                color="success"
                                onClick={() => handleApproveAgreement(item)}
                                disabled={isDisabled}
                              >
                                <Iconify icon="solar:check-circle-bold" />
                              </IconButton>
                            </>
                          ) : (
                            <IconButton
                              color={item.isSent ? 'warning' : 'primary'}
                              onClick={() => handleSendAgreement(item)}
                              disabled={isDisabled || !isAmountValid}
                            >
                              <Iconify icon="bx:send" />
                            </IconButton>
                          )}
                        </Stack>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>

      <AgreementDialog
        open={dialog.value}
        onClose={dialog.onFalse}
        url={selectedUrl}
        agreement={selectedAgreement}
        campaign={campaign}
        onApprove={async () => {
          // Refresh V3 pitches data to update pitch status
          mutate(`/api/pitch/v3?campaignId=${campaign?.id}`);
          // Refresh submissions data
          const response = await axiosInstance.get(
            `${endpoints.submission.root}?campaignId=${campaign.id}`
          );
          setSubmissions(response.data);
        }}
        onReject={async () => {
          // Refresh V3 pitches data to update pitch status
          mutate(`/api/pitch/v3?campaignId=${campaign?.id}`);
          // Refresh submissions data
          const response = await axiosInstance.get(
            `${endpoints.submission.root}?campaignId=${campaign.id}`
          );
          setSubmissions(response.data);
        }}
      />

      <Dialog open={feedbackDialog.value} onClose={feedbackDialog.onFalse} maxWidth="xs" fullWidth>
        <FormProvider methods={methods} onSubmit={onSubmitFeedback}>
          <DialogTitle>Feedback</DialogTitle>
          <DialogContent>
            <Box pt={2}>
              <RHFTextField
                name="feedback"
                label="Feedback"
                placeholder="Reason to reject"
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                reset();
                feedbackDialog.onFalse();
              }}
              variant="contained"
              sx={{
                textTransform: 'none',
                minHeight: 42,
                minWidth: 100,
                bgcolor: '#ffffff',
                color: '#636366',
                border: '1.5px solid',
                borderColor: '#e7e7e7',
                borderBottom: '3px solid',
                borderBottomColor: '#e7e7e7',
                borderRadius: 1.15,
                fontWeight: 600,
                fontSize: '16px',
                '&:hover': {
                  bgcolor: '#e7e7e7',
                },
              }}
            >
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              variant="contained"
              loading={isSubmitting || rejectLoading}
              disabled={isDisabled}
              sx={{
                textTransform: 'none',
                minHeight: 42,
                minWidth: 100,
                bgcolor: '#2e6c56',
                color: '#fff',
                border: 'none',
                borderBottom: '3px solid',
                borderBottomColor: '#202021',
                borderRadius: 1.15,
                fontWeight: 600,
                fontSize: '16px',
                '&:hover': {
                  bgcolor: '#1e4a3a',
                },
                '&:disabled': {
                  display: 'none',
                },
              }}
            >
              Submit
            </LoadingButton>
          </DialogActions>
        </FormProvider>
      </Dialog>

      <CampaignAgreementEdit
        dialog={editDialog}
        agreement={selectedAgreement}
        campaign={campaign}
      />
    </Box>
  );
};

CampaignAgreements.propTypes = {
  campaign: PropTypes.any,
};

export default CampaignAgreements;
