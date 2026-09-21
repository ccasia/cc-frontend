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
  Stack,
  Dialog,
  Avatar,
  Button,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Typography,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { useGetCampaignById } from 'src/hooks/use-get-campaign-by-id';

import { paths } from 'src/routes/paths';

import axiosInstance, { endpoints } from 'src/utils/axios';
import { campaignHasClient } from 'src/utils/campaign-flow';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import Markdown from 'src/components/markdown';

import {
  LINE,
  ONYX,
  MUTED,
  RAISED,
  TagChip,
  MetaItem,
  StatTile,
  VDivider,
  FieldGroup,
} from '../client/v3-pitches/v3-pitch-modal-parts';
import {
  availablePitchPlatforms,
  resolvePitchPlatformStats,
  seedPitchPlatform,
} from '../client/v3-pitches/resolve-pitch-platform-stats';

const PitchModalMobile = ({
  pitch,
  open,
  onClose,
  campaign,
  onUpdate,
  readOnly = false,
  showClientApprovalNote = false,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthContext();
  const isClientRole = user?.role === 'client' || user?.role === 'client_demo';
  const isDemoCampaign = Boolean(campaign?.isDemo);
  const hasClient = campaignHasClient(campaign);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null });

  // 'send_to_client' shares the approve styling but has its own copy and handler intent
  const isApproveLikeDialog =
    confirmDialog.type === 'approve' || confirmDialog.type === 'send_to_client';

  const confirmDialogCopy = (() => {
    if (confirmDialog.type === 'send_to_client') {
      return {
        title: 'Send to Client?',
        description: 'Send this pitch to the client for review?',
        cta: 'Yes, send!',
      };
    }
    if (confirmDialog.type === 'approve') {
      return {
        title: 'Approve Pitch?',
        description: 'Are you sure you want to approve this pitch?',
        cta: 'Yes, approve!',
      };
    }
    return {
      title: 'Decline Pitch?',
      description: 'Are you sure you want to decline this pitch?',
      cta: isClientRole ? 'Submit Reason' : 'Yes, decline!',
    };
  })();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPitch, setCurrentPitch] = useState(pitch);
  const [totalUGCVideos] = useState(null);
  const { mutate } = useGetCampaignById(isDemoCampaign ? null : campaign?.id);
  const navigate = useNavigate();

  const [maybeOpen, setMaybeOpen] = useState(false);
  const [maybeReason, setMaybeReason] = useState('');
  const [maybeNote, setMaybeNote] = useState('');
  const [creatorProfileFull, setCreatorProfileFull] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState('instagram'); // 'instagram' or 'tiktok'
  const [comments, setComments] = useState('');
  const MAYBE_REASONS = [
    { value: 'engagement_low', label: 'Engagement Rate Too Low' },
    { value: 'not_fit_brief', label: 'Does Not Fit Criteria in Campaign Brief' },
    { value: 'not_fit_campaign', label: 'Content is Not Fit for the Campaign' },
    { value: 'others', label: 'Others' },
  ];

  useEffect(() => {
    setCurrentPitch(pitch);
    setComments(((pitch?.adminComments ?? '') || '').toString());
  }, [pitch]);

  // Seed the platform toggle when the modal opens. Prefer the scrape platform
  // for this pitch, so Apify numbers are the ones on screen.
  useEffect(() => {
    if (!open) return;
    setSelectedPlatform(seedPitchPlatform(currentPitch));
  }, [open, currentPitch]);

  // Fetch full creator profile to hydrate Languages/Age/Pronouns when modal opens
  useEffect(() => {
    let cancelled = false;
    const userId = currentPitch?.user?.id;
    if (open && userId && !isDemoCampaign) {
      setCreatorProfileFull(null);
      axiosInstance
        .get(endpoints.creators.getCreatorFullInfo(userId))
        .then((res) => {
          if (cancelled) return;
          // API may return { user } or the user directly
          const payload = res?.data?.user || res?.data || null;
          if (payload) setCreatorProfileFull(payload);
        })
        .catch(() => {
          // non-blocking; keep UI as-is on error
        });
    }
    return () => {
      cancelled = true;
    };
  }, [open, currentPitch?.user?.id, isDemoCampaign]);

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

  const derivedInterests = useMemo(() => {
    const raw = creatorProfileFull?.creator?.interests?.length
      ? creatorProfileFull.creator.interests
      : (currentPitch?.user?.creator?.interests ?? []);
    const seen = new Set();
    return raw
      .map((item) => (typeof item === 'string' ? item : item?.name))
      .filter((name) => {
        if (!name || !name.trim()) return false;
        const key = name.trim().toUpperCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((name) => name.trim());
  }, [creatorProfileFull, currentPitch]);

  const availablePlatforms = useMemo(() => availablePitchPlatforms(currentPitch), [currentPitch]);

  const tierName =
    creatorProfile?.creditTier?.name ||
    creatorProfileFull?.creator?.creditTier?.name ||
    '—';

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING_REVIEW':
      case 'pending':
        return '#FFC702';
      case 'SENT_TO_CLIENT':
      case 'SENT_TO_CLIENT_WITH_COMMENTS':
        return '#8A5AFE';
      case 'APPROVED':
      case 'approved':
        return '#1ABF66';
      case 'REJECTED':
      case 'rejected':
        return '#D4321C';
      default:
        return '#8E8E93';
    }
  };

  const getStatusLabel = (status) => {
    if (!status) return '—';
    const map = {
      PENDING_REVIEW: 'Pending Review',
      SENT_TO_CLIENT: 'Sent to Client',
      SENT_TO_CLIENT_WITH_COMMENTS: 'Sent to Client',
      APPROVED: 'Approved',
      approved: 'Approved',
      REJECTED: 'Rejected',
      rejected: 'Rejected',
    };
    return map[status] || status.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
  };

  const activePlatform = selectedPlatform === 'tiktok' ? 'tiktok' : 'instagram';
  const resolvedStats = resolvePitchPlatformStats({
    pitch: currentPitch,
    creatorProfileFull,
    platform: activePlatform,
  });
  const activeStats = {
    followers: resolvedStats.followers,
    engagementRate: resolvedStats.engagementRate,
    averageLikes: resolvedStats.averageLikes,
  };

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
    // Hybrid pitch UX: 'approve' is final; 'send_to_client' forwards to client review
    const sendingToClient = confirmDialog.type === 'send_to_client';

    if (isDemoCampaign) {
      const updatedPitch = { ...pitch, status: 'APPROVED', displayStatus: 'APPROVED' };
      setCurrentPitch(updatedPitch);
      onUpdate?.(updatedPitch);
      enqueueSnackbar('Pitch approved successfully');
      setConfirmDialog({ open: false, type: null });
      onClose();
      return;
    }

    try {
      setIsSubmitting(true);

      let response;

      // Check if this is a V3 pitch (client-created campaign)
      if (campaign?.submissionVersion === 'v4') {
        // Use V3 endpoint for client-created campaigns
        const v3PitchId = pitch.pitchId || pitch.id;

        // Check user role to call the correct endpoint
        if (isClientRole) {
          // Client approves pitch
          response = await axiosInstance.patch(
            endpoints.campaign.pitch.v3.approveClient(v3PitchId)
          );
        } else {
          // Admin approves pitch — explicit action tells the backend whether this is a
          // final approval or a forward to client review
          response = await axiosInstance.patch(endpoints.campaign.pitch.v3.approve(v3PitchId), {
            action: sendingToClient ? 'send_to_client' : 'approve',
            adminComments: comments,
          });
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

      const updatedPitch = { ...pitch, status: sendingToClient ? 'SENT_TO_CLIENT' : 'approved' };
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
    if (isDemoCampaign) {
      const updatedPitch = { ...pitch, status: 'REJECTED', displayStatus: 'REJECTED' };
      setCurrentPitch(updatedPitch);
      onUpdate?.(updatedPitch);
      enqueueSnackbar('Pitch declined successfully');
      setConfirmDialog({ open: false, type: null });
      onClose();
      return;
    }

    try {
      setIsSubmitting(true);

      let response;

      // Check if this is a V3 pitch (client-created campaign)
      if (campaign?.submissionVersion === 'v4') {
        // Use V3 endpoint for client-created campaigns
        const v3PitchId = pitch.pitchId || pitch.id;

        // Check user role to call the correct endpoint
        if (isClientRole) {
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

  const handleCloseMaybe = () => {
    setMaybeOpen(false);
    setMaybeReason('');
    setMaybeNote('');
  };

  const handleMaybeSubmit = async () => {
    if (isDemoCampaign) {
      const reasonLabel =
        maybeReason === 'others'
          ? 'Other'
          : MAYBE_REASONS.find((reason) => reason.value === maybeReason)?.label || 'Unspecified';
      const updatedPitch = {
        ...pitch,
        status: 'MAYBE',
        displayStatus: 'MAYBE',
        rejectionReason: reasonLabel,
        ...(maybeReason === 'others' && maybeNote.trim()
          ? { customRejectionText: maybeNote.trim() }
          : {}),
      };

      setCurrentPitch(updatedPitch);
      onUpdate?.(updatedPitch);
      enqueueSnackbar('Pitch marked as Maybe');
      setMaybeOpen(false);
      setMaybeReason('');
      setMaybeNote('');
      return;
    }

    try {
      setIsSubmitting(true);

      if (campaign?.submissionVersion === 'v4' && isClientRole) {
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
            width: 'calc(100% - 16px)',
            maxWidth: 480,
            m: 1,
            maxHeight: 'calc(100% - 16px)',
            borderRadius: '16px',
            border: `1px solid ${LINE}`,
            bgcolor: '#FFFFFF',
            overflow: 'hidden',
          },
        }}
      >
        <DialogContent
          sx={{
            p: 2,
            overflowY: 'auto',
            '&:first-of-type': { pt: 2 },
          }}
        >
          <Stack spacing={2.5}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
              spacing={1.5}
            >
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
                <Avatar
                  src={currentPitch?.user?.photoURL}
                  alt={currentPitch?.user?.name}
                  sx={{ width: 56, height: 56, flexShrink: 0, border: `1px solid ${LINE}` }}
                />
                <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: 18,
                      fontWeight: 700,
                      lineHeight: '22px',
                      color: ONYX,
                      cursor: 'pointer',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      '&:hover': { color: '#1340FF' },
                    }}
                    noWrap
                    onClick={() => {
                      const creatorId = currentPitch?.userId || currentPitch?.user?.id;
                      if (!creatorId) return;
                      navigate(paths.dashboard.creator.profile(creatorId));
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
                        sx={{ fontSize: 14, fontWeight: 400, lineHeight: '18px', color: MUTED }}
                        noWrap
                      >
                        {email}
                      </Typography>
                    ) : null;
                  })()}
                </Stack>
              </Stack>

              <Stack alignItems="flex-end" spacing={1} sx={{ flexShrink: 0 }}>
                <IconButton
                  onClick={onClose}
                  sx={{ p: 0, color: '#636366', '&:hover': { bgcolor: 'transparent' } }}
                >
                  <Iconify icon="eva:close-fill" width={24} height={24} />
                </IconButton>
                {availablePlatforms.length > 0 && (
                  <Stack direction="row" spacing={1}>
                    {availablePlatforms.map((platform) => (
                      <IconButton
                        key={platform}
                        onClick={() => setSelectedPlatform(platform)}
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '8px',
                          bgcolor: '#FFFFFF',
                          border: '1px solid #E8E8E8',
                          boxShadow: 'inset 0px -3px 0px #E7E7E7',
                          '&:hover': { bgcolor: '#FAFAFA' },
                        }}
                      >
                        <Iconify
                          icon={platform === 'tiktok' ? 'ic:baseline-tiktok' : 'mdi:instagram'}
                          width={22}
                          sx={{ color: selectedPlatform === platform ? ONYX : '#C9C9C9' }}
                        />
                      </IconButton>
                    ))}
                  </Stack>
                )}
              </Stack>
            </Stack>

            {derivedLanguages.length > 0 && (
              <FieldGroup label="Languages">
                {derivedLanguages.map((language) => (
                  <TagChip
                    key={language}
                    label={typeof language === 'string' ? language : String(language)}
                  />
                ))}
              </FieldGroup>
            )}

            {derivedInterests.length > 0 && (
              <FieldGroup label="Interests">
                {derivedInterests.map((interest) => (
                  <TagChip key={interest} label={interest} />
                ))}
              </FieldGroup>
            )}

            <Stack spacing={1.5}>
              <Stack direction="row" alignItems="center">
                <MetaItem
                  compact
                  label="Age"
                  value={
                    derivedBirthDate ? String(dayjs().diff(dayjs(derivedBirthDate), 'year')) : '—'
                  }
                />
                <VDivider height={40} compact />
                <MetaItem compact label="Pronouns" value={derivedPronouns || '—'} />
                <VDivider height={40} compact />
                <MetaItem compact label="Tier" value={tierName} />
              </Stack>

              <Stack direction="row" alignItems="center" sx={{ width: 1 }}>
                <StatTile
                  compact
                  stat="followers"
                  value={formatCount(activeStats.followers)}
                  caption="Followers"
                />
                <VDivider height={64} compact />
                <StatTile
                  compact
                  stat="engagement"
                  value={formatEngagement(activeStats.engagementRate)}
                  caption="Engagement Rate"
                />
                <VDivider height={64} compact />
                <StatTile
                  compact
                  stat="likes"
                  value={formatLikes(activeStats.averageLikes)}
                  caption="Average Likes"
                />
              </Stack>
            </Stack>

            {/* Pitch Section */}

            <Stack spacing={1.5} sx={{ py: 2, borderTop: `1px solid #E7E7E7`, borderBottom: `1px solid #E7E7E7` }}>
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
                <Box
                  component="img"
                  src={
                    currentPitch?.type === 'video'
                      ? '/assets/icons/components/ic_videopitch.svg'
                      : '/assets/icons/components/ic_letterpitch.svg'
                  }
                  alt=""
                  sx={{ width: 48, height: 48, flexShrink: 0 }}
                />
                <Stack spacing={0.75} alignItems="flex-start" sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{ fontSize: 16, fontWeight: 600, lineHeight: '20px', color: '#000000' }}
                  >
                    {currentPitch?.type === 'video' ? 'Video Pitch' : 'Letter Pitch'}
                  </Typography>
                  <Box
                    sx={{
                      ...RAISED,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      px: 1,
                      pt: 0.5,
                      pb: 0.75,
                    }}
                  >
                    <Box
                      sx={{ position: 'relative', display: 'inline-flex', width: 14, height: 14 }}
                    >
                      <CircularProgress
                        variant="determinate"
                        value={100}
                        size={14}
                        thickness={7}
                        sx={{ color: LINE }}
                      />
                      <CircularProgress
                        variant="determinate"
                        value={matchingPercentage}
                        size={14}
                        thickness={7}
                        sx={{
                          color: '#1ABF66',
                          position: 'absolute',
                          left: 0,
                          strokeLinecap: 'round',
                        }}
                      />
                    </Box>
                    <Typography
                      sx={{
                        fontSize: 13,
                        fontWeight: 700,
                        lineHeight: '16px',
                        color: '#48484A',
                        whiteSpace: { xs: 'normal', sm: 'nowrap' },
                      }}
                    >
                      {`${matchingPercentage}% MATCH WITH CAMPAIGN`}
                    </Typography>
                  </Box>
                </Stack>
              </Stack>

              <Stack direction="row" spacing={2.5} justifyContent="flex-end">
                <Stack spacing={0.5} alignItems="flex-end">
                  <Typography sx={{ fontSize: 12, lineHeight: '16px', color: MUTED }}>
                    Submitted On
                  </Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, lineHeight: '18px', color: ONYX }}>
                    {new Date(currentPitch?.createdAt).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Typography>
                </Stack>
                <Stack spacing={0.5} alignItems="flex-end">
                  <Typography sx={{ fontSize: 12, lineHeight: '16px', color: MUTED }}>
                    Status
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: 600,
                      lineHeight: '18px',
                      color: getStatusColor(currentPitch?.displayStatus || currentPitch?.status),
                    }}
                  >
                    {getStatusLabel(currentPitch?.displayStatus || currentPitch?.status)}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>

            {showClientApprovalNote && currentPitch?.clientVisibleApprovalNote?.trim() && (
              <Box>
                <Typography
                  sx={{
                    color: '#FFC702',
                    fontWeight: 700,
                    fontSize: 12,
                    letterSpacing: 0.5,
                    display: 'block',
                    mb: 0.5,
                  }}
                >
                  NOTE FROM APPROVER
                </Typography>
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 400,
                    color: ONYX,
                    lineHeight: 1.4,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {currentPitch.clientVisibleApprovalNote.trim()}
                </Typography>
              </Box>
            )}

            <Stack spacing="15px">
              {currentPitch?.type === 'video' && currentPitch?.content ? (
                <Box sx={{ borderRadius: '16px', overflow: 'hidden', bgcolor: '#000' }}>
                  <Box
                    component="video"
                    controls
                    sx={{ width: '100%', height: 'auto', display: 'block' }}
                    src={currentPitch.content}
                  />
                </Box>
              ) : (
                <Box
                  sx={{
                    p: '20px',
                    borderRadius: '16px',
                    bgcolor: '#FFFFFF',
                    border: '1px solid #1340FF',
                    fontSize: 14,
                    lineHeight: '18px',
                    color: ONYX,
                    '& p': { margin: 0, '& + p': { mt: 1 } },
                  }}
                >
                  <Markdown children={currentPitch?.content || 'No content available'} />
                </Box>
              )}

              <Stack spacing={0.75}>
                <Typography
                  sx={{ fontSize: 12, fontWeight: 500, lineHeight: '16px', color: '#636366' }}
                >
                  CS Comments
                </Typography>
                {!isClientRole &&
                (currentPitch?.displayStatus || currentPitch?.status) === 'PENDING_REVIEW' ? (
                  <TextField
                    multiline
                    minRows={1}
                    fullWidth
                    value={comments}
                    placeholder="Input comments about the creator that your clients might find helpful"
                    onChange={(e) => setComments(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        p: '10px 12px',
                        borderRadius: '8px',
                        fontSize: 14,
                        lineHeight: '18px',
                        color: ONYX,
                        '& fieldset': { borderColor: LINE },
                        '&:hover fieldset': { borderColor: '#D0D0D0' },
                      },
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      p: '10px 12px',
                      minHeight: 44,
                      borderRadius: '8px',
                      bgcolor: '#FFFFFF',
                      border: `1px solid ${LINE}`,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 14,
                        lineHeight: '18px',
                        color: adminCommentsText ? ONYX : MUTED,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {adminCommentsText || '—'}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Stack>
          </Stack>
        </DialogContent>

        {/* Action Buttons */}
        {!readOnly && (currentPitch?.status === 'PENDING_REVIEW' ||
          currentPitch?.displayStatus === 'PENDING_REVIEW' ||
          currentPitch?.status === 'undecided' ||
          currentPitch?.displayStatus === 'undecided' ||
          currentPitch?.status === 'AWAITING_APPROVAL' ||
          currentPitch?.displayStatus === 'AWAITING_APPROVAL') && (
          <DialogActions sx={{ p: 2, gap: 1, flexWrap: 'wrap' }}>
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

            {!isClientRole && campaign?.submissionVersion === 'v4' && hasClient && (
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setConfirmDialog({ open: true, type: 'send_to_client' })}
                disabled={isDisabled || isSubmitting}
                sx={{
                  bgcolor: '#fff',
                  color: '#1340FF',
                  borderRadius: 1,
                  py: 1,
                  fontSize: 14,
                  fontWeight: 600,
                  textTransform: 'none',
                  flex: 1,
                  '&:hover': {
                    bgcolor: '#f5f5f5',
                    border: '1.5px solid',
                    borderColor: '#1340FF',
                    borderBottom: '3px solid',
                    borderBottomColor: '#1340FF',
                  },
                }}
              >
                Send to Client
              </Button>
            )}

            {isClientRole && (
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
          {confirmDialog.type === 'decline' && isClientRole ? (
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
                  bgcolor: isApproveLikeDialog ? '#5abc6f' : '#ff3b30',
                  fontSize: '50px',
                  mb: -2,
                }}
              >
                {isApproveLikeDialog ? '🫣' : '🥹'}
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
                  {confirmDialogCopy.title}
                </Typography>
                <Typography variant="body1" sx={{ color: '#636366', mt: -0.5, mb: -3 }}>
                  {confirmDialogCopy.description}
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
              confirmDialog.type === 'decline' && isClientRole
                ? handleDecline
                : isApproveLikeDialog
                  ? handleApprove
                  : handleDecline
            }
            disabled={isSubmitting}
            sx={{
              bgcolor: isApproveLikeDialog ? '#026D54' : '#ffffff',
              color:
                isApproveLikeDialog
                  ? '#fff'
                  : isClientRole && confirmDialog.type === 'decline'
                    ? '#D4321C'
                    : '#ff3b30',
              border: isApproveLikeDialog ? 'none' : '1.5px solid #e7e7e7',
              borderBottom: '3px solid',
              borderBottomColor: isApproveLikeDialog ? '#202021' : '#e7e7e7',
              borderRadius: 1.15,
              flex: 1,
              py: 1.2,
              ml: 1,
              fontWeight: 600,
              '&:hover': {
                bgcolor: isApproveLikeDialog ? '#1e4a3a' : '#e7e7e7',
              },
            }}
          >
            {isSubmitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <>
                {isApproveLikeDialog && (
                  <Iconify icon="eva:checkmark-fill" width={20} sx={{ mr: 0.5 }} />
                )}
                {confirmDialogCopy.cta}
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
            {isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Submit Reason'}
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
  readOnly: PropTypes.bool,
  showClientApprovalNote: PropTypes.bool,
};

export default PitchModalMobile;
