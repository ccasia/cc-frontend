import dayjs from 'dayjs';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { useMemo, useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Table,
  Stack,
  Button,
  Dialog,
  Avatar,
  Tooltip,
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
  TextField,
  InputAdornment,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
import { useGetAgreements } from 'src/hooks/use-get-agreeements';

import { fDate } from 'src/utils/format-time';
import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import useSocketContext from 'src/socket/hooks/useSocketContext';

import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content';
import { RHFTextField } from 'src/components/hook-form';
import SortableHeader from 'src/components/table/sortable-header';
import FormProvider from 'src/components/hook-form/form-provider';

import CampaignAgreementEdit from './campaign-agreement-edit';

// Convert AgreementDialog to a full component with approve/reject functionality
const AgreementDialog = ({ open, onClose, url, agreement, campaign, onApprove, onReject, isDisabled: propIsDisabled = false }) => {
  const isPendingReview = agreement?.submission?.status === 'PENDING_REVIEW';
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const feedbackDialog = useBoolean();
  const { user } = useAuthContext();

  // Merge prop-based isDisabled with existing Finance role check
  const financeDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );
  const isDisabled = propIsDisabled || financeDisabled;

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
                  cursor: 'not-allowed',
                  pointerEvents: 'auto',
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
                  cursor: 'not-allowed',
                  pointerEvents: 'auto',
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
  isDisabled: PropTypes.bool,
};

const CampaignAgreements = ({ campaign, isDisabled: propIsDisabled = false }) => {
  const { data, isLoading, mutate: mutateAgreements } = useGetAgreements(campaign?.id);
  const { socket } = useSocketContext();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [sortColumn, setSortColumn] = useState('name'); // 'name', 'date', 'status'
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
  const mdUp = useResponsive('up', 'md');

  // Get tier data for an agreement item
  const getTierDataForItem = (item) => {
    if (!campaign?.isCreditTier) return null;
    
    // First try: creditTier from shortlisted record
    const shortlisted = item?.user?.shortlisted?.[0] || item?.shortlistedCreator;
    if (shortlisted?.creditTier) {
      return {
        name: shortlisted.creditTier?.name || 'Unknown Tier',
        creditsPerVideo: shortlisted.creditPerVideo ?? shortlisted.creditTier?.creditsPerVideo ?? 1,
      };
    }

    // Second try: creditTier from creator record (current tier)
    const creatorTier = item?.user?.creator?.creditTier;
    if (creatorTier) {
      return {
        name: creatorTier.name || 'Unknown Tier',
        creditsPerVideo: creatorTier.creditsPerVideo ?? 1,
      };
    }

    // Third try: look in campaign.shortlisted for this user
    const campaignShortlisted = campaign?.shortlisted?.find(
      (s) => s.userId === item?.user?.id
    );
    if (campaignShortlisted?.creditTier) {
      return {
        name: campaignShortlisted.creditTier?.name || 'Unknown Tier',
        creditsPerVideo: campaignShortlisted.creditPerVideo ?? campaignShortlisted.creditTier?.creditsPerVideo ?? 1,
      };
    }

    return null;
  };

  // Handle column sort click
  const handleColumnSort = (column) => {
    if (sortColumn === column) {
      // Same column - toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column - set to asc
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Toggle sort direction (for alphabetical button - legacy)
  const handleToggleSort = () => {
    setSortColumn('name');
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  // Using shared SortableHeader component from components/table

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

  // Extract submissions fetch into reusable callback
  const fetchSubmissions = useCallback(async () => {
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
  }, [campaign?.id]);

  // Initial fetch
  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Real-time updates when creator submits agreement
  useEffect(() => {
    if (!socket) return undefined;

    const handleAgreementReady = () => {
      mutateAgreements();  // Refresh agreements data (SWR)
      fetchSubmissions();  // Refresh submissions data (status for approve/reject buttons)
    };

    socket.on('agreementReady', handleAgreementReady);

    return () => {
      socket.off('agreementReady', handleAgreementReady);
    };
  }, [socket, mutateAgreements, fetchSubmissions]);

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

  const pitchApprovedAgreements = useMemo(() => {
    if (!combinedData) return [];

    // Collect approved user IDs from pitches
    const approvedPitchUserIds = new Set();
    if (Array.isArray(campaign?.pitch)) {
      campaign.pitch
        .filter(
          (pitchItem) =>
            pitchItem?.status === 'APPROVED' ||
            pitchItem?.status === 'AGREEMENT_SUBMITTED' ||
            pitchItem?.status === 'AGREEMENT_PENDING' ||
            pitchItem?.status === 'approved'
        )
        .forEach((pitchItem) => {
          if (pitchItem?.userId) {
            approvedPitchUserIds.add(pitchItem.userId);
          }
        });
    }

    // Also include shortlisted creators who may not have a pitch record
    // This handles backwards compatibility for creators shortlisted before the pitch system
    const shortlistedUserIds = new Set();
    if (Array.isArray(campaign?.shortlisted)) {
      campaign.shortlisted.forEach((shortlistedItem) => {
        if (shortlistedItem?.userId) {
          shortlistedUserIds.add(shortlistedItem.userId);
        }
      });
    }

    // Combine both sets - approved pitches and shortlisted creators
    const approvedCreatorSet = new Set([...approvedPitchUserIds, ...shortlistedUserIds]);

    if (!approvedCreatorSet.size) {
      return [];
    }

    return combinedData.filter((agreement) => approvedCreatorSet.has(agreement.userId));
  }, [combinedData, campaign?.pitch, campaign?.shortlisted]);

  const pendingCount = useMemo(
    () => pitchApprovedAgreements?.filter((item) => !item.isSent).length || 0,
    [pitchApprovedAgreements]
  );

  const filterCounts = useMemo(() => {
    if (!pitchApprovedAgreements) return { pendingApproval: 0, sentToCreator: 0, rejected: 0, approved: 0 };
    return {
      pendingApproval: pitchApprovedAgreements.filter((item) => item?.submission?.status === 'PENDING_REVIEW').length,
      sentToCreator: pitchApprovedAgreements.filter(
        (item) =>
          item?.isSent &&
          item?.submission?.status !== 'PENDING_REVIEW' &&
          item?.submission?.status !== 'APPROVED' &&
          item?.submission?.status !== 'REJECTED'
      ).length,
      rejected: pitchApprovedAgreements.filter((item) => item?.submission?.status === 'REJECTED').length,
      approved: pitchApprovedAgreements.filter((item) => item?.submission?.status === 'APPROVED').length,
    };
  }, [pitchApprovedAgreements]);

  const filteredData = useMemo(() => {
    if (!pitchApprovedAgreements) return [];

    let result = [];

    if (selectedFilter === 'pending') {
      result = pitchApprovedAgreements.filter((item) => !item.isSent);
    } else if (selectedFilter === 'sent') {
      result = pitchApprovedAgreements.filter((item) => item.isSent);
    } else {
      result = pitchApprovedAgreements;
    }

    // Search functionality
    if (searchQuery?.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((item) => {
        const creatorName = (item.user?.name || '').toLowerCase();
        const creatorEmail = (item.user?.email || '').toLowerCase();
        
        return (
          creatorName.includes(query) ||
          creatorEmail.includes(query)
        );
      });
    }

    // Sort by selected column
    return [...result].sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case 'date': {
          // Sort by issue date (createdAt or updatedAt)
          const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
          comparison = dateA - dateB;
          break;
        }
        case 'status': {
          // Get status priority for sorting
          const getStatusPriority = (item) => {
            if (item?.submission?.status === 'PENDING_REVIEW') return 1; // Pending Review first
            if (item?.isSent) return 2; // Sent
            return 3; // Not sent
          };
          comparison = getStatusPriority(a) - getStatusPriority(b);
          break;
        }
        case 'name':
        default: {
          const nameA = (a.user?.name || '').toLowerCase();
          const nameB = (b.user?.name || '').toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;
        }
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [selectedFilter, sortColumn, sortDirection, pitchApprovedAgreements, searchQuery]);

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

  // Merge prop-based isDisabled with existing Finance role check
  const financeDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );
  const isDisabled = propIsDisabled || financeDisabled;

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
              alignSelf: 'self-start',
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
            </Button> */}

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
              {`Pending Approval (${filterCounts.pendingApproval})`}
            </Button>

            <Button
              fullWidth={!mdUp}
              onClick={() => setSelectedFilter('sentToCreator')}
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
                whiteSpace: 'nowrap',
                ...(selectedFilter === 'sentToCreator'
                  ? {
                      color: '#203ff5',
                      bgcolor: 'rgba(32, 63, 245, 0.04)',
                    }
                  : {
                      color: '#637381',
                      bgcolor: 'transparent',
                    }),
                '&:hover': {
                  bgcolor:
                    selectedFilter === 'sentToCreator' ? 'rgba(32, 63, 245, 0.04)' : 'transparent',
                },
              }}
            >
              {`Sent To Creator (${filterCounts.sentToCreator})`}
            </Button>

            <Button
              fullWidth={!mdUp}
              onClick={() => setSelectedFilter('rejected')}
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
                whiteSpace: 'nowrap',
                ...(selectedFilter === 'rejected'
                  ? {
                      color: '#203ff5',
                      bgcolor: 'rgba(32, 63, 245, 0.04)',
                    }
                  : {
                      color: '#637381',
                      bgcolor: 'transparent',
                    }),
                '&:hover': {
                  bgcolor: selectedFilter === 'rejected' ? 'rgba(32, 63, 245, 0.04)' : 'transparent',
                },
              }}
            >
              {`Rejected (${filterCounts.rejected})`}
            </Button>

            <Button
              fullWidth={!mdUp}
              onClick={() => setSelectedFilter('approved')}
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
                whiteSpace: 'nowrap',
                ...(selectedFilter === 'approved'
                  ? {
                      color: '#203ff5',
                      bgcolor: 'rgba(32, 63, 245, 0.04)',
                    }
                  : {
                      color: '#637381',
                      bgcolor: 'transparent',
                    }),
                '&:hover': {
                  bgcolor: selectedFilter === 'approved' ? 'rgba(32, 63, 245, 0.04)' : 'transparent',
                },
              }}
            >
              {`Approved (${filterCounts.approved})`}
            </Button>
          </Stack>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', flex: 1 }}>
            <TextField
              placeholder="Search creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                width: { xs: '100%', sm: 300 },
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#FFFFFF',
                  border: '1.5px solid #e7e7e7',
                  borderBottom: '3px solid #e7e7e7',
                  borderRadius: 1.15,
                  height: 44,
                  fontSize: '0.85rem',
                  '& fieldset': {
                    border: 'none',
                  },
                  '&.Mui-focused': {
                    border: '1.5px solid #e7e7e7',
                    borderBottom: '3px solid #e7e7e7',
                  },
                },
                '& .MuiOutlinedInput-input': {
                  py: 1.25,
                  px: 0,
                  color: '#637381',
                  fontWeight: 600,
                  '&::placeholder': {
                    color: '#637381',
                    opacity: 1,
                    fontWeight: 400,
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify
                      icon="eva:search-fill"
                      width={18}
                      sx={{ color: '#637381' }}
                    />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
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
                {campaign?.isCreditTier && (
                  <TableCell
                    sx={{
                      py: { xs: 0.5, sm: 1 },
                      px: { xs: 1, sm: 2 },
                      color: '#221f20',
                      fontWeight: 600,
                      width: { xs: 90, sm: '12%' },
                      minWidth: { xs: 90, sm: 'auto' },
                      bgcolor: '#f5f5f5',
                      whiteSpace: 'nowrap',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    }}
                  >
                    Tier
                  </TableCell>
                )}
                <SortableHeader
                  column="date"
                  label="Issue Date"
                  width={{ xs: '25%', sm: 120 }}
                  minWidth={{ xs: 110, sm: 120 }}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleColumnSort}
                />
                <SortableHeader
                  column="status"
                  label="Status"
                  width={{ xs: '15%', sm: 75 }}
                  minWidth={{ xs: 90, sm: 75 }}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleColumnSort}
                />
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
                    {campaign?.isCreditTier && (
                      <TableCell sx={{ py: { xs: 0.5, sm: 1 }, px: { xs: 1, sm: 2 } }}>
                        {(() => {
                          const tierData = getTierDataForItem(item);
                          if (!tierData) {
                            return <Typography fontSize={13.5}>-</Typography>;
                          }
                          return (
                            <Stack alignItems="start">
                              <Typography fontSize={13.5} whiteSpace="nowrap">
                                {tierData.name}
                              </Typography>
                              <Typography
                                variant="body2"
                                fontSize={13.5}
                                sx={{
                                  color: '#8e8e93',
                                  display: 'block',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {tierData.creditsPerVideo} credit{tierData.creditsPerVideo !== 1 ? 's' : ''}
                              </Typography>
                            </Stack>
                          );
                        })()}
                      </TableCell>
                    )}
                    <TableCell
                      sx={{
                        width: { xs: '25%', sm: 120 },
                        minWidth: { xs: 110, sm: 120 },
                      }}
                    >
                      <Stack spacing={0.5} alignItems="start">
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: { xs: '0.7rem', sm: '0.875rem' },
                          }}
                        >
                          {fDate(item?.updatedAt)}
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
                              px: { xs: 0.6, sm: 1 },
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
                            <Tooltip
                              title={
                                !item?.submission ? 'Link creator before sending agreement' : ''
                              }
                              arrow
                            >
                              <span>
                                <Button
                                  onClick={() => handleEditAgreement(item)}
                                  disabled={isDisabled || !item?.submission}
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
                                      border: '1px solid rgba(19, 64, 255, 0.5)',
                                      color: '#ffffff',
                                      cursor: 'not-allowed',
                                      pointerEvents: 'auto',
                                    },
                                  }}
                                >
                                  Send Agreement
                                </Button>
                              </span>
                            </Tooltip>
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
                                    cursor: 'not-allowed',
                                    pointerEvents: 'auto',
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
                                        cursor: 'not-allowed',
                                        pointerEvents: 'auto',
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
                                        cursor: 'not-allowed',
                                        pointerEvents: 'auto',
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
                                      cursor: 'not-allowed',
                                      pointerEvents: 'auto',
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
                            sx={{ '&.Mui-disabled': { cursor: 'not-allowed', pointerEvents: 'auto' } }}
                          >
                            <Iconify icon="iconamoon:edit-light" />
                          </IconButton>

                          {isPendingReview ? (
                            <>
                              <IconButton
                                color="error"
                                onClick={() => handleOpenRejectDialog(item)}
                                disabled={isDisabled || rejectLoading}
                                sx={{ '&.Mui-disabled': { cursor: 'not-allowed', pointerEvents: 'auto' } }}
                              >
                                <Iconify icon="solar:close-circle-bold" />
                              </IconButton>
                              <IconButton
                                color="success"
                                onClick={() => handleApproveAgreement(item)}
                                disabled={isDisabled}
                                sx={{ '&.Mui-disabled': { cursor: 'not-allowed', pointerEvents: 'auto' } }}
                              >
                                <Iconify icon="solar:check-circle-bold" />
                              </IconButton>
                            </>
                          ) : (
                            <IconButton
                              color={item.isSent ? 'warning' : 'primary'}
                              onClick={() => handleSendAgreement(item)}
                              disabled={isDisabled || !isAmountValid}
                              sx={{ '&.Mui-disabled': { cursor: 'not-allowed', pointerEvents: 'auto' } }}
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
        isDisabled={isDisabled}
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
  isDisabled: PropTypes.bool,
};

export default CampaignAgreements;
