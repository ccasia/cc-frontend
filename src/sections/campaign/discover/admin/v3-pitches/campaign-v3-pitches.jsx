/* eslint-disable no-nested-ternary */
import dayjs from 'dayjs';
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
  IconButton,
  Tooltip,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';

import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content/empty-content';

import V3PitchModal from './v3-pitch-modal';
import V3PitchActions from './v3-pitch-actions';

const CampaignV3Pitches = ({ pitches, campaign, onUpdate }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedPitch, setSelectedPitch] = useState(null);
  const [openPitchModal, setOpenPitchModal] = useState(false);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
  const theme = useTheme();
  const smUp = useResponsive('up', 'sm');
  const mdUp = useResponsive('up', 'md');

  // Count pitches by display status
  const pendingReviewCount = pitches?.filter((pitch) => 
    (pitch.displayStatus || pitch.status) === 'PENDING_REVIEW'
  ).length || 0;
  
  const sentToClientCount = pitches?.filter((pitch) => 
    (pitch.displayStatus || pitch.status) === 'SENT_TO_CLIENT'
  ).length || 0;
  
  const approvedCount = pitches?.filter((pitch) => 
    (pitch.displayStatus || pitch.status) === 'APPROVED'
  ).length || 0;

  // Toggle sort direction
  const handleToggleSort = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  const filteredPitches = useMemo(() => {
    let filtered = pitches;

    // Apply status filter
    if (selectedFilter === 'PENDING_REVIEW') {
      filtered = filtered?.filter((pitch) => 
        (pitch.displayStatus || pitch.status) === 'PENDING_REVIEW'
      );
    } else if (selectedFilter === 'SENT_TO_CLIENT') {
      filtered = filtered?.filter((pitch) => 
        (pitch.displayStatus || pitch.status) === 'SENT_TO_CLIENT'
      );
    } else if (selectedFilter === 'APPROVED') {
      filtered = filtered?.filter((pitch) => 
        (pitch.displayStatus || pitch.status) === 'APPROVED'
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

    return statusMap[status] || {
      color: '#8E8E93',
      borderColor: '#8E8E93',
      tooltip: 'Unknown status',
    };
  };

  const getStatusText = (status) => {
    const statusTextMap = {
      PENDING_REVIEW: 'PENDING REVIEW',
      SENT_TO_CLIENT: 'SENT TO CLIENT',
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
                  bgcolor: selectedFilter === 'PENDING_REVIEW' ? 'rgba(32, 63, 245, 0.04)' : 'transparent',
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
                  bgcolor: selectedFilter === 'SENT_TO_CLIENT' ? 'rgba(32, 63, 245, 0.04)' : 'transparent',
                },
              }}
            >
              {`Sent to Client (${sentToClientCount})`}
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
                  bgcolor: selectedFilter === 'APPROVED' ? 'rgba(32, 63, 245, 0.04)' : 'transparent',
                },
              }}
            >
              {`Approved (${approvedCount})`}
            </Button>
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
                        <V3PitchActions 
                          pitch={pitch} 
                          onViewPitch={handleViewPitch}
                        />
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

export default CampaignV3Pitches;

CampaignV3Pitches.propTypes = {
  pitches: PropTypes.array,
  campaign: PropTypes.object,
  onUpdate: PropTypes.func,
}; 