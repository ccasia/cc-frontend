/* eslint-disable no-unsafe-optional-chaining */
import dayjs from 'dayjs';
/* eslint-disable no-nested-ternary */
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

import { alpha } from '@mui/material/styles';
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
  DialogTitle,
  Autocomplete,
  DialogContent,
  DialogActions,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import { useGetAllCreators } from 'src/api/creator';

import Iconify from 'src/components/iconify';

import UGCCreditsModal from './ugc-credits-modal';

const V3PitchModal = ({ open, onClose, pitch, campaign, onUpdate }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPitch, setCurrentPitch] = useState(pitch);
  const [ugcCreditsModalOpen, setUgCCreditsModalOpen] = useState(false);
  const [comments, setComments] = useState('');
  const [creatorProfileFull, setCreatorProfileFull] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState('instagram'); // 'instagram', 'tiktok', or 'both'

  const displayStatus = pitch?.displayStatus || pitch?.status;
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isClient = user?.role === 'client';
  // Compute remaining UGC credits from campaign overview
  const ugcLeft = (() => {
    if (!campaign?.campaignCredits) return 0;
    const used = (campaign?.shortlisted || []).reduce((acc, s) => acc + (s?.ugcVideos || 0), 0);
    return Math.max(0, campaign.campaignCredits - used);
  })();
  // Normalize admin comments text so UI displays whenever present
  const adminCommentsText = ((currentPitch?.adminComments ?? pitch?.adminComments ?? '') || '')
    .toString()
    .trim();

  useEffect(() => {
    setCurrentPitch(pitch);
  }, [pitch]);

  // Set default platform when modal opens
  useEffect(() => {
    if (open && currentPitch?.user?.creator) {
      if (currentPitch.user.creator.instagram && currentPitch.user.creator.tiktok) {
        setSelectedPlatform('both'); // Show both if both platforms exist
      } else if (currentPitch.user.creator.instagram) {
        setSelectedPlatform('instagram');
      } else if (currentPitch.user.creator.tiktok) {
        setSelectedPlatform('tiktok');
      }
    }
  }, [open, currentPitch?.user?.creator]);

  // Fetch full creator profile to hydrate Languages/Age/Pronouns when modal opens
  useEffect(() => {
    const userId = currentPitch?.user?.id;
    if (open && userId) {
      axiosInstance
        .get(endpoints.creators.getCreatorFullInfo(userId))
        .then((res) => {
          // API may return { user } or the user directly
          const payload = res?.data?.user || res?.data || null;
          if (payload) setCreatorProfileFull(payload);
        })
        .catch(() => {
          // non-blocking; keep UI as-is on error
        });
    }
  }, [open, currentPitch?.user?.id]);

  // Derive creator profile data from multiple possible sources
  const creatorProfile = creatorProfileFull?.creator || currentPitch?.user?.creator || {};
  const accountUser = creatorProfileFull || currentPitch?.user || {};
  const derivedLanguages = (
    Array.isArray(creatorProfile.languages) && creatorProfile.languages.length
      ? creatorProfile.languages
      : Array.isArray(accountUser.languages)
        ? accountUser.languages
        : []
  ).filter(Boolean);
  const derivedBirthDate = creatorProfile.birthDate || accountUser.birthDate || null;
  const derivedPronouns =
    creatorProfile.pronounce || accountUser.pronounce || accountUser.pronouns || null;

  // Check if creator is a guest
  const isGuestCreator = React.useMemo(() => {
    const email = currentPitch?.user?.email;
    const isGuestByEmail = email?.includes('@tempmail.com') || email?.startsWith('guest_');
    const isGuestByFlag = currentPitch?.user?.creator?.isGuest === true;
    return isGuestByEmail || isGuestByFlag;
  }, [currentPitch]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return '#FFC702';
      case 'SENT_TO_CLIENT':
        return '#8B5CF6'; // Purple color for SENT_TO_CLIENT
      case 'SENT_TO_CLIENT_WITH_COMMENTS':
        return '#8B5CF6';
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
      case 'SENT_TO_CLIENT_WITH_COMMENTS':
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

      // Check if the response contains updated pitch data
      if (response.data.pitch) {
        onUpdate({ ...pitch, ...response.data.pitch });
      } else {
        // If no pitch data returned, create a mock update with the expected status change
        const mockUpdatedPitch = {
          ...pitch,
          status:
            action === 'reject'
              ? 'REJECTED'
              : action === 'approve'
                ? 'SENT_TO_CLIENT'
                : pitch.status,
        };
        onUpdate(mockUpdatedPitch);
      }

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
    if (isAdmin && (displayStatus === 'PENDING_REVIEW' || displayStatus === 'MAYBE')) {
      if (ugcLeft <= 0) {
        enqueueSnackbar('No credits left. Cannot approve or assign UGC credits.', {
          variant: 'warning',
        });
        return;
      }
      // For admin, open UGC credits modal instead of direct approval
      setUgCCreditsModalOpen(true);
    } else if (isClient && displayStatus === 'PENDING_REVIEW') {
      handleAction('approve', 'approve/client', { adminComments: comments });
    }
  };

  const handleReject = () => {
    if (isAdmin && (displayStatus === 'PENDING_REVIEW' || displayStatus === 'MAYBE')) {
      // For admin rejecting from MAYBE status, include the current status for context
      const actionData = {
        rejectionReason,
        previousStatus: displayStatus === 'MAYBE' ? 'MAYBE' : 'PENDING_REVIEW',
      };
      handleAction('reject', 'reject', actionData);
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
      if (displayStatus === 'PENDING_REVIEW' || displayStatus === 'MAYBE') {
        actions.push(
          {
            label: 'Approve',
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

  // Guest creator modal
  if (isGuestCreator) {
    return (
      <ViewGuestCreatorModal
        open={open}
        onClose={onClose}
        pitch={currentPitch}
        isAdmin={isAdmin}
        campaign={campaign}
        onSwapped={onUpdate}
      />
    );
  }

  // Regular creator modal
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
            top: 10,
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

        {/* Social links under close button (desktop) */}
        <Box
          sx={{
            display: { xs: 'none', sm: 'flex' },
            position: 'absolute',
            right: 14,
            top: 65,
            zIndex: 9,
            flexDirection: 'row',
            gap: 1,
          }}
        >
          <Tooltip title="Instagram Stats">
            <IconButton
              onClick={() => setSelectedPlatform('instagram')}
              size="small"
              disabled={selectedPlatform === 'instagram'}
              sx={{
                p: 0.8,
                color: selectedPlatform === 'instagram' ? '#8E8E93' : '#231F20',
                bgcolor: selectedPlatform === 'instagram' ? '#F2F2F7' : '#FFF',
                border: '1px solid #ebebeb',
                borderBottom: '3px solid #ebebeb',
                borderRadius: '10px',
                height: '42px',
                width: '42px',
                '&:hover': {
                  bgcolor: selectedPlatform === 'instagram' ? '#F2F2F7' : '#f5f5f5',
                },
                '&.Mui-disabled': {
                  bgcolor: '#F2F2F7',
                  color: '#8E8E93',
                },
              }}
            >
              <Iconify icon="mdi:instagram" width={22} />
            </IconButton>
          </Tooltip>
          <Tooltip title="TikTok Stats">
            <IconButton
              onClick={() => setSelectedPlatform('tiktok')}
              size="small"
              disabled={selectedPlatform === 'tiktok'}
              sx={{
                p: 0.8,
                color: selectedPlatform === 'tiktok' ? '#8E8E93' : '#231F20',
                bgcolor: selectedPlatform === 'tiktok' ? '#F2F2F7' : '#FFF',
                border: '1px solid #ebebeb',
                borderBottom: '3px solid #ebebeb',
                borderRadius: '10px',
                height: '42px',
                width: '42px',
                '&:hover': {
                  bgcolor: selectedPlatform === 'tiktok' ? '#F2F2F7' : '#f5f5f5',
                },
                '&.Mui-disabled': {
                  bgcolor: '#F2F2F7',
                  color: '#8E8E93',
                },
              }}
            >
              <Iconify icon="ic:baseline-tiktok" width={22} />
            </IconButton>
          </Tooltip>
        </Box>

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
                    sx={{
                      fontSize: '16px',
                      fontWeight: 700,
                      lineHeight: '18px',
                      color: '#231F20',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                    onClick={() => {
                      const creatorId = currentPitch?.user?.creator?.id || currentPitch?.user?.id;
                      navigate(`/dashboard/mediakit/client/${creatorId}`, {
                        state: {
                          returnTo: {
                            pathname: window.location.pathname,
                            search: window.location.search,
                          },
                          reopenModal: { pitchId: currentPitch?.id, isV3: true },
                        },
                      });
                    }}
                  >
                    {currentPitch?.user?.name}
                  </Typography>
                  {(() => {
                    const email = currentPitch?.user?.email;
                    const isGuest = email?.includes('@tempmail.com') || email?.startsWith('guest_');
                    return email && !isGuest ? (
                      <Typography
                        sx={{
                          fontSize: '14px',
                          fontWeight: 400,
                          lineHeight: '16px',
                          color: '#8E8E93',
                        }}
                      >
                        {email}
                      </Typography>
                    ) : null;
                  })()}

                  {/* Social Media Icons - Mobile */}
                  <Box sx={{ display: { xs: 'block', sm: 'none' }, mt: 1 }}>
                    <Stack direction="row" spacing={1.5}>
                      {currentPitch?.user?.creator?.instagram && (
                        <Tooltip title="Instagram Stats">
                          <Box
                            sx={{
                              p: 0.8,
                              color: '#231F20',
                              bgcolor: '#FFF',
                              border: '1px solid #ebebeb',
                              borderBottom: '3px solid #ebebeb',
                              borderRadius: '10px',
                              height: '42px',
                              width: '42px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'default',
                            }}
                          >
                            <Iconify icon="mdi:instagram" width={24} />
                          </Box>
                        </Tooltip>
                      )}
                      {currentPitch?.user?.creator?.tiktok && (
                        <Tooltip title="TikTok Stats">
                          <Box
                            sx={{
                              p: 0.8,
                              color: '#000000',
                              bgcolor: '#FFF',
                              border: '1px solid #ebebeb',
                              borderBottom: '3px solid #ebebeb',
                              borderRadius: '10px',
                              height: '42px',
                              width: '42px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'default',
                            }}
                          >
                            <Iconify icon="ic:baseline-tiktok" width={24} />
                          </Box>
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
                    <Tooltip title="Instagram Stats">
                      <Box
                        sx={{
                          p: 0.8,
                          color: '#231F20',
                          bgcolor: '#FFF',
                          border: '1px solid #ebebeb',
                          borderBottom: '3px solid #ebebeb',
                          borderRadius: '10px',
                          height: '48px',
                          width: '48px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'default',
                        }}
                      >
                        <Iconify icon="mdi:instagram" width={28} />
                      </Box>
                    </Tooltip>
                  )}
                  {currentPitch?.user?.creator?.tiktok && (
                    <Tooltip title="TikTok Stats">
                      <Box
                        sx={{
                          p: 0.8,
                          color: '#000000',
                          bgcolor: '#FFF',
                          border: '1px solid #ebebeb',
                          borderBottom: '3px solid #ebebeb',
                          borderRadius: '10px',
                          height: '48px',
                          width: '48px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'default',
                        }}
                      >
                        <Iconify icon="ic:baseline-tiktok" width={28} />
                      </Box>
                    </Tooltip>
                  )}
                </Stack>
              </Box>
            </Box>

            {/* Right Info: Stats */}
            <Grid container spacing={2} sx={{ pb: 2 }}>
              <Grid item xs={12} md={12}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    minWidth: 0,
                    width: '100%',
                    mb: -1.5,
                    pr: 0,
                  }}
                >
                  {/* Left side: Languages, Age, Pronouns (always render labels) */}
                  <Stack direction="row" spacing={3} alignItems="center">
                    {/* Languages */}
                    {derivedLanguages.length > 0 && (
                      <Box>
                        <Stack spacing={0.5} alignItems="flex-start">
                          <Typography
                            variant="caption"
                            color="#8e8e93"
                            sx={{ fontWeight: 700, fontSize: '12px' }}
                          >
                            Languages
                          </Typography>
                          <Stack
                            direction="row"
                            flexWrap="nowrap"
                            gap={0.5}
                            alignItems="center"
                            sx={{ mt: 1.8 }}
                          >
                            {derivedLanguages.slice(0, 2).map((language, index) => (
                              <Chip
                                key={index}
                                label={
                                  typeof language === 'string'
                                    ? language.toUpperCase()
                                    : String(language).toUpperCase()
                                }
                                size="small"
                                sx={{
                                  bgcolor: '#FFF',
                                  border: '1px solid #EBEBEB',
                                  borderRadius: 0.5,
                                  color: '#8E8E93',
                                  height: '30px',
                                  boxShadow: '0px -2px 0px 0px #E7E7E7 inset',
                                  cursor: 'default',
                                  '& .MuiChip-label': {
                                    fontWeight: 600,
                                    px: 1.25,
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginTop: '-2px',
                                    fontSize: '0.8rem',
                                  },
                                  '&:hover': { bgcolor: '#FFF' },
                                }}
                              />
                            ))}
                            {derivedLanguages.length > 2 && (
                              <Typography
                                variant="caption"
                                color="#8E8E93"
                                sx={{ fontSize: '0.7rem', alignSelf: 'center' }}
                              >
                                +{derivedLanguages.length - 2}
                              </Typography>
                            )}
                          </Stack>
                        </Stack>
                      </Box>
                    )}

                    {/* Age */}
                    {derivedBirthDate && (
                      <Box>
                        <Stack spacing={0.5} alignItems="flex-start">
                          <Typography
                            variant="caption"
                            color="#8e8e93"
                            sx={{
                              fontWeight: 700,
                              fontSize: '12px',
                              position: 'relative',
                              top: 25,
                            }}
                          >
                            Age
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 400, fontSize: '14px', mt: 2.8 }}
                          >
                            {dayjs().diff(dayjs(derivedBirthDate), 'year')}
                          </Typography>
                        </Stack>
                      </Box>
                    )}

                    {/* Pronouns */}
                    {derivedPronouns && (
                      <Box>
                        <Stack spacing={0.5} alignItems="flex-start">
                          <Typography
                            variant="caption"
                            color="#8e8e93"
                            sx={{
                              fontWeight: 700,
                              fontSize: '12px',
                              position: 'relative',
                              top: 25,
                            }}
                          >
                            Pronouns
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 400, fontSize: '14px', mt: 2.8 }}
                          >
                            {derivedPronouns}
                          </Typography>
                        </Stack>
                      </Box>
                    )}
                  </Stack>

                  <Stack direction="row" spacing={0} width="100%" justifyContent="flex-end">
                    {/* Instagram Stats */}
                    {selectedPlatform === 'instagram' && (
                      <>
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
                              {(() => {
                                // Try multiple possible sources for media kit data
                                const followers =
                                  currentPitch?.user?.creator?.instagramUser?.followers_count ||
                                  creatorProfileFull?.creator?.instagramUser?.followers_count ||
                                  creatorProfileFull?.instagramUser?.followers_count;
                                if (!followers) return 'N/A';
                                if (followers >= 1000) {
                                  const k = followers / 1000;
                                  return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
                                }
                                return followers.toLocaleString();
                              })()}
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
                              {(() => {
                                // Try multiple possible sources for media kit data
                                const engagementRate =
                                  currentPitch?.user?.creator?.instagramUser?.engagement_rate ||
                                  creatorProfileFull?.creator?.instagramUser?.engagement_rate ||
                                  creatorProfileFull?.instagramUser?.engagement_rate;
                                if (!engagementRate) return 'N/A';
                                return `${Math.round(engagementRate)}%`;
                              })()}
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
                              {(() => {
                                // Try multiple possible sources for media kit data
                                const likes =
                                  currentPitch?.user?.creator?.instagramUser?.averageLikes ||
                                  creatorProfileFull?.creator?.instagramUser?.averageLikes ||
                                  creatorProfileFull?.instagramUser?.averageLikes;
                                if (!likes) return 'N/A';
                                if (likes >= 1000) {
                                  const k = likes / 1000;
                                  return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
                                }
                                return Math.round(likes).toLocaleString();
                              })()}
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
                      </>
                    )}

                    {/* TikTok Stats */}
                    {selectedPlatform === 'tiktok' && (
                      <>
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
                              {(() => {
                                // Try multiple possible sources for media kit data
                                const followers =
                                  currentPitch?.user?.creator?.tiktokUser?.follower_count ||
                                  creatorProfileFull?.creator?.tiktokUser?.follower_count ||
                                  creatorProfileFull?.tiktokUser?.follower_count;
                                if (!followers) return 'N/A';
                                if (followers >= 1000) {
                                  const k = followers / 1000;
                                  return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
                                }
                                return followers.toLocaleString();
                              })()}
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
                              {(() => {
                                // Try multiple possible sources for media kit data
                                const engagementRate =
                                  currentPitch?.user?.creator?.tiktokUser?.engagement_rate ||
                                  creatorProfileFull?.creator?.tiktokUser?.engagement_rate ||
                                  creatorProfileFull?.tiktokUser?.engagement_rate;
                                if (!engagementRate) return 'N/A';
                                return `${Math.round(engagementRate)}%`;
                              })()}
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
                              {(() => {
                                // Try multiple possible sources for media kit data
                                const likes =
                                  currentPitch?.user?.creator?.tiktokUser?.averageLikes ||
                                  creatorProfileFull?.creator?.tiktokUser?.averageLikes ||
                                  creatorProfileFull?.tiktokUser?.averageLikes;
                                if (!likes) return 'N/A';
                                if (likes >= 1000) {
                                  const k = likes / 1000;
                                  return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
                                }
                                return Math.round(likes).toLocaleString();
                              })()}
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
                      </>
                    )}
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
                            sx={{
                              position: 'relative',
                              display: 'inline-flex',
                              mr: 2,
                              ml: -0.5,
                            }}
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
                    <Stack
                      alignItems={{ xs: 'flex-start', md: 'flex-start' }}
                      sx={{ mr: { md: 8 } }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        SUBMITTED ON
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, textAlign: 'left', width: '100%' }}
                      >
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
                  {(currentPitch?.customRejectionText ||
                    currentPitch?.rejectionReason ||
                    (currentPitch?.status || '').toUpperCase() === 'MAYBE' ||
                    (currentPitch?.displayStatus || '').toUpperCase() === 'MAYBE') && (
                    <Box sx={{ mt: 1.5, width: { xs: '100%', md: 220 }, ml: { md: 'auto' } }}>
                      <Stack spacing={0.25} alignItems="flex-start">
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#FFC702',
                            fontWeight: 700,
                            letterSpacing: 0.5,
                            textAlign: 'left',
                          }}
                        >
                          CLIENT REASON
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#000',
                            fontWeight: 400,
                            fontFamily: 'Inter Display, Inter, sans-serif',
                            lineHeight: 1.35,
                            textAlign: 'left',
                            wordBreak: 'break-word',
                            fontSize: { xs: '0.75rem', md: '0.75rem' },
                          }}
                        >
                          {currentPitch?.customRejectionText ||
                            currentPitch?.rejectionReason ||
                            '—'}
                        </Typography>
                      </Stack>
                    </Box>
                  )}
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
                  {currentPitch?.content?.replace(/<[^>]*>/g, '') || 'No content available'}
                </Typography>
              </Box>
            </Box>

            {/* Display CS Comments if they exist */}
            {adminCommentsText.length > 0 && (
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}
                >
                  CS Comments
                </Typography>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor: '#ffffff',
                    border: '1px solid #e7e7e7',
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
                    {adminCommentsText}
                  </Typography>
                </Box>
              </Box>
            )}

            {user?.role !== 'client' && displayStatus === 'PENDING_REVIEW' && (
              <Box mb={2}>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}
                >
                  CS Comments (Optional)
                </Typography>

                <TextField
                  multiline
                  minRows={1}
                  fullWidth
                  size="small"
                  placeholder="Input comments about the creator that your clients might find helpful"
                  onChange={(e) => setComments(e.target.value)}
                />
              </Box>
            )}
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
                  disabled={
                    loading ||
                    (isAdmin &&
                      (displayStatus === 'PENDING_REVIEW' || displayStatus === 'MAYBE') &&
                      ugcLeft <= 0)
                  }
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
        comments={comments}
        onSuccess={handleUGCCreditsSuccess}
      />
    </>
  );
};

// Modal for Guest Creator
export function ViewGuestCreatorModal({ open, onClose, pitch, isAdmin, campaign, onSwapped }) {
  const { enqueueSnackbar } = useSnackbar();
  const { data: allCreators, isLoading: creatorsLoading } = useGetAllCreators();

  const [selectedPlatformCreator, setSelectedPlatformCreator] = React.useState(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [showCreatorSelection, setShowCreatorSelection] = React.useState(false);

  // Form state for editable fields
  const [formValues, setFormValues] = React.useState({
    name: pitch?.user?.name || '',
    username: pitch?.username || '',
    followerCount: pitch?.followerCount || '',
    engagementRate: pitch?.engagementRate || '',
    profileLink: pitch?.user?.guestProfileLink || '',
    adminComments: pitch?.adminComments || '',
  });

  // Update form values when pitch changes
  React.useEffect(() => {
    if (pitch) {
      setFormValues({
        name: pitch?.user?.name || '',
        username: pitch?.username || '',
        followerCount: pitch?.followerCount || '',
        engagementRate: pitch?.engagementRate || '',
        profileLink: pitch?.user?.guestProfileLink || '',
        adminComments: pitch?.adminComments || '',
      });
    }
  }, [pitch]);

  const handleFieldChange = (field) => (event) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  // Filter out inactive creators and already shortlisted creators
  const availableCreators = React.useMemo(() => {
    if (!allCreators || !campaign) return [];

    const shortlistedIds = new Set((campaign?.shortlisted || []).map((s) => s.userId));

    return allCreators.filter(
      (creator) =>
        creator.status === 'active' &&
        creator.creator?.isFormCompleted &&
        !creator.creator?.isGuest &&
        !shortlistedIds.has(creator.id)
    );
  }, [allCreators, campaign]);

  const handleUpdateGuestCreator = async () => {
    // Validate required fields
    if (!formValues.name?.trim() || !formValues.profileLink?.trim()) {
      enqueueSnackbar('Please fill in Creator Name and Profile Link', { variant: 'error' });
      return;
    }

    try {
      setSubmitting(true);

      // Update guest creator information
      const response = await axiosInstance.patch(`/api/pitch/v3/${pitch.id}/updateGuest`, {
        name: formValues.name,
        username: formValues.username,
        followerCount: formValues.followerCount,
        engagementRate: formValues.engagementRate,
        profileLink: formValues.profileLink,
        adminComments: formValues.adminComments,
      });

      enqueueSnackbar(response.data.message || 'Successfully updated guest creator!', {
        variant: 'success',
      });

      // Close modal
      onClose();

      // Callback to refresh data
      if (onSwapped) {
        onSwapped();
      }
    } catch (error) {
      console.error('Error updating guest creator:', error);
      enqueueSnackbar(error?.response?.data?.message || 'Failed to update guest creator', {
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLinkCreator = async () => {
    if (!selectedPlatformCreator) {
      enqueueSnackbar('Please select a platform creator', { variant: 'warning' });
      return;
    }

    try {
      setSubmitting(true);

      const response = await axiosInstance.post('/api/campaign/swapCreator', {
        campaignId: campaign.id,
        guestUserId: pitch?.user?.id,
        platformUserId: selectedPlatformCreator.id,
      });

      enqueueSnackbar(response.data.message || 'Successfully linked creator!', {
        variant: 'success',
      });

      // Reset selection
      setSelectedPlatformCreator(null);
      setShowCreatorSelection(false);

      // Close modal
      onClose();

      // Callback to refresh data
      if (onSwapped) {
        onSwapped();
      }
    } catch (error) {
      console.error('Error linking creator:', error);
      enqueueSnackbar(error?.response?.data?.message || 'Failed to link creator', {
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { borderRadius: 2, backgroundColor: '#F4F4F4' } }}
    >
      <DialogTitle
        sx={{
          fontFamily: 'Instrument Serif',
          fontWeight: 500,
          '&.MuiTypography-root': { fontSize: 36 },
        }}
      >
        {!showCreatorSelection ? 'Non-Platform Creator' : 'Link Non-Platform Creator'}
      </DialogTitle>

      <DialogContent sx={{ bgcolor: '#F4F4F4' }}>
        <Box sx={{ pb: 2 }}>
          <Box display="flex" gap={1} mb={2}>
            {/* Creator Name */}
            <Box flex={1}>
              <Typography
                variant="caption"
                sx={{ fontWeight: 600, display: 'block', mb: 0.5, color: '#636366' }}
              >
                Creator Name
              </Typography>
              {isAdmin ? (
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Creator Name"
                  value={formValues.name}
                  onChange={handleFieldChange('name')}
                  disabled={submitting}
                  sx={{ bgcolor: '#fff', borderRadius: 1 }}
                />
              ) : (
                <Typography variant="body2" sx={{ color: 'text.primary' }}>
                  {formValues.name || '—'}
                </Typography>
              )}
            </Box>

            <Stack flex={1} spacing={1} flexDirection="row">
              {/* Username */}
              <Box flex={1}>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, display: 'block', mb: 0.5, color: '#636366' }}
                >
                  Username (Social Media)
                </Typography>
                {isAdmin ? (
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Username"
                    value={formValues.username}
                    onChange={handleFieldChange('username')}
                    disabled={submitting}
                    sx={{ bgcolor: '#fff', borderRadius: 1 }}
                  />
                ) : (
                  <Typography variant="body2" sx={{ color: 'text.primary' }}>
                    {formValues.username || '—'}
                  </Typography>
                )}
              </Box>

              {/* Profile Link */}
              <Box flex={1}>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, display: 'block', mb: 0.5, color: '#636366' }}
                >
                  Profile Link
                </Typography>
                {isAdmin ? (
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Profile Link"
                    value={formValues.profileLink}
                    onChange={handleFieldChange('profileLink')}
                    disabled={submitting}
                    sx={{ bgcolor: '#fff', borderRadius: 1 }}
                  />
                ) : formValues.profileLink ? (
                  <Typography
                    variant="body2"
                    sx={{ color: '#1340FF', textDecoration: 'underline', wordBreak: 'break-all' }}
                    component="a"
                    href={formValues.profileLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {formValues.profileLink}
                  </Typography>
                ) : (
                  <Typography variant="body2">—</Typography>
                )}
              </Box>              
            </Stack>
          </Box>

          <Stack spacing={1} flexDirection="row" mb={2}>
            {/* Follower Count */}
            <Box flex={1}>
              <Typography
                variant="caption"
                sx={{ fontWeight: 600, display: 'block', mb: 0.5, color: '#636366' }}
              >
                Follower Count
              </Typography>
              {isAdmin ? (
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Follower Count"
                  value={formValues.followerCount}
                  onChange={handleFieldChange('followerCount')}
                  disabled={submitting}
                  sx={{ bgcolor: '#fff', borderRadius: 1 }}
                />
              ) : (
                <Typography variant="body2" sx={{ color: 'text.primary' }}>
                  {formValues.followerCount || '—'}
                </Typography>
              )}
            </Box>

            {/* Engagement Rate */}
            <Box flex={1}>
              <Typography
                variant="caption"
                sx={{ fontWeight: 600, display: 'block', mb: 0.5, color: '#636366' }}
              >
                Engagement Rate (%)
              </Typography>
              {isAdmin ? (
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Follower Count"
                  value={formValues.engagementRate}
                  onChange={handleFieldChange('engagementRate')}
                  disabled={submitting}
                  sx={{ bgcolor: '#fff', borderRadius: 1 }}
                />
              ) : (
                <Typography variant="body2" sx={{ color: 'text.primary' }}>
                  {formValues.engagementRate || '—'}
                </Typography>
              )}
            </Box>
          </Stack>

          {/* CS Comments */}
          <Box>
            <Typography
              variant="caption"
              sx={{ fontWeight: 600, display: 'block', mb: 0.5, color: '#636366' }}
            >
              CS Comments (Optional)
            </Typography>
            {isAdmin ? (
              <TextField
                fullWidth
                size="small"
                placeholder="Input comments about the creator that your clients might find helpful"
                value={formValues.adminComments}
                onChange={handleFieldChange('adminComments')}
                disabled={submitting}
                sx={{ bgcolor: '#fff', borderRadius: 1 }}
              />
            ) : (
              <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
                {formValues.adminComments || '—'}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Platform Creator Selection - Only show for admins when Link Creator button is clicked */}
        {isAdmin && showCreatorSelection && (
          <Box>
            <Typography
              variant="caption"
              sx={{ fontWeight: 600, display: 'block', mb: 0.5, color: '#636366' }}
            >
              Select Platform Creator to Link
            </Typography>

            {creatorsLoading ? (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <CircularProgress thickness={6} size={28} />
              </Box>
            ) : (
              <Autocomplete
                value={selectedPlatformCreator}
                onChange={(_, val) => setSelectedPlatformCreator(val)}
                options={availableCreators}
                getOptionLabel={(opt) => opt?.name || ''}
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                filterOptions={(options, state) => {
                  if (!state.inputValue) return options;

                  const lowercaseInput = state.inputValue.toLowerCase();
                  return options.filter(
                    (option) =>
                      option?.name?.toLowerCase().includes(lowercaseInput) ||
                      option?.email?.toLowerCase().includes(lowercaseInput) ||
                      option?.creator?.instagram?.toLowerCase().includes(lowercaseInput)
                  );
                }}
                slotProps={{
                  popper: {
                    placement: 'bottom-start',
                    modifiers: [
                      {
                        name: 'flip',
                        enabled: false,
                      },
                    ],
                    sx: {
                      zIndex: (theme) => theme.zIndex.modal + 1,
                    },
                  },
                }}
                renderOption={(props, option) => (
                  <Box
                    component="li"
                    {...props}
                    key={option.id}
                    sx={{ display: 'flex', gap: 1.5, py: 1 }}
                  >
                    <Avatar
                      src={option?.photoURL}
                      sx={{ width: 30, height: 30, borderRadius: 2, flexShrink: 0 }}
                    >
                      {option?.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <Stack spacing={0}>
                      <Typography variant="body2" sx={{ lineHeight: 1.3, fontWeight: 500 }}>
                        {option?.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                        {option?.email}
                      </Typography>
                      {option?.creator?.instagram && (
                        <Typography variant="caption" color="primary.main" sx={{ lineHeight: 1.2 }}>
                          @{option.creator.instagram}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search by name, email, or Instagram handle"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <Box sx={{ pl: 1, display: 'flex', alignItems: 'center' }}>
                          <Iconify icon="eva:search-fill" width={16} sx={{ color: '#8E8E93' }} />
                        </Box>
                      ),
                    }}
                    sx={{ bgcolor: '#fff', borderRadius: 1 }}
                  />
                )}
              />
            )}

            {selectedPlatformCreator && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: (theme) => alpha(theme.palette.success.main, 0.08),
                  border: '1px solid',
                  borderColor: (theme) => alpha(theme.palette.success.main, 0.24),
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    src={selectedPlatformCreator?.photoURL}
                    sx={{ width: 48, height: 48, borderRadius: 2 }}
                  >
                    {selectedPlatformCreator?.name?.[0]?.toUpperCase()}
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {selectedPlatformCreator?.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedPlatformCreator?.email}
                    </Typography>
                  </Box>
                  <Iconify
                    icon="eva:checkmark-circle-2-fill"
                    width={24}
                    sx={{ color: 'success.main' }}
                  />
                </Stack>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {isAdmin && !showCreatorSelection && (
          <>
            <Button
              onClick={() => setShowCreatorSelection(true)}
              disabled={submitting}
              sx={{
                bgcolor: '#ffffff',
                color: 'text.primary',
                border: '1px solid',
                borderColor: '#e7e7e7',
                borderBottom: '3px solid',
                borderBottomColor: '#e7e7e7',
                borderRadius: 1,
                px: 2,
                '&:hover': {
                  bgcolor: '#F7F7F7',
                },
              }}
              startIcon={
                <Iconify
                  icon="mdi:account-plus-outline"
                  width={24}
                  sx={{ color: 'text.primary' }}
                />
              }
            >
              Link Creator
            </Button>
            <Button
              onClick={handleUpdateGuestCreator}
              disabled={submitting}
              sx={{
                bgcolor: '#203ff5',
                color: '#fff',
                fontWeight: 600,
                px: 2,
                borderBottom: '3px solid #000',
                textTransform: 'none',
                '&:hover': { bgcolor: '#1a32c4' },
                '&.Mui-disabled': {
                  bgcolor: '#C7C7CC',
                  color: '#fff',
                },
              }}
            >
              {submitting ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Update'}
            </Button>
          </>
        )}
        {isAdmin && showCreatorSelection && (
          <>
            <Button
              onClick={() => {
                setShowCreatorSelection(false);
                setSelectedPlatformCreator(null);
              }}
              disabled={submitting}
              sx={{
                bgcolor: '#ffffff',
                color: 'text.primary',
                border: '1px solid',
                borderColor: '#e7e7e7',
                borderBottom: '3px solid',
                borderBottomColor: '#e7e7e7',
                borderRadius: 1,
                px: 2,
                '&:hover': {
                  bgcolor: '#F7F7F7',
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLinkCreator}
              disabled={submitting || !selectedPlatformCreator}
              sx={{
                bgcolor: '#3A3A3C',
                borderBottom: '3px solid #000',
                color: '#fff',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: '#525151',
                  borderBottom: '3px solid #000',
                },
                '&.Mui-disabled': {
                  bgcolor: '#C7C7CC',
                  color: '#fff',
                  borderBottom: '3px solid #0000001A',
                },
              }}
            >
              {submitting ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Link'}
            </Button>
          </>
        )}
        {!isAdmin && (
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
        )}
      </DialogActions>
    </Dialog>
  );
}

ViewGuestCreatorModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  pitch: PropTypes.object,
  isAdmin: PropTypes.bool,
  campaign: PropTypes.object,
  onSwapped: PropTypes.func,
};

export default V3PitchModal;

V3PitchModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  pitch: PropTypes.object,
  campaign: PropTypes.object,
  onUpdate: PropTypes.func,
};
