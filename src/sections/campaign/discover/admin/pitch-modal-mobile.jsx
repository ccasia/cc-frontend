/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable no-nested-ternary */
import dayjs from 'dayjs';
/* eslint-disable no-plusplus */
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router';
import { useMemo, useState, useEffect } from 'react';

import CircularProgress from '@mui/material/CircularProgress';
import {
  Box,
  Chip,
  Stack,
  Dialog,
  Avatar,
  Button,
  Select,
  Divider,
  Tooltip,
  MenuItem,
  TextField,
  IconButton,
  Typography,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { useGetCampaignById } from 'src/hooks/use-get-campaign-by-id';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';

const PitchModalMobile = ({ pitch, open, onClose, campaign, onUpdate }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthContext();
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPitch, setCurrentPitch] = useState(pitch);
  const [totalUGCVideos] = useState(null);
  const { mutate } = useGetCampaignById(campaign.id);
  const navigate = useNavigate();

  const [maybeOpen, setMaybeOpen] = useState(false);
  const [maybeReason, setMaybeReason] = useState('');
  const [maybeNote, setMaybeNote] = useState('');
  const [creatorProfileFull, setCreatorProfileFull] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState('instagram'); // 'instagram' or 'tiktok'
  const MAYBE_REASONS = [
    { value: 'engagement_low', label: 'Engagement Rate Too Low' },
    { value: 'not_fit_brief', label: 'Does Not Fit Criteria in Campaign Brief' },
    { value: 'not_fit_campaign', label: 'Content is Not Fit for the Campaign' },
    { value: 'others', label: 'Others' },
  ];

  useEffect(() => {
    setCurrentPitch(pitch);
  }, [pitch]);

  const hasSocialMediaConnection =
    pitch?.user?.creator?.isFacebookConnected || pitch?.user?.creator?.isTiktokConnected;

  // Set default platform when modal opens
  useEffect(() => {
    if (open && currentPitch?.user?.creator) {
      if (currentPitch.user.creator.instagram && currentPitch.user.creator.tiktok) {
        setSelectedPlatform('both');
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
  const creatorProfile = currentPitch?.user?.creator || {};
  const accountUser = currentPitch?.user || {};
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

  const isGuest = accountUser.status === 'guest';

  const resolveNumber = (value) =>
    typeof value === 'number' && Number.isFinite(value) ? value : null;

  const platformStats = useMemo(() => {
    const collect = (platform) => {
      const creator = currentPitch?.user?.creator;
      const account = creatorProfileFull;

      const sources =
        platform === 'instagram'
          ? [creator?.instagramUser, account?.instagramUser]
          : [creator?.tiktokUser, account?.tiktokUser];

      const base = sources.find(Boolean) || {};
      const followerKey = platform === 'instagram' ? 'followers_count' : 'follower_count';

      return {
        followers: resolveNumber(base[followerKey]),
        engagementRate: resolveNumber(base.engagement_rate),
        averageLikes: resolveNumber(base.averageLikes),
        username:
          base.username ??
          (platform === 'instagram'
            ? (creator?.instagram ?? account?.instagram)
            : (creator?.tiktok ?? account?.tiktok)),
      };
    };

    return {
      instagram: collect('instagram'),
      tiktok: collect('tiktok'),
    };
  }, [currentPitch, creatorProfileFull]);

  const activePlatform = selectedPlatform === 'tiktok' ? 'tiktok' : 'instagram';
  const activeStats = platformStats[activePlatform] || {};

  const formatCount = (value, emptyLabel = 'N/A') => {
    const numeric = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(numeric)) return emptyLabel;
    if (numeric >= 1000000) return `${(numeric / 1000000).toFixed(1)}M`;
    if (numeric >= 1000) return `${(numeric / 1000).toFixed(1)}K`;
    return Math.round(numeric).toLocaleString();
  };

  const formatEngagement = (value) => (value == null ? 'N/A' : `${Math.round(value)}%`);

  const formatLikes = (value) => formatCount(value, 'N/A');

  const matchingPercentage = useMemo(() => {
    const numeric = Number(pitch?.matchingPercentage);
    if (!Number.isFinite(numeric)) return 0;
    return Math.min(numeric, 100);
  }, [pitch?.matchingPercentage]);

  // Normalized CS Comments text (for client view rendering)
  const adminCommentsText = ((currentPitch?.adminComments ?? pitch?.adminComments ?? '') || '')
    .toString()
    .trim();

  const isDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );

  const handleApprove = async () => {
    try {
      setIsSubmitting(true);

      let response;

      // Check if this is a V3 pitch (client-created campaign)
      if (campaign?.submissionVersion === 'v4') {
        // Use V3 endpoint for client-created campaigns
        const v3PitchId = pitch.pitchId || pitch.id;

        // Check user role to call the correct endpoint
        if (user?.role === 'client') {
          // Client approves pitch
          response = await axiosInstance.patch(
            endpoints.campaign.pitch.v3.approveClient(v3PitchId)
          );
        } else {
          // Admin approves pitch
          response = await axiosInstance.patch(endpoints.campaign.pitch.v3.approve(v3PitchId));
        }
      } else {
        // Use V2 endpoint for admin-created campaigns
        const requestData = {
          pitchId: pitch.id,
          status: 'approved',
        };

        // Add UGC videos only for v4 campaigns
        if (campaign?.submissionVersion !== 'v4') {
          requestData.totalUGCVideos = totalUGCVideos;
        }

        response = await axiosInstance.patch(endpoints.campaign.pitch.changeStatus, requestData);
      }

      const updatedPitch = { ...pitch, status: 'approved' };
      setCurrentPitch(updatedPitch);

      if (onUpdate) {
        onUpdate(updatedPitch);
      }

      mutate();
      enqueueSnackbar(response?.data?.message || 'Pitch approved successfully');
      setConfirmDialog({ open: false, type: null });
      onClose();
    } catch (error) {
      console.error('Error approving pitch:', error);
      enqueueSnackbar('Error approving pitch', { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    try {
      setIsSubmitting(true);

      let response;

      // Check if this is a V3 pitch (client-created campaign)
      if (campaign?.submissionVersion === 'v4') {
        // Use V3 endpoint for client-created campaigns
        const v3PitchId = pitch.pitchId || pitch.id;

        // Check user role to call the correct endpoint
        if (user?.role === 'client') {
          // Client rejects pitch
          response = await axiosInstance.patch(
            endpoints.campaign.pitch.v3.rejectClient(v3PitchId),
            {
              rejectionReason: 'Rejected by client',
            }
          );
        } else {
          // Admin rejects pitch
          response = await axiosInstance.patch(endpoints.campaign.pitch.v3.reject(v3PitchId), {
            rejectionReason: 'Rejected by admin',
          });
        }
      } else {
        // Use V2 endpoint for admin-created campaigns
        response = await axiosInstance.patch(endpoints.campaign.pitch.changeStatus, {
          pitchId: pitch.id,
          status: 'rejected',
        });
      }

      const updatedPitch = { ...pitch, status: 'REJECTED' };
      setCurrentPitch(updatedPitch);

      if (onUpdate) {
        onUpdate(updatedPitch);
      }
      mutate();
      enqueueSnackbar(response?.data?.message || 'Pitch declined successfully');
      setConfirmDialog({ open: false, type: null });
      onClose();
    } catch (error) {
      console.error('Error declining pitch:', error);
      enqueueSnackbar('Error declining pitch', { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Adds a delay before fully closing the dialog
  const handleCloseConfirmDialog = () => {
    // First just close the dialog
    setConfirmDialog((prev) => ({ ...prev, open: false }));

    setTimeout(() => {
      setConfirmDialog({ open: false, type: null });
    }, 300);
  };

  const handleMediaKitClick = () => {
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
  };

  const handleCloseMaybe = () => {
    setMaybeOpen(false);
    setMaybeReason('');
    setMaybeNote('');
  };

  const handleMaybeSubmit = async () => {
    try {
      setIsSubmitting(true);

      if (campaign?.submissionVersion === 'v4' && user?.role === 'client') {
        const v3PitchId = pitch.pitchId || pitch.id;

        // Build request body
        let body;
        if (maybeReason === 'others') {
          body = { customRejectionText: maybeNote.trim() };
        } else {
          const reasonLabel =
            MAYBE_REASONS.find((r) => r.value === maybeReason)?.label || 'Unspecified';
          body = { rejectionReason: reasonLabel };
        }

        // Call your endpoint
        const response = await axiosInstance.patch(
          endpoints.campaign.pitch.v3.maybeClient(v3PitchId),
          body
        );

        // Update pitch status
        const updatedPitch = { ...pitch, status: 'MAYBE' };
        setCurrentPitch(updatedPitch);
        onUpdate?.(updatedPitch);

        enqueueSnackbar(response?.data?.message || 'Pitch marked as Maybe');
        setMaybeOpen(false);
        setMaybeReason('');
        setMaybeNote('');
      } else {
        console.warn('Maybe action is only available for client-created campaigns by clients');
      }
    } catch (error) {
      console.error('Error setting maybe:', error);
      enqueueSnackbar('Error setting Maybe', { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: '90%',
            bgcolor: '#F5F5F5',
          },
        }}
      >
        {/* Close Button */}
        <IconButton
          onClick={onClose}
          sx={{
            paddingTop: 2,
            paddingRight: 2,
            alignSelf: 'flex-end',
            color: '#8E8E93',
          }}
        >
          <Iconify icon="eva:close-fill" width={28} height={28} />
        </IconButton>

        {/* Scrollable Content */}
        <DialogContent sx={{ px: 2, mb: 2 }}>
          <Stack spacing={2}>
            {/* Creator Info Section */}
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                src={currentPitch?.user?.photoURL}
                sx={{
                  width: 63,
                  height: 63,
                  border: '2px solid',
                  borderColor: 'background.paper',
                }}
              />
              <Stack spacing={0.5} flex={1}>
                <Typography
                  sx={{
                    fontSize: 16,
                    fontWeight: 700,
                    lineHeight: '24px',
                    color: '#231F20',
                  }}
                >
                  {currentPitch?.user?.name}
                </Typography>
                {(() => {
                  const email = accountUser?.email;
                  const isGuestEmail =
                    email?.includes('@tempmail.com') || email?.startsWith('guest_');
                  return email && !isGuestEmail ? (
                    <Typography
                      sx={{
                        fontSize: 14,
                        fontWeight: 400,
                        lineHeight: '16px',
                        color: '#8E8E93',
                      }}
                    >
                      {email}
                    </Typography>
                  ) : null;
                })()}
                {/* Social Links - Show when no media kit data */}
                {(() => {
                  const hasInstagramData = !!(
                    currentPitch?.user?.creator?.instagramUser?.followers_count ||
                    creatorProfileFull?.creator?.instagramUser?.followers_count ||
                    creatorProfileFull?.instagramUser?.followers_count
                  );
                  const hasTiktokData = !!(
                    currentPitch?.user?.creator?.tiktokUser?.follower_count ||
                    creatorProfileFull?.creator?.tiktokUser?.follower_count ||
                    creatorProfileFull?.tiktokUser?.follower_count
                  );
                  const instagramLink =
                    currentPitch?.user?.creator?.instagramProfileLink ||
                    creatorProfileFull?.creator?.instagramProfileLink;
                  const tiktokLink =
                    currentPitch?.user?.creator?.tiktokProfileLink ||
                    creatorProfileFull?.creator?.tiktokProfileLink;

                  const isGuestCreator = creatorProfile?.isGuest;
                  const profileLink = creatorProfile?.profileLink;

                  // Show social links section ONLY if there's no media kit data at all
                  const shouldShowSocialLinks =
                    (!hasInstagramData && !hasTiktokData && (instagramLink || tiktokLink)) ||
                    profileLink;

                  if (shouldShowSocialLinks) {
                    return (
                      <Box>
                        {!hasTiktokData && tiktokLink && (
                          <Typography
                            component="a"
                            href={tiktokLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              fontSize: '12px',
                              color: '#1340FF',
                              textDecoration: 'none',
                              display: 'block',
                              mb: 0.5,
                              '&:hover': {
                                textDecoration: 'underline',
                              },
                            }}
                          >
                            {(() => {
                              try {
                                const url = new URL(
                                  tiktokLink.startsWith('http')
                                    ? tiktokLink
                                    : `https://${tiktokLink}`
                                );
                                return `www.tiktok.com${url.pathname}`;
                              } catch {
                                return tiktokLink;
                              }
                            })()}
                          </Typography>
                        )}
                        {!hasInstagramData && instagramLink && (
                          <Typography
                            component="a"
                            href={instagramLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              fontSize: '12px',
                              color: '#1340FF',
                              textDecoration: 'none',
                              display: 'block',
                              '&:hover': {
                                textDecoration: 'underline',
                              },
                            }}
                          >
                            {(() => {
                              try {
                                const url = new URL(
                                  instagramLink.startsWith('http')
                                    ? instagramLink
                                    : `https://${instagramLink}`
                                );
                                return `www.instagram.com${url.pathname}`;
                              } catch {
                                return instagramLink;
                              }
                            })()}
                          </Typography>
                        )}
                        {isGuestCreator && (
                          <Typography
                            component="a"
                            href={profileLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              fontSize: '12px',
                              color: '#1340FF',
                              textDecoration: 'none',
                              display: 'block',
                              '&:hover': {
                                textDecoration: 'underline',
                              },
                            }}
                          >
                            {profileLink}
                          </Typography>
                        )}
                      </Box>
                    );
                  }
                  return null;
                })()}
              </Stack>
            </Stack>

            {/* Age, Pronouns, Languages */}
            <Stack direction="row" justifyContent="space-between">
              <Stack flex={1}>
                {derivedBirthDate && (
                  <Box>
                    <Typography
                      sx={{
                        color: '#8E8E93',
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      Age
                    </Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 400, color: '#231F20' }}>
                      {dayjs().diff(dayjs(derivedBirthDate), 'year')}
                    </Typography>
                  </Box>
                )}

                {derivedPronouns && (
                  <Box>
                    <Typography
                      sx={{
                        color: '#8E8E93',
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      Pronouns
                    </Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 400, color: '#231F20' }}>
                      {derivedPronouns}
                    </Typography>
                  </Box>
                )}

                {derivedLanguages.length > 0 && (
                  <Box>
                    <Typography
                      sx={{
                        color: '#8E8E93',
                        fontWeight: 700,
                        my: 0.5,
                        display: 'block',
                        fontSize: 14,
                      }}
                    >
                      Languages
                    </Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {derivedLanguages.map((language, index) => (
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
                            borderRadius: '6px',
                            color: '#8E8E93',
                            fontSize: 12,
                            fontWeight: 600,
                            height: '28px',
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>

              {!isGuest && hasSocialMediaConnection && (
                <Stack justifyContent="space-between" gap={2} alignItems="flex-end">
                  {/* Media Kit Button */}
                  <Button
                    onClick={handleMediaKitClick}
                    sx={{
                      height: 40,
                      bgcolor: '#3A3A3C',
                      color: '#FFFFFF',
                      borderRadius: '10px',
                      py: 1.25,
                      fontSize: 14,
                      fontWeight: 600,
                      textTransform: 'none',
                      minWidth: '100px',
                      '&:hover': {
                        bgcolor: '#2A2A2C',
                      },
                    }}
                  >
                    Media Kit
                  </Button>
                  {/* Social Media Icons - Mobile */}
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Instagram Stats">
                      <IconButton
                        onClick={() => setSelectedPlatform('instagram')}
                        size="small"
                        disabled={selectedPlatform === 'instagram'}
                        sx={{
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
                        <Iconify icon="mdi:instagram" width={20} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="TikTok Stats">
                      <IconButton
                        onClick={() => setSelectedPlatform('tiktok')}
                        size="small"
                        disabled={selectedPlatform === 'tiktok'}
                        sx={{
                          color: selectedPlatform === 'tiktok' ? '#8E8E93' : '#000000',
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
                        <Iconify icon="ic:baseline-tiktok" width={24} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              )}
            </Stack>

            {/* Stats Section */}
            <Stack spacing={2}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 1,
                }}
              >
                {/* Followers */}
                <Box pl={2}>
                  <Box
                    component="img"
                    src="/assets/icons/overview/purpleGroup.svg"
                    sx={{ width: 20, height: 20 }}
                  />
                  <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#231F20' }}>
                    {formatCount(activeStats.followers)}
                  </Typography>
                  <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#8E8E93' }}>
                    Followers
                  </Typography>
                </Box>

                {/* Engagement */}
                <Box borderLeft="1px solid #D3D3D3" pl={2}>
                  <Box
                    component="img"
                    src="/assets/icons/overview/greenChart.svg"
                    sx={{ width: 20, height: 20 }}
                  />
                  <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#231F20' }}>
                    {formatEngagement(activeStats.engagementRate)}
                  </Typography>
                  <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#8E8E93' }}>
                    Engagement
                  </Typography>
                </Box>

                {/* Average Likes */}
                <Box borderLeft="1px solid #D3D3D3" pl={2}>
                  <Box
                    component="img"
                    src="/assets/icons/overview/bubbleHeart.svg"
                    sx={{ width: 20, height: 20 }}
                  />
                  <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#231F20' }}>
                    {formatLikes(activeStats.averageLikes)}
                  </Typography>
                  <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#8E8E93' }}>
                    Average Likes
                  </Typography>
                </Box>
              </Box>
            </Stack>

            <Divider />

            {/* Pitch Section */}
            <Stack direction="row" spacing={2} pr={3} alignItems="center">
              <Box
                component="img"
                src={
                  currentPitch?.type === 'video'
                    ? '/assets/icons/components/ic_videopitch.svg'
                    : '/assets/icons/components/ic_letterpitch.svg'
                }
                sx={{ width: 55, height: 55 }}
              />
              <Stack flex={1}>
                <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#231F20' }}>
                  {currentPitch?.type === 'video' ? 'Video Pitch' : 'Letter Pitch'}
                </Typography>

                {/* Match Percentage */}
                <Chip
                  icon={
                    <Box sx={{ position: 'relative', display: 'inline-flex', mr: 2 }}>
                      <CircularProgress
                        variant="determinate"
                        value={100}
                        size={16}
                        thickness={7}
                        sx={{ color: 'grey.300' }}
                      />
                      <CircularProgress
                        variant="determinate"
                        value={matchingPercentage}
                        size={16}
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
                  label={`${matchingPercentage}% MATCH WITH CAMPAIGN`}
                  sx={{
                    backgroundColor: '#FFF',
                    color: '#48484a',
                    fontWeight: 700,
                    fontSize: '11px',
                    borderRadius: '8px',
                    height: 28,
                    border: '1px solid #ebebeb',
                    mt: 0.5,
                    '&:hover': {
                      bgcolor: '#fff',
                    },
                  }}
                />
              </Stack>
            </Stack>

            {/* Submitted On and Status */}
            <Stack direction="row" spacing={4} justifyContent="space-between">
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#8E8E93',
                    fontWeight: 700,
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  SUBMITTED ON
                </Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#231F20' }}>
                  {new Date(currentPitch?.createdAt).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Typography>
              </Box>

              <Box alignItems="flex-end" textAlign="end">
                <Typography
                  variant="caption"
                  sx={{
                    color: '#8E8E93',
                    fontWeight: 700,
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  STATUS
                </Typography>
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: 600,
                    color:
                      currentPitch?.status === 'approved' ||
                      (currentPitch?.status || '').toUpperCase() === 'APPROVED'
                        ? '#1ABF66'
                        : currentPitch?.status === 'rejected' ||
                            (currentPitch?.status || '').toUpperCase() === 'REJECTED'
                          ? '#D4321C'
                          : '#FFC702',
                  }}
                >
                  {currentPitch?.status
                    ?.split('_')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ')}
                </Typography>
              </Box>
            </Stack>

            <Divider />

            {/* Pitch Content */}
            <Box>
              {currentPitch?.type === 'video' &&
                currentPitch?.content &&
                currentPitch.status !== 'pending' && (
                  <Box
                    sx={{
                      borderRadius: 1,
                      overflow: 'hidden',
                      bgcolor: '#000',
                    }}
                  >
                    <Box
                      component="video"
                      controls
                      sx={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                      }}
                      src={currentPitch.content}
                    />
                  </Box>
                )}

              {currentPitch?.type === 'text' && currentPitch?.content && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    bgcolor: '#ffffff',
                    border: '1px solid #EBEBEB',
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      color: '#231F20',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                      fontSize: 15,
                    }}
                  >
                    {currentPitch.content?.replace(/<[^>]*>/g, '') || ''}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* CS Comments for client */}
            {user?.role === 'client' && adminCommentsText.length > 0 && (
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1, fontWeight: 600, color: '#8E8E93', fontSize: '12px' }}
                >
                  CS Comments
                </Typography>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    bgcolor: '#ffffff',
                    border: '1px solid #EBEBEB',
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{ color: '#231F20', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}
                  >
                    {adminCommentsText}
                  </Typography>
                </Box>
              </Box>
            )}
          </Stack>
        </DialogContent>

        {/* Action Buttons */}
        {(currentPitch?.status === 'PENDING_REVIEW' ||
          currentPitch?.displayStatus === 'PENDING_REVIEW' ||
          currentPitch?.status === 'undecided' ||
          currentPitch?.displayStatus === 'undecided') && (
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => setConfirmDialog({ open: true, type: 'decline' })}
              disabled={isDisabled || isSubmitting}
              sx={{
                bgcolor: '#fff',
                color: '#D4321C',
                borderRadius: 1,
                py: 1,
                fontSize: 14,
                fontWeight: 600,
                textTransform: 'none',
                flex: 1,
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

            <Button
              variant="outlined"
              fullWidth
              onClick={() => setConfirmDialog({ open: true, type: 'approve' })}
              disabled={isDisabled || isSubmitting}
              sx={{
                bgcolor: '#fff',
                color: '#1ABF66',
                borderRadius: 1,
                py: 1,
                fontSize: 14,
                fontWeight: 600,
                textTransform: 'none',
                flex: 1,
                '&:hover': {
                  bgcolor: '#f5f5f5',
                  border: '1.5px solid',
                  borderColor: '#1ABF66',
                  borderBottom: '3px solid',
                  borderBottomColor: '#1ABF66',
                },
              }}
            >
              Approve
            </Button>

            {user?.role === 'client' && (
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setMaybeOpen(true)}
                disabled={isDisabled || isSubmitting}
                sx={{
                  bgcolor: '#ffffff',
                  color: '#FFC702',
                  border: '1.5px solid',
                  borderColor: '#e7e7e7',
                  borderBottom: '3px solid',
                  borderBottomColor: '#e7e7e7',
                  borderRadius: 1,
                  py: 1,
                  fontSize: 14,
                  fontWeight: 600,
                  textTransform: 'none',
                  flex: 1,
                  '&:hover': {
                    bgcolor: '#f5f5f5',
                    border: '1.5px solid',
                    borderColor: '#FFC702',
                    borderBottom: '3px solid',
                    borderBottomColor: '#FFC702',
                  },
                }}
              >
                Maybe
              </Button>
            )}
          </DialogActions>
        )}
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={handleCloseConfirmDialog} maxWidth="xs" fullWidth>
        <DialogContent>
          {/* CONDITIONAL BODY */}
          {confirmDialog.type === 'decline' && user?.role === 'client' ? (
            // --- Client Decline: reason UI (reusing the dialog) ---
            <Stack spacing={2} sx={{ pt: 2 }}>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: 'Instrument Serif, serif',
                  fontSize: { xs: '1.5rem', sm: '2rem' },
                  fontWeight: 550,
                }}
              >
                Reason for Rejection
              </Typography>

              {/* Title above field (no InputLabel) */}
              <Typography variant="caption" sx={{ fontWeight: 400 }}>
                Selection Reason
              </Typography>
              <Box>
                <Select
                  fullWidth
                  value={maybeReason}
                  onChange={(e) => setMaybeReason(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="" disabled>
                    Select Reason
                  </MenuItem>
                  {MAYBE_REASONS.map((r) => (
                    <MenuItem key={r.value} value={r.value}>
                      {r.label}
                    </MenuItem>
                  ))}
                </Select>
              </Box>

              {maybeReason === 'others' && (
                <Stack spacing={1}>
                  <Typography variant="caption" sx={{ fontWeight: 400 }}>
                    Selection Description
                  </Typography>
                  <TextField
                    placeholder="Type your reason…"
                    multiline
                    minRows={3}
                    value={maybeNote}
                    onChange={(e) => setMaybeNote(e.target.value)}
                    fullWidth
                    required
                    error={!maybeNote.trim() && isSubmitting}
                    helperText={!maybeNote.trim() && isSubmitting ? 'This field is required' : ''}
                  />
                </Stack>
              )}
            </Stack>
          ) : (
            // --- Approve OR Admin Decline: original look ---
            <Stack spacing={3} alignItems="center" sx={{ py: 4 }}>
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  bgcolor: confirmDialog.type === 'approve' ? '#5abc6f' : '#ff3b30',
                  fontSize: '50px',
                  mb: -2,
                }}
              >
                {confirmDialog.type === 'approve' ? '🫣' : '🥹'}
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
                  {confirmDialog.type === 'approve' ? 'Approve Pitch?' : 'Decline Pitch?'}
                </Typography>
                <Typography variant="body1" sx={{ color: '#636366', mt: -0.5, mb: -3 }}>
                  {confirmDialog.type === 'approve'
                    ? 'Are you sure you want to approve this pitch?'
                    : 'Are you sure you want to decline this pitch?'}
                </Typography>
              </Stack>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ pb: 3, px: 3 }}>
          <Button
            onClick={() => {
              setMaybeReason('');
              setMaybeNote('');
              handleCloseConfirmDialog();
            }}
            disabled={isSubmitting}
            sx={{
              bgcolor: '#ffffff',
              color: '#636366',
              border: '1.5px solid',
              borderColor: '#e7e7e7',
              borderBottom: '3px solid',
              borderBottomColor: '#e7e7e7',
              borderRadius: 1.15,
              py: 1.2,
              flex: 1,
              mr: 1,
              fontWeight: 600,
              '&:hover': { bgcolor: '#e7e7e7' },
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={
              confirmDialog.type === 'decline' && user?.role === 'client'
                ? handleDecline
                : confirmDialog.type === 'approve'
                  ? handleApprove
                  : handleDecline
            }
            disabled={isSubmitting}
            sx={{
              bgcolor: confirmDialog.type === 'approve' ? '#026D54' : '#ffffff',
              color:
                confirmDialog.type === 'approve'
                  ? '#fff'
                  : user?.role === 'client' && confirmDialog.type === 'decline'
                    ? '#D4321C'
                    : '#ff3b30',
              border: confirmDialog.type === 'approve' ? 'none' : '1.5px solid #e7e7e7',
              borderBottom: '3px solid',
              borderBottomColor: confirmDialog.type === 'approve' ? '#202021' : '#e7e7e7',
              borderRadius: 1.15,
              flex: 1,
              py: 1.2,
              ml: 1,
              fontWeight: 600,
              '&:hover': {
                bgcolor: confirmDialog.type === 'approve' ? '#1e4a3a' : '#e7e7e7',
              },
            }}
          >
            {isSubmitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <>
                {confirmDialog.type === 'approve' && (
                  <Iconify icon="eva:checkmark-fill" width={20} sx={{ mr: 0.5 }} />
                )}
                {confirmDialog.type === 'approve'
                  ? 'Yes, approve!'
                  : user?.role === 'client' && confirmDialog.type === 'decline'
                    ? 'Submit Reason'
                    : 'Yes, decline!'}
              </>
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Maybe Dialog */}
      <Dialog open={maybeOpen} onClose={handleCloseMaybe} maxWidth="sm" fullWidth>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={1}>
            <Typography
              variant="h6"
              sx={{
                fontFamily: 'Instrument Serif, serif',
                fontSize: { xs: '1.5rem', sm: '2rem' },
                fontWeight: 550,
              }}
            >
              Reason for Maybe
            </Typography>

            <Typography variant="caption" sx={{ fontWeight: 400 }}>
              Selection Reason
            </Typography>

            <Box>
              <Select
                fullWidth
                value={maybeReason}
                onChange={(e) => setMaybeReason(e.target.value)}
                displayEmpty
              >
                <MenuItem value="" disabled>
                  Select Reason
                </MenuItem>
                {MAYBE_REASONS.map((r) => (
                  <MenuItem key={r.value} value={r.value}>
                    {r.label}
                  </MenuItem>
                ))}
              </Select>
            </Box>

            {maybeReason === 'others' && (
              <Stack spacing={1}>
                <Typography variant="caption" sx={{ fontWeight: 400 }}>
                  Selection Description
                </Typography>
                <TextField
                  placeholder="Please describe the reason for your selection, so we can provide more creators more suited to your needs"
                  multiline
                  minRows={3}
                  value={maybeNote}
                  onChange={(e) => setMaybeNote(e.target.value)}
                  fullWidth
                  required
                  error={!maybeNote.trim() && isSubmitting}
                  helperText={!maybeNote.trim() && isSubmitting ? 'This field is required' : ''}
                />
              </Stack>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ pb: 3, px: 3 }}>
          <Button
            onClick={handleCloseMaybe}
            disabled={isSubmitting}
            sx={{
              bgcolor: '#ffffff',
              color: '#636366',
              border: '1.5px solid',
              borderColor: '#e7e7e7',
              borderBottom: '3px solid',
              borderBottomColor: '#e7e7e7',
              borderRadius: 1.15,
              py: 1.2,
              flex: 1,
              mr: 1,
              fontWeight: 600,
              '&:hover': { bgcolor: '#e7e7e7' },
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={handleMaybeSubmit}
            disabled={
              isSubmitting || !maybeReason || (maybeReason === 'others' && !maybeNote.trim())
            }
            sx={{
              bgcolor: '#ffffff',
              color: '#FFC702',
              border: '1.5px solid',
              borderColor: '#FFC702',
              borderBottom: '3px solid',
              borderBottomColor: '#FFC702',
              borderRadius: 1.15,
              py: 1.2,
              flex: 1,
              ml: 1,
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#f5f5f5',
              },
              '&:disabled': {
                borderColor: '#e7e7e7',
                borderBottomColor: '#e7e7e7',
                color: '#8E8E93',
              },
            }}
          >
            {isSubmitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              'Submit Reason'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

PitchModalMobile.propTypes = {
  pitch: PropTypes.object,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  campaign: PropTypes.object,
  onUpdate: PropTypes.func,
};

export default PitchModalMobile;
