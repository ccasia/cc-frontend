/* eslint-disable no-nested-ternary */
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { LoadingButton } from '@mui/lab';
import { alpha } from '@mui/material/styles';
import {
  Box,
  Stack,
  Table,
  Dialog,
  Button,
  Avatar,
  TableRow,
  TableBody,
  TextField,
  TableCell,
  TableHead,
  Typography,
  IconButton,
  DialogTitle,
  Autocomplete,
  DialogActions,
  DialogContent,
  TableContainer,
  CircularProgress,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
import { useGetAgreements } from 'src/hooks/use-get-agreeements';

import { useAuthContext } from 'src/auth/hooks';
import { useGetAllCreators } from 'src/api/creator';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content/empty-content';

import PitchRow from './v3-pitch-row';
import V3PitchModal from './v3-pitch-modal';
import BatchAssignUGCModal from './BatchAssignUGCModal';

const countPitchesByStatus = (pitches, statusList) => (
    pitches?.filter((pitch) => {
      const status = pitch.displayStatus || pitch.status;
      return statusList.includes(status);
    }).length || 0
  );

const CampaignV3Pitches = ({ pitches, campaign, onUpdate }) => {
  const { user } = useAuthContext();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedPitch, setSelectedPitch] = useState(null);
  const [openPitchModal, setOpenPitchModal] = useState(false);
  const [sortDirection, setSortDirection] = useState('asc');
  const [addCreatorOpen, setAddCreatorOpen] = useState(false);
  const [nonPlatformOpen, setNonPlatformOpen] = useState(false);
  const [platformCreatorOpen, setPlatformCreatorOpen] = useState(false);
  const [batchCreditsOpen, setBatchCreditsOpen] = useState(false);
  const [batchCreditCreators, setBatchCreditCreators] = useState([]);
  const [batchAdminComments, setBatchAdminComments] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const isDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );
  const smUp = useResponsive('up', 'sm');
  const mdUp = useResponsive('up', 'md');

  const { data: agreements } = useGetAgreements(campaign?.id);

  const totalUsedCredits = campaign?.shortlisted?.reduce(
    (acc, creator) => acc + (creator?.ugcVideos ?? 0),
    0
  );

  // For v4 campaigns, count credits only from agreements that have been sent (isSent = true)
  // AND only count Platform Creators (exclude Non-Platform/Guest creators)
  // Sum the actual ugcVideos values, not just count agreements
  const v4UsedCredits = useMemo(() => {
    if (campaign?.submissionVersion !== 'v4' || !campaign?.campaignCredits) return null;
    if (!agreements || !campaign?.shortlisted) return 0;
    
    // Get userIds of Platform Creators whose agreements have been sent
    const sentAgreementUserIds = new Set(
      agreements
        .filter(
          (agreement) =>
            agreement.isSent &&
            agreement.user?.creator?.isGuest !== true
        )
        .map((agreement) => agreement.userId)
    );
    
    return campaign.shortlisted.reduce((acc, creator) => {
      if (
        sentAgreementUserIds.has(creator.userId) &&
        creator.user?.creator?.isGuest !== true &&
        creator.ugcVideos
      ) {
        return acc + (creator.ugcVideos || 0);
      }
      return acc;
    }, 0);
  }, [campaign, agreements]);

  const ugcLeft = useMemo(() => {
    if (!campaign?.campaignCredits) return (campaign?.campaignCredits ?? 0) - (totalUsedCredits ?? 0);
    if (campaign?.submissionVersion === 'v4') {
      return campaign.campaignCredits - (v4UsedCredits ?? 0);
    }
    return (campaign?.campaignCredits ?? 0) - (totalUsedCredits ?? 0);
  }, [campaign, totalUsedCredits, v4UsedCredits]);

  // Count pitches by display status
  const pendingReviewCount = countPitchesByStatus(pitches, ['PENDING_REVIEW']);

  const sentToClientCount = countPitchesByStatus(pitches, [
    'SENT_TO_CLIENT',
    'SENT_TO_CLIENT_WITH_COMMENTS',
  ]);

  const maybeCount = countPitchesByStatus(pitches, ['MAYBE']);

  const approvedCount = countPitchesByStatus(pitches, [
    'approved',
    'APPROVED',
    'AGREEMENT_PENDING',
    'AGREEMENT_SUBMITTED',
  ]);

  // Toggle sort direction
  const handleToggleSort = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  const filteredPitches = useMemo(() => {
    const isV4 = campaign?.submissionVersion === 'v4';

    if (isV4) {
      console.log('🔍 V4 Campaign Pitches Debug:', {
        campaignId: campaign?.id,
        submissionVersion: campaign?.submissionVersion,
        totalPitches: pitches?.length,
        selectedFilter,
        pitches: pitches?.map((p) => ({
          id: p.id,
          status: p.status,
          displayStatus: p.displayStatus,
          userName: p.user?.name,
          ugcCredits: p.ugcCredits,
          isGuestCreator: p.user?.creator?.isGuest,
        })),
      });
    }

    // Determine which pitches to show based on version
    let filtered = (pitches || []).filter((pitch) => {
      const status = pitch.displayStatus || pitch.status || '';
      const userId = pitch?.user?.id;

      // Define status checks
      const isPending = ['PENDING_REVIEW'].includes(status);
      const sentToClient = ['SENT_TO_CLIENT'].includes(status);
      const sentToClientWithComments = ['SENT_TO_CLIENT_WITH_COMMENTS'].includes(status);
      const isMaybe = ['MAYBE'].includes(status);
      const isApproved = ['approved', 'APPROVED', 'AGREEMENT_PENDING', 'AGREEMENT_SUBMITTED'].includes(status);
      const isRejected = ['rejected', 'REJECTED'].includes(status);

      // V4: Show all pitches in approval flow
      if (isV4) {
        return (
          isPending ||
          sentToClient ||
          sentToClientWithComments ||
          isMaybe ||
          isApproved ||
          isRejected
        );
      }

      // V3: Only show if credits assigned or already approved
      const creditedUserIds = new Set(
        (campaign?.shortlisted || []).filter((s) => (s?.ugcVideos || 0) > 0).map((s) => s.userId)
      );
      const hasAssignedCredits = userId ? creditedUserIds.has(userId) : false;
      return isApproved || hasAssignedCredits || isPending || sentToClient || isMaybe || isRejected;
    });

    if (selectedFilter === 'PENDING_REVIEW') {
      filtered = filtered?.filter(
        (pitch) => (pitch.displayStatus || pitch.status) === 'PENDING_REVIEW'
      );
    } else if (selectedFilter === 'SENT_TO_CLIENT') {
      const sentToClientStatuses = ['SENT_TO_CLIENT'];
      if (isV4) sentToClientStatuses.push('SENT_TO_CLIENT_WITH_COMMENTS');

      filtered = filtered?.filter((pitch) =>
        sentToClientStatuses.includes(pitch.displayStatus || pitch.status)
      );
    } else if (selectedFilter === 'MAYBE') {
      filtered = filtered?.filter((pitch) => (pitch.displayStatus || pitch.status) === 'MAYBE');
    } else if (selectedFilter === 'APPROVED') {
      filtered = filtered?.filter((pitch) =>
        ['APPROVED', 'AGREEMENT_PENDING', 'AGREEMENT_SUBMITTED'].includes(
          pitch.displayStatus || pitch.status
        )
      );
    }

    // Search functionality removed (search state variable removed)

    return [...(filtered || [])].sort((a, b) => {
      const nameA = (a.user?.name || '').toLowerCase();
      const nameB = (b.user?.name || '').toLowerCase();
      return sortDirection === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
  }, [pitches, selectedFilter, sortDirection, campaign]);

  // Reopen modal when returning from media kit if state indicates
  useEffect(() => {
    const reopen = location?.state?.reopenModal;
    if (reopen?.isV3 && reopen?.pitchId && pitches?.length) {
      const pitch = pitches.find((p) => p.id === reopen.pitchId);
      if (pitch) {
        setSelectedPitch(pitch);
        setOpenPitchModal(true);
        // Clear state to avoid loops
        navigate(location.pathname + location.search, { replace: true, state: {} });
      }
    }
  }, [location?.state, pitches, navigate, location?.pathname, location?.search]);

  const handleViewPitch = (pitch) => {
    setSelectedPitch(pitch);
    setOpenPitchModal(true);
  };

  const handleModalOpen = () => {
    setAddCreatorOpen(true);
  };

  const handleClosePitchModal = () => {
    setOpenPitchModal(false);
    setSelectedPitch(null);
  };

  const handlePitchUpdate = (updatedPitch) => {
    onUpdate(updatedPitch);
    handleClosePitchModal();
  };

  const getStatusInfo = (status) => {
    // Check for AGREEMENT_PENDING status with PENDING_REVIEW agreement form
    if (status === 'AGREEMENT_PENDING' && campaign?.submission) {
      const agreementFormSubmission = campaign.submission.find(
        (sub) => sub?.submissionType?.type === 'AGREEMENT_FORM'
      );

      if (agreementFormSubmission?.status === 'PENDING_REVIEW') {
        return {
          color: '#FFC702',
          borderColor: '#FFC702',
          tooltip: 'Agreement is pending approval',
        };
      }
    }

    const statusMap = {
      PENDING_REVIEW: {
        color: '#FFC702',
        borderColor: '#FFC702',
        tooltip: 'Pitch is pending admin review',
      },
      MAYBE: {
        color: '#FFC702',
        borderColor: '#FFC702',
        tooltip: 'Pitch is pending admin review',
      },
      maybe: {
        color: '#FFC702',
        borderColor: '#FFC702',
        tooltip: 'Pitch is pending admin review',
      },
      SENT_TO_CLIENT: {
        color: '#8A5AFE',
        borderColor: '#8A5AFE',
        tooltip: 'Pitch has been sent to client for review',
      },
      SENT_TO_CLIENT_WITH_COMMENTS: {
        color: '#8A5AFE',
        borderColor: '#8A5AFE',
        tooltip: 'Pitch has been sent to client for review',
      },
      APPROVED: {
        color: '#1ABF66',
        borderColor: '#1ABF66',
        tooltip: 'Pitch has been approved by client',
      },
      approved: {
        color: '#1ABF66',
        borderColor: '#1ABF66',
        tooltip: 'Pitch has been approved by client',
      },
      REJECTED: {
        color: '#D4321C',
        borderColor: '#D4321C',
        tooltip: 'Pitch has been rejected',
      },
      rejected: {
        color: '#D4321C',
        borderColor: '#D4321C',
        tooltip: 'Pitch has been rejected',
      },
      AGREEMENT_PENDING: {
        color: '#8B5CF6',
        borderColor: '#8B5CF6',
        tooltip: 'Agreement is pending creator submission',
      },
      AGREEMENT_SUBMITTED: {
        color: '#1ABF66',
        borderColor: '#1ABF66',
        tooltip: 'Agreement has been submitted by creator',
      },
    };

    return (
      statusMap[status] || {
        color: '#8E8E93',
        borderColor: '#8E8E93',
        tooltip: 'Unknown status',
      }
    );
  };

  const handleCreatorTypeSelect = (type) => {
    setAddCreatorOpen(false);

    switch (type) {
      case 'platform':
        setPlatformCreatorOpen(true);
        break;
      case 'non-platform':
        setNonPlatformOpen(true);
        break;
      default:
        console.warn(`Unknown creator type: ${type}`);
    }
  };

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Stack direction="column" spacing={2}>
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
                icon={sortDirection === 'asc' ? 'eva:arrow-downward-fill' : 'eva:arrow-upward-fill'}
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
            alignSelf: 'self-start',
          }}
        >
          Alphabetical
        </Button>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          justifyContent="flex-start"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          sx={{ mb: 1 }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{ width: { xs: '100%', md: 'auto' } }}
          >
            <Button
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
              onClick={() => setSelectedFilter('PENDING_REVIEW')}
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
                ...(selectedFilter === 'PENDING_REVIEW'
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
                    selectedFilter === 'PENDING_REVIEW' ? 'rgba(32, 63, 245, 0.04)' : 'transparent',
                },
              }}
            >
              {`Pending Review (${pendingReviewCount})`}
            </Button>

            <Button
              fullWidth={!mdUp}
              onClick={() => setSelectedFilter('SENT_TO_CLIENT')}
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
                ...(selectedFilter === 'SENT_TO_CLIENT'
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
                    selectedFilter === 'SENT_TO_CLIENT' ? 'rgba(32, 63, 245, 0.04)' : 'transparent',
                },
              }}
            >
              {`Sent to Client (${sentToClientCount})`}
            </Button>

            <Button
              fullWidth={!mdUp}
              onClick={() => setSelectedFilter('MAYBE')}
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
                ...(selectedFilter === 'MAYBE'
                  ? {
                      color: '#203ff5',
                      bgcolor: 'rgba(32, 63, 245, 0.04)',
                    }
                  : {
                      color: '#637381',
                      bgcolor: 'transparent',
                    }),
                '&:hover': {
                  bgcolor: selectedFilter === 'MAYBE' ? 'rgba(32, 63, 245, 0.04)' : 'transparent',
                },
              }}
            >
              {`Maybe (${maybeCount})`}
            </Button>

            <Button
              fullWidth={!mdUp}
              onClick={() => setSelectedFilter('APPROVED')}
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
                ...(selectedFilter === 'APPROVED'
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
                    selectedFilter === 'APPROVED' ? 'rgba(32, 63, 245, 0.04)' : 'transparent',
                },
              }}
            >
              {`Approved (${approvedCount})`}
            </Button>
          </Stack>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', flex: 1 }}>
            {!smUp ? (
              <IconButton
                sx={{ bgcolor: (theme) => theme.palette.background.paper, borderRadius: 1 }}
                onClick={handleModalOpen}
              >
                <Iconify icon="fluent:people-add-28-filled" width={18} />
              </IconButton>
            ) : (
              <Button
                onClick={handleModalOpen}
                disabled={
                  isDisabled ||
                  (campaign?.submissionVersion === 'v4'
                    ? v4UsedCredits !== null && campaign?.campaignCredits && v4UsedCredits >= campaign.campaignCredits
                    : typeof ugcLeft === 'number' && ugcLeft <= 0)
                }
                sx={{
                  bgcolor: '#ffffff',
                  border: '1px solid #e7e7e7',
                  borderBottom: '3px solid #e7e7e7',
                  height: 44,
                  color: '#203ff5',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  px: 3,
                  '&:hover': {
                    bgcolor: alpha('#636366', 0.08),
                    opacity: 0.9,
                  },
                }}
                startIcon={<Iconify icon="fluent:people-add-28-filled" width={16} />}
              >
                Add New Creators
              </Button>
            )}
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
                    width: '100%',
                    borderRadius: '10px 0 0 10px',
                    bgcolor: '#f5f5f5',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Creator
                </TableCell>
                {/* <TableCell
                  sx={{
                    py: 1,
                    color: '#221f20',
                    fontWeight: 600,
                    width: 80,
                    bgcolor: '#f5f5f5',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Engagement Rate
                </TableCell> */}
                <TableCell
                  sx={{
                    py: 1,
                    color: '#221f20',
                    fontWeight: 600,
                    width: 80,
                    bgcolor: '#f5f5f5',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Follower Count
                </TableCell>
                <TableCell
                  sx={{
                    py: 1,
                    color: '#221f20',
                    fontWeight: 600,
                    width: 150,
                    bgcolor: '#f5f5f5',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Date Submitted
                </TableCell>
                <TableCell
                  sx={{
                    py: 1,
                    color: '#221f20',
                    fontWeight: 600,
                    width: 150,
                    bgcolor: '#f5f5f5',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Type
                </TableCell>
                <TableCell
                  sx={{
                    py: 1,
                    color: '#221f20',
                    fontWeight: 600,
                    width: 100,
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
                    width: 100,
                    borderRadius: '0 10px 10px 0',
                    bgcolor: '#f5f5f5',
                    whiteSpace: 'nowrap',
                  }}
                />
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPitches?.map((pitch) => {
                const displayStatus = pitch.displayStatus || pitch.status;
                const statusInfo = getStatusInfo(displayStatus);
                const isGuestCreator = pitch.user?.creator?.isGuest;

                return (
                  <PitchRow
                    key={pitch.id}
                    pitch={pitch}
                    displayStatus={displayStatus}
                    statusInfo={statusInfo}
                    isGuestCreator={isGuestCreator}
                    campaign={campaign}
                    onViewPitch={handleViewPitch}
                  />
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>

      <AddCreatorModal
        open={addCreatorOpen}
        onClose={() => setAddCreatorOpen(false)}
        onSelect={handleCreatorTypeSelect}
        ugcLeft={ugcLeft}
      />

      <PlatformCreatorModal
        open={platformCreatorOpen}
        onClose={() => setPlatformCreatorOpen(false)}
        campaign={campaign}
        onUpdated={(payload) => {
          if (payload?.openBatchCredits) {
            setBatchCreditCreators(
              (payload.creators || []).map((c) => ({
                id: c.id,
                name: c.name || 'Creator',
                credits: '',
              }))
            );
            setBatchAdminComments(payload?.adminComments || '');
            setBatchCreditsOpen(true);
          }
          onUpdate?.();
        }}
      />

      <NonPlatformCreatorFormDialog
        open={nonPlatformOpen}
        onClose={() => setNonPlatformOpen(false)}
        campaignId={campaign.id}
        onUpdated={(payload) => {
          if (payload?.openBatchCredits) {
            setBatchCreditCreators(
              (payload.creators || []).map((c) => ({
                id: c.id,
                name: c.name || 'Creator',
                profileLink: c.profileLink || '',
                username: c.username || '',
                followerCount: c.followerCount || '',
                engagementRate: c.engagementRate || '',
                adminComments: c.adminComments || '',
                credits: '',
              }))
            );
            setBatchAdminComments(payload?.adminComments || '');
            setBatchCreditsOpen(true);
            setNonPlatformOpen(false);
          }
          onUpdate?.();
        }}
      />

      {/* Batch Assign UGC Credits Modal */}
      {batchCreditsOpen ? (
        <BatchAssignUGCModal
          open={batchCreditsOpen}
          onClose={() => setBatchCreditsOpen(false)}
          creators={batchCreditCreators}
          campaignId={campaign.id}
          adminComments={batchAdminComments}
          creditsLeft={
            campaign?.submissionVersion === 'v4'
              ? ugcLeft // For v4 campaigns, use ugcLeft which already counts only sent agreements
              : (campaign?.campaignCredits ?? 0) -
                (campaign?.shortlisted || []).reduce((acc, s) => acc + (s?.ugcVideos || 0), 0)
          }
          onAssigned={() => {
            setBatchCreditsOpen(false);
            onUpdate?.();
          }}
        />
      ) : null}

      {/* Empty state */}
      {(!filteredPitches || filteredPitches.length === 0) && (
        <EmptyContent
          title="No pitches found"
          description="There are no pitches matching your current filters."
          sx={{ py: 10 }}
        />
      )}

      {/* Pitch Modal */}
      {selectedPitch && (
        <V3PitchModal
          open={openPitchModal}
          onClose={handleClosePitchModal}
          pitch={selectedPitch}
          campaign={campaign}
          onUpdate={handlePitchUpdate}
        />
      )}
    </Box>
  );
};

export function AddCreatorModal({ open, onClose, onSelect, ugcLeft }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle
        sx={{
          fontSize: 20,
          fontWeight: 600,
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        Add Creators
        {typeof ugcLeft === 'number' && (
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: 'text.secondary',
              border: '1px solid #e7e7e7',
              px: 1,
              py: 0.25,
              borderRadius: 1,
              fontSize: '0.7rem',
            }}
          >
            UGC Credits: {ugcLeft} left
          </Typography>
        )}
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', fontWeight: 500 }}>
          Who would you like to add?
        </Typography>

        <Stack direction="row" spacing={2} justifyContent="center">
          <Button
            variant="outlined"
            onClick={() => onSelect('platform')}
            sx={{
              borderColor: '#203ff5',
              color: '#203ff5',
              fontWeight: 600,
              textTransform: 'none',
              px: 3,
              '&:hover': {
                bgcolor: 'rgba(32,63,245,0.08)',
                borderColor: '#203ff5',
              },
            }}
          >
            Platform Creator
          </Button>

          <Button
            variant="outlined"
            onClick={() => onSelect('non-platform')}
            sx={{
              borderColor: '#203ff5',
              color: '#203ff5',
              fontWeight: 600,
              textTransform: 'none',
              px: 3,
              '&:hover': {
                bgcolor: 'rgba(32,63,245,0.08)',
                borderColor: '#203ff5',
              },
            }}
          >
            Non-Platform Creator
          </Button>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'flex-end', pb: 2, px: 3 }}>
        <Button
          onClick={onClose}
          sx={{
            color: '#203ff5',
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': { bgcolor: 'rgba(32,63,245,0.08)' },
          }}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}

AddCreatorModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  ugcLeft: PropTypes.number,
};

export function PlatformCreatorModal({ open, onClose, campaign, onUpdated }) {
  const { data, isLoading } = useGetAllCreators();
  const { data: agreements } = useGetAgreements(campaign?.id);
  const [selected, setSelected] = useState([]);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // For v4 campaigns, calculate credits used only from sent agreements
  const v4UsedCredits = useMemo(() => {
    if (campaign?.submissionVersion !== 'v4' || !campaign?.campaignCredits) return null;
    if (!agreements || !campaign?.shortlisted) return 0;
    
    // Get userIds of Platform Creators whose agreements have been sent
    const sentAgreementUserIds = new Set(
      agreements
        .filter(
          (agreement) =>
            agreement.isSent &&
            agreement.user?.creator?.isGuest !== true
        )
        .map((agreement) => agreement.userId)
    );
    
    return campaign.shortlisted.reduce((acc, creator) => {
      if (
        sentAgreementUserIds.has(creator.userId) &&
        creator.user?.creator?.isGuest !== true &&
        creator.ugcVideos
      ) {
        return acc + (creator.ugcVideos || 0);
      }
      return acc;
    }, 0);
  }, [campaign, agreements]);

  const ugcLeft = useMemo(() => {
    if (!campaign?.campaignCredits) return null;
    // For v4 campaigns, only count credits from sent agreements
    if (campaign?.submissionVersion === 'v4') {
      return campaign.campaignCredits - (v4UsedCredits ?? 0);
    }
    // For non-v4 campaigns, count all shortlisted creators
    const totalUGCs = campaign?.shortlisted?.reduce((acc, sum) => acc + (sum?.ugcVideos ?? 0), 0);
    return campaign.campaignCredits - totalUGCs;
  }, [campaign, v4UsedCredits]);

  const shortlistedCreators = campaign?.shortlisted || [];
  const shortlistedIds = new Set(shortlistedCreators.map((c) => c.userId));

  const options = (data || [])
    .filter((item) => item.status === 'active' && item?.creator?.isFormCompleted)
    .filter((item) => !shortlistedIds.has(item.id));

  const resetState = () => {
    setSelected([]);
    setCommentText('');
    setCommentOpen(false);
    setSubmitting(false);
  };

  const handleCloseAll = () => {
    resetState();
    onClose?.();
  };

  const handleContinue = () => {
    // Open comment dialog (platform-only flow)
    setCommentOpen(true);
  };

  const handleSubmitWithComment = async () => {
    try {
      setSubmitting(true);

      // Do NOT shortlist yet; open batch credits modal first.
      onUpdated?.({
        openBatchCredits: true,
        creators: selected.map((c) => ({ id: c.id, name: c.name || c.email || 'Creator' })),
        adminComments: commentText,
      });
      handleCloseAll();
    } catch (e) {
      console.error('Error shortlisting creators:', e);
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* MAIN SELECT DIALOG */}
      <Dialog
        open={open}
        onClose={handleCloseAll}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 1 } }}
      >
        <DialogTitle
          sx={{
            fontFamily: (theme) => theme.typography.fontSecondaryFamily,
            '&.MuiTypography-root': { fontSize: 24 },
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            Shortlist Creators
            {typeof ugcLeft === 'number' && (
              <Label sx={{ fontFamily: (theme) => theme.typography.fontFamily }}>
                UGC Credits: {ugcLeft} left
              </Label>
            )}
          </Stack>
        </DialogTitle>

        <DialogContent>
          {isLoading ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CircularProgress thickness={6} size={28} />
            </Box>
          ) : (
            <Stack spacing={2}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                Who would you like to shortlist?
              </Typography>

              <Autocomplete
                multiple
                options={options}
                value={selected}
                onChange={(e, val) => setSelected(val)}
                getOptionLabel={(opt) => opt?.name || ''}
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.id} sx={{ display: 'flex', gap: 1 }}>
                    <Avatar
                      src={option?.photoURL}
                      sx={{ width: 30, height: 30, borderRadius: 2, flexShrink: 0 }}
                    >
                      {option?.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <Stack spacing={0}>
                      <Typography variant="body2" sx={{ lineHeight: 1.2 }}>
                        {option?.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option?.email}
                      </Typography>
                    </Stack>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select creators to shortlist"
                    placeholder="Search…"
                  />
                )}
              />
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={handleCloseAll}
            sx={{
              bgcolor: '#ffffff',
              border: '1px solid #e7e7e7',
              borderBottom: '3px solid #e7e7e7',
              height: 44,
              color: '#203ff5',
              fontSize: '0.875rem',
              fontWeight: 600,
              px: 3,
              '&:hover': { bgcolor: (theme) => alpha('#636366', 0.08), opacity: 0.9 },
            }}
          >
            Cancel
          </Button>

          <LoadingButton
            onClick={handleContinue}
            disabled={!selected.length}
            loading={false}
            sx={{
              bgcolor: '#203ff5',
              border: '1px solid #203ff5',
              borderBottom: '3px solid #1933cc',
              height: 44,
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: 600,
              px: 3,
              '&:hover': { bgcolor: '#1933cc', opacity: 0.9 },
              '&:disabled': {
                bgcolor: '#e7e7e7',
                color: '#999999',
                border: '1px solid #e7e7e7',
                borderBottom: '3px solid #d1d1d1',
              },
            }}
          >
            Continue
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* COMMENT DIALOG (platform-only) */}
      <Dialog open={commentOpen} onClose={() => setCommentOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle
          sx={{
            fontFamily: (theme) => theme.typography.fontSecondaryFamily,
            fontSize: 24,
          }}
        >
          CS Comments (Optional)
        </DialogTitle>
        <DialogContent>
          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
            CS Comments (Optional)
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            placeholder="Optional: Add comments about the creators that your clients might find helpful"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            helperText="You can skip this step and proceed without adding comments"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setCommentOpen(false)}
            sx={{
              bgcolor: '#ffffff',
              border: '1px solid #e7e7e7',
              borderBottom: '3px solid #e7e7e7',
              height: 44,
              color: '#221f20',
              fontSize: '0.875rem',
              fontWeight: 600,
              px: 3,
              textTransform: 'none',
              '&:hover': { bgcolor: (theme) => alpha('#636366', 0.08), opacity: 0.9 },
            }}
          >
            Back
          </Button>
          <LoadingButton
            variant="contained"
            onClick={handleSubmitWithComment}
            loading={submitting}
            sx={{
              bgcolor: '#203ff5',
              border: '1px solid #203ff5',
              borderBottom: '3px solid #1933cc',
              height: 44,
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: 600,
              px: 3,
              textTransform: 'none',
              '&:hover': { bgcolor: '#1933cc', opacity: 0.9 },
              '&:disabled': {
                bgcolor: '#e7e7e7',
                color: '#999999',
                border: '1px solid #e7e7e7',
                borderBottom: '3px solid #d1d1d1',
              },
            }}
          >
            {submitting ? 'Adding Creators…' : 'Continue'}
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

PlatformCreatorModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  campaign: PropTypes.object,
  onUpdated: PropTypes.func,
};

export function NonPlatformCreatorFormDialog({ open, onClose, onUpdated }) {
  const [formValues, setFormValues] = useState({
    creators: [{ name: '', followerCount: '', profileLink: '', adminComments: '' }],
  });

  const loading = useBoolean();
  const { enqueueSnackbar } = useSnackbar();

  const handleCreatorChange = (index, field) => (event) => {
    const updatedCreators = [...formValues.creators];
    updatedCreators[index][field] = event.target.value;
    setFormValues({ ...formValues, creators: updatedCreators });
  };

  const handleAddCreator = () => {
    if (formValues.creators.length < 3) {
      setFormValues((prev) => ({
        ...prev,
        creators: [
          ...prev.creators,
          {
            name: '',
            username: '',
            followerCount: '',
            engagementRate: '',
            profileLink: '',
            adminComments: '',
          },
        ],
      }));
    }
  };

  const handleRemoveCreator = () => {
    if (formValues.creators.length > 1) {
      const updated = formValues.creators.slice(0, formValues.creators.length - 1);
      setFormValues({ ...formValues, creators: updated });
    }
  };

  const handleSubmit = async () => {
    // Validate required guest fields before proceeding
    const invalid = formValues.creators.find((c) => !c.name?.trim() || !c.profileLink?.trim());
    if (invalid) {
      enqueueSnackbar('Please fill in Creator Name and Profile Link for all entries.', {
        variant: 'error',
      });
      return;
    }

    // Do NOT shortlist yet; pass the entered creators to parent to open credits modal
    onUpdated?.({ openBatchCredits: true, creators: formValues.creators });
    onClose();
    setFormValues({
      creators: [
        {
          name: '',
          username: '',
          followerCount: '',
          engagementRate: '',
          profileLink: '',
          adminComments: '',
        },
      ],
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle
        sx={{
          fontFamily: (theme) => theme.typography.fontSecondaryFamily,
          '&.MuiTypography-root': { fontSize: 24 },
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          Add Non-Platform Creator
          <IconButton onClick={onClose} size="small">
            <Iconify icon="eva:close-fill" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ bgcolor: '#fff' }}>
        {formValues.creators.map((creator, index) => (
          <Box
            key={index}
            sx={{
              borderBottom: '1px solid #e7e7e7',
              pb: 2,
              mb: 2,
            }}
          >
            <Stack flexDirection="row" flex={1} spacing={2} mb={2}>
              {/* Creator Name */}
              <Box flex={1}>
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 0.5 }}>
                  Creator Name
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Creator Name"
                  value={creator.name}
                  onChange={handleCreatorChange(index, 'name')}
                />
              </Box>

              <Stack flexDirection="row" flex={1} spacing={2}>
                {/* Username */}
                <Box flex={1}>
                  <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 0.5 }}>
                    Username (Social Media)
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Username"
                    value={creator.username}
                    onChange={handleCreatorChange(index, 'username')}
                  />
                </Box>

                {/* Profile Link */}
                <Box flex={1}>
                  <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 0.5 }}>
                    Profile Link
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Profile Link"
                    value={creator.profileLink}
                    onChange={handleCreatorChange(index, 'profileLink')}
                  />
                </Box>
              </Stack>
            </Stack>

            <Box display="flex" gap={2} mb={2}>
              {/* Follower Count */}
              <Box flex={1}>
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 0.5 }}>
                  Follower Count
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Follower Count"
                  value={creator.followerCount}
                  onChange={handleCreatorChange(index, 'followerCount')}
                />
              </Box>

              {/* Engagement Rate */}
              {/* <Box flex={1}>
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 0.5 }}>
                  Engagement Rate (%)
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Engagement Rate"
                  value={creator.engagementRate}
                  onChange={handleCreatorChange(index, 'engagementRate')}
                />
              </Box> */}
            </Box>

            {/* CS Comments */}
            <Box>
              <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 0.5 }}>
                CS Comments (Optional)
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Input comments about the creator that your clients might find helpful"
                value={creator.adminComments}
                onChange={handleCreatorChange(index, 'adminComments')}
              />
            </Box>
          </Box>
        ))}

        {/* + / - buttons */}
        <Box display="flex" justifyContent="flex-end" gap={1}>
          <Button
            variant="outlined"
            size="small"
            disabled={formValues.creators.length <= 1}
            onClick={handleRemoveCreator}
            sx={{
              minWidth: 36,
              color: '#666',
              borderColor: '#ccc',
              fontWeight: 'bold',
            }}
          >
            −
          </Button>
          <Button
            variant="outlined"
            size="small"
            disabled={formValues.creators.length >= 3}
            onClick={handleAddCreator}
            sx={{
              minWidth: 36,
              color: '#666',
              borderColor: '#ccc',
              fontWeight: 'bold',
            }}
          >
            +
          </Button>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          sx={{
            bgcolor: '#ffffff',
            border: '1px solid #e7e7e7',
            borderBottom: '3px solid #e7e7e7',
            color: '#221f20',
            fontSize: '0.875rem',
            fontWeight: 600,
            px: 3,
            textTransform: 'none',
            '&:hover': { bgcolor: (theme) => theme.palette.action.hover },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading.value}
          sx={{
            bgcolor: '#3A3A3C',
            borderBottom: '3px solid #000',
            color: '#fff',
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            '&:hover': {
              bgcolor: '#525151',
              borderBottom: '3px solid #000',
            },
          }}
        >
          {loading.value ? 'Adding...' : 'Add Creator'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

NonPlatformCreatorFormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdated: PropTypes.func,
};

// View-only modal for Non-Platform Creator form values
export function ViewNonPlatformCreatorsModal({
  open,
  onClose,
  creators = [],
  title = 'View Non-Platform Creator',
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle
        sx={{
          fontFamily: (theme) => theme.typography.fontSecondaryFamily,
          '&.MuiTypography-root': { fontSize: 24 },
        }}
      >
        {title}
      </DialogTitle>

      <DialogContent sx={{ bgcolor: '#fff' }}>
        {(creators?.length ? creators : [{}]).map((creator, idx) => (
          <Box
            key={idx}
            sx={{
              borderBottom: '1px solid #e7e7e7',
              pb: 2,
              mb: 2,
            }}
          >
            <Box display="flex" gap={2} mb={2}>
              {/* Creator Name */}
              <Box flex={1}>
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 0.5 }}>
                  Creator Name
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.primary' }}>
                  {creator?.name || '—'}
                </Typography>
              </Box>

              {/* Follower Count */}
              <Box flex={1}>
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 0.5 }}>
                  Follower Count
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.primary' }}>
                  {creator?.followerCount || '—'}
                </Typography>
              </Box>

              {/* Profile Link */}
              <Box flex={1}>
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 0.5 }}>
                  Profile Link
                </Typography>
                {creator?.profileLink ? (
                  <Typography
                    variant="body2"
                    sx={{ color: '#1340FF', textDecoration: 'underline', wordBreak: 'break-all' }}
                    component="a"
                    href={creator.profileLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {creator.profileLink}
                  </Typography>
                ) : (
                  <Typography variant="body2">—</Typography>
                )}
              </Box>
            </Box>

            {/* CS Comments */}
            <Box>
              <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 0.5 }}>
                CS Comments (Optional)
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
                {creator?.adminComments || '—'}
              </Typography>
            </Box>
          </Box>
        ))}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          sx={{
            color: '#203ff5',
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': { bgcolor: 'rgba(32,63,245,0.08)' },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ViewNonPlatformCreatorsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  creators: PropTypes.array,
  title: PropTypes.string,
};

export default CampaignV3Pitches;

CampaignV3Pitches.propTypes = {
  pitches: PropTypes.array,
  campaign: PropTypes.object,
  onUpdate: PropTypes.func,
};
