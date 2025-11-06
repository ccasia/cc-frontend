/* eslint-disable no-nested-ternary */
import dayjs from 'dayjs';
/* eslint-disable no-plusplus */
import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';

import {
  Box,
  Stack,
  Table,
  Button,
  TableRow,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  InputAdornment,
  TableContainer,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
import useGetV3Pitches from 'src/hooks/use-get-v3-pitches';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import EmptyContent from 'src/components/empty-content/empty-content';

import PitchModal from './pitch-modal';
import MediaKitModal from './media-kit-modal';
import CreatorMasterListRow from './creator-master-list-row';

// Status display helper function
const getStatusInfo = (pitch) => {
  // Normalize status first
  let status;
  if (pitch.isShortlisted) {
    status = 'APPROVED';
  } else {
    status = pitch.isV3 ? pitch.displayStatus || pitch.status : pitch.status;
    // Normalize legacy statuses to new format
    if (status === 'undecided') status = 'PENDING_REVIEW';
    if (status === 'approved') status = 'APPROVED';
    if (status === 'rejected') status = 'REJECTED';
  }

  // Map status to display properties
  const statusMap = {
    PENDING_REVIEW: {
      color: '#FF9A02',
      label: 'PENDING REVIEW',
      normalizedStatus: 'PENDING_REVIEW',
    },
    MAYBE: { color: '#FFC702', label: 'Maybe', normalizedStatus: 'MAYBE' },
    APPROVED: { color: '#1ABF66', label: 'APPROVED', normalizedStatus: 'APPROVED' },
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

  // Special case for pitch approved vs regular approved
  if (status === 'APPROVED' && !pitch.isShortlisted && !pitch.isV3) {
    return {
      color: '#1ABF66',
      label: 'PITCH APPROVED',
      normalizedStatus: 'APPROVED',
    };
  }

  return (
    statusMap[status] || {
      color: '#637381',
      label: status?.toUpperCase() || 'UNKNOWN',
      normalizedStatus: status,
    }
  );
};

const CampaignCreatorMasterListClient = ({ campaign, campaignMutate }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedPitch, setSelectedPitch] = useState(null);
  const [openPitchModal, setOpenPitchModal] = useState(false);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
  const mediaKit = useBoolean();

  // Fetch V3 pitches for client-created campaigns OR admin-created v4 campaigns
  const shouldFetchV3Pitches =
    campaign?.origin === 'CLIENT' || campaign?.submissionVersion === 'v4';
  const {
    pitches: v3Pitches,
    isLoading: v3PitchesLoading,
    mutate: v3PitchesMutate,
  } = useGetV3Pitches(shouldFetchV3Pitches ? campaign?.id : null);

  // Create a list of creators from the shortlisted array and pitches
  const creators = useMemo(() => {
    if (!campaign) return [];

    // For client-created campaigns OR v4 campaigns, use V3 pitches
    if ((campaign.origin === 'CLIENT' || campaign.submissionVersion === 'v4') && v3Pitches) {
      return (
        v3Pitches
          .map((pitch) => ({
              id: pitch.userId || pitch.id,
              user: {
                id: pitch.userId || pitch.user?.id,
                name: pitch.user?.name,
                username: pitch.user?.instagramUser?.username,
                photoURL: pitch.user?.photoURL,
                status: pitch.user?.status || 'active',
                creator: pitch.user?.creator,
                engagementRate: pitch.user?.instagramUser?.engagement_rate,
                followerCount: pitch.user?.instagramUser?.followers_count,
                guestProfileLink: pitch.user?.guestProfileLink,
              },
              status: pitch.displayStatus || pitch.status || 'undecided',
              displayStatus: pitch.displayStatus || pitch.status || 'undecided',
              createdAt: pitch.createdAt || new Date().toISOString(),
              type: pitch.type || 'text',
              content: pitch.content || pitch.user?.creator?.about || 'No content available',
              isShortlisted: false,
              pitchId: pitch.id,
              isV3: true,
              adminComments: pitch.adminComments,
              rejectionReason: pitch.rejectionReason,
              customRejectionText: pitch.customRejectionText,
              username: pitch.username,
              followerCount: pitch.followerCount,
              engagementRate: pitch.engagementRate,
            }))
          // FIX: Only require user to exist, not user.creator
          .filter((creator) => !!creator.user && !!creator.user.id)
      );
    }

    // For admin-created campaigns, use V2 approach
    // Get creators from shortlisted
    const shortlistedCreators = campaign.shortlisted
      ? campaign.shortlisted
          .map((item) => ({
            id: item.userId,
            user: {
              id: item.userId,
              name: item.user?.name,
              username: item.user?.instagramUser?.username,
              photoURL: item.user?.photoURL,
              status: item.user?.status || 'active',
              creator: item.user?.creator,
              engagementRate: item.user?.instagramUser?.engagement_rate,
              followerCount: item.user?.instagramUser?.followers_count,
              guestProfileLink: item.user?.guestProfileLink,
            },
            status: 'approved', // Shortlisted creators are approved
            createdAt: item.shortlisted_date || new Date().toISOString(),
            type: 'text',
            content: item.user?.creator?.about || 'No content available',
            isShortlisted: true,
            isV3: false,
          }))
          .filter((creator) => creator.user && creator.user.creator)
      : [];

    // Get creators from pitches
    const pitchCreators = campaign.pitches
      ? campaign.pitches
          .filter(
            (pitch) =>
              // Only include pitches that aren't already in shortlisted
              !shortlistedCreators.some((sc) => sc.id === pitch.userId)
          )
          .map((pitch) => ({
            id: pitch.userId || pitch.id,
            user: {
              id: pitch.userId || pitch.user?.id,
              name: pitch.user?.name,
              username: pitch.user?.instagramUser?.username || pitch.user?.tiktokUser?.username,
              photoURL: pitch.user?.photoURL,
              status: pitch.user?.status || 'active',
              creator: pitch.user?.creator,
              engagementRate: pitch.user?.instagramUser?.engagement_rate,
              followerCount: pitch.user?.instagramUser?.followers_count,
              guestProfileLink: pitch.user?.guestProfileLink,
            },
            status: pitch.status || 'undecided',
            createdAt: pitch.createdAt || new Date().toISOString(),
            type: pitch.type || 'text',
            content: pitch.content || pitch.user?.creator?.about || 'No content available',
            isShortlisted: false,
            pitchId: pitch.id,
            isV3: false,
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
          elem.user.name?.toLowerCase().includes(search.toLowerCase()) ||
          (elem.user.username?.toLowerCase() || '').includes(search.toLowerCase()) ||
          (elem.user.creator?.instagram?.toLowerCase() || '').includes(search.toLowerCase())
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
    // Refresh V3 pitches data when a pitch is updated (approved/rejected)
    if (campaign?.origin === 'CLIENT') {
      v3PitchesMutate();
    }

    // Also refresh campaign data to update shortlisted creators
    if (campaignMutate) {
      campaignMutate();
    }
  };

  const mdUp = useResponsive('up', 'md');

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
                    <TableCell colSpan={6} align="center">
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
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>
      </Box>

      <PitchModal
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
};

export default CampaignCreatorMasterListClient;

CampaignCreatorMasterListClient.propTypes = {
  campaign: PropTypes.object,
  campaignMutate: PropTypes.func,
};
