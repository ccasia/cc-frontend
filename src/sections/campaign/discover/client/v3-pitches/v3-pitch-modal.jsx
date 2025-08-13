/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable no-nested-ternary */
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import React, { useState, useEffect } from 'react';

import CircularProgress from '@mui/material/CircularProgress';
import {
  Box,
  Chip,
  Grid,
  Stack,
  Dialog,
  Avatar,
  Button,
  Divider,
  Tooltip,
  TextField,
  IconButton,
  Typography,
  DialogContent,
  DialogActions,
} from '@mui/material';

import axiosInstance from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';

import UGCCreditsModal from './ugc-credits-modal';

const V3PitchModal = ({ open, onClose, pitch, campaign, onUpdate }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthContext();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPitch, setCurrentPitch] = useState(pitch);
  const [ugcCreditsModalOpen, setUgCCreditsModalOpen] = useState(false);

  const displayStatus = pitch?.displayStatus || pitch?.status;
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isClient = user?.role === 'client';

  useEffect(() => {
    setCurrentPitch(pitch);
  }, [pitch]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return '#FFC702';
      case 'SENT_TO_CLIENT':
        return '#8B5CF6'; // Purple color for SENT_TO_CLIENT
      case 'APPROVED':
        return '#1ABF66';
      case 'REJECTED':
        return '#D4321C';
      case 'AGREEMENT_PENDING':
        return '#203FF5';
      case 'AGREEMENT_SUBMITTED':
        return '#1ABF66';
      default:
        return '#8E8E93';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return 'Pending Review';
      case 'SENT_TO_CLIENT':
        return 'Sent to Client';
      case 'APPROVED':
        return 'Approved';
      case 'REJECTED':
        return 'Rejected';
      case 'AGREEMENT_PENDING':
        return 'Agreement Pending';
      case 'AGREEMENT_SUBMITTED':
        return 'Agreement Submitted';
      default:
        return status;
    }
  };

  const handleAction = async (action, endpoint, data = {}) => {
    setLoading(true);
    try {
      const response = await axiosInstance.patch(`/api/pitch/v3/${pitch.id}/${endpoint}`, data);
      enqueueSnackbar(response.data.message || 'Action completed successfully', {
        variant: 'success',
      });
      onUpdate({ ...pitch, ...response.data.pitch });
      onClose();
    } catch (error) {
      console.error('Error performing action:', error);
      enqueueSnackbar(error.response?.data?.message || 'Error performing action', {
        variant: 'error',
      });
    } finally {
      setLoading(false);
      setRejectDialogOpen(false);
      setRejectionReason('');
    }
  };

  const handleApprove = () => {
    if (isAdmin && displayStatus === 'PENDING_REVIEW') {
      // For admin, open UGC credits modal instead of direct approval
      setUgCCreditsModalOpen(true);
    } else if (isClient && displayStatus === 'PENDING_REVIEW') {
      handleAction('approve', 'approve/client');
    }
  };

  const handleReject = () => {
    if (isAdmin && displayStatus === 'PENDING_REVIEW') {
      handleAction('reject', 'reject', { rejectionReason });
    } else if (isClient && displayStatus === 'PENDING_REVIEW') {
      handleAction('reject', 'reject/client', { rejectionReason });
    }
  };

  const handleSetAgreement = () => {
    enqueueSnackbar('Agreement setup feature coming soon', { variant: 'info' });
  };

  const handleUGCCreditsSuccess = (updatedPitch) => {
    onUpdate(updatedPitch);
    setUgCCreditsModalOpen(false);
  };

  const getAvailableActions = () => {
    const actions = [];

    if (isAdmin) {
      if (displayStatus === 'PENDING_REVIEW') {
        actions.push(
          {
            label: 'Approve & Send to Client',
            action: 'approve',
            icon: 'eva:checkmark-circle-2-fill',
            color: 'success',
          },
          { label: 'Reject', action: 'reject', icon: 'eva:close-circle-fill', color: 'error' }
        );
      } else if (displayStatus === 'APPROVED') {
        actions.push({
          label: 'Set Agreement',
          action: 'agreement',
          icon: 'eva:file-text-fill',
          color: 'primary',
        });
      }
    } else if (isClient) {
      if (displayStatus === 'PENDING_REVIEW') {
        actions.push(
          {
            label: 'Approve',
            action: 'approve',
            icon: 'eva:checkmark-circle-2-fill',
            color: 'success',
          },
          { label: 'Reject', action: 'reject', icon: 'eva:close-circle-fill', color: 'error' }
        );
      }
    }

    return actions;
  };

  const availableActions = getAvailableActions();

  if (!pitch) return null;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: 'background.paper',
            boxShadow: (theme) => theme.customShadows.dialog,
          },
        }}
      >
        {/* Close Button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 18,
            top: 16,
            zIndex: 9,
            padding: 1,
            color: '#636366',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <Iconify icon="eva:close-fill" width={32} height={32} />
        </IconButton>

        {/* Fixed User Info Section */}
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            bgcolor: 'background.paper',
            zIndex: 8,
            pt: 7,
            px: 4,
          }}
        >
          <Stack spacing={3}>
            {/* Creator Info and Social Media - Horizontal Layout */}
            <Box sx={{ position: 'relative' }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={2}
                sx={{ pr: { xs: 0, sm: 8 } }}
              >
                {/* Creator Info */}
                <Avatar
                  src={currentPitch?.user?.photoURL}
                  sx={{
                    width: 64,
                    height: 64,
                    border: '2px solid',
                    borderColor: 'background.paper',
                    boxShadow: (theme) => theme.customShadows.z8,
                  }}
                />
                <Stack spacing={0.5}>
                  <Typography
                    sx={{ fontSize: '16px', fontWeight: 700, lineHeight: '18px', color: '#231F20' }}
                  >
                    {currentPitch?.user?.name}
                  </Typography>
                  <Typography
                    sx={{ fontSize: '14px', fontWeight: 400, lineHeight: '16px', color: '#8E8E93' }}
                  >
                    {currentPitch?.user?.email}
                  </Typography>

                  {/* Social Media Icons - Mobile */}
                  <Box sx={{ display: { xs: 'block', sm: 'none' }, mt: 1 }}>
                    <Stack direction="row" spacing={1.5}>
                      {currentPitch?.user?.creator?.instagram && (
                        <Tooltip title="Instagram Profile">
                          <IconButton
                            href={`https://instagram.com/${currentPitch.user.creator.instagram}`}
                            target="_blank"
                            size="small"
                            sx={{
                              p: 0.8,
                              color: '#231F20',
                              bgcolor: '#FFF',
                              border: '1px solid #ebebeb',
                              borderBottom: '3px solid #ebebeb',
                              borderRadius: '10px',
                              height: '42px',
                              width: '42px',
                              '&:hover': {
                                bgcolor: '#f5f5f5',
                              },
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Iconify icon="mdi:instagram" width={24} />
                          </IconButton>
                        </Tooltip>
                      )}
                      {currentPitch?.user?.creator?.tiktok && (
                        <Tooltip title="TikTok Profile">
                          <IconButton
                            href={`https://tiktok.com/@${currentPitch.user.creator.tiktok}`}
                            target="_blank"
                            size="small"
                            sx={{
                              p: 0.8,
                              color: '#000000',
                              bgcolor: '#FFF',
                              border: '1px solid #ebebeb',
                              borderBottom: '3px solid #ebebeb',
                              borderRadius: '10px',
                              height: '42px',
                              width: '42px',
                              '&:hover': {
                                bgcolor: '#f5f5f5',
                              },
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Iconify icon="ic:baseline-tiktok" width={24} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </Box>
                </Stack>
              </Stack>

              {/* Social Media Icons - Desktop */}
              <Box
                sx={{
                  display: { xs: 'none', sm: 'block' },
                  position: 'absolute',
                  right: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 9,
                }}
              >
                <Stack direction="row" spacing={1}>
                  {currentPitch?.user?.creator?.instagram && (
                    <Tooltip title="Instagram Profile">
                      <IconButton
                        href={`https://instagram.com/${currentPitch.user.creator.instagram}`}
                        target="_blank"
                        size="small"
                        sx={{
                          p: 0.8,
                          color: '#231F20',
                          bgcolor: '#FFF',
                          border: '1px solid #ebebeb',
                          borderBottom: '3px solid #ebebeb',
                          borderRadius: '10px',
                          height: '48px',
                          width: '48px',
                          '&:hover': {
                            bgcolor: '#f5f5f5',
                          },
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Iconify icon="mdi:instagram" width={28} />
                      </IconButton>
                    </Tooltip>
                  )}
                  {currentPitch?.user?.creator?.tiktok && (
                    <Tooltip title="TikTok Profile">
                      <IconButton
                        href={`https://tiktok.com/@${currentPitch.user.creator.tiktok}`}
                        target="_blank"
                        size="small"
                        sx={{
                          p: 0.8,
                          color: '#000000',
                          bgcolor: '#FFF',
                          border: '1px solid #ebebeb',
                          borderBottom: '3px solid #ebebeb',
                          borderRadius: '10px',
                          height: '48px',
                          width: '48px',
                          '&:hover': {
                            bgcolor: '#f5f5f5',
                          },
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Iconify icon="ic:baseline-tiktok" width={28} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              </Box>
            </Box>

            {/* Languages and Interests Grid */}
            <Grid container spacing={2} sx={{ pb: 2 }}>
              {/* Languages Section */}
              {currentPitch?.user?.creator?.languages?.length > 0 && (
                <Grid item xs={12} md={0.1}>
                  <Box>
                    <Typography variant="subtitle2" color="#8E8E93" sx={{ mb: 1 }}>
                      Languages
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: -1.5 }}>
                      {currentPitch.user.creator.languages.map((language, index) => (
                        <Chip
                          key={index}
                          label={language.toUpperCase()}
                          size="medium"
                          sx={{
                            bgcolor: '#FFF',
                            border: '1px solid #EBEBEB',
                            borderRadius: 1,
                            color: '#8E8E93',
                            height: '34px',
                            boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                            cursor: 'default',
                            '& .MuiChip-label': {
                              fontWeight: 600,
                              px: 1.5,
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginTop: '-3px',
                              fontSize: '0.8rem',
                            },
                            '&:hover': {
                              bgcolor: '#FFF',
                            },
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                </Grid>
              )}

              {/* Stats Section  */}
              <Grid item xs={12} md={11.9}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    minWidth: 0,
                    ml: 'auto',
                    width: '100%',
                    mb: -1.5,
                    pr: 0,
                  }}
                >
                  <Stack direction="row" spacing={0} width="100%" justifyContent="flex-end">
                    {/* First stat */}
                    <Box
                      sx={{
                        flex: 0,
                        display: 'flex',
                        justifyContent: 'flex-end',
                        minWidth: '80px',
                      }}
                    >
                      <Stack spacing={0.5} alignItems="flex-end" sx={{ minWidth: 0 }}>
                        <Box
                          component="img"
                          src="/assets/icons/overview/purpleGroup.svg"
                          sx={{ width: 20, height: 20 }}
                        />
                        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '14px' }}>
                          {currentPitch?.user?.followerCount?.toLocaleString() || 'N/A'}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="#8e8e93"
                          sx={{
                            whiteSpace: 'nowrap',
                            fontWeight: 500,
                            overflow: 'visible',
                            width: '100%',
                            fontSize: '12px',
                            textAlign: 'right',
                          }}
                        >
                          Followers
                        </Typography>
                      </Stack>
                    </Box>

                    {/* Divider */}
                    <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />

                    {/* Second stat */}
                    <Box
                      sx={{
                        flex: 0,
                        display: 'flex',
                        justifyContent: 'flex-end',
                        minWidth: '120px',
                      }}
                    >
                      <Stack spacing={0.5} alignItems="flex-end" sx={{ minWidth: 0 }}>
                        <Box
                          component="img"
                          src="/assets/icons/overview/greenChart.svg"
                          sx={{ width: 20, height: 20 }}
                        />
                        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '14px' }}>
                          {currentPitch?.user?.engagementRate
                            ? `${(currentPitch.user.engagementRate * 100).toFixed(2)}%`
                            : 'N/A'}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="#8e8e93"
                          sx={{
                            whiteSpace: 'nowrap',
                            fontWeight: 500,
                            overflow: 'visible',
                            width: '100%',
                            fontSize: '12px',
                            textAlign: 'right',
                          }}
                        >
                          Engagement Rate
                        </Typography>
                      </Stack>
                    </Box>

                    {/* Divider */}
                    <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />

                    {/* Third stat */}
                    <Box
                      sx={{
                        flex: 0,
                        display: 'flex',
                        justifyContent: 'flex-end',
                        minWidth: '105px',
                      }}
                    >
                      <Stack spacing={0.5} alignItems="flex-end" sx={{ minWidth: 0 }}>
                        <Box
                          component="img"
                          src="/assets/icons/overview/bubbleHeart.svg"
                          sx={{ width: 20, height: 20 }}
                        />
                        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '14px' }}>
                          N/A
                        </Typography>
                        <Typography
                          variant="caption"
                          color="#8e8e93"
                          sx={{
                            whiteSpace: 'nowrap',
                            fontWeight: 500,
                            overflow: 'visible',
                            width: '100%',
                            fontSize: '12px',
                            textAlign: 'right',
                          }}
                        >
                          Average Likes
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>
                </Box>
              </Grid>
            </Grid>

            <Divider />
          </Stack>
        </Box>

        {/* Scrollable Content */}
        <DialogContent
          sx={{
            p: 3,
            pt: 2,
            '&::-webkit-scrollbar': {
              width: 8,
            },
            '&::-webkit-scrollbar-thumb': {
              borderRadius: 4,
              bgcolor: 'rgba(0,0,0,0.2)',
            },
          }}
        >
          <Stack spacing={3}>
            {/* Pitch Info Box */}
            <Box
              sx={{
                borderRadius: 2,
                p: 2.5,
                mb: -2,
                mt: -2,
              }}
            >
              <Grid container spacing={2} alignItems="center">
                {/* Pitch Type Section */}
                <Grid item xs={12} md={6}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    {currentPitch?.type === 'video' ? (
                      <Box
                        component="img"
                        src="/assets/icons/components/ic_videopitch.svg"
                        sx={{ width: 64, height: 64 }}
                      />
                    ) : (
                      <Box
                        component="img"
                        src="/assets/icons/components/ic_letterpitch.svg"
                        sx={{ width: 64, height: 64 }}
                      />
                    )}
                    <Stack>
                      <Typography variant="h6">
                        {currentPitch?.type === 'video' ? 'Video Pitch' : 'Letter Pitch'}
                      </Typography>

                      {/* Match Percentage Chip */}
                      <Chip
                        icon={
                          <Box
                            sx={{ position: 'relative', display: 'inline-flex', mr: 2, ml: -0.5 }}
                          >
                            <CircularProgress
                              variant="determinate"
                              value={100}
                              size={20}
                              thickness={7}
                              sx={{ color: 'grey.300' }}
                            />

                            <CircularProgress
                              variant="determinate"
                              value={Math.min(currentPitch?.matchingPercentage || 100, 100)}
                              size={20}
                              thickness={7}
                              sx={{
                                color: '#5abc6f',
                                position: 'absolute',
                                left: 0,
                                strokeLinecap: 'round',
                              }}
                            />
                          </Box>
                        }
                        label={`${Math.min(currentPitch?.matchingPercentage || 100, 100)}% MATCH WITH CAMPAIGN`}
                        sx={{
                          backgroundColor: (theme) => theme.palette.common.white,
                          color: '#48484a',
                          fontWeight: 'bold',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          borderRadius: '10px',
                          height: { xs: '32px', sm: '35px' },
                          border: '1px solid #ebebeb',
                          borderBottom: '3px solid #ebebeb',
                          mt: 1,
                          maxWidth: { xs: '100%', sm: 'auto' },
                          '& .MuiChip-label': {
                            padding: { xs: '0 6px 0 8px', sm: '0 8px 0 12px' },
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          },
                          '&:hover': {
                            backgroundColor: (theme) => theme.palette.common.white,
                          },
                        }}
                      />
                    </Stack>
                  </Stack>
                </Grid>

                {/* Submission Info Section */}
                <Grid item xs={12} md={6}>
                  <Stack
                    direction={{ xs: 'row', sm: 'row' }}
                    spacing={3}
                    alignItems="center"
                    justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
                    sx={{ width: '100%' }}
                  >
                    <Stack alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                      <Typography variant="caption" color="text.secondary">
                        SUBMITTED ON
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {new Date(currentPitch?.createdAt).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Typography>
                    </Stack>
                    <Stack alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                      <Typography variant="caption" color="text.secondary">
                        STATUS
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: getStatusColor(displayStatus),
                        }}
                      >
                        {getStatusLabel(displayStatus)}
                      </Typography>
                    </Stack>
                  </Stack>
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Pitch Content Section */}
            <Box>
              <Box
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: '#ffffff',
                  border: '1px solid #203ff5',
                  '& p': {
                    margin: 0,
                    '& + p': {
                      mt: 0.5,
                    },
                  },
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    color: '#000000',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {currentPitch?.content || 'No content available'}
                </Typography>
              </Box>
            </Box>
          </Stack>
        </DialogContent>

        {/* Action Buttons */}
        <DialogActions sx={{ px: 3, pb: 3, gap: -1, mt: -3 }}>
          {availableActions.length > 0 ? (
            <>
              {availableActions.find((action) => action.action === 'reject') && (
                <Button
                  variant="contained"
                  onClick={() => setRejectDialogOpen(true)}
                  disabled={loading}
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
                  }}
                >
                  Reject
                </Button>
              )}
              {availableActions.find((action) => action.action === 'approve') && (
                <Button
                  variant="contained"
                  onClick={handleApprove}
                  disabled={loading}
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
                  }}
                >
                  {loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    availableActions.find((action) => action.action === 'approve')?.label ||
                    'Approve'
                  )}
                </Button>
              )}
              {availableActions.find((action) => action.action === 'agreement') && (
                <Button
                  variant="contained"
                  onClick={handleSetAgreement}
                  disabled={loading}
                  sx={{
                    textTransform: 'none',
                    minHeight: 42,
                    minWidth: 100,
                    bgcolor: '#FFFFFF',
                    color: '#203FF5',
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
                      borderColor: '#203FF5',
                      borderBottom: '3px solid',
                      borderBottomColor: '#203FF5',
                    },
                  }}
                >
                  Set Agreement
                </Button>
              )}
            </>
          ) : (
            <Button
              onClick={onClose}
              sx={{
                bgcolor: '#ffffff',
                color: '#636366',
                border: '1.5px solid',
                borderColor: '#e7e7e7',
                borderBottom: '3px solid',
                borderBottomColor: '#e7e7e7',
                borderRadius: 1.15,
                px: 2.5,
                py: 1.2,
                fontWeight: 600,
                '&:hover': {
                  bgcolor: '#e7e7e7',
                },
              }}
            >
              Close
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <Stack spacing={3} alignItems="center" sx={{ py: 4 }}>
            <Box
              sx={{
                width: 100,
                height: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                bgcolor: '#ff3b30',
                fontSize: '50px',
                mb: -2,
              }}
            >
              🥹
            </Box>
            <Stack spacing={1} alignItems="center">
              <Typography
                variant="h6"
                sx={{
                  fontFamily: 'Instrument Serif, serif',
                  fontSize: { xs: '1.5rem', sm: '2.5rem' },
                  fontWeight: 550,
                }}
              >
                Reject Pitch?
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#636366',
                  mt: -0.5,
                  mb: -3,
                }}
              >
                Are you sure you want to reject this pitch?
              </Typography>
            </Stack>
            <Box mt={2} width={1}>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                variant="outlined"
                label="Rejection Reason"
              />
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ pb: 3, px: 3 }}>
          <Button
            onClick={() => setRejectDialogOpen(false)}
            disabled={loading}
            sx={{
              bgcolor: '#ffffff',
              color: '#636366',
              border: '1.5px solid',
              borderColor: '#e7e7e7',
              borderBottom: '3px solid',
              borderBottomColor: '#e7e7e7',
              borderRadius: 1.15,
              px: 2.5,
              py: 1.2,
              flex: 1,
              mr: 1,
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#e7e7e7',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReject}
            disabled={loading || !rejectionReason.trim()}
            sx={{
              bgcolor: '#ffffff',
              color: '#ff3b30',
              border: '1.5px solid #e7e7e7',
              borderBottom: '3px solid',
              borderBottomColor: '#e7e7e7',
              borderRadius: 1.15,
              px: 2.5,
              py: 1.2,
              flex: 1,
              ml: 1,
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#e7e7e7',
              },
            }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Yes, reject!'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* UGC Credits Assignment Modal */}
      <UGCCreditsModal
        open={ugcCreditsModalOpen}
        onClose={() => setUgCCreditsModalOpen(false)}
        pitch={pitch}
        campaign={campaign}
        onSuccess={handleUGCCreditsSuccess}
      />
    </>
  );
};

export default V3PitchModal;

V3PitchModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  pitch: PropTypes.object,
  campaign: PropTypes.object,
  onUpdate: PropTypes.func,
};
