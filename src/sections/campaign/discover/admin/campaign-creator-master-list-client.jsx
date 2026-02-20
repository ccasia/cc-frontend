/* eslint-disable no-nested-ternary */
import dayjs from 'dayjs';
/* eslint-disable no-plusplus */
import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';

import {
  Box,
  Card,
  Stack,
  Table,
  Button,
  Select,
  Avatar,
  TableRow,
  MenuItem,
  Collapse,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  CardContent,
  InputAdornment,
  TableContainer,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
import useGetV3Pitches from 'src/hooks/use-get-v3-pitches';

import { extractUsernameFromProfileLink } from 'src/utils/media-kit-utils';

import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import EmptyContent from 'src/components/empty-content/empty-content';

import PitchModal from './pitch-modal';
import MediaKitModal from './media-kit-modal';
import PitchModalMobile from './pitch-modal-mobile';
import CreatorMasterListRow from './creator-master-list-row';
import usePitchSocket from '../client/v3-pitches/use-pitch-socket';

// Status display helper function
const getStatusInfo = (pitch) => {
  // Normalize status first
  let status;
  if (pitch.isShortlisted) {
    status = 'APPROVED';
  } else {
    status = pitch.displayStatus || pitch.status;
    // Normalize legacy statuses to new format
    if (status === 'undecided') status = 'PENDING_REVIEW';
    if (status === 'approved') status = 'APPROVED';
    if (status === 'rejected') status = 'REJECTED';
  }

  // Map status to display properties
  const statusMap = {
    PENDING_REVIEW: {
      color: '#FFC702',
      label: 'PENDING REVIEW',
      normalizedStatus: 'PENDING_REVIEW',
    },
    MAYBE: { color: '#FFC702', label: 'Maybe', normalizedStatus: 'MAYBE' },
    APPROVED: { color: '#1ABF66', label: 'APPROVED', normalizedStatus: 'APPROVED' },
    approved: { color: '#1ABF66', label: 'APPROVED', normalizedStatus: 'APPROVED' },
    REJECTED: { color: '#FF4842', label: 'REJECTED', normalizedStatus: 'REJECTED' },
    AGREEMENT_SUBMITTED: {
      color: '#1ABF66',
      label: 'AGREEMENT SUBMITTED',
      normalizedStatus: 'AGREEMENT_SUBMITTED',
    },
    AGREEMENT_PENDING: {
      color: '#8B5CF6',
      label: 'AGREEMENT PENDING',
      normalizedStatus: 'AGREEMENT_PENDING',
    },
    SENT_TO_CLIENT: {
      color: '#8B5CF6',
      label: 'SENT TO CLIENT',
      normalizedStatus: 'SENT_TO_CLIENT',
    },
    pending: { color: '#FF9A02', label: 'PENDING', normalizedStatus: 'PENDING_REVIEW' },
    filtered: { color: '#FF4842', label: 'FILTERED', normalizedStatus: 'REJECTED' },
    draft: { color: '#637381', label: 'DRAFT', normalizedStatus: 'DRAFT' },
  };

  return (
    statusMap[status] || {
      color: '#637381',
      label: status?.toUpperCase() || 'UNKNOWN',
      normalizedStatus: status,
    }
  );
};

const CampaignCreatorMasterListClient = ({ campaign, campaignMutate }) => {
  const { user } = useAuthContext();
  const { socket } = useSocketContext();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedPitch, setSelectedPitch] = useState(null);
  const [openPitchModal, setOpenPitchModal] = useState(false);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
  const mediaKit = useBoolean();
  const smDown = useResponsive('down', 'sm');
  
  // Mobile-specific state
  const [expandedSections, setExpandedSections] = useState({
    pending: true,
    approved: true,
    rejected: false,
  });

  // Fetch V3 pitches for client-created campaigns OR admin-created v4 campaigns
  const fetchV3Pitches =
    campaign?.origin === 'CLIENT' || campaign?.submissionVersion === 'v4';
  const {
    pitches: v3Pitches,
    isLoading: v3PitchesLoading,
    mutate: v3PitchesMutate,
  } = useGetV3Pitches(fetchV3Pitches ? campaign?.id : null);

  // Listen for real-time pitch updates (outreach + status changes)
  usePitchSocket({
    socket,
    campaignId: campaign?.id,
    onOutreachUpdate: () => v3PitchesMutate?.(),
    onPitchStatusUpdate: () => {
      v3PitchesMutate?.();
      campaignMutate?.();
    },
    userId: user?.id,
  });

  // Create a list of creators from the shortlisted array and pitches
  const creators = useMemo(() => {
    if (!campaign) return [];

    if (campaign.submissionVersion === 'v4' && v3Pitches) {
      return (
        v3Pitches
          .map((pitch) => ({
              pitchId: pitch.id,
              user: {
                id: pitch.userId || pitch.user?.id,
                name: pitch.user?.name,
                email: pitch.user?.email,
                ig_username: pitch.user?.creator?.instagramUser?.username,
                tiktok_username: pitch.user?.creator?.tiktokUser?.username,
                photoURL: pitch.user?.photoURL,
                status: pitch.user?.status || 'active',
                creator: pitch.user?.creator,
                engagementRate: pitch.user?.instagramUser?.engagement_rate,
                followerCount: pitch.user?.instagramUser?.followers_count,
                profileLink: pitch.user?.creator?.profileLink,
              },
              status: pitch.displayStatus || pitch.status || 'undecided',
              displayStatus: pitch.displayStatus || pitch.status || 'undecided',
              createdAt: pitch.createdAt || new Date().toISOString(),
              type: pitch.type || 'text',
              content: pitch.content || pitch.user?.creator?.about || 'No content available',
              adminComments: pitch.adminComments,
              rejectionReason: pitch.rejectionReason,
              customRejectionText: pitch.customRejectionText,
              followerCount: pitch.followerCount,
              engagementRate: pitch.engagementRate,
              isShortlisted: false,
              outreachStatus: pitch.outreachStatus,
            }))
          .filter((creator) => !!creator.user && !!creator.user.id)
          .filter((creator) => creator.status !== 'draft' && creator.status !== 'DRAFT')
      );
    }

    // Get creators from shortlisted
    const shortlistedCreators = campaign.shortlisted
      ? campaign.shortlisted
          .map((item) => ({
            id: item.userId,
            user: {
              id: item.userId,
              name: item.user?.name,
              ig_username: item.user?.instagramUser?.username,
              tiktok_username: item.user?.tiktokUser?.username,
              photoURL: item.user?.photoURL,
              status: item.user?.status || 'active',
              creator: item.user?.creator,
              engagementRate: item.user?.instagramUser?.engagement_rate,
              followerCount: item.user?.instagramUser?.followers_count,
              profileLink: item.user?.creator?.profileLink,
            },
            status: 'approved', // Shortlisted creators are approved
            createdAt: item.shortlisted_date || new Date().toISOString(),
            type: 'text',
            content: item.user?.creator?.about || 'No content available',
            isShortlisted: true,
          }))
          .filter((creator) => creator.user && creator.user.creator)
      : [];

    // Get creators from pitches
    const pitchCreators = campaign.pitches
      ? campaign.pitches
          .filter(
            (pitch) =>
              // Only include pitches that aren't already in shortlisted and exclude drafts
              !shortlistedCreators.some((sc) => sc.id === pitch.userId) &&
              pitch.status !== 'draft' &&
              pitch.status !== 'DRAFT'
          )
          .map((pitch) => ({
            pitchId: pitch.id,
            user: {
              id: pitch.userId || pitch.user?.id,
              name: pitch.user?.name,
              ig_username: pitch.user?.creator?.instagramUser?.username,
              tiktok_username: pitch.user?.creator?.tiktokUser?.username,
              photoURL: pitch.user?.photoURL,
              status: pitch.user?.status || 'active',
              creator: pitch.user?.creator,
              engagementRate: pitch.user?.instagramUser?.engagement_rate,
              followerCount: pitch.user?.instagramUser?.followers_count,
              profileLink: pitch.user?.creator?.profileLink,
            },
            status: pitch.status || 'undecided',
            createdAt: pitch.createdAt || new Date().toISOString(),
            type: pitch.type || 'text',
            content: pitch.content || pitch.user?.creator?.about || 'No content available',
            isShortlisted: false,
            // pitchId: pitch.id,
            isV3: false,
            outreachStatus: pitch.outreachStatus,
          }))
          .filter((creator) => creator.user && creator.user.creator)
      : [];

    // Combine both lists
    return [...shortlistedCreators, ...pitchCreators];
  }, [campaign, v3Pitches]);

  const activeCount = creators.length || 0;
  const pendingCount =
    creators.filter((creator) => getStatusInfo(creator).normalizedStatus === 'PENDING_REVIEW')
      .length || 0;
  const approvedPitchCount =
    creators.filter(
      (creator) => getStatusInfo(creator).normalizedStatus === 'APPROVED' && !creator.isShortlisted
    ).length || 0;
  const rejectedCount =
    creators.filter((creator) => getStatusInfo(creator).normalizedStatus === 'REJECTED').length ||
    0;

  // Handle toggling sort direction
  const handleToggleSort = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  console.log('List of creators: ', creators)

  const filteredCreators = useMemo(() => {
    let filtered = creators;

    // Apply status filter
    if (selectedFilter === 'pending') {
      filtered = filtered.filter(
        (creator) => getStatusInfo(creator).normalizedStatus === 'PENDING_REVIEW'
      );
    } else if (selectedFilter === 'approved_pitch') {
      filtered = filtered.filter(
        (creator) =>
          getStatusInfo(creator).normalizedStatus === 'APPROVED' && !creator.isShortlisted
      );
    } else if (selectedFilter === 'rejected') {
      filtered = filtered.filter(
        (creator) => getStatusInfo(creator).normalizedStatus === 'REJECTED'
      );
    }

    // Apply search filter
    if (search) {
      filtered = filtered.filter(
        (elem) =>
          elem.user.name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      const nameA = a.user.name?.toLowerCase() || '';
      const nameB = b.user.name?.toLowerCase() || '';

      if (sortDirection === 'asc') {
        return nameA.localeCompare(nameB);
      }
      return nameB.localeCompare(nameA);
    });
  }, [creators, search, sortDirection, selectedFilter]);

  const matchCampaignPercentage = (pitch) => {
    if (!pitch) return null;

    const creator = pitch?.user?.creator;
    const requirements = campaign?.campaignRequirement;

    if (!requirements || !creator) return 100; // Default to 100% if no requirements

    const calculateInterestMatchingPercentage = () => {
      if (!requirements?.creator_persona?.length || !creator?.interests?.length) return 0;

      // Convert creator interests to lowercase names
      const creatorInterests = creator.interests
        .map((int) => (typeof int === 'string' ? int.toLowerCase() : int?.name?.toLowerCase()))
        .filter(Boolean);

      // Count matching interests
      const matchingInterests = creatorInterests.filter((interest) =>
        requirements.creator_persona.map((p) => p.toLowerCase()).includes(interest)
      ).length;

      return (matchingInterests / requirements.creator_persona.length) * 100;
    };

    const calculateRequirementMatchingPercentage = () => {
      let matches = 0;
      let totalCriteria = 0;

      // Age check
      if (requirements?.age?.length) {
        totalCriteria++;
        const creatorAge = dayjs().diff(dayjs(creator.birthDate), 'year');
        const isAgeInRange = requirements.age.some((range) => {
          const [min, max] = range.split('-').map(Number);
          return creatorAge >= min && creatorAge <= max;
        });
        if (isAgeInRange) matches++;
      }

      // Gender check
      if (requirements?.gender?.length) {
        totalCriteria++;
        const creatorGender =
          creator.pronounce === 'he/him'
            ? 'male'
            : creator.pronounce === 'she/her'
              ? 'female'
              : 'nonbinary';
        if (requirements.gender.includes(creatorGender)) matches++;
      }

      // Language check
      if (requirements?.language?.length && creator.languages?.length) {
        totalCriteria++;
        const hasLanguageMatch = creator.languages.some((lang) =>
          requirements.language.map((l) => l.toLowerCase()).includes(lang.toLowerCase())
        );
        if (hasLanguageMatch) matches++;
      }

      return totalCriteria > 0 ? (matches / totalCriteria) * 100 : 0;
    };

    const interestMatch = calculateInterestMatchingPercentage();
    const requirementMatch = calculateRequirementMatchingPercentage();

    return Math.round(interestMatch * 0.5 + requirementMatch * 0.5);
  };

  const handleViewPitch = (pitch) => {
    // Calculate matching percentage
    const data = matchCampaignPercentage(pitch);

    // Set the selected pitch with matching percentage
    setSelectedPitch({ ...pitch, matchingPercentage: data });
    setOpenPitchModal(true);
  };

  const handleClosePitchModal = () => {
    setOpenPitchModal(false);
  };

  const handlePitchUpdate = (updatedPitch) => {
    // Refresh V3 pitches data when a pitch is updated (approved/rejected/maybe)
    if (fetchV3Pitches) {
      v3PitchesMutate();
    }

    // Also refresh campaign data to update shortlisted creators
    if (campaignMutate) {
      campaignMutate();
    }
  };

  const mdUp = useResponsive('up', 'md');

  // Group creators by status for mobile view - MUST be before conditional returns
  const groupedCreators = useMemo(() => {
    const pending = filteredCreators.filter(
      (creator) => getStatusInfo(creator).normalizedStatus === 'PENDING_REVIEW'
    );
    const approved = filteredCreators.filter(
      (creator) => getStatusInfo(creator).normalizedStatus === 'APPROVED' && !creator.isShortlisted
    );
    const rejected = filteredCreators.filter(
      (creator) => getStatusInfo(creator).normalizedStatus === 'REJECTED'
    );
    
    return { pending, approved, rejected };
  }, [filteredCreators]);

  // Show loading state for V3 pitches
  if (campaign?.origin === 'CLIENT' && v3PitchesLoading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          Loading pitches...
        </Typography>
      </Box>
    );
  }

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const formatFollowerCount = (count) => {
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  // Mobile View
  if (!mdUp) {
    return (
      <>
        <Box sx={{ mb: 3 }}>
          <Select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            displayEmpty
            sx={{
              height: 40,
              borderRadius: 1,
              pb: 0.3,
              color: '#1340FF',
              fontSize: 14,
              bgcolor: '#fff',
              boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
              border: '1px solid #e7e7e7',
              '& .MuiOutlinedInput-notchedOutline': {
                border: 'none',
              },
            }}
          >
            <MenuItem value="all" sx={{ width: 180 }}>
              <Stack direction="row" alignItems="center">
                <Typography fontWeight={600}>All</Typography>
              </Stack>
            </MenuItem>
            <MenuItem value="pending">
              <Stack direction="row" alignItems="center">
                <Typography fontWeight={600}>Pending</Typography>
              </Stack>
            </MenuItem>
            <MenuItem value="approved_pitch">
              <Stack direction="row" alignItems="center">
                <Typography fontWeight={600}>Approved</Typography>
              </Stack>
            </MenuItem>
            <MenuItem value="rejected">
              <Stack direction="row" alignItems="center">
                <Typography fontWeight={600}>Rejected</Typography>
              </Stack>
            </MenuItem>
          </Select>
        </Box>

        <Box>
          {selectedFilter === 'all' ? (
            <>
              {pendingCount > 0 && (
                <MobileSection
                  title="PENDING REVIEW"
                  count={pendingCount}
                  color="#FFC702"
                  creators={groupedCreators.pending}
                  sectionKey="pending"
                  isExpanded={expandedSections.pending}
                  onToggle={toggleSection}
                  onViewPitch={handleViewPitch}
                  formatFollowerCount={formatFollowerCount}
                />
              )}
              {approvedPitchCount > 0 && (
                <MobileSection
                  title="APPROVED"
                  count={approvedPitchCount}
                  color="#1ABF66"
                  creators={groupedCreators.approved}
                  sectionKey="approved"
                  isExpanded={expandedSections.approved}
                  onToggle={toggleSection}
                  onViewPitch={handleViewPitch}
                  formatFollowerCount={formatFollowerCount}
                />
              )}
              {rejectedCount > 0 && (
                <MobileSection
                  title="REJECTED"
                  count={rejectedCount}
                  color="#D4321C"
                  creators={groupedCreators.rejected}
                  sectionKey="rejected"
                  isExpanded={expandedSections.rejected}
                  onToggle={toggleSection}
                  onViewPitch={handleViewPitch}
                  formatFollowerCount={formatFollowerCount}
                />
              )}
              {activeCount === 0 && (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <EmptyContent title="No creators found" filled />
                </Box>
              )}
            </>
          ) : selectedFilter === 'pending' ? (
            <MobileSection
              title="PENDING REVIEW"
              count={pendingCount}
              color="#FFC702"
              creators={groupedCreators.pending}
              sectionKey="pending"
              isExpanded={expandedSections.pending}
              onToggle={toggleSection}
              onViewPitch={handleViewPitch}
              formatFollowerCount={formatFollowerCount}
            />
          ) : selectedFilter === 'approved_pitch' ? (
            <MobileSection
              title="APPROVED"
              count={approvedPitchCount}
              color="#1ABF66"
              creators={groupedCreators.approved}
              sectionKey="approved"
              isExpanded={expandedSections.approved}
              onToggle={toggleSection}
              onViewPitch={handleViewPitch}
              formatFollowerCount={formatFollowerCount}
            />
          ) : (
            <MobileSection
              title="REJECTED"
              count={rejectedCount}
              color="#D4321C"
              creators={groupedCreators.rejected}
              sectionKey="rejected"
              isExpanded={expandedSections.rejected}
              onToggle={toggleSection}
              onViewPitch={handleViewPitch}
              formatFollowerCount={formatFollowerCount}
            />
          )}
        </Box>

        <PitchModalMobile
          pitch={selectedPitch}
          open={openPitchModal}
          onClose={handleClosePitchModal}
          onUpdate={handlePitchUpdate}
          campaign={campaign}
        />

        <MediaKitModal
          open={mediaKit.value}
          handleClose={mediaKit.onFalse}
          creatorId={selectedPitch?.user?.creator?.id}
        />
      </>
    );
  }

  // Desktop View
  return (
    <>
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
          mb: 2,
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
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'stretch', md: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
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
            All ({activeCount})
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
            onClick={() => setSelectedFilter('approved_pitch')}
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
              ...(selectedFilter === 'approved_pitch'
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
                  selectedFilter === 'approved_pitch' ? 'rgba(32, 63, 245, 0.04)' : 'transparent',
              },
            }}
          >
            {`Approved Pitches (${approvedPitchCount})`}
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
            {`Rejected (${rejectedCount})`}
          </Button>
        </Stack>

        <TextField
          placeholder="Search by Creator Name or Username"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth={!mdUp}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="material-symbols:search" />
              </InputAdornment>
            ),
            sx: {
              height: '42px',
              '& input': {
                py: 3,
                height: '42px',
              },
            },
          }}
          sx={{
            width: { xs: '100%', md: 260 },
            '& .MuiOutlinedInput-root': {
              height: '42px',
              border: '1px solid #e7e7e7',
              borderBottom: '3px solid #e7e7e7',
              borderRadius: 1,
            },
          }}
        />
      </Stack>

      <Box>
        <Scrollbar>
          <TableContainer
            sx={{
              minWidth: 800,
              position: 'relative',
              bgcolor: 'transparent',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      py: 1,
                      color: '#221f20',
                      fontWeight: 600,
                      width: 300,
                      borderRadius: '10px 0 0 10px',
                      bgcolor: '#f5f5f5',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Creator
                  </TableCell>
                  <TableCell
                    sx={{
                      py: 1,
                      color: '#221f20',
                      fontWeight: 600,
                      width: 140,
                      bgcolor: '#f5f5f5',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Outreach Status
                  </TableCell>
                  <TableCell
                    sx={{
                      py: 1,
                      color: '#221f20',
                      fontWeight: 600,
                      width: 350,
                      bgcolor: '#f5f5f5',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Username
                  </TableCell>
                  {/* <TableCell
                    sx={{
                      py: 1,
                      color: '#221f20',
                      fontWeight: 600,
                      width: 120,
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
                      width: 100,
                      bgcolor: '#f5f5f5',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Follower Count
                  </TableCell>
                  {campaign?.isCreditTier && (
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
                      Tier
                    </TableCell>
                  )}
                  {campaign?.isCreditTier && (
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
                      Credits
                    </TableCell>
                  )}
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
                      width: 80,
                      borderRadius: '0 10px 10px 0',
                      bgcolor: '#f5f5f5',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {/* Actions */}
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredCreators.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <EmptyContent sx={{ py: 10 }} title="No creators found" filled />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCreators.map((pitch) => (
                    <CreatorMasterListRow
                      key={pitch.id}
                      pitch={pitch}
                      getStatusInfo={getStatusInfo}
                      onViewPitch={handleViewPitch}
                      campaign={campaign}
                      isCreditTier={campaign?.isCreditTier}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>
      </Box>

      {smDown ? (
        <PitchModalMobile
          pitch={selectedPitch}
          open={openPitchModal}
          onClose={handleClosePitchModal}
          onUpdate={handlePitchUpdate}
          campaign={campaign}
        />
      ) : (
        <PitchModal
          pitch={selectedPitch}
          open={openPitchModal}
          onClose={handleClosePitchModal}
          onUpdate={handlePitchUpdate}
          campaign={campaign}
        />
      )}

      <MediaKitModal
        open={mediaKit.value}
        handleClose={mediaKit.onFalse}
        creatorId={selectedPitch?.user?.creator?.id}
      />
    </>
  );
};

const MobileCreatorCard = ({ pitch, onViewPitch, formatFollowerCount }) => {
  const creatorProfile = pitch?.user?.creator || {};
  const instagramStats = creatorProfile.instagramUser || {};
  const tiktokStats = creatorProfile.tiktokUser || {};

  // Helper function to select the account with most followers and highest engagement
  const selectBestAccount = () => {
    const igFollowers = instagramStats?.followers_count || 0;
    const igEngagement = ((instagramStats?.totalLikes || 0) + (instagramStats?.totalComments || 0)) / igFollowers || 0;
    const tkFollowers = tiktokStats?.follower_count || 0;
    const tkEngagement = ((tiktokStats?.likes_count || 0) + (tiktokStats?.totalComments || 0) + (tiktokStats?.totalShares || 0)) / tkFollowers || 0;

    // If only one account exists, use it
    if (!tkFollowers) return { followers: igFollowers, engagement: igEngagement };
    if (!igFollowers) return { followers: tkFollowers, engagement: tkEngagement };

    // If both exist, compare follower count first, then engagement rate
    if (igFollowers >= tkFollowers) {
      return { followers: igFollowers, engagement: igEngagement };
    }
    return { followers: tkFollowers, engagement: tkEngagement };
  };

  const bestAccount = selectBestAccount();

  // Extract social media usernames
  const instagramUsername = instagramStats?.username || extractUsernameFromProfileLink(creatorProfile?.instagramProfileLink);
  const tiktokUsername = tiktokStats?.username || extractUsernameFromProfileLink(creatorProfile?.tiktokProfileLink);
  const profileUsername = extractUsernameFromProfileLink(creatorProfile?.profileLink);
  const hasSocialUsernames = instagramUsername || tiktokUsername;

  const followerCount = bestAccount.followers || pitch?.followerCount;
  const engagementRate = bestAccount.engagement || pitch?.engagementRate;

  return (
    <Card
      onClick={() => onViewPitch(pitch)}
      sx={{
        mb: 1.5,
        borderRadius: 2,
        boxShadow: '0 2px 0px 0px rgba(0,0,0,0.08)',
        border: '1px solid #f0f0f0',
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack flex={1} spacing={1}>
          <Stack flex={3} direction="row" spacing={1}>
            <Avatar
              src={pitch?.user?.photoURL}
              alt={pitch?.user?.name || 'Creator avatar'}
              sx={{ width: 35, height: 35 }}
            />

            <Typography variant="subtitle2" fontWeight="bold" lineHeight={1.4} sx={{ color: '#221f20' }} flex={3} alignSelf="center">
              {pitch?.user?.name || 'Unknown Creator'}
            </Typography>

            <Button
              onClick={() => onViewPitch(pitch)}
              sx={{
                flex: 1,
                px: 1,
                height: 30,
                minWidth: 90,
                color: '#203ff5',
                border: '1px solid #E7E7E7',
                boxShadow: '0px -2px 0px 0px #E7E7E7 inset',
                textTransform: 'none',
                fontSize: 12,
                fontWeight: 600,
                '&:hover': {
                  border: '1px solid #E7E7E7',
                  bgcolor: '#E7E7E7',
                },
              }}
            >
              View Profile
            </Button>
          </Stack>

          {hasSocialUsernames ? (
            <Stack direction="row" alignItems="center" mt={-0.5} ml={5.2} spacing={1}>
              {instagramUsername && (
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Iconify icon="mdi:instagram" width={14} sx={{ color: '#8E8E93' }} />
                  <Typography variant="caption" sx={{ color: '#8E8E93', fontSize: 12 }}>
                    {instagramUsername}
                  </Typography>
                </Stack>
              )}
              {tiktokUsername && (
                <Stack direction="row" alignItems="center" spacing={0}>
                  <Iconify icon="ic:baseline-tiktok" width={14} sx={{ color: '#8E8E93' }} />
                  <Typography variant="caption" sx={{ color: '#8E8E93', fontSize: 12 }}>
                    {tiktokUsername}
                  </Typography>
                </Stack>
              )}
            </Stack>
          ) : profileUsername && (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography variant="caption" sx={{ color: '#8E8E93', fontSize: 12 }}>
                {profileUsername}
              </Typography>
            </Stack>
        )}
        </Stack>

        <Stack direction="row" spacing={2} ml={5.2} sx={{ mt: 0.5 }}>
          <Stack direction="row" alignItems="center" spacing={0.5} minWidth={100}>
            <Iconify icon="streamline:user-multiple-group" width={12} sx={{ color: '#637381' }} />
            <Typography variant="caption" sx={{ color: '#637381', fontSize: 12, pt: 0.2 }}>
              {formatFollowerCount(followerCount)} Followers
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Iconify icon="mage:chart-up-b" width={16} sx={{ color: '#637381' }} />
            <Typography variant="caption" sx={{ color: '#637381', fontSize: 12, pt: 0.2 }}>
              {typeof engagementRate === 'number' ? `${(engagementRate * 100).toFixed(2)}%` : 'N/A'} Engagement
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

const MobileSection = ({
  title,
  count,
  color,
  creators: sectionCreators,
  sectionKey,
  isExpanded,
  onToggle,
  onViewPitch,
  formatFollowerCount,
}) => (
  <Box sx={{ mb: 2 }}>
    <Button
      fullWidth
      onClick={() => onToggle(sectionKey)}
      endIcon={
        <Iconify
          icon={isExpanded ? 'tabler:chevron-down' : 'tabler:chevron-right'}
          width={20}
          color="#000"
        />
      }
      sx={{
        px: 1,
        pt: 0.5,
        py: 1,
        maxHeight: 50,
        justifyContent: 'space-between',
        bgcolor: '#fff',
        color,
        boxShadow: `0px -2px 0px 0px ${color} inset`,
        borderRadius: 0.8,
        border: `1px solid ${color}`,
        textTransform: 'none',
        fontWeight: 600,
        fontSize: 14,
        '&:hover': {
          bgcolor: '#fff',
          boxShadow: `0px -3px 0px 0px ${color} inset`,
        },
      }}
    >
      {title} ({count})
    </Button>

    <Collapse in={isExpanded}>
      <Box sx={{ mt: 1.5 }}>
        {sectionCreators.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No creators in this category
            </Typography>
          </Box>
        ) : (
          sectionCreators.map((sectionPitch) => (
            <MobileCreatorCard
              key={sectionPitch.id}
              pitch={sectionPitch}
              onViewPitch={onViewPitch}
              formatFollowerCount={formatFollowerCount}
            />
          ))
        )}
      </Box>
    </Collapse>
  </Box>
);

export default CampaignCreatorMasterListClient;

CampaignCreatorMasterListClient.propTypes = {
  campaign: PropTypes.object,
  campaignMutate: PropTypes.func,
};

// Shared prop-type shape for pitch objects
const pitchPropType = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  user: PropTypes.shape({
    name: PropTypes.string,
    username: PropTypes.string,
    photoURL: PropTypes.string,
    followerCount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    engagementRate: PropTypes.number,
    creator: PropTypes.object,
  }),
  followerCount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  engagementRate: PropTypes.number,
});

MobileCreatorCard.propTypes = {
  pitch: pitchPropType.isRequired,
  onViewPitch: PropTypes.func.isRequired,
  formatFollowerCount: PropTypes.func.isRequired,
};

MobileSection.propTypes = {
  title: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  creators: PropTypes.arrayOf(pitchPropType).isRequired,
  sectionKey: PropTypes.string.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  onViewPitch: PropTypes.func.isRequired,
  formatFollowerCount: PropTypes.func.isRequired,
};
