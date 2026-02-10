/* eslint-disable no-nested-ternary */
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { m, AnimatePresence } from 'framer-motion';
import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { LoadingButton } from '@mui/lab';
import { alpha } from '@mui/material/styles';
import {
  Box,
  Chip,
  Menu,
  Stack,
  Table,
  Dialog,
  Button,
  Avatar,
  Divider,
  Tooltip,
  Checkbox,
  TableRow,
  MenuItem,
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
  InputAdornment,
  CircularProgress,
  FormControlLabel,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';

import axiosInstance from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import { useGetAllCreators } from 'src/api/creator';
import useSocketContext from 'src/socket/hooks/useSocketContext';
import { OUTREACH_STATUS_OPTIONS } from 'src/contants/outreach';

import Iconify from 'src/components/iconify';
import SortableHeader from 'src/components/table/sortable-header';
import EmptyContent from 'src/components/empty-content/empty-content';

import PitchRow from './v3-pitch-row';
import V3PitchModal from './v3-pitch-modal';
import usePitchSocket from './use-pitch-socket';
import PitchModalMobile from '../../admin/pitch-modal-mobile';

const countPitchesByStatus = (pitches, statusList) =>
  pitches?.filter((pitch) => {
    const status = pitch.displayStatus || pitch.status;
    return statusList.includes(status);
  }).length || 0;

// Using SortableHeader component from components/table to avoid defining components during render

const CampaignV3Pitches = ({ pitches, campaign, onUpdate, isDisabled: propIsDisabled = false }) => {
  const { user } = useAuthContext();
  const { socket } = useSocketContext();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedPitch, setSelectedPitch] = useState(null);
  const [openPitchModal, setOpenPitchModal] = useState(false);
  const [sortColumn, setSortColumn] = useState('name'); // 'name', 'followers', 'tier', 'date', 'type', 'status'
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [addCreatorOpen, setAddCreatorOpen] = useState(false);
  const [nonPlatformOpen, setNonPlatformOpen] = useState(false);
  const [platformCreatorOpen, setPlatformCreatorOpen] = useState(false);
  const [outreachStatusFilter, setOutreachStatusFilter] = useState([]);
  const [outreachFilterAnchorEl, setOutreachFilterAnchorEl] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  // Merge prop-based isDisabled with existing Finance role check
  const financeDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );
  const isDisabled = propIsDisabled || financeDisabled;
  const smUp = useResponsive('up', 'sm');
  const smDown = useResponsive('down', 'sm');
  const mdUp = useResponsive('up', 'md');

  // Listen for real-time outreach status updates
  usePitchSocket({
    socket,
    campaignId: campaign?.id,
    onOutreachUpdate: () => onUpdate?.(),
    userId: user?.id,
  });

  const shortlistedCreators = campaign?.shortlisted;

  // Merge pitches with shortlisted creators for backwards compatibility
  // Before the new system, creators could be shortlisted without having a pitch record
  // We need to display them as "APPROVED" rows to avoid missing data
  const mergedPitchesAndShortlisted = useMemo(() => {
    const pitchUserIds = new Set((pitches || []).map((p) => p.userId));
    
    // Transform shortlisted creators (without pitch records) into pitch-like objects
    const shortlistedWithoutPitch = (shortlistedCreators || [])
      .filter((sc) => sc.userId && !pitchUserIds.has(sc.userId))
      .map((sc) => ({
        // Generate a synthetic pitch object for display
        id: `shortlisted-${sc.id}`,
        type: 'shortlisted',
        campaignId: campaign?.id,
        userId: sc.userId,
        status: 'APPROVED',
        displayStatus: 'APPROVED',
        content: `Creator ${sc.user?.name || 'Unknown'} was shortlisted`,
        createdAt: sc.shortlisted_date || sc.createdAt || new Date().toISOString(),
        completedAt: null,
        ugcCredits: sc.ugcVideos,
        adminComments: sc.adminComments,
        // User data from shortlisted record
        user: sc.user,
        // Mark as synthetic for identification
        _isShortlistedOnly: true,
        // Credit tier data from shortlisted record (snapshot at assignment time)
        _creditTier: sc.creditTier,
        _creditPerVideo: sc.creditPerVideo,
      }));

    return [...(pitches || []), ...shortlistedWithoutPitch];
  }, [pitches, shortlistedCreators, campaign?.id]);

  // Count pitches by display status (using merged array)
  const pendingReviewCount = countPitchesByStatus(mergedPitchesAndShortlisted, ['PENDING_REVIEW']);

  const sentToClientCount = countPitchesByStatus(mergedPitchesAndShortlisted, [
    'SENT_TO_CLIENT',
    'SENT_TO_CLIENT_WITH_COMMENTS',
  ]);

  const maybeCount = countPitchesByStatus(mergedPitchesAndShortlisted, ['MAYBE']);

  const rejectedCount = countPitchesByStatus(mergedPitchesAndShortlisted, ['REJECTED', 'rejected']);

  const approvedCount = countPitchesByStatus(mergedPitchesAndShortlisted, [
    'approved',
    'APPROVED',
    'AGREEMENT_PENDING',
    'AGREEMENT_SUBMITTED',
  ]);

  const withdrawnCount = countPitchesByStatus(mergedPitchesAndShortlisted, ['WITHDRAWN']);

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

  // Outreach status filter handlers
  const handleOutreachFilterClick = (event) => {
    setOutreachFilterAnchorEl(event.currentTarget);
  };

  const handleOutreachFilterClose = () => {
    setOutreachFilterAnchorEl(null);
  };

  const handleOutreachFilterToggle = (value) => {
    setOutreachStatusFilter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleOutreachFilterClear = () => {
    setOutreachStatusFilter([]);
  };

  // Handler for outreach status update from row
  const handleOutreachUpdate = () => {
    onUpdate?.();
  };

  const filteredPitches = useMemo(() => {
    const isV4 = campaign?.submissionVersion === 'v4';

    // Use merged array that includes shortlisted creators without pitch records
    // Determine which pitches to show based on version
    let filtered = (mergedPitchesAndShortlisted || []).filter((pitch) => {
      const status = pitch.displayStatus || pitch.status || '';

      // Define status checks
      const isPending = ['PENDING_REVIEW'].includes(status);
      const sentToClient = ['SENT_TO_CLIENT'].includes(status);
      const sentToClientWithComments = ['SENT_TO_CLIENT_WITH_COMMENTS'].includes(status);
      const isMaybe = ['MAYBE'].includes(status);
      const isApproved = [
        'approved',
        'APPROVED',
        'AGREEMENT_PENDING',
        'AGREEMENT_SUBMITTED',
      ].includes(status);
      const isRejected = ['rejected', 'REJECTED'].includes(status);
      const withdrawn = ['WITHDRAWN'].includes(status);

      // V4: Show all pitches in approval flow
      if (isV4) {
        return (
          isPending ||
          sentToClient ||
          sentToClientWithComments ||
          isMaybe ||
          isApproved ||
          isRejected ||
          withdrawn
        );
      }

      return (
        isApproved ||
        isPending ||
        sentToClient ||
        isMaybe ||
        isRejected ||
        withdrawn
      );
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
        ['approved', 'APPROVED', 'AGREEMENT_PENDING', 'AGREEMENT_SUBMITTED'].includes(
          pitch.displayStatus || pitch.status
        )
      );
    } else if (selectedFilter === 'REJECTED') {
      filtered = filtered?.filter((pitch) =>
        ['REJECTED', 'rejected'].includes(pitch.displayStatus || pitch.status)
      );
    } else if (selectedFilter === 'WITHDRAWN') {
      filtered = filtered?.filter((pitch) =>
        ['WITHDRAWN'].includes(pitch.displayStatus || pitch.status)
      );
    }

    // Search functionality
    if (searchQuery?.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered?.filter((pitch) => {
        const creatorName = (pitch.user?.name || '').toLowerCase();
        const instagramUsername = (pitch.user?.creator?.instagramUser?.username || '').toLowerCase();
        const tiktokUsername = (pitch.user?.creator?.tiktokUser?.username || '').toLowerCase();
        const profileLink = (pitch.user?.creator?.profileLink || pitch.user?.profileLink || '').toLowerCase();

        return (
          creatorName.includes(query) ||
          instagramUsername.includes(query) ||
          tiktokUsername.includes(query) ||
          profileLink.includes(query)
        );
      });
    }

    // Outreach status filter (multi-select)
    if (outreachStatusFilter.length > 0) {
      filtered = filtered?.filter((pitch) => {
        // Handle "NOT_SET" filter for null/undefined outreachStatus
        if (outreachStatusFilter.includes('NOT_SET')) {
          if (!pitch.outreachStatus) return true;
        }
        // Check if pitch's outreach status matches any selected filter
        return outreachStatusFilter.includes(pitch.outreachStatus);
      });
    }

    return [...(filtered || [])].sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case 'followers': {
          // Get follower count using same logic as getHighestFollowerCount
          // Priority: Media kit (max of IG/TikTok) > manualFollowerCount > pitch.followerCount
          const getFollowerCount = (pitch) => {
            const igFollowers = pitch.user?.creator?.instagramUser?.followers_count || 0;
            const tkFollowers = pitch.user?.creator?.tiktokUser?.follower_count || 0;
            const manualFollowers = pitch.user?.creator?.manualFollowerCount || 0;
            const pitchFollowers = parseInt(pitch.followerCount, 10) || 0;

            // If media kit exists, use highest between IG and TikTok
            if (igFollowers > 0 || tkFollowers > 0) {
              return Math.max(igFollowers, tkFollowers);
            }

            // Otherwise use manual follower count, then pitch follower count as fallback
            return manualFollowers || pitchFollowers;
          };
          const followersA = getFollowerCount(a);
          const followersB = getFollowerCount(b);
          comparison = followersA - followersB;
          break;
        }
        case 'tier': {
          // Get tier data using same logic as PitchRow
          const getTierCredits = (pitch) => {
            // For synthetic shortlisted rows (manually added creators), use the tier snapshot
            if (pitch._isShortlistedOnly && pitch._creditTier) {
              return pitch._creditPerVideo || pitch._creditTier?.creditsPerVideo || 0;
            }
            // For regular pitches, use creator's current tier
            return pitch.user?.creator?.creditTier?.creditsPerVideo || 0;
          };
          const tierA = getTierCredits(a);
          const tierB = getTierCredits(b);
          comparison = tierA - tierB;
          break;
        }
        case 'date': {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          comparison = dateA - dateB;
          break;
        }
        case 'type': {
          const typeA = (a.type || '').toLowerCase();
          const typeB = (b.type || '').toLowerCase();
          comparison = typeA.localeCompare(typeB);
          break;
        }
        case 'status': {
          const statusA = (a.displayStatus || a.status || '').toLowerCase();
          const statusB = (b.displayStatus || b.status || '').toLowerCase();
          comparison = statusA.localeCompare(statusB);
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
  }, [mergedPitchesAndShortlisted, selectedFilter, sortColumn, sortDirection, campaign, searchQuery, outreachStatusFilter]);

  // Reopen modal when returning from media kit if state indicates
  useEffect(() => {
    const reopen = location?.state?.reopenModal;
    if (reopen?.isV3 && reopen?.pitchId && mergedPitchesAndShortlisted?.length) {
      const pitch = mergedPitchesAndShortlisted.find((p) => p.id === reopen.pitchId);
      if (pitch) {
        setSelectedPitch(pitch);
        setOpenPitchModal(true);
        // Clear state to avoid loops
        navigate(location.pathname + location.search, { replace: true, state: {} });
      }
    }
  }, [location?.state, mergedPitchesAndShortlisted, navigate, location?.pathname, location?.search]);

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
      WITHDRAWN: {
        color: '#000',
        borderColor: '#000',
        tooltip: 'Pitch has been withdrawn',
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

  const handleRemoveCreator = () => {
    if (onUpdate) {
      onUpdate();
    }
  };

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <Stack direction="column" spacing={2}>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          alignItems={{ xs: 'stretch', sm: 'center' }}
          sx={{ width: '100%' }}
        >
          <TextField
            placeholder="Search creators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              width: { xs: '100%', sm: 300 },
              flexShrink: 0,
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
          {/* Outreach Status Filter */}
          <Button
            onClick={handleOutreachFilterClick}
            endIcon={<Iconify icon="eva:chevron-down-fill" width={18} />}
            sx={{
              height: 44,
              px: 2,
              bgcolor: outreachStatusFilter.length > 0 ? 'rgba(32, 63, 245, 0.08)' : '#FFFFFF',
              border: '1.5px solid',
              borderColor: outreachStatusFilter.length > 0 ? '#1340FF' : '#e7e7e7',
              borderBottom: outreachStatusFilter.length > 0 ? '3px solid #1340FF' : '3px solid #e7e7e7',
              borderRadius: 1.15,
              color: outreachStatusFilter.length > 0 ? '#1340FF' : '#637381',
              fontWeight: 600,
              fontSize: '0.85rem',
              textTransform: 'none',
              whiteSpace: 'nowrap',
              '&:hover': {
                bgcolor: outreachStatusFilter.length > 0 ? 'rgba(32, 63, 245, 0.08)' : '#F5F5F5',
                borderColor: outreachStatusFilter.length > 0 ? '#1340FF' : '#e7e7e7',
              },
            }}
          >
            Outreach
            {outreachStatusFilter.length > 0 && (
              <Chip
                label={outreachStatusFilter.length}
                size="small"
                sx={{
                  ml: 1,
                  height: 20,
                  minWidth: 20,
                  bgcolor: '#1340FF',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  '& .MuiChip-label': { px: 0.75 },
                }}
              />
            )}
          </Button>
          <Menu
            anchorEl={outreachFilterAnchorEl}
            open={Boolean(outreachFilterAnchorEl)}
            onClose={handleOutreachFilterClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            slotProps={{
              paper: {
                sx: {
                  mt: 0.5,
                  p: 1.25,
                  bgcolor: 'white',
                  boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.12)',
                  borderRadius: 1.5,
                  '& .MuiList-root': {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    p: 0,
                  },
                },
              },
            }}
          >
            {/* Not Set option */}
            <Box
              onClick={() => handleOutreachFilterToggle('NOT_SET')}
              sx={{
                textTransform: 'uppercase',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 0.75,
                px: 1.5,
                fontSize: 13,
                border: '1px dashed',
                borderBottom: '3px dashed',
                borderRadius: 0.8,
                bgcolor: 'white',
                whiteSpace: 'nowrap',
                color: '#8E8E93',
                borderColor: '#D0D0D0',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
                ...(outreachStatusFilter.includes('NOT_SET') && {
                  boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08), 0 0 0 2px rgba(142, 142, 147, 0.2)',
                }),
                '&:hover': {
                  bgcolor: '#F5F5F5',
                },
              }}
            >
              <Box component="span" sx={{ flex: 1, textAlign: 'center' }}>Not Set</Box>
              {outreachStatusFilter.includes('NOT_SET') && (
                <Iconify icon="eva:checkmark-fill" width={16} sx={{ ml: 1, flexShrink: 0 }} />
              )}
            </Box>
            {/* Status options */}
            {OUTREACH_STATUS_OPTIONS.map((option) => (
              <Box
                key={option.value}
                onClick={() => handleOutreachFilterToggle(option.value)}
                sx={{
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 0.75,
                  px: 1.5,
                  fontSize: 13,
                  border: '1px solid',
                  borderBottom: '3px solid',
                  borderRadius: 0.8,
                  bgcolor: 'white',
                  whiteSpace: 'nowrap',
                  color: option.color,
                  borderColor: option.color,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
                  ...(outreachStatusFilter.includes(option.value) && {
                    boxShadow: `0px 1px 3px rgba(0, 0, 0, 0.08), 0 0 0 2px ${option.color}20`,
                  }),
                  '&:hover': {
                    bgcolor: '#F5F5F5',
                  },
                }}
              >
                <Box component="span" sx={{ flex: 1, textAlign: 'center' }}>{option.label}</Box>
                {outreachStatusFilter.includes(option.value) && (
                  <Iconify icon="eva:checkmark-fill" width={16} sx={{ ml: 1, flexShrink: 0 }} />
                )}
              </Box>
            ))}
            {/* Clear button */}
            {outreachStatusFilter.length > 0 && (
              <Typography
                onClick={handleOutreachFilterClear}
                sx={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#637381',
                  cursor: 'pointer',
                  textAlign: 'center',
                  mt: 0.5,
                  '&:hover': {
                    color: '#212B36',
                    textDecoration: 'underline',
                  },
                }}
              >
                Clear all
              </Typography>
            )}
          </Menu>
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
              alignSelf: { xs: 'flex-start', sm: 'center' },
              '&:hover': {
                backgroundColor: 'transparent',
                color: '#221f20',
              },
            }}
          >
            Alphabetical
          </Button>
        </Stack>
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
              {`Pending (${pendingReviewCount})`}
            </Button>

            {/* Sent to Client filter - only show for v4 campaigns where client approval is required */}
            {campaign?.submissionVersion === 'v4' && (
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
                      selectedFilter === 'SENT_TO_CLIENT'
                        ? 'rgba(32, 63, 245, 0.04)'
                        : 'transparent',
                  },
                }}
              >
                {`Sent To Client (${sentToClientCount})`}
              </Button>
            )}

            {/* Maybe filter - only show for v4 campaigns where client can mark as maybe */}
            {campaign?.submissionVersion === 'v4' && (
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
            )}

            <Button
              fullWidth={!mdUp}
              onClick={() => setSelectedFilter('REJECTED')}
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
                ...(selectedFilter === 'REJECTED'
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
                    selectedFilter === 'REJECTED' ? 'rgba(32, 63, 245, 0.04)' : 'transparent',
                },
              }}
            >
              {`Rejected (${rejectedCount})`}
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

            <Button
              fullWidth={!mdUp}
              onClick={() => setSelectedFilter('WITHDRAWN')}
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
                ...(selectedFilter === 'WITHDRAWN'
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
                    selectedFilter === 'WITHDRAWN' ? 'rgba(32, 63, 245, 0.04)' : 'transparent',
                },
              }}
            >
              {`Withdrawn (${withdrawnCount})`}
            </Button>
          </Stack>

          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: { xs: 'flex-start', md: 'flex-end' }, 
              flex: 1,
              width: { xs: '100%', md: 'auto' },
              mt: { xs: 1, md: 0 },
            }}
          >
            {!smUp ? (
              <IconButton
                sx={{
                  bgcolor: (theme) => theme.palette.background.paper,
                  borderRadius: 1,
                  '&.Mui-disabled': {
                    cursor: 'not-allowed',
                    pointerEvents: 'auto',
                  },
                }}
                onClick={handleModalOpen}
                disabled={isDisabled}
              >
                <Iconify icon="fluent:people-add-28-filled" width={18} />
              </IconButton>
            ) : (
              <Button
                onClick={handleModalOpen}
                disabled={isDisabled}
                fullWidth={!mdUp}
                sx={{
                  bgcolor: '#FFFFFF',
                  border: '1.5px solid #e7e7e7',
                  borderBottom: '3px solid #e7e7e7',
                  borderRadius: 1.15,
                  color: '#1340FF',
                  height: 44,
                  px: 2.5,
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    bgcolor: 'rgba(19, 64, 255, 0.08)',
                    border: '1.5px solid #1340FF',
                    borderBottom: '3px solid #1340FF',
                    color: '#1340FF',
                  },
                  '&.Mui-disabled': {
                    cursor: 'not-allowed',
                    pointerEvents: 'auto',
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
            maxWidth: '100%',
            overflowX: 'auto',
            position: 'relative',
            bgcolor: 'transparent',
            borderBottom: '1px solid',
            borderColor: 'divider',
            '&::-webkit-scrollbar': {
              height: 8,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#f5f5f5',
              borderRadius: 4,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#d0d0d0',
              borderRadius: 4,
              '&:hover': {
                backgroundColor: '#b0b0b0',
              },
            },
          }}
        >
          <Table 
            size={smUp ? 'medium' : 'small'}
            sx={{
              minWidth: { xs: 800, sm: 'auto' },
              width: '100%',
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    py: { xs: 0.5, sm: 1 },
                    px: { xs: 1, sm: 2 },
                    color: '#221f20',
                    fontWeight: 600,
                    width: '25%',
                    borderRadius: '10px 0 0 10px',
                    bgcolor: '#f5f5f5',
                    whiteSpace: 'nowrap',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  Creator
                </TableCell>
                <TableCell
                  sx={{
                    py: { xs: 0.5, sm: 1 },
                    px: { xs: 1, sm: 2 },
                    color: '#221f20',
                    fontWeight: 600,
                    width: { xs: 120, sm: '12%' },
                    minWidth: { xs: 120, sm: 'auto' },
                    bgcolor: '#f5f5f5',
                    whiteSpace: 'nowrap',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  Outreach Status
                </TableCell>
                <SortableHeader
                  column="followers"
                  label="Followers"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleColumnSort}
                  sx={{
                    width: { xs: 100, sm: '15%' },
                    minWidth: { xs: 100, sm: 'auto' },
                  }}
                />
                {campaign?.isCreditTier && (
                  <SortableHeader
                    column="tier"
                    label="Tier"
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleColumnSort}
                    sx={{
                      width: { xs: 90, sm: '12%' },
                      minWidth: { xs: 90, sm: 'auto' },
                    }}
                  />
                )}
                <SortableHeader
                  column="date"
                  label="Date Submitted"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleColumnSort}
                  sx={{
                    width: { xs: 130, sm: '15%' },
                    minWidth: { xs: 130, sm: 'auto' },
                  }}
                />
                <SortableHeader
                  column="type"
                  label="Type"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleColumnSort}
                  sx={{
                    width: { xs: 100, sm: '10%' },
                    minWidth: { xs: 100, sm: 'auto' },
                  }}
                />
                <SortableHeader
                  column="status"
                  label="Status"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleColumnSort}
                  sx={{
                    width: { xs: 120, sm: '10%' },
                    minWidth: { xs: 120, sm: 'auto' },
                  }}
                />
                <TableCell
                  sx={{
                    py: { xs: 0.5, sm: 1 },
                    px: { xs: 1, sm: 2 },
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
                    isCreditTier={campaign?.isCreditTier}
                    onViewPitch={handleViewPitch}
                    onRemoved={handleRemoveCreator}
                    onOutreachUpdate={handleOutreachUpdate}
                    isDisabled={isDisabled}
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
        campaign={campaign}
      />

      <PlatformCreatorModal
        open={platformCreatorOpen}
        onClose={() => setPlatformCreatorOpen(false)}
        campaign={campaign}
        pitches={pitches}
        onUpdated={() => {
          onUpdate?.();
        }}
      />

      <NonPlatformCreatorFormDialog
        open={nonPlatformOpen}
        onClose={() => setNonPlatformOpen(false)}
        campaignId={campaign.id}
        onUpdated={() => {
          onUpdate?.();
        }}
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
          isDisabled={isDisabled}
        />
      )}

      {smDown ? (
        <PitchModalMobile
          pitch={selectedPitch}
          open={openPitchModal}
          onClose={handleClosePitchModal}
          onUpdate={handlePitchUpdate}
          campaign={campaign}
          isDisabled={isDisabled}
        />
      ) : (
        <V3PitchModal
          open={openPitchModal}
          onClose={handleClosePitchModal}
          pitch={selectedPitch}
          campaign={campaign}
          onUpdate={handlePitchUpdate}
          isDisabled={isDisabled}
        />
      )}
    </Box>
  );
};

// eslint-disable-next-line react/prop-types
export function AddCreatorModal({ open, onClose, onSelect, campaign }) {
  // Calculate remaining credits
  // For credit tier campaigns: credits = ugcVideos * creditPerVideo (stored on shortlisted creator)
  // For regular campaigns: credits = ugcVideos * 1
  const creditsRemaining = (() => {
    if (!campaign?.campaignCredits) return null;

    const isCreditTier = campaign?.isCreditTier === true;

    const sentAgreementUserIds = new Set(
      (campaign?.creatorAgreement || [])
        .filter(a => a.isSent)
        .map(a => a.userId)
    );

    const utilizedCredits = (campaign?.shortlisted || []).reduce((total, creator) => {
      if (sentAgreementUserIds.has(creator.userId) &&
          creator.user?.creator?.isGuest !== true) {
        const videos = creator.ugcVideos || 0;
        // For credit tier campaigns, use creditPerVideo; for regular campaigns, use 1
        const creditsPerVideo = isCreditTier ? (creator.creditPerVideo || 1) : 1;
        return total + (videos * creditsPerVideo);
      }
      return total;
    }, 0);

    return Math.max(0, campaign.campaignCredits - utilizedCredits);
  })();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: '#F4F4F4',
        },
      }}
    >
      <DialogTitle
        sx={{
          fontFamily: 'Instrument Serif',
          fontSize: '40px !important',
          fontWeight: 400,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
          lineHeight: 1.2,
        }}
      >
        Add Creators
        <IconButton onClick={onClose} size="small">
          <Iconify icon="mdi:close" width={24} />
        </IconButton>
      </DialogTitle>

      <Divider sx={{ borderColor: '#EBEBEB', mx: 3 }} />

      <DialogContent sx={{ pt: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ color: '#636366', fontWeight: 600, fontSize: '14px' }}>
            Who would you like to add?
          </Typography>

          {creditsRemaining !== null && (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                bgcolor: '#fff',
                border: '1px solid #E7E7E7',
                borderRadius: 1,
                px: 1.5,
                py: 0.75,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: '#636366',
                  fontWeight: 500,
                  fontSize: '0.8125rem',
                }}
              >
                Credits Remaining
              </Typography>
              <Box
                sx={{
                  bgcolor: '#1340FF',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  px: 1,
                  py: 0.25,
                  borderRadius: 0.5,
                  minWidth: 24,
                  textAlign: 'center',
                }}
              >
                {creditsRemaining}
              </Box>
            </Box>
          )}
        </Stack>

        <Stack direction="row" spacing={2} sx={{ mb: 3, width: '100%' }}>
          <Button
            variant="outlined"
            onClick={() => onSelect('platform')}
            sx={{
              borderColor: '#8E8E93',
              color: '#8E8E93',
              fontWeight: 600,
              textTransform: 'none',
              px: 4,
              py: 1.5,
              fontSize: '0.875rem',
              minHeight: 48,
              flex: 1,
              '&:hover': {
                bgcolor: 'rgba(19,64,255,0.08)',
                borderColor: '#1340ff',
                color: '#1340ff',
              },
            }}
          >
            Platform Creator
          </Button>

          <Button
            variant="outlined"
            onClick={() => onSelect('non-platform')}
            sx={{
              borderColor: '#8E8E93',
              color: '#8E8E93',
              fontWeight: 600,
              textTransform: 'none',
              px: 4,
              py: 1.5,
              fontSize: '0.875rem',
              minHeight: 48,
              flex: 1,
              '&:hover': {
                bgcolor: 'rgba(19,64,255,0.08)',
                borderColor: '#1340ff',
                color: '#1340ff',
              },
            }}
          >
            Non-Platform Creator
          </Button>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, pt: 2 }}>
        <Button
          onClick={onClose}
          sx={{
            bgcolor: '#FFFFFF',
            border: '1.5px solid #e7e7e7',
            borderBottom: '3px solid #e7e7e7',
            borderRadius: 1.15,
            color: '#1340FF',
            height: 44,
            px: 2.5,
            fontWeight: 600,
            fontSize: '0.85rem',
            textTransform: 'none',
            '&:hover': {
              bgcolor: 'rgba(19, 64, 255, 0.08)',
              border: '1.5px solid #1340FF',
              borderBottom: '3px solid #1340FF',
              color: '#1340FF',
            },
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
  campaign: PropTypes.object,
};

export function PlatformCreatorModal({ open, onClose, campaign, pitches, onUpdated }) {
  const { data, isLoading } = useGetAllCreators();
  const { enqueueSnackbar } = useSnackbar();
  const [creatorRows, setCreatorRows] = useState([{ id: 1, creator: null, followerCount: '', adminComments: '', hasMediaKit: false }]);
  const [submitting, setSubmitting] = useState(false);

  const shortlistedCreators = campaign?.shortlisted || [];
  const shortlistedIds = new Set(shortlistedCreators.map((c) => c.userId));

  // Also exclude creators with existing pitches (any status means they're already in the workflow)
  // This includes SENT_TO_CLIENT (V4 admin approved), PENDING_REVIEW (applied), APPROVED, etc.
  const pitchUserIds = new Set(
    (pitches || [])
      .filter((p) => p.userId)
      .map((p) => p.userId)
  );

  // Determine if this is a credit tier campaign (controls follower count field visibility)
  const isCreditTier = campaign?.isCreditTier || false;

  // Get highest follower count from creator's connected accounts or manual entry
  const getHighestFollowerCount = (creator) => {
    const igFollowers = creator?.creator?.instagramUser?.followers_count || 0;
    const tkFollowers = creator?.creator?.tiktokUser?.follower_count || 0;
    const manualFollowers = creator?.creator?.manualFollowerCount || 0;

    // If media kit exists, use highest between IG and TikTok
    if (igFollowers > 0 || tkFollowers > 0) {
      return Math.max(igFollowers, tkFollowers);
    }

    // Otherwise use manual follower count
    return manualFollowers;
  };

  // Check if creator has media kit (connected Instagram or TikTok)
  const hasMediaKitLinked = (creator) => {
    if (!creator) return false;
    return !!(creator?.creator?.instagramUser || creator?.creator?.tiktokUser);
  };

  // Filter options - exclude already shortlisted and already selected in other rows
  const getFilteredOptions = (currentRowId) => {
    const selectedInOtherRows = creatorRows
      .filter(row => row.id !== currentRowId && row.creator)
      .map(row => row.creator.id);

    return (data || [])
      .filter((item) => item.status === 'active' && item?.creator?.isFormCompleted)
      .filter((item) => !shortlistedIds.has(item.id) && !pitchUserIds.has(item.id))
      .filter((item) => !selectedInOtherRows.includes(item.id));
  };

  // Add a new creator row (max 3)
  const handleAddCreatorRow = () => {
    if (creatorRows.length < 3) {
      setCreatorRows([...creatorRows, { id: Date.now(), creator: null, followerCount: '', adminComments: '', hasMediaKit: false }]);
    }
  };

  // Remove the last creator row (min 1)
  const handleRemoveCreatorRow = () => {
    if (creatorRows.length > 1) {
      setCreatorRows(creatorRows.slice(0, -1));
    }
  };

  // Update creator selection for a specific row
  const handleCreatorRowChange = (rowId, selectedCreator) => {
    setCreatorRows(rows => rows.map(row => {
      if (row.id === rowId) {
        const hasMediaKit = hasMediaKitLinked(selectedCreator);
        // Always use getHighestFollowerCount - it handles priority: media kit > manualFollowerCount
        const followerCount = getHighestFollowerCount(selectedCreator) || '';
        // Only reset adminComments when clearing creator (null), preserve when switching creators
        const shouldResetComments = selectedCreator === null;
        return {
          ...row,
          creator: selectedCreator,
          followerCount,
          hasMediaKit,
          adminComments: shouldResetComments ? '' : row.adminComments
        };
      }
      return row;
    }));
  };

  // Update follower count for a specific row (only for manual entry)
  const handleFollowerCountChange = (rowId, value) => {
    setCreatorRows(rows => rows.map(row => {
      if (row.id === rowId && !row.hasMediaKit) {
        return { ...row, followerCount: value };
      }
      return row;
    }));
  };

  // Update admin comments for a specific row
  const handleAdminCommentsChange = (rowId, value) => {
    setCreatorRows(rows => rows.map(row => {
      if (row.id === rowId) {
        return { ...row, adminComments: value };
      }
      return row;
    }));
  };

  // Get valid creators from rows
  const getValidCreatorsFromRows = () => creatorRows.filter(row => row.creator !== null).map(row => row.creator);

  const resetState = () => {
    setCreatorRows([{ id: 1, creator: null, followerCount: '', adminComments: '', hasMediaKit: false }]);
    setSubmitting(false);
  };

  const handleCloseAll = () => {
    resetState();
    onClose?.();
  };

  const handleSubmit = async () => {
    // Get valid rows (with creator selected)
    const validRows = creatorRows.filter(row => row.creator !== null);
    if (!validRows.length || !campaign?.id) return;

    // Validate follower counts - max 10 billion
    const MAX_FOLLOWER_COUNT = 10_000_000_000;
    const invalidRow = validRows.find(row => {
      const count = row.followerCount ? parseInt(row.followerCount, 10) : 0;
      return count > MAX_FOLLOWER_COUNT;
    });
    if (invalidRow) {
      enqueueSnackbar('Follower count is too large. Please enter a valid number.', { variant: 'error' });
      return;
    }

    try {
      setSubmitting(true);

      await axiosInstance.post('/api/campaign/v3/shortlistCreator', {
        campaignId: campaign.id,
        creators: validRows.map((row) => {
          const parsedFollowerCount = row.followerCount ? parseInt(row.followerCount, 10) : undefined;
          return {
            id: row.creator.id,
            followerCount: !Number.isNaN(parsedFollowerCount) ? parsedFollowerCount : undefined,
            adminComments: row.adminComments?.trim() || undefined,
          };
        }),
      });

      enqueueSnackbar(
        validRows.length > 1
          ? 'Creators shortlisted successfully.'
          : 'Creator shortlisted successfully.',
        { variant: 'success' }
      );

      onUpdated?.();
      handleCloseAll();
    } catch (error) {
      console.error('Error shortlisting creators:', error);
      enqueueSnackbar(error?.response?.data?.message || 'Failed to shortlist creators.', {
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* MAIN SELECT DIALOG */}
      <Dialog
        open={open}
        onClose={handleCloseAll}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: '#F4F4F4',
            width: { xs: '95%', sm: '90%', md: '900px', lg: '1000px' },
            maxWidth: { xs: '95%', sm: '90%', md: '900px', lg: '1000px' },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: 'Instrument Serif',
            fontSize: '40px !important',
            fontWeight: 400,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 2,
            lineHeight: 1.2,
          }}
        >
          Add Platform Creators
          <IconButton onClick={handleCloseAll} size="small">
            <Iconify icon="mdi:close" width={24} />
          </IconButton>
        </DialogTitle>

        <Divider sx={{ borderColor: '#EBEBEB', mx: 3 }} />

        <DialogContent sx={{ pt: 3 }}>
          {isLoading ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CircularProgress thickness={6} size={28} />
            </Box>
          ) : (
            <>
              <AnimatePresence initial={false}>
                {creatorRows.map((row) => (
                  <Box
                    key={row.id}
                    component={m.div}
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{
                      opacity: 1,
                      height: 'auto',
                      marginBottom: 16,
                      transition: {
                        height: { duration: 0.3, ease: 'easeOut' },
                        opacity: { duration: 0.2, delay: 0.1 },
                      },
                    }}
                    exit={{
                      opacity: 0,
                      height: 0,
                      marginBottom: 0,
                      transition: {
                        height: { duration: 0.25, ease: 'easeIn' },
                        opacity: { duration: 0.15 },
                      },
                    }}
                    sx={{
                      borderBottom: '1px solid #e7e7e7',
                      pb: 2,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Single Row: Creator Autocomplete + Conditional Follower Count + CS Comments */}
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                      {/* Creator Autocomplete */}
                      <Box flex={1} sx={{ minWidth: { xs: '100%', md: 'auto' } }}>
                        <Typography sx={{ mb: 0.5, display: 'block', color: '#636366', fontSize: '14px !important', fontWeight: 600 }}>
                          Select Creators to add
                        </Typography>
                        <Autocomplete
                          value={row.creator}
                          onChange={(e, val) => handleCreatorRowChange(row.id, val)}
                          options={getFilteredOptions(row.id)}
                          getOptionLabel={(option) => option?.name || ''}
                          filterOptions={(options, state) => {
                            if (!state.inputValue) return options;
                            const lowercaseInput = state.inputValue.toLowerCase();
                            return options.filter(
                              (option) =>
                                option?.name?.toLowerCase().includes(lowercaseInput) ||
                                option?.email?.toLowerCase().includes(lowercaseInput)
                            );
                          }}
                          isOptionEqualToValue={(option, value) => option?.id === value?.id}
                          disableClearable={!!row.creator}
                          popupIcon={<Iconify icon="eva:chevron-down-fill" width={20} sx={{ color: '#231F20' }} />}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder={row.creator ? '' : 'Search creator...'}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  bgcolor: '#fff',
                                  minHeight: 48,
                                  borderRadius: 1,
                                },
                                '& .MuiOutlinedInput-input': {
                                  display: row.creator ? 'none' : 'block',
                                },
                              }}
                              InputProps={{
                                ...params.InputProps,
                                startAdornment: row.creator ? (
                                  <Box
                                    sx={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      bgcolor: '#fff',
                                      color: '#231F20',
                                      border: '1px solid #E7E7E7',
                                      borderBottom: '3px solid #E7E7E7',
                                      borderRadius: 1,
                                      px: 1.5,
                                      py: 0.5,
                                      fontWeight: 500,
                                      fontSize: '0.875rem',
                                      gap: 0.5,
                                      maxWidth: 180,
                                    }}
                                  >
                                    <Box
                                      component="span"
                                      sx={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {row.creator.name}
                                    </Box>
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCreatorRowChange(row.id, null);
                                      }}
                                      sx={{ p: 0, ml: 0.5, flexShrink: 0 }}
                                    >
                                      <Iconify icon="mdi:close" width={16} sx={{ color: '#636366' }} />
                                    </IconButton>
                                  </Box>
                                ) : null,
                              }}
                            />
                          )}
                          renderOption={({ key, ...optionProps }, option) => (
                            <Box key={key} component="li" {...optionProps} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                              <Avatar src={option?.photoURL} sx={{ width: 32, height: 32, bgcolor: '#e0e0e0' }}>
                                {option?.name?.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={500}>{option?.name}</Typography>
                                <Typography variant="caption" sx={{ color: '#636366' }}>{option?.email}</Typography>
                              </Box>
                            </Box>
                          )}
                        />
                      </Box>

                      {/* Conditional Follower Count Field with Animation */}
                      <AnimatePresence mode="wait">
                        {row.creator && !row.hasMediaKit && (
                          <Box
                            key={`follower-${row.id}`}
                            component={m.div}
                            initial={{ opacity: 0, width: 0 }}
                            animate={{
                              opacity: 1,
                              width: 'auto',
                              transition: {
                                width: { duration: 0.3, ease: 'easeOut' },
                                opacity: { duration: 0.2, delay: 0.1 },
                              },
                            }}
                            exit={{
                              opacity: 0,
                              width: 0,
                              transition: {
                                width: { duration: 0.25, ease: 'easeIn' },
                                opacity: { duration: 0.15 },
                              },
                            }}
                            sx={{ overflow: 'hidden', minWidth: 0 }}
                          >
                            <Typography sx={{ mb: 0.5, display: 'block', color: '#636366', fontSize: '14px !important', fontWeight: 600 }}>
                              Follower Count
                            </Typography>
                            <TextField
                              value={row.followerCount}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                handleFollowerCountChange(row.id, val);
                              }}
                              placeholder="Instagram or TikTok"
                              fullWidth
                              inputProps={{
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                              }}
                              sx={{
                                minWidth: 160,
                                '& .MuiOutlinedInput-root': {
                                  bgcolor: '#fff',
                                  minHeight: 48,
                                  borderRadius: 1,
                                },
                              }}
                            />
                          </Box>
                        )}
                      </AnimatePresence>

                      {/* CS Comments (Optional) */}
                      <Box sx={{ flex: { xs: 1, md: 1.5 }, minWidth: { xs: '100%', md: 'auto' } }}>
                        <Typography sx={{ mb: 0.5, display: 'block', color: '#636366', fontSize: '14px !important', fontWeight: 600 }}>
                          CS Comments (Optional)
                        </Typography>
                        <TextField
                          fullWidth
                          placeholder="Input comments about the creator that your clients might find helpful"
                          value={row.adminComments}
                          onChange={(e) => handleAdminCommentsChange(row.id, e.target.value)}
                          disabled={!row.creator}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              bgcolor: '#fff',
                              minHeight: 48,
                              borderRadius: 1,
                            },
                          }}
                        />
                      </Box>
                    </Stack>
                  </Box>
                ))}
              </AnimatePresence>

              {/* Plus/Minus Buttons */}
              <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 2 }}>
                <Tooltip title="Remove row" arrow>
                  <span>
                    <IconButton
                      onClick={handleRemoveCreatorRow}
                      disabled={creatorRows.length <= 1}
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: 1,
                        border: '1px solid #E7E7E7',
                        boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                        bgcolor: '#fff',
                        '&:hover': { bgcolor: '#f5f5f5' },
                        '&:disabled': { opacity: 0.5 },
                      }}
                    >
                      <Iconify icon="eva:minus-fill" width={20} />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Add row" arrow>
                  <span>
                    <IconButton
                      onClick={handleAddCreatorRow}
                      disabled={creatorRows.length >= 3}
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: 1,
                        border: '1px solid #E7E7E7',
                        boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                        bgcolor: '#fff',
                        '&:hover': { bgcolor: '#f5f5f5' },
                        '&:disabled': { opacity: 0.5 },
                      }}
                    >
                      <Iconify icon="eva:plus-fill" width={20} sx={{ color: '#1340FF' }} />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleCloseAll}
            sx={{
              bgcolor: '#FFFFFF',
              border: '1.5px solid #e7e7e7',
              borderBottom: '3px solid #e7e7e7',
              borderRadius: 1.15,
              color: '#1340FF',
              height: 44,
              px: 2.5,
              fontWeight: 600,
              fontSize: '0.85rem',
              textTransform: 'none',
              '&:hover': {
                bgcolor: 'rgba(19, 64, 255, 0.08)',
                border: '1.5px solid #1340FF',
                borderBottom: '3px solid #1340FF',
                color: '#1340FF',
              },
            }}
          >
            Cancel
          </Button>

          <LoadingButton
            onClick={handleSubmit}
            disabled={getValidCreatorsFromRows().length === 0}
            loading={submitting}
            loadingIndicator={<CircularProgress size={20} sx={{ color: '#fff' }} />}
            sx={{
              bgcolor: '#203ff5',
              border: '1px solid #203ff5',
              borderBottom: '3px solid #1933cc',
              height: 44,
              minWidth: 120,
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: 600,
              px: 3,
              textTransform: 'none',
              '&:hover': { bgcolor: '#1933cc', opacity: 0.9 },
              '&.MuiLoadingButton-loading': {
                bgcolor: '#203ff5',
                border: '1px solid #203ff5',
                borderBottom: '3px solid #1933cc',
              },
              '&:disabled:not(.MuiLoadingButton-loading)': {
                bgcolor: '#e7e7e7',
                color: '#999999',
                border: '1px solid #e7e7e7',
                borderBottom: '3px solid #d1d1d1',
              },
            }}
          >
            Add Creators
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
  pitches: PropTypes.array,
  onUpdated: PropTypes.func,
};

export function NonPlatformCreatorFormDialog({ open, onClose, onUpdated, campaignId }) {
  const [formValues, setFormValues] = useState({
    creators: [{ id: 1, name: '', followerCount: '', profileLink: '', adminComments: '' }],
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
            id: Date.now(),
            name: '',
            followerCount: '',
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

    if (!campaignId) {
      enqueueSnackbar('Missing campaign information. Please reload and try again.', {
        variant: 'error',
      });
      return;
    }

    // Validate follower counts - max 10 billion
    const MAX_FOLLOWER_COUNT = 10_000_000_000;
    const invalidFollower = formValues.creators.find((c) => {
      const count = c.followerCount ? parseInt(c.followerCount, 10) : 0;
      return count > MAX_FOLLOWER_COUNT;
    });
    if (invalidFollower) {
      enqueueSnackbar('Follower count is too large. Please enter a valid number.', { variant: 'error' });
      return;
    }

    const guestCreators = formValues.creators.map((creator) => ({
      name: creator.name.trim(),
      profileLink: creator.profileLink.trim(),
      followerCount: creator.followerCount || undefined,
      adminComments: creator.adminComments?.trim() || undefined,
    }));

    try {
      loading.onTrue();

      await axiosInstance.post('/api/campaign/v3/shortlistCreator/guest', {
        campaignId,
        guestCreators,
      });

      enqueueSnackbar(
        guestCreators.length > 1
          ? 'Guest creators shortlisted successfully.'
          : 'Guest creator shortlisted successfully.',
        { variant: 'success' }
      );

      onUpdated?.();
      onClose();
      setFormValues({
        creators: [
          {
            id: 1,
            name: '',
            followerCount: '',
            profileLink: '',
            adminComments: '',
          },
        ],
      });
    } catch (error) {
      console.error('Error adding guest creators:', error);
      enqueueSnackbar(error?.response?.data?.message || 'Failed to add non-platform creator.', {
        variant: 'error',
      });
    } finally {
      loading.onFalse();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: '#F4F4F4',
          width: { xs: '95%', sm: '90%', md: '900px', lg: '1000px' },
          maxWidth: { xs: '95%', sm: '90%', md: '900px', lg: '1000px' },
        },
      }}
    >
      <DialogTitle
        sx={{
          fontFamily: 'Instrument Serif',
          fontSize: { xs: '28px !important', sm: '40px !important' },
          fontWeight: 400,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
          lineHeight: 1.2,
        }}
      >
        Add Non-Platform Creator
        <IconButton onClick={onClose} size="small">
          <Iconify icon="mdi:close" width={24} />
        </IconButton>
      </DialogTitle>

      <Divider sx={{ borderColor: '#EBEBEB', mx: 3 }} />

      <DialogContent sx={{ pt: 3 }}>
        <AnimatePresence initial={false}>
          {formValues.creators.map((creator, index) => (
            <Box
              key={creator.id}
              component={m.div}
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{
                opacity: 1,
                height: 'auto',
                marginBottom: 16,
                transition: {
                  height: { duration: 0.3, ease: 'easeOut' },
                  opacity: { duration: 0.2, delay: 0.1 },
                },
              }}
              exit={{
                opacity: 0,
                height: 0,
                marginBottom: 0,
                transition: {
                  height: { duration: 0.25, ease: 'easeIn' },
                  opacity: { duration: 0.15 },
                },
              }}
              sx={{
                borderBottom: '1px solid #e7e7e7',
                pb: 2,
                overflow: 'hidden',
              }}
            >
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={2}>
                {/* Creator Name */}
                <Box sx={{ flex: 1, minWidth: { xs: '100%', md: 'auto' } }}>
                  <Typography sx={{ mb: 0.5, display: 'block', color: '#636366', fontSize: '14px !important', fontWeight: 600 }}>
                    Creator Name
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="Creator Name"
                    value={creator.name}
                    onChange={handleCreatorChange(index, 'name')}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: '#fff',
                        minHeight: 48,
                        borderRadius: 1,
                      },
                    }}
                  />
                </Box>

                {/* Follower Count */}
                <Box sx={{ flex: 1, minWidth: { xs: '100%', md: 'auto' } }}>
                  <Typography sx={{ mb: 0.5, display: 'block', color: '#636366', fontSize: '14px !important', fontWeight: 600 }}>
                    Follower Count
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="Follower Count"
                    value={creator.followerCount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      const updatedCreators = [...formValues.creators];
                      updatedCreators[index].followerCount = val;
                      setFormValues({ ...formValues, creators: updatedCreators });
                    }}
                    inputProps={{
                      inputMode: 'numeric',
                      pattern: '[0-9]*',
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: '#fff',
                        minHeight: 48,
                        borderRadius: 1,
                      },
                    }}
                  />
                </Box>

                {/* Profile Link */}
                <Box sx={{ flex: 1, minWidth: { xs: '100%', md: 'auto' } }}>
                  <Typography sx={{ mb: 0.5, display: 'block', color: '#636366', fontSize: '14px !important', fontWeight: 600 }}>
                    Profile Link
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="Profile Link"
                    value={creator.profileLink}
                    onChange={handleCreatorChange(index, 'profileLink')}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: '#fff',
                        minHeight: 48,
                        borderRadius: 1,
                      },
                    }}
                  />
                </Box>
              </Stack>

              {/* CS Comments - separate row below */}
              <Box sx={{ mt: 2 }}>
                <Typography sx={{ mb: 0.5, display: 'block', color: '#636366', fontSize: '14px !important', fontWeight: 600 }}>
                  CS Comments (Optional)
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Input comments about the creator that your clients might find helpful"
                  value={creator.adminComments}
                  onChange={handleCreatorChange(index, 'adminComments')}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#fff',
                      minHeight: 48,
                      borderRadius: 1,
                    },
                  }}
                />
              </Box>
            </Box>
          ))}
        </AnimatePresence>

        {/* Plus/Minus Buttons */}
        <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 2 }}>
          <Tooltip title="Remove row" arrow>
            <span>
              <IconButton
                onClick={handleRemoveCreator}
                disabled={formValues.creators.length <= 1}
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 1,
                  border: '1px solid #E7E7E7',
                  boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                  bgcolor: '#fff',
                  '&:hover': { bgcolor: '#f5f5f5' },
                  '&:disabled': { opacity: 0.5 },
                }}
              >
                <Iconify icon="eva:minus-fill" width={20} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Add row" arrow>
            <span>
              <IconButton
                onClick={handleAddCreator}
                disabled={formValues.creators.length >= 3}
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 1,
                  border: '1px solid #E7E7E7',
                  boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                  bgcolor: '#fff',
                  '&:hover': { bgcolor: '#f5f5f5' },
                  '&:disabled': { opacity: 0.5 },
                }}
              >
                <Iconify icon="eva:plus-fill" width={20} sx={{ color: '#1340FF' }} />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          sx={{
            bgcolor: '#FFFFFF',
            border: '1.5px solid #e7e7e7',
            borderBottom: '3px solid #e7e7e7',
            borderRadius: 1.15,
            color: '#1340FF',
            height: 44,
            px: 2.5,
            fontWeight: 600,
            fontSize: '0.85rem',
            textTransform: 'none',
            '&:hover': {
              bgcolor: 'rgba(19, 64, 255, 0.08)',
              border: '1.5px solid #1340FF',
              borderBottom: '3px solid #1340FF',
              color: '#1340FF',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading.value}
          sx={{
            bgcolor: '#203ff5',
            border: '1px solid #203ff5',
            borderBottom: '3px solid #1933cc',
            height: 44,
            color: '#ffffff',
            textTransform: 'none',
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
  campaignId: PropTypes.string,
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
  isDisabled: PropTypes.bool,
};
