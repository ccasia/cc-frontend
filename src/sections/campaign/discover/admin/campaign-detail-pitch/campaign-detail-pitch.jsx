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

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import EmptyContent from 'src/components/empty-content/empty-content';

import PitchModal from '../pitch-modal';
import MediaKitModal from '../media-kit-modal';

const TABLE_HEAD = [
  { id: 'creator', label: 'Creator', width: 300 },
  { id: 'email', label: "Creator's Email", width: 350 },
  { id: 'submitDate', label: 'Pitch Submitted', width: 120 },
  { id: 'format', label: 'Pitch Format', width: 100 },
  { id: 'status', label: 'Status', width: 100 },
  { id: 'actions', label: 'Actions', width: 80 },
];

const CampaignDetailPitch = ({ pitches, timelines, campaign, onUpdate }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedPitch, setSelectedPitch] = useState(null);
  const [openPitchModal, setOpenPitchModal] = useState(false);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
  const mediaKit = useBoolean();
  const theme = useTheme();

  const undecidedCount = pitches?.filter((pitch) => pitch.status === 'undecided').length || 0;
  const approvedCount = pitches?.filter((pitch) => pitch.status === 'approved').length || 0;

  const filteredPitches = useMemo(() => {
    let filtered = pitches;

    // Apply status filter
    if (selectedFilter === 'undecided') {
      filtered = filtered?.filter((pitch) => pitch.status === 'undecided');
    } else if (selectedFilter === 'approved') {
      filtered = filtered?.filter((pitch) => pitch.status === 'approved');
    }

    // Apply search filter
    if (search) {
      filtered = filtered?.filter((elem) =>
        elem.user.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sort alphabetically by creator name
    if (filtered?.length) {
      filtered = [...filtered].sort((a, b) => {
        const nameA = (a.user?.name || '').toLowerCase();
        const nameB = (b.user?.name || '').toLowerCase();
        
        return sortDirection === 'asc' 
          ? nameA.localeCompare(nameB) 
          : nameB.localeCompare(nameA);
      });
    }

    return filtered;
  }, [pitches, selectedFilter, search, sortDirection]);

  // Toggle sort direction
  const handleToggleSort = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  const matchCampaignPercentage = (pitch) => {
    if (!pitch) return null;

    const creator = pitch?.user?.creator;
    const requirements = campaign?.campaignRequirement;

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
    const completePitch = pitches.find((p) => p.id === pitch.id);
    const data = matchCampaignPercentage(pitch);

    setSelectedPitch({ ...completePitch, matchingPercentage: data });
    setOpenPitchModal(true);
  };

  const handleClosePitchModal = () => {
    setOpenPitchModal(false);
  };

  const handlePitchUpdate = (updatedPitch) => {
    // Update the pitch in the local state
    const updatedPitches = pitches.map((p) => (p.id === updatedPitch.id ? updatedPitch : p));

    // Call the parent's onUpdate if it exists
    if (onUpdate) {
      onUpdate(updatedPitches);
    }
  };

  const mdUp = useResponsive('up', 'md');

  return pitches?.length > 0 ? (
    <>
      {/* Main Controls Container */}
      <Box
        sx={{
          border: '1px solid #e7e7e7',
          borderRadius: 1,
          p: 1,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: 'space-between',
          gap: { xs: 1.5, md: 1.5 },
          bgcolor: 'background.paper',
          mb: 2.5,
        }}
      >
        {/* Filter Buttons */}
        <Stack
          direction="row"
          spacing={1}
          sx={{
            flex: { xs: 'none', md: '0 0 auto' },
            overflowX: 'auto',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          <Button
            onClick={() => setSelectedFilter('all')}
            sx={{
              px: 2,
              py: 1,
              minHeight: '38px',
              height: '38px',
              minWidth: 'fit-content',
              color: selectedFilter === 'all' ? '#ffffff' : '#666666',
              bgcolor: selectedFilter === 'all' ? '#1340ff' : 'transparent',
              fontSize: '0.95rem',
              fontWeight: 600,
              borderRadius: 0.75,
              textTransform: 'none',
              position: 'relative',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '1px',
                left: '1px',
                right: '1px',
                bottom: '1px',
                borderRadius: 0.75,
                backgroundColor: 'transparent',
                transition: 'background-color 0.2s ease',
                zIndex: -1,
              },
              '&:hover::before': {
                backgroundColor: selectedFilter === 'all' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(19, 64, 255, 0.08)',
              },
              '&:hover': {
                bgcolor: selectedFilter === 'all' ? '#1340ff' : 'transparent',
                color: selectedFilter === 'all' ? '#ffffff' : '#1340ff',
                transform: 'scale(0.98)',
              },
              '&:focus': {
                outline: 'none',
              },
            }}
          >
            All
          </Button>

          <Button
            onClick={() => setSelectedFilter('undecided')}
            sx={{
              px: 2,
              py: 1,
              minHeight: '38px',
              height: '38px',
              minWidth: 'fit-content',
              color: selectedFilter === 'undecided' ? '#ffffff' : '#666666',
              bgcolor: selectedFilter === 'undecided' ? '#1340ff' : 'transparent',
              fontSize: '0.95rem',
              fontWeight: 600,
              borderRadius: 0.75,
              textTransform: 'none',
              position: 'relative',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '1px',
                left: '1px',
                right: '1px',
                bottom: '1px',
                borderRadius: 0.75,
                backgroundColor: 'transparent',
                transition: 'background-color 0.2s ease',
                zIndex: -1,
              },
              '&:hover::before': {
                backgroundColor: selectedFilter === 'undecided' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(19, 64, 255, 0.08)',
              },
              '&:hover': {
                bgcolor: selectedFilter === 'undecided' ? '#1340ff' : 'transparent',
                color: selectedFilter === 'undecided' ? '#ffffff' : '#1340ff',
                transform: 'scale(0.98)',
              },
              '&:focus': {
                outline: 'none',
              },
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <span>Undecided</span>
              <Box
                sx={{
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 0.5,
                  bgcolor: selectedFilter === 'undecided' ? 'rgba(255, 255, 255, 0.25)' : '#f5f5f5',
                  color: selectedFilter === 'undecided' ? '#ffffff' : '#666666',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  minWidth: 20,
                  textAlign: 'center',
                  lineHeight: 1,
                }}
              >
                {undecidedCount}
              </Box>
            </Stack>
          </Button>

          <Button
            onClick={() => setSelectedFilter('approved')}
            sx={{
              px: 2,
              py: 1,
              minHeight: '38px',
              height: '38px',
              minWidth: 'fit-content',
              color: selectedFilter === 'approved' ? '#ffffff' : '#666666',
              bgcolor: selectedFilter === 'approved' ? '#1340ff' : 'transparent',
              fontSize: '0.95rem',
              fontWeight: 600,
              borderRadius: 0.75,
              textTransform: 'none',
              position: 'relative',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '1px',
                left: '1px',
                right: '1px',
                bottom: '1px',
                borderRadius: 0.75,
                backgroundColor: 'transparent',
                transition: 'background-color 0.2s ease',
                zIndex: -1,
              },
              '&:hover::before': {
                backgroundColor: selectedFilter === 'approved' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(19, 64, 255, 0.08)',
              },
              '&:hover': {
                bgcolor: selectedFilter === 'approved' ? '#1340ff' : 'transparent',
                color: selectedFilter === 'approved' ? '#ffffff' : '#1340ff',
                transform: 'scale(0.98)',
              },
              '&:focus': {
                outline: 'none',
              },
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <span>Approved</span>
              <Box
                sx={{
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 0.5,
                  bgcolor: selectedFilter === 'approved' ? 'rgba(255, 255, 255, 0.25)' : '#f5f5f5',
                  color: selectedFilter === 'approved' ? '#ffffff' : '#666666',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  minWidth: 20,
                  textAlign: 'center',
                  lineHeight: 1,
                }}
              >
                {approvedCount}
              </Box>
            </Stack>
          </Button>
        </Stack>

        {/* Search and Sort Controls */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{
            flex: { xs: 'none', md: '1 1 auto' },
            justifyContent: { xs: 'stretch', md: 'flex-end' },
            alignItems: { xs: 'stretch', sm: 'center' },
          }}
        >
          {/* Search Box */}
          <TextField
            placeholder="Search by Creator Name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify 
                    icon="eva:search-fill" 
                    sx={{
                      width: 18,
                      height: 18,
                      color: 'text.disabled',
                      transition: 'color 0.2s ease',
                    }}
                  />
                </InputAdornment>
              ),
            }}
            sx={{
              width: { xs: '100%', sm: '240px', md: '280px' },
              '& .MuiOutlinedInput-root': {
                height: '38px',
                border: '1px solid #e7e7e7',
                borderRadius: 0.75,
                bgcolor: 'background.paper',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  borderColor: '#1340ff',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 2px 8px rgba(19, 64, 255, 0.1)',
                },
                '&.Mui-focused': {
                  borderColor: '#1340ff',
                  boxShadow: '0 0 0 3px rgba(19, 64, 255, 0.1)',
                  transform: 'translateY(-1px)',
                },
                '& fieldset': {
                  border: 'none',
                },
              },
              '& .MuiInputBase-input': {
                py: 1,
                px: 1,
                fontSize: '0.95rem',
                '&::placeholder': {
                  color: '#999999',
                  opacity: 1,
                  transition: 'color 0.2s ease',
                },
                '&:focus::placeholder': {
                  color: '#cccccc',
                },
              },
            }}
          />

          {/* Sort Button */}
          <Button
            onClick={handleToggleSort}
            endIcon={
              <Stack direction="row" alignItems="center" spacing={0.5}>
                {sortDirection === 'asc' ? (
                  <Stack direction="column" alignItems="center" spacing={0}>
                    <Typography variant="caption" sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 700 }}>
                      A
                    </Typography>
                    <Typography variant="caption" sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 400 }}>
                      Z
                    </Typography>
                  </Stack>
                ) : (
                  <Stack direction="column" alignItems="center" spacing={0}>
                    <Typography variant="caption" sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 400 }}>
                      Z
                    </Typography>
                    <Typography variant="caption" sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 700 }}>
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
              px: 2,
              py: 1,
              height: '38px',
              minWidth: { xs: '100%', sm: '140px' },
              color: '#666666',
              fontWeight: 600,
              fontSize: '0.95rem',
              backgroundColor: 'transparent',
              border: '1px solid #e7e7e7',
              borderRadius: 0.75,
              textTransform: 'none',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(19, 64, 255, 0.04)',
                borderColor: '#1340ff',
                color: '#1340ff',
              },
              '&:focus': {
                outline: 'none',
              },
            }}
          >
            Alphabetical
          </Button>
        </Stack>
      </Box>

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
                    Creator&apos;s Email
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
                    Pitch Format
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
                {filteredPitches?.map((pitch) => (
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
                    <TableCell>{pitch.user?.email}</TableCell>
                    <TableCell>
                      <Stack spacing={0.5} alignItems="start">
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '0.875rem',
                          }}
                        >
                          {new Date(pitch.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
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
                          {new Date(pitch.createdAt).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>
                      {pitch.type === 'text' ? 'Letter' : pitch.type}
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
                          ...(pitch.status === 'pending' && {
                            color: '#FF9A02',
                            borderColor: '#FF9A02',
                          }),
                          ...(pitch.status === 'undecided' && {
                            color: '#FF9A02',
                            borderColor: '#FF9A02',
                          }),
                          ...(pitch.status === 'approved' && {
                            color: '#1ABF66',
                            borderColor: '#1ABF66',
                          }),
                          ...(pitch.status === 'rejected' && {
                            color: '#ff4842',
                            borderColor: '#ff4842',
                          }),
                        }}
                      >
                        {pitch.status === 'undecided' ? 'PENDING REVIEW' : pitch.status?.toUpperCase() || 'PENDING'}
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
                        View Pitch
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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
    <EmptyContent title="No Pitches" filled />
  );
};

export default CampaignDetailPitch;

CampaignDetailPitch.propTypes = {
  pitches: PropTypes.array,
  timelines: PropTypes.array,
  campaign: PropTypes.object,
  onUpdate: PropTypes.func,
};
