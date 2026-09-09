/* eslint-disable no-unsafe-optional-chaining */
import dayjs from 'dayjs';
/* eslint-disable no-nested-ternary */
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import React, { useMemo, useState, useEffect } from 'react';

import { alpha } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';
import {
  Box,
  Stack,
  Dialog,
  Avatar,
  Button,
  Divider,
  TextField,
  IconButton,
  Typography,
  DialogTitle,
  Autocomplete,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useResponsive } from 'src/hooks/use-responsive';

import { formatNumber } from 'src/utils/media-kit-utils';
import axiosInstance, { endpoints } from 'src/utils/axios';
import { campaignHasClient } from 'src/utils/campaign-flow';

import { useAuthContext } from 'src/auth/hooks';
import { useGetAllCreators } from 'src/api/creator';

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
} from './v3-pitch-modal-parts';
import {
  availablePitchPlatforms,
  resolvePitchPlatformStats,
  seedPitchPlatform,
} from './resolve-pitch-platform-stats';

const DASH = '\u2014';
const MAX_LANGUAGES = 3;
const MAX_INTERESTS = 5;

const V3PitchModal = ({ open, onClose, pitch, campaign, onUpdate, isDisabled = false }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPitch, setCurrentPitch] = useState(pitch);
  const [comments, setComments] = useState('');
  const [creatorProfileFull, setCreatorProfileFull] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState('instagram'); // 'instagram' or 'tiktok'
  const [agreementDialogOpen, setAgreementDialogOpen] = useState(false);
  const [agreementAmount, setAgreementAmount] = useState('');

  const resolvedAgreementTemplateId = useMemo(() => {
    if (campaign?.agreementTemplate?.id) return campaign.agreementTemplate.id;
    return (
      campaign?.campaignAdmin?.reduce(
        (found, item) => found || item?.admin?.user?.agreementTemplate?.[0]?.id || null,
        null
      ) || null
    );
  }, [campaign]);

  const displayStatus = pitch?.displayStatus || pitch?.status;
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isClient = user?.role === 'client';
  const mdDown = useResponsive('down', 'md');
  // Normalize admin comments text so UI displays whenever present
  const adminCommentsText = ((currentPitch?.adminComments ?? pitch?.adminComments ?? '') || '')
    .toString()
    .trim();

  useEffect(() => {
    setCurrentPitch(pitch);
    setCreatorProfileFull(null);
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
    if (open && userId) {
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

  // Interests arrive on the pitch payload; the secondary creator fetch overrides
  // them once it lands. Names repeat across sources, so de-duplicate.
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

  const visibleLanguages = derivedLanguages.slice(0, MAX_LANGUAGES);
  const hiddenLanguages = Math.max(0, derivedLanguages.length - MAX_LANGUAGES);
  const visibleInterests = derivedInterests.slice(0, MAX_INTERESTS);
  const hiddenInterests = Math.max(0, derivedInterests.length - MAX_INTERESTS);

  const visibleEmail = (() => {
    const email = currentPitch?.user?.email;
    const isGuestEmail = email?.includes('@tempmail.com') || email?.startsWith('guest_');
    return email && !isGuestEmail ? email : null;
  })();

  // The three numbers follow the platform toggle in the header.
  const availablePlatforms = useMemo(() => availablePitchPlatforms(currentPitch), [currentPitch]);

  const { followers: followerCount, engagementRate, averageLikes } = resolvePitchPlatformStats({
    pitch: currentPitch,
    creatorProfileFull,
    platform: selectedPlatform === 'tiktok' ? 'tiktok' : 'instagram',
  });

  const followersText = followerCount == null ? DASH : formatNumber(followerCount);
  const engagementText = engagementRate == null ? DASH : `${Number(engagementRate).toFixed(2)}%`;
  const averageLikesText = averageLikes == null ? DASH : formatNumber(averageLikes);

  const ageText = derivedBirthDate ? String(dayjs().diff(dayjs(derivedBirthDate), 'year')) : DASH;
  const pronounsText = derivedPronouns || DASH;
  const tierName =
    creatorProfile?.creditTier?.name ||
    currentPitch?.user?.creator?.creditTier?.name ||
    currentPitch?._creditTier?.name ||
    DASH;

  const matchPercentage = Math.min(currentPitch?.matchingPercentage || 100, 100);

  const isMaybe =
    (currentPitch?.status || '').toUpperCase() === 'MAYBE' ||
    (currentPitch?.displayStatus || '').toUpperCase() === 'MAYBE';
  const clientReason =
    currentPitch?.customRejectionText || currentPitch?.rejectionReason || (isMaybe ? DASH : null);

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
        return '#8A5AFE';
      case 'SENT_TO_CLIENT_WITH_COMMENTS':
        return '#8A5AFE';
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
        const mockStatusByAction = {
          reject: 'REJECTED',
          approve: 'APPROVED',
          send_to_client: 'SENT_TO_CLIENT',
        };
        const mockUpdatedPitch = {
          ...pitch,
          status: mockStatusByAction[action] || pitch.status,
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
      // Explicit action: admin approval is final (forwarding is the Send to Client button)
      handleAction('approve', 'approve', { adminComments: comments, action: 'approve' });
    } else if (isClient && displayStatus === 'PENDING_REVIEW') {
      handleAction('approve', 'approve/client', { adminComments: comments });
    }
  };

  const handleSendToClient = () => {
    if (isAdmin && displayStatus === 'PENDING_REVIEW') {
      handleAction('send_to_client', 'approve', {
        adminComments: comments,
        action: 'send_to_client',
      });
    }
  };

  const handleReject = () => {
    if (isAdmin && (displayStatus === 'PENDING_REVIEW' || displayStatus === 'MAYBE')) {
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
    if (!pitch?.id || String(pitch.id).startsWith('shortlisted-')) {
      enqueueSnackbar('Cannot set agreement for this row — open a pitch record from the list.', {
        variant: 'warning',
      });
      return;
    }
    if (!resolvedAgreementTemplateId && !campaign?.agreementTemplateId) {
      enqueueSnackbar(
        'No agreement template on this campaign. Add one in campaign settings, then try again.',
        { variant: 'error' }
      );
      return;
    }
    setAgreementAmount('');
    setAgreementDialogOpen(true);
  };

  const handleConfirmSetAgreement = async () => {
    if (!pitch?.id || String(pitch.id).startsWith('shortlisted-')) return;

    const templateId = resolvedAgreementTemplateId || campaign?.agreementTemplateId;
    if (!templateId) {
      enqueueSnackbar('Agreement template is required.', { variant: 'error' });
      return;
    }

    let amountNum = null;
    if (agreementAmount.trim()) {
      amountNum = parseInt(agreementAmount, 10);
      if (Number.isNaN(amountNum) || amountNum < 0) {
        enqueueSnackbar('Enter a valid payment amount or leave the field empty.', {
          variant: 'error',
        });
        return;
      }
    }

    setLoading(true);
    try {
      const res = await axiosInstance.patch(endpoints.campaign.pitch.v3.setAgreement(pitch.id), {
        agreementTemplateId: templateId,
        ...(amountNum != null ? { amount: amountNum } : {}),
      });
      enqueueSnackbar(res?.data?.message || 'Agreement sent to creator', { variant: 'success' });
      setAgreementDialogOpen(false);
      onUpdate({
        ...pitch,
        status: 'AGREEMENT_PENDING',
        displayStatus: 'AGREEMENT_PENDING',
        agreementTemplateId: templateId,
        ...(amountNum != null ? { amount: amountNum } : {}),
      });
      onClose();
    } catch (error) {
      enqueueSnackbar(
        error?.response?.data?.message || error?.message || 'Failed to set agreement',
        { variant: 'error' }
      );
    } finally {
      setLoading(false);
    }
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
        // MAYBE approvals are always final on the backend, so only offer forwarding
        // for PENDING_REVIEW pitches on campaigns that actually have a client
        if (displayStatus === 'PENDING_REVIEW' && campaignHasClient(campaign)) {
          actions.push({
            label: 'Send to Client',
            action: 'send_to_client',
            icon: 'eva:paper-plane-fill',
            color: 'primary',
          });
        }
      } else if (displayStatus === 'APPROVED' || displayStatus === 'approved') {
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
      } else if (displayStatus === 'APPROVED' || displayStatus === 'approved') {
        actions.push({
          label: 'Set Agreement',
          action: 'agreement',
          icon: 'eva:file-text-fill',
          color: 'primary',
        });
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
        isDisabled={isDisabled}
      />
    );
  }

  // Regular creator modal
  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth={false}
        PaperProps={{
          sx: {
            width: { xs: 'calc(100% - 16px)', sm: '100%' },
            maxWidth: 842,
            m: { xs: 1, sm: 2 },
            maxHeight: { xs: 'calc(100% - 16px)', sm: '90vh' },
            borderRadius: '16px',
            border: `1px solid ${LINE}`,
            bgcolor: '#FFFFFF',
            boxShadow: (theme) => theme.customShadows.dialog,
            overflow: 'hidden',
          },
        }}
      >
        <DialogContent
          sx={{
            p: { xs: 2, md: 3 },
            '&:first-of-type': { pt: { xs: 2, md: 3 } },
            '&::-webkit-scrollbar': { width: 8 },
            '&::-webkit-scrollbar-thumb': {
              borderRadius: 4,
              bgcolor: 'rgba(0,0,0,0.2)',
            },
          }}
        >
          <Stack spacing={3}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'flex-end' }}
              spacing={2}
            >
              {/* Creator */}
              <Stack direction="row" alignItems="center" spacing="17px" sx={{ minWidth: 0 }}>
                <Avatar
                  src={currentPitch?.user?.photoURL}
                  alt={currentPitch?.user?.name}
                  sx={{
                    width: { xs: 56, md: 63 },
                    height: { xs: 56, md: 63 },
                    flexShrink: 0,
                    border: `1px solid ${LINE}`,
                  }}
                />
                <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: 18,
                      fontWeight: 700,
                      lineHeight: '22px',
                      color: ONYX,
                      cursor: 'pointer',
                      '&:hover': { color: '#1340FF' },
                    }}
                    onClick={() => {
                      const creatorId = currentPitch?.userId || currentPitch?.user?.id;
                      if (!creatorId) return;
                      navigate(paths.dashboard.creator.profile(creatorId));
                    }}
                  >
                    {currentPitch?.user?.name}
                  </Typography>
                  {visibleEmail && (
                    <Typography
                      sx={{ fontSize: 14, fontWeight: 400, lineHeight: '18px', color: MUTED }}
                      noWrap
                    >
                      {visibleEmail}
                    </Typography>
                  )}
                </Stack>
              </Stack>

              {/* Close, then the platform toggle */}
              <Stack alignItems="flex-end" spacing="15px" sx={{ flexShrink: 0 }}>
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
                          width: { xs: 40, md: 44 },
                          height: { xs: 40, md: 44 },
                          borderRadius: '8px',
                          bgcolor: '#FFFFFF',
                          border: '1px solid #E8E8E8',
                          boxShadow: 'inset 0px -3px 0px #E7E7E7',
                          '&:hover': { bgcolor: '#FAFAFA' },
                        }}
                      >
                        <Iconify
                          icon={platform === 'tiktok' ? 'ic:baseline-tiktok' : 'mdi:instagram'}
                          width={24}
                          sx={{ color: selectedPlatform === platform ? ONYX : '#C9C9C9' }}
                        />
                      </IconButton>
                    ))}
                  </Stack>
                )}
              </Stack>
            </Stack>

            <Stack spacing="15px">
            {/* Languages and interests on the left, numbers on the right */}
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', md: 'flex-start' }}
              spacing={3}
            >
              <Stack spacing={1.5} sx={{ minWidth: 0 }}>
                {visibleLanguages.length > 0 && (
                  <FieldGroup label="Languages">
                    {visibleLanguages.map((language) => (
                      <TagChip key={language} label={language} />
                    ))}
                    {hiddenLanguages > 0 && <TagChip label={`+${hiddenLanguages}`} />}
                  </FieldGroup>
                )}

                {visibleInterests.length > 0 && (
                  <FieldGroup label="Interests">
                    {visibleInterests.map((interest) => (
                      <TagChip key={interest} label={interest} />
                    ))}
                    {hiddenInterests > 0 && <TagChip label={`+${hiddenInterests}`} />}
                  </FieldGroup>
                )}
              </Stack>

              <Stack
                alignItems={{ xs: 'stretch', md: 'flex-end' }}
                spacing={2}
                sx={{ flexShrink: 0, width: { xs: 1, md: 377 } }}
              >
                <Stack direction="row" alignItems="center" sx={{ height: 40 }}>
                  <MetaItem compact={mdDown} label="Age" value={ageText} />
                  <VDivider height={40} compact={mdDown} />
                  <MetaItem compact={mdDown} label="Pronouns" value={pronounsText} />
                  <VDivider height={40} compact={mdDown} />
                  <MetaItem compact={mdDown} label="Tier" value={tierName} />
                </Stack>

                <Stack direction="row" alignItems="center" sx={{ width: 1, height: 64 }}>
                  <StatTile
                    compact={mdDown}
                    stat="followers"
                    value={followersText}
                    caption="Followers"
                  />
                  <VDivider height={64} compact={mdDown} />
                  <StatTile
                    compact={mdDown}
                    stat="engagement"
                    value={engagementText}
                    caption="Engagement Rate"
                  />
                  <VDivider height={64} compact={mdDown} />
                  <StatTile
                    compact={mdDown}
                    stat="likes"
                    value={averageLikesText}
                    caption="Average Likes"
                  />
                </Stack>
              </Stack>
            </Stack>

            {/* Pitch type, match, submitted on, status */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={2}
              sx={{
                py: 2,
                borderTop: '1px solid #E7E7E7',
                borderBottom: '1px solid #E7E7E7',
              }}
            >
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
                        value={matchPercentage}
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
                      {`${matchPercentage}% MATCH WITH CAMPAIGN`}
                    </Typography>
                  </Box>
                </Stack>
              </Stack>

              <Stack direction="row" spacing={2.5} alignItems="center" sx={{ flexShrink: 0 }}>
                <Stack spacing={0.5} alignItems="flex-end">
                  <Typography sx={{ fontSize: 12, lineHeight: '16px', color: MUTED }}>
                    Submitted On
                  </Typography>
                  <Typography
                    sx={{ fontSize: 14, fontWeight: 700, lineHeight: '18px', color: ONYX }}
                  >
                    {new Date(currentPitch?.createdAt).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Typography>
                </Stack>

                <Stack spacing={0.5} alignItems="flex-end" sx={{ maxWidth: 220 }}>
                  <Typography sx={{ fontSize: 12, lineHeight: '16px', color: MUTED }}>
                    Status
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: 600,
                      lineHeight: '18px',
                      color: getStatusColor(displayStatus),
                    }}
                  >
                    {getStatusLabel(displayStatus)}
                  </Typography>

                  {clientReason && (
                    <Stack spacing={0.25} alignItems="flex-end" sx={{ pt: 1 }}>
                      <Typography
                        sx={{
                          fontSize: 12,
                          fontWeight: 700,
                          lineHeight: '16px',
                          letterSpacing: 0.5,
                          color: '#FFC702',
                        }}
                      >
                        CLIENT REASON
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 12,
                          fontWeight: 400,
                          lineHeight: '16px',
                          color: '#000000',
                          textAlign: 'right',
                          wordBreak: 'break-word',
                        }}
                      >
                        {clientReason}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Stack>
            </Stack>
            </Stack>

            {/* Pitch Content Section */}
            <Stack spacing="15px">
              <Box
                sx={{
                  p: '20px',
                  borderRadius: '16px',
                  bgcolor: '#FFFFFF',
                  border: '1px solid #1340FF',
                  fontSize: 14,
                  lineHeight: '18px',
                  color: ONYX,
                  '& p': {
                    margin: 0,
                    '& + p': { mt: 1 },
                  },
                }}
              >
                <Markdown children={currentPitch?.content || 'No content available'} />
              </Box>

              <Stack spacing={0.75}>
                <Typography
                  sx={{ fontSize: 12, fontWeight: 500, lineHeight: '16px', color: '#636366' }}
                >
                  CS Comments
                </Typography>
                {user?.role !== 'client' && displayStatus === 'PENDING_REVIEW' ? (
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

        {availableActions.length > 0 && (
        <DialogActions sx={{ px: { xs: 2, md: 3 }, pb: { xs: 2, md: 3 }, pt: 0, flexWrap: 'wrap', gap: 1 }}>
              {availableActions.find((action) => action.action === 'reject') && (
                <Button
                  variant="contained"
                  onClick={() => setRejectDialogOpen(true)}
                  disabled={loading || isDisabled}
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
                    '&.Mui-disabled': {
                      cursor: 'not-allowed',
                      pointerEvents: 'auto',
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
                  disabled={loading || isDisabled}
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
                    '&.Mui-disabled': {
                      cursor: 'not-allowed',
                      pointerEvents: 'auto',
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
              {availableActions.find((action) => action.action === 'send_to_client') && (
                <Button
                  variant="contained"
                  onClick={handleSendToClient}
                  disabled={loading || isDisabled}
                  sx={{
                    textTransform: 'none',
                    minHeight: 42,
                    minWidth: 100,
                    bgcolor: '#FFFFFF',
                    color: '#1340FF',
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
                      borderColor: '#1340FF',
                      borderBottom: '3px solid',
                      borderBottomColor: '#1340FF',
                    },
                    '&.Mui-disabled': {
                      cursor: 'not-allowed',
                      pointerEvents: 'auto',
                    },
                  }}
                >
                  {loading ? <CircularProgress size={20} color="inherit" /> : 'Send to Client'}
                </Button>
              )}
              {availableActions.find((action) => action.action === 'agreement') && (
                <Button
                  variant="contained"
                  onClick={handleSetAgreement}
                  disabled={loading || isDisabled}
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
                    '&.Mui-disabled': {
                      cursor: 'not-allowed',
                      pointerEvents: 'auto',
                    },
                  }}
                >
                  Set Agreement
                </Button>
              )}
        </DialogActions>
        )}
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

      <Dialog
        open={agreementDialogOpen}
        onClose={() => !loading && setAgreementDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Send agreement to creator</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              This prepares the agreement for the creator to review and submit. Payment amount is
              optional.
            </Typography>
            <TextField
              label="Payment amount (optional)"
              type="number"
              fullWidth
              value={agreementAmount}
              onChange={(e) => setAgreementAmount(e.target.value)}
              inputProps={{ min: 0 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAgreementDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleConfirmSetAgreement} disabled={loading}>
            {loading ? <CircularProgress size={22} /> : 'Send to creator'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// Modal for Guest Creator
export function ViewGuestCreatorModal({
  open,
  onClose,
  pitch,
  isAdmin,
  campaign,
  onSwapped,
  isDisabled = false,
}) {
  const { enqueueSnackbar } = useSnackbar();
  const { data: allCreators, isLoading: creatorsLoading } = useGetAllCreators();

  const [selectedPlatformCreator, setSelectedPlatformCreator] = React.useState(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [showCreatorSelection, setShowCreatorSelection] = React.useState(false);

  // Form state for editable fields
  const [formValues, setFormValues] = React.useState({
    name: pitch?.user?.name || '',
    followerCount: pitch?.followerCount || '',
    engagementRate: pitch?.engagementRate || '',
    profileLink: pitch?.user?.creator?.profileLink || '',
    adminComments: pitch?.adminComments || '',
  });

  // Update form values when pitch changes
  React.useEffect(() => {
    if (pitch) {
      setFormValues({
        name: pitch?.user?.name || '',
        followerCount: pitch?.followerCount || '',
        engagementRate: pitch?.engagementRate || '',
        profileLink: pitch?.user?.creator?.profileLink || '',
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
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: '#F4F4F4',
          width: { xs: '95%', sm: '90%', md: '900px' },
          maxWidth: { xs: '95%', sm: '90%', md: '900px' },
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
        {!showCreatorSelection ? 'Non-Platform Creator' : 'Link Non-Platform Creator'}
        <IconButton onClick={onClose} size="small">
          <Iconify icon="mdi:close" width={24} />
        </IconButton>
      </DialogTitle>

      <Divider sx={{ borderColor: '#EBEBEB', mx: 3 }} />

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ pb: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={2}>
            {/* Creator Name */}
            <Box sx={{ flex: 1, minWidth: { xs: '100%', md: 'auto' } }}>
              <Typography
                sx={{
                  mb: 0.5,
                  display: 'block',
                  color: '#636366',
                  fontSize: '14px !important',
                  fontWeight: 600,
                }}
              >
                Creator Name
              </Typography>
              {isAdmin ? (
                <TextField
                  fullWidth
                  placeholder="Creator Name"
                  value={formValues.name}
                  onChange={handleFieldChange('name')}
                  disabled={submitting}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#fff',
                      minHeight: 48,
                      borderRadius: 1,
                    },
                  }}
                />
              ) : (
                <Typography variant="body2" sx={{ color: 'text.primary' }}>
                  {formValues.name || '—'}
                </Typography>
              )}
            </Box>

            {/* Profile Link */}
            <Box sx={{ flex: 1, minWidth: { xs: '100%', md: 'auto' } }}>
              <Typography
                sx={{
                  mb: 0.5,
                  display: 'block',
                  color: '#636366',
                  fontSize: '14px !important',
                  fontWeight: 600,
                }}
              >
                Profile Link
              </Typography>
              {isAdmin ? (
                <TextField
                  fullWidth
                  placeholder="Profile Link"
                  value={formValues.profileLink}
                  onChange={handleFieldChange('profileLink')}
                  disabled={submitting}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#fff',
                      minHeight: 48,
                      borderRadius: 1,
                    },
                  }}
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

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={2}>
            {/* Follower Count */}
            <Box sx={{ flex: 1, minWidth: { xs: '100%', md: 'auto' } }}>
              <Typography
                sx={{
                  mb: 0.5,
                  display: 'block',
                  color: '#636366',
                  fontSize: '14px !important',
                  fontWeight: 600,
                }}
              >
                Follower Count
              </Typography>
              {isAdmin ? (
                <TextField
                  fullWidth
                  placeholder="Follower Count"
                  value={formValues.followerCount}
                  onChange={handleFieldChange('followerCount')}
                  disabled={submitting}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#fff',
                      minHeight: 48,
                      borderRadius: 1,
                    },
                  }}
                />
              ) : (
                <Typography variant="body2" sx={{ color: 'text.primary' }}>
                  {formValues.followerCount || '—'}
                </Typography>
              )}
            </Box>

            {/* Engagement Rate */}
            <Box sx={{ flex: 1, minWidth: { xs: '100%', md: 'auto' } }}>
              <Typography
                sx={{
                  mb: 0.5,
                  display: 'block',
                  color: '#636366',
                  fontSize: '14px !important',
                  fontWeight: 600,
                }}
              >
                Engagement Rate (%)
              </Typography>
              {isAdmin ? (
                <TextField
                  fullWidth
                  placeholder="Engagement Rate"
                  value={formValues.engagementRate}
                  onChange={handleFieldChange('engagementRate')}
                  disabled={submitting}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#fff',
                      minHeight: 48,
                      borderRadius: 1,
                    },
                  }}
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
              sx={{
                mb: 0.5,
                display: 'block',
                color: '#636366',
                fontSize: '14px !important',
                fontWeight: 600,
              }}
            >
              CS Comments (Optional)
            </Typography>
            {isAdmin ? (
              <TextField
                fullWidth
                placeholder="Input comments about the creator that your clients might find helpful"
                value={formValues.adminComments}
                onChange={handleFieldChange('adminComments')}
                disabled={submitting}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#fff',
                    minHeight: 48,
                    borderRadius: 1,
                  },
                }}
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
              sx={{
                mb: 0.5,
                display: 'block',
                color: '#636366',
                fontSize: '14px !important',
                fontWeight: 600,
              }}
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
                      sx={{ width: 32, height: 32, bgcolor: '#e0e0e0' }}
                    >
                      {option?.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {option?.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#636366' }}>
                        {option?.email}
                      </Typography>
                      {option?.creator?.instagram && (
                        <Typography
                          variant="caption"
                          color="primary.main"
                          sx={{ display: 'block' }}
                        >
                          {option.creator.instagram}
                        </Typography>
                      )}
                    </Box>
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
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: '#fff',
                        minHeight: 48,
                        borderRadius: 1,
                      },
                    }}
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

      <DialogActions sx={{ px: 3, pb: 3 }}>
        {isAdmin && !showCreatorSelection && (
          <>
            <Button
              onClick={() => setShowCreatorSelection(true)}
              disabled={submitting || isDisabled}
              sx={{
                bgcolor: '#FFFFFF',
                color: '#1340FF',
                border: '1.5px solid #e7e7e7',
                borderBottom: '3px solid #e7e7e7',
                borderRadius: 1.15,
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
                '&.Mui-disabled': {
                  cursor: 'not-allowed',
                  pointerEvents: 'auto',
                },
              }}
              startIcon={
                <Iconify icon="mdi:account-plus-outline" width={20} sx={{ color: 'inherit' }} />
              }
            >
              Link Creator
            </Button>
            <Button
              onClick={handleUpdateGuestCreator}
              disabled={submitting || isDisabled}
              sx={{
                bgcolor: '#203ff5',
                border: '1px solid #203ff5',
                borderBottom: '3px solid #1933cc',
                height: 44,
                minWidth: 100,
                color: '#fff',
                fontSize: '0.875rem',
                fontWeight: 600,
                px: 3,
                textTransform: 'none',
                '&:hover': { bgcolor: '#1933cc', opacity: 0.9 },
                '&.Mui-disabled': {
                  bgcolor: '#C7C7CC',
                  color: '#fff',
                  border: '1px solid #C7C7CC',
                  borderBottom: '3px solid #0000001A',
                  cursor: 'not-allowed',
                  pointerEvents: 'auto',
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
                '&.Mui-disabled': {
                  cursor: 'not-allowed',
                  pointerEvents: 'auto',
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLinkCreator}
              disabled={submitting || !selectedPlatformCreator}
              sx={{
                bgcolor: '#203ff5',
                border: '1px solid #203ff5',
                borderBottom: '3px solid #1933cc',
                height: 44,
                minWidth: 100,
                color: '#fff',
                fontSize: '0.875rem',
                fontWeight: 600,
                px: 3,
                textTransform: 'none',
                '&:hover': { bgcolor: '#1933cc', opacity: 0.9 },
                '&.Mui-disabled': {
                  bgcolor: '#C7C7CC',
                  color: '#fff',
                  border: '1px solid #C7C7CC',
                  borderBottom: '3px solid #0000001A',
                  cursor: 'not-allowed',
                  pointerEvents: 'auto',
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
              },
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
  isDisabled: PropTypes.bool,
};

export default V3PitchModal;

V3PitchModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  pitch: PropTypes.object,
  campaign: PropTypes.object,
  onUpdate: PropTypes.func,
  isDisabled: PropTypes.bool,
};
