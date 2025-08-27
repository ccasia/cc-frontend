/* eslint-disable no-nested-ternary */
import dayjs from 'dayjs';
/* eslint-disable no-plusplus */
import PropTypes from 'prop-types';
import { useTheme } from '@emotion/react';
import React, { useMemo, useState } from 'react';

import {
  Box,
  Stack,
  Table,
  Button,
  Avatar,
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

const TABLE_HEAD = [
  { id: 'creator', label: 'Creator', width: 300 },
  { id: 'username', label: 'Username', width: 350 },
  { id: 'instagram', label: 'Engagement Rate', width: 120 },
  { id: 'engagement', label: 'Follower Count', width: 100 },
  { id: 'status', label: 'Status', width: 100 },
  { id: 'actions', label: 'Actions', width: 80 },
];

// Helper function to get normalized status for filtering
const getNormalizedStatus = (pitch) => {
  if (pitch.isShortlisted) return 'APPROVED';

  const status = pitch.isV3 ? pitch.displayStatus || pitch.status : pitch.status;

  // Normalize legacy statuses to new format
  if (status === 'undecided') return 'PENDING_REVIEW';
  if (status === 'approved') return 'APPROVED';
  if (status === 'rejected') return 'REJECTED';

  return status;
};

// Status mapping function for consistent colors and labels
const getStatusDisplay = (pitch) => {
  const status = getNormalizedStatus(pitch);

  const statusMap = {
    PENDING_REVIEW: { color: '#FF9A02', label: 'PENDING REVIEW' },
    APPROVED: { color: '#1ABF66', label: 'APPROVED' },
    REJECTED: { color: '#FF4842', label: 'REJECTED' },
    AGREEMENT_SUBMITTED: { color: '#1ABF66', label: 'AGREEMENT SUBMITTED' },
    AGREEMENT_PENDING: { color: '#1340FF', label: 'AGREEMENT PENDING' },
    SENT_TO_CLIENT: { color: '#FF9A02', label: 'SENT TO CLIENT' },
    pending: { color: '#FF9A02', label: 'PENDING' },
    filtered: { color: '#FF4842', label: 'FILTERED' },
    draft: { color: '#637381', label: 'DRAFT' },
  };

  // Special case for pitch approved vs regular approved
  if (status === 'APPROVED' && !pitch.isShortlisted && !pitch.isV3) {
    return { color: '#1ABF66', label: 'PITCH APPROVED' };
  }

  return statusMap[status] || { color: '#637381', label: status?.toUpperCase() || 'UNKNOWN' };
};

const CampaignCreatorMasterListClient = ({ campaign, campaignMutate }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedPitch, setSelectedPitch] = useState(null);
  const [openPitchModal, setOpenPitchModal] = useState(false);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
  const mediaKit = useBoolean();
  const theme = useTheme();

  // Fetch V3 pitches for client-created campaigns
  const {
    pitches: v3Pitches,
    isLoading: v3PitchesLoading,
    isError: v3PitchesError,
    mutate: v3PitchesMutate,
  } = useGetV3Pitches(campaign?.origin === 'CLIENT' ? campaign?.id : null);

  // Debug log for V3 pitches
  if (campaign?.origin === 'CLIENT') {
    // eslint-disable-next-line no-console
    console.log('V3 pitches for client:', v3Pitches);
    // eslint-disable-next-line no-console
    console.log('Campaign ID:', campaign?.id);
    // eslint-disable-next-line no-console
    console.log('Campaign origin:', campaign?.origin);
    // eslint-disable-next-line no-console
    console.log('V3 pitches loading:', v3PitchesLoading);
    // eslint-disable-next-line no-console
    console.log('V3 pitches error:', v3PitchesError);
  }

  // Create a list of creators from the shortlisted array and pitches
  const creators = useMemo(() => {
    if (!campaign) return [];

    // For client-created campaigns, use V3 pitches
    if (campaign.origin === 'CLIENT' && v3Pitches) {
      // eslint-disable-next-line no-console
      console.log('Processing V3 pitches:', v3Pitches);

      return (
        v3Pitches
          .map((pitch) => {
            // eslint-disable-next-line no-console
            console.log('Processing pitch:', pitch);

            return {
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
              },
              status: pitch.displayStatus || pitch.status || 'undecided',
              displayStatus: pitch.displayStatus || pitch.status || 'undecided',
              createdAt: pitch.createdAt || new Date().toISOString(),
              type: pitch.type || 'text',
              content: pitch.content || pitch.user?.creator?.about || 'No content available',
              isShortlisted: false,
              pitchId: pitch.id,
              isV3: true,
            };
          })
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
              username: pitch.user?.instagramUser?.username,
              photoURL: pitch.user?.photoURL,
              status: pitch.user?.status || 'active',
              creator: pitch.user?.creator,
              engagementRate: pitch.user?.instagramUser?.engagement_rate,
              followerCount: pitch.user?.instagramUser?.followers_count,
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

  // Debug logs for creators
  if (campaign?.origin === 'CLIENT') {
    // eslint-disable-next-line no-console
    console.log('Creators array:', creators);
    // eslint-disable-next-line no-console
    console.log('Creators length:', creators.length);
    if (creators.length > 0) {
      // eslint-disable-next-line no-console
      console.log('First creator:', creators[0]);
    }
  }

  const activeCount = creators.length || 0;
  const pendingCount =
    creators.filter((creator) => getNormalizedStatus(creator) === 'PENDING_REVIEW').length || 0;
  const approvedPitchCount =
    creators.filter(
      (creator) => getNormalizedStatus(creator) === 'APPROVED' && !creator.isShortlisted
    ).length || 0;
  const shortlistedCount = creators.filter((creator) => creator.isShortlisted).length || 0;
  const rejectedCount = creators.filter(
    (creator) => getNormalizedStatus(creator) === 'REJECTED'
  ).length || 0;

  // Handle toggling sort direction
  const handleToggleSort = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  const filteredCreators = useMemo(() => {
    let filtered = creators;

    // Apply status filter
    if (selectedFilter === 'pending') {
      filtered = filtered.filter((creator) => getNormalizedStatus(creator) === 'PENDING_REVIEW');
    } else if (selectedFilter === 'approved_pitch') {
      filtered = filtered.filter(
        (creator) => getNormalizedStatus(creator) === 'APPROVED' && !creator.isShortlisted
      );
    } else if (selectedFilter === 'shortlisted') {
      filtered = filtered.filter((creator) => creator.isShortlisted);
    } else if (selectedFilter === 'rejected') {
      filtered = filtered.filter((creator) => getNormalizedStatus(creator) === 'REJECTED');
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

  // Debug logs for filtered creators
  if (campaign?.origin === 'CLIENT') {
    // eslint-disable-next-line no-console
    console.log('Filtered creators:', filteredCreators);
    // eslint-disable-next-line no-console
    console.log('Filtered creators length:', filteredCreators.length);
    // eslint-disable-next-line no-console
    console.log('Selected filter:', selectedFilter);
    // eslint-disable-next-line no-console
    console.log('Search term:', search);
  }

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

  const handleOpenMediaKit = (creatorId) => {
    setSelectedPitch({ user: { creator: { id: creatorId } } });
    mediaKit.onTrue();
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

  return creators.length > 0 ? (
    <>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'stretch', md: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 2 }}
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
            onClick={() => setSelectedFilter('shortlisted')}
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
              ...(selectedFilter === 'shortlisted'
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
                  selectedFilter === 'shortlisted' ? 'rgba(32, 63, 245, 0.04)' : 'transparent',
              },
            }}
          >
            {`Shortlisted (${shortlistedCount})`}
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
                bgcolor:
                  selectedFilter === 'rejected' ? 'rgba(32, 63, 245, 0.04)' : 'transparent',
              },
            }}
          >
            {`Rejected (${rejectedCount})`}
          </Button>

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
                    Engagement Rate
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
                      <EmptyContent title="No creators found" filled />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCreators.map((pitch) => (
                    <TableRow
                      key={pitch.id}
                      hover
                      sx={{
                        bgcolor: 'transparent',
                        '& td': {
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                        },
                      }}
                    >
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar
                            src={pitch.user?.photoURL}
                            alt={pitch.user?.name}
                            sx={{
                              width: 40,
                              height: 40,
                              border: '2px solid',
                              borderColor: 'background.paper',
                              boxShadow: theme.customShadows.z8,
                            }}
                          >
                            {pitch.user?.name?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="body2">{pitch.user?.name}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{pitch.user?.username || '-'}</TableCell>
                      <TableCell>
                        {pitch.user?.engagementRate
                          ? `${(pitch.user.engagementRate * 100).toFixed(2)}%`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {pitch.user?.followerCount
                          ? pitch.user.followerCount.toLocaleString()
                          : '-'}
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
                            ...(pitch.isShortlisted && {
                              color: '#1ABF66',
                              borderColor: '#1ABF66',
                            }),
                            ...(!pitch.isShortlisted && (pitch.displayStatus || pitch.status) === 'PENDING_REVIEW' && {
                              color: '#FF9A02',
                              borderColor: '#FF9A02',
                            }),
                            ...(!pitch.isShortlisted && (pitch.displayStatus || pitch.status) === 'APPROVED' && {
                              color: '#1ABF66',
                              borderColor: '#1ABF66',
                            }),
                            ...(!pitch.isShortlisted && (pitch.displayStatus || pitch.status) === 'REJECTED' && {
                              color: '#FF4842',
                              borderColor: '#FF4842',
                            }),
                            ...(!pitch.isShortlisted && pitch.status === 'undecided' && {
                              color: '#FF9A02',
                              borderColor: '#FF9A02',
                            }),
                            ...(!pitch.isShortlisted && pitch.status === 'approved' && {
                              color: '#1ABF66',
                              borderColor: '#1ABF66',
                            }),
                            ...(!pitch.isShortlisted && pitch.status === 'rejected' && {
                              color: '#FF4842',
                              borderColor: '#FF4842',
                            }),
                          }}
                        >
                          {pitch.isShortlisted 
                            ? 'APPROVED' 
                            : pitch.isV3
                              ? (pitch.displayStatus || pitch.status).toUpperCase()
                            : pitch.status === 'undecided' 
                              ? 'PENDING REVIEW' 
                              : pitch.status === 'approved'
                                ? 'PITCH APPROVED'
                                : pitch.status.toUpperCase()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleViewPitch(pitch)}
                          sx={{
                            cursor: 'pointer',
                            px: 1.5,
                            py: 2,
                            border: '1px solid #e7e7e7',
                            borderBottom: '3px solid #e7e7e7',
                            borderRadius: 1,
                            color: '#203ff5',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            textTransform: 'none',
                            bgcolor: 'transparent',
                            whiteSpace: 'nowrap',
                            '&:hover': {
                              bgcolor: 'rgba(32, 63, 245, 0.04)',
                              border: '1px solid #e7e7e7',
                              borderBottom: '3px solid #e7e7e7',
                            },
                          }}
                        >
                          View Profile
                        </Button>
                      </TableCell>
                    </TableRow>
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
  ) : (
    <EmptyContent title="No Creators" filled />
  );
};

export default CampaignCreatorMasterListClient;

CampaignCreatorMasterListClient.propTypes = {
  campaign: PropTypes.object,
  campaignMutate: PropTypes.func,
};
