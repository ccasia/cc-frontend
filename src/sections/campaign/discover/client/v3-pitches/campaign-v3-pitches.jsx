/* eslint-disable no-nested-ternary */
import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { useTheme } from '@emotion/react';
import React, { useMemo, useState } from 'react';
import { LoadingButton } from '@mui/lab';
import { useForm } from 'react-hook-form';

import {
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  Autocomplete,
  Box,
  Stack,
  Table,
  Button,
  Avatar,
  TableRow,
  TableBody,
  TextField,
  TableCell,
  TableHead,
  Typography,
  IconButton,
  TableContainer,
  CircularProgress,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import { useAuthContext } from 'src/auth/hooks';
import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
import { shortlistCreator, useGetAllCreators, shortlistGuestCreator } from 'src/api/creator';
import { useShortlistedCreators } from '../../admin/campaign-detail-creator/hooks/shortlisted-creator';

import Iconify from 'src/components/iconify';
import Label from 'src/components/label';
import EmptyContent from 'src/components/empty-content/empty-content';

import V3PitchModal from './v3-pitch-modal';
import V3PitchActions from './v3-pitch-actions';

const CampaignV3Pitches = ({ pitches, campaign, onUpdate }) => {
  const { user } = useAuthContext();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedPitch, setSelectedPitch] = useState(null);
  const [openPitchModal, setOpenPitchModal] = useState(false);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
  const [addCreatorOpen, setAddCreatorOpen] = useState(false);
  const [nonPlatformOpen, setNonPlatformOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [platformCreatorOpen, setPlatformCreatorOpen] = useState(false);
  const theme = useTheme();
  const isDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );
  const smUp = useResponsive('up', 'sm');
  const mdUp = useResponsive('up', 'md');

  const [modalOpen, setModalOpen] = useState(false);

  const handleModalOpen = () => {
    setAddCreatorOpen(true);
  };
  const handleModalClose = () => setModalOpen(false);

  const totalUsedCredits = campaign?.shortlisted?.reduce(
    (acc, creator) => acc + (creator?.ugcVideos ?? 0),
    0
  );
  // Count pitches by display status
  const pendingReviewCount =
    pitches?.filter((pitch) => (pitch.displayStatus || pitch.status) === 'PENDING_REVIEW').length ||
    0;

  const sentToClientCount =
    pitches?.filter((pitch) => (pitch.displayStatus || pitch.status) === 'SENT_TO_CLIENT').length ||
    0;

  const approvedCount =
    pitches?.filter(
      (pitch) =>
        (pitch.displayStatus || pitch.status) === 'APPROVED' ||
        (pitch.displayStatus || pitch.status) === 'AGREEMENT_PENDING' ||
        (pitch.displayStatus || pitch.status) === 'AGREEMENT_SUBMITTED'
    ).length || 0;

  // Toggle sort direction
  const handleToggleSort = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  const filteredPitches = useMemo(() => {
    let filtered = pitches;

    // Apply status filter
    if (selectedFilter === 'PENDING_REVIEW') {
      filtered = filtered?.filter(
        (pitch) => (pitch.displayStatus || pitch.status) === 'PENDING_REVIEW'
      );
    } else if (selectedFilter === 'SENT_TO_CLIENT') {
      filtered = filtered?.filter(
        (pitch) => (pitch.displayStatus || pitch.status) === 'SENT_TO_CLIENT'
      );
    } else if (selectedFilter === 'APPROVED') {
      filtered = filtered?.filter(
        (pitch) =>
          (pitch.displayStatus || pitch.status) === 'APPROVED' ||
          (pitch.displayStatus || pitch.status) === 'AGREEMENT_PENDING' ||
          (pitch.displayStatus || pitch.status) === 'AGREEMENT_SUBMITTED'
      );
    }

    // Apply search filter
    if (search) {
      filtered = filtered?.filter((elem) =>
        elem.user.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply sorting
    return [...(filtered || [])].sort((a, b) => {
      const nameA = (a.user?.name || '').toLowerCase();
      const nameB = (b.user?.name || '').toLowerCase();

      if (sortDirection === 'asc') {
        return nameA.localeCompare(nameB);
      }
      return nameB.localeCompare(nameA);
    });
  }, [pitches, selectedFilter, search, sortDirection]);

  const handleViewPitch = (pitch) => {
    setSelectedPitch(pitch);
    setOpenPitchModal(true);
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
      SENT_TO_CLIENT: {
        color: '#8A5AFE',
        borderColor: '#8A5AFE',
        tooltip: 'Pitch has been sent to client for review',
      },
      APPROVED: {
        color: '#1ABF66',
        borderColor: '#1ABF66',
        tooltip: 'Pitch has been approved by client',
      },
      REJECTED: {
        color: '#D4321C',
        borderColor: '#D4321C',
        tooltip: 'Pitch has been rejected',
      },
      AGREEMENT_PENDING: {
        color: '#1340FF',
        borderColor: '#1340FF',
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

  const getStatusText = (status) => {
    const statusTextMap = {
      PENDING_REVIEW: 'PENDING REVIEW',
      SENT_TO_CLIENT: 'SENT TO CLIENT',
      MAYBE: 'MAYBE',
      APPROVED: 'APPROVED',
      REJECTED: 'REJECTED',
      AGREEMENT_PENDING: 'AGREEMENT PENDING',
      AGREEMENT_SUBMITTED: 'AGREEMENT SUBMITTED',
    };

    return statusTextMap[status] || status;
  };

  if (!pitches || pitches.length === 0) {
    return <EmptyContent title="No pitches found" />;
  }

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
              {`Sent to Client(${sentToClientCount})`}
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
                disabled={isDisabled || totalUsedCredits === campaign?.campaignCredits}
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
                    width: 220,
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
                      width: 220,
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
                    width: 150,
                    bgcolor: '#f5f5f5',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Pitch Submitted
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
                  Format
                </TableCell>
                <TableCell
                  sx={{
                    py: 1,
                    color: '#221f20',
                    fontWeight: 600,
                    width: 120,
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
                    width: 120,
                    borderRadius: '0 10px 10px 0',
                    bgcolor: '#f5f5f5',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPitches?.map((pitch) => {
                const displayStatus = pitch.displayStatus || pitch.status;
                const statusInfo = getStatusInfo(displayStatus);

                return (
                  <TableRow key={pitch.id} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={{ xs: 1, sm: 2 }}>
                        <Avatar
                          src={pitch.user?.photoURL}
                          alt={pitch.user?.name}
                          sx={{
                            width: { xs: 32, sm: 40 },
                            height: { xs: 32, sm: 40 },
                            border: '2px solid',
                            borderColor: 'background.paper',
                            boxShadow: (theme) => theme.customShadows.z8,
                          }}
                        >
                          {pitch.user?.name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Stack spacing={0.5}>
                          <Typography variant="body2">{pitch.user?.name}</Typography>
                          {!smUp && (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {pitch.user?.email}
                            </Typography>
                          )}
                        </Stack>
                      </Stack>
                    </TableCell>
                    {smUp && <TableCell>{pitch.user?.email}</TableCell>}
                    <TableCell>
                      <Stack spacing={0.5} alignItems="start">
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '0.875rem',
                          }}
                        >
                          {dayjs(pitch.createdAt).format('LL')}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#8e8e93',
                            display: 'block',
                            fontSize: '0.875rem',
                            mt: '-2px',
                          }}
                        >
                          {dayjs(pitch.createdAt).format('LT')}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          color: pitch.type === 'video' ? '#1340FF' : '#8E8E93',
                        }}
                      >
                        {pitch.type === 'video' ? 'Video' : 'Text'}
                      </Typography>
                    </TableCell>
                    <TableCell>
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
                          whiteSpace: 'nowrap',
                          color: statusInfo.color,
                          borderColor: statusInfo.borderColor,
                        }}
                      >
                        {getStatusText(displayStatus)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {smUp ? (
                        <V3PitchActions pitch={pitch} onViewPitch={handleViewPitch} />
                      ) : (
                        <IconButton onClick={() => handleViewPitch(pitch)}>
                          <Iconify icon="hugeicons:view" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
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
      />

      <PlatformCreatorModal
        open={platformCreatorOpen}
        onClose={() => setPlatformCreatorOpen(false)}
        campaign={campaign}
      />

      <NonPlatformCreatorFormDialog
        open={nonPlatformOpen}
        onClose={handleModalClose}
        campaignId={campaign.id}
      />

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

export function PlatformCreatorModal({ open, onClose, campaign }) {
  const { data, isLoading } = useGetAllCreators();
  const [selected, setSelected] = useState([]);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const ugcLeft = useMemo(() => {
    if (!campaign?.campaignCredits) return null;
    const totalUGCs = campaign?.shortlisted?.reduce((acc, sum) => acc + (sum?.ugcVideos ?? 0), 0);
    return campaign.campaignCredits - totalUGCs;
  }, [campaign]);

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

      // ⤵️ Adjust payload keys to match your shortlistCreator API if needed
      await shortlistCreator({
        campaignId: campaign.id,
        creatorIds: selected.map((c) => c.id),
        comment: commentText.trim() || undefined, // optional comment
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
          Add a Comment (Optional)
        </DialogTitle>
        <DialogContent>
          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
            This comment will be attached to this shortlist action.
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            placeholder="Type your comment…"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentOpen(false)}>Back</Button>
          <LoadingButton variant="contained" onClick={handleSubmitWithComment} loading={submitting}>
            {submitting ? 'Submitting…' : 'Submit'}
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

export function NonPlatformCreatorFormDialog({ open, onClose, campaignId }) {
  const [formValues, setFormValues] = useState({
    creators: [{ name: '', followerCount: '', profileLink: '', adminComments: '' }],
  });

  const loading = useBoolean();

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
          { name: '', followerCount: '', profileLink: '', adminComments: '' },
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
    try {
      loading.onTrue();
      const res = await shortlistGuestCreator({
        guestCreators: formValues.creators,
        campaignId,
      });

      onClose();
      setFormValues({
        creators: [{ name: '', followerCount: '', profileLink: '', adminComments: '' }],
      });

      enqueueSnackbar(res?.data?.message || 'Creators shortlisted successfully!');
      mutate(`/campaign/creatorAgreement/${campaignId}`);
    } catch (error) {
      console.error('Error shortlisting guest creators:', error);
      enqueueSnackbar('Error shortlisting guest creator', { variant: 'error' });
    } finally {
      loading.onFalse();
    }
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
        Add Non-Platform Creator
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
            <Box display="flex" gap={2} mb={2}>
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
          onClick={handleSubmit}
          variant="contained"
          disabled={loading.value}
          sx={{
            bgcolor: '#d1d1d1',
            color: '#fff',
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            '&:hover': {
              bgcolor: '#a8a8a8',
            },
          }}
        >
          {loading.value ? 'Adding...' : 'Add Creator'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  <ViewNonPlatformCreatorsModal
    open={viewOpen}
    onClose={() => setViewOpen(false)}
    creators={formValues.creators}
  />;
}

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

export default CampaignV3Pitches;

CampaignV3Pitches.propTypes = {
  pitches: PropTypes.array,
  campaign: PropTypes.object,
  onUpdate: PropTypes.func,
};
