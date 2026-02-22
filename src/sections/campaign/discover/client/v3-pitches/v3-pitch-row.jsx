import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';

import { Box, Link, Stack, Avatar, Tooltip, Popover, MenuItem, TableRow, TableCell, Typography, IconButton, CircularProgress } from '@mui/material';

import { useResponsive } from 'src/hooks/use-responsive';

import { fDate } from 'src/utils/format-time';
import axiosInstance, { endpoints } from 'src/utils/axios';
import { formatNumber, createSocialProfileUrl, extractUsernameFromProfileLink } from 'src/utils/media-kit-utils';

import { OUTREACH_STATUS_OPTIONS, getOutreachStatusConfig } from 'src/contants/outreach';

import Iconify from 'src/components/iconify';

import V3PitchActions from './v3-pitch-actions';

const TYPE_LABELS = {
  video: 'Pitch (Video)',
  text: 'Pitch (Letter)',
  shortlisted: 'Shortlisted',
};

const PitchTypeCell = React.memo(({ type, isGuestCreator }) => {
  const label = TYPE_LABELS[type] ?? (type || '—');

  let subtitle = null;
  if (type === 'shortlisted') {
    subtitle = isGuestCreator ? '(Non-platform)' : '(On Platform)';
  }

  return (
    <Stack>
      <Typography fontSize={13.5} noWrap>
        {label}
      </Typography>
      {subtitle && <Typography fontSize={13.5} noWrap>{subtitle}</Typography>}
    </Stack>
  );
});

PitchTypeCell.propTypes = {
  type: PropTypes.string,
  isGuestCreator: PropTypes.bool,
};

const getStatusText = (status, pitch, campaign) => {
  // Check for AGREEMENT_PENDING status with PENDING_REVIEW agreement form
  if (status === 'AGREEMENT_PENDING') {
    const agreementFormSubmission = campaign?.submission?.find(
      (sub) => sub?.submissionType?.type === 'AGREEMENT_FORM'
    );

    if (agreementFormSubmission?.status === 'PENDING_REVIEW') {
      return 'PENDING APPROVAL';
    }
  }

  const statusTextMap = {
    PENDING_REVIEW: 'PENDING REVIEW',
    SENT_TO_CLIENT: 'SENT TO CLIENT',
    SENT_TO_CLIENT_WITH_COMMENTS: 'SENT TO CLIENT',
    MAYBE: 'MAYBE',
    maybe: 'MAYBE',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    AGREEMENT_PENDING: 'AGREEMENT PENDING',
    AGREEMENT_SUBMITTED: 'AGREEMENT SUBMITTED',
  };

  return statusTextMap[status] || status;
};

const PitchRow = ({ pitch, displayStatus, statusInfo, isGuestCreator, campaign, isCreditTier, onViewPitch, onRemoved, onOutreachUpdate, isDisabled = false }) => {
  const smUp = useResponsive('up', 'sm');
  const { enqueueSnackbar } = useSnackbar();

  // Outreach status dropdown state
  const [outreachAnchorEl, setOutreachAnchorEl] = useState(null);
  const [outreachLoading, setOutreachLoading] = useState(false);
  const outreachPopoverOpen = Boolean(outreachAnchorEl);

  const handleOutreachClick = (event) => {
    if (isDisabled || pitch._isShortlistedOnly) return;
    event.stopPropagation();
    setOutreachAnchorEl(event.currentTarget);
  };

  const handleOutreachClose = () => {
    setOutreachAnchorEl(null);
  };

  const handleOutreachSelect = async (statusValue) => {
    handleOutreachClose();

    // Don't update if same status
    if (statusValue === pitch.outreachStatus) return;

    try {
      setOutreachLoading(true);
      await axiosInstance.patch(endpoints.campaign.pitch.v3.outreachStatus(pitch.id), {
        outreachStatus: statusValue,
      });

      enqueueSnackbar('Outreach status updated', { variant: 'success' });
      onOutreachUpdate?.();
    } catch (error) {
      console.error('Error updating outreach status:', error);
      enqueueSnackbar(error?.response?.data?.message || 'Failed to update outreach status', { variant: 'error' });
    } finally {
      setOutreachLoading(false);
    }
  };

  // Helper to extract username from stats or profile link
  const getUsername = (stats, profileLink) => stats?.username || (profileLink ? extractUsernameFromProfileLink(profileLink) : undefined);

  const instagramStats = pitch?.user?.creator?.instagramUser || null;
  const tiktokStats = pitch?.user?.creator?.tiktokUser || null;
  const profileLink = pitch.user?.creator?.profileLink || pitch.user?.profileLink;
  const instagramProfileLink = pitch.user?.creator?.instagramProfileLink;
  const tiktokProfileLink = pitch.user?.creator?.tiktokProfileLink;

  const instagramUsername = getUsername(instagramStats, instagramProfileLink);
  const tiktokUsername = getUsername(tiktokStats, tiktokProfileLink);
  const profileUsername = profileLink ? extractUsernameFromProfileLink(profileLink) : undefined;

  // Check if we have any social usernames to display
  const hasSocialUsernames = instagramUsername || tiktokUsername;

  const getDisplayData = () => {
    const resolveMetric = (...args) => args.find(val => val != null) ?? null;

    return {
      engagementRate: resolveMetric(
        instagramStats?.engagement_rate,
        tiktokStats?.engagement_rate,
        pitch.engagementRate
      ),
      followerCount: resolveMetric(
        instagramStats?.followers_count,
        tiktokStats?.follower_count,
        pitch.followerCount,
        pitch.user?.creator?.manualFollowerCount // Fallback for manually entered count
      ),
    };
  };

  // Get tier data from synthetic shortlisted row or creator's current tier
  const getTierData = () => {
    // For synthetic shortlisted rows (manually added creators), use the tier snapshot
    if (pitch._isShortlistedOnly && pitch._creditTier) {
      return {
        name: pitch._creditTier.name,
        creditsPerVideo: pitch._creditPerVideo || pitch._creditTier.creditsPerVideo,
      };
    }
    // For regular pitches, use creator's current tier
    const creatorTier = pitch.user?.creator?.creditTier;
    if (creatorTier) {
      return {
        name: creatorTier.name,
        creditsPerVideo: creatorTier.creditsPerVideo,
      };
    }
    return null;
  };

  const displayData = getDisplayData();

  return (
    <TableRow hover onClick={() => onViewPitch(pitch)} sx={{ cursor: 'pointer' }}>
      <TableCell
        sx={{
          py: { xs: 0.5, sm: 1 },
          px: { xs: 1, sm: 2 },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={{ xs: 1, sm: 1 }}>
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
          <Stack spacing={0}>
            <Typography variant="body2" fontSize={13.5}>{pitch.user?.name}</Typography>
            {hasSocialUsernames ? (
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.25 }}>
                {instagramUsername && (
                  <Stack direction="row" alignItems="center" spacing={0.3}>
                    <Iconify icon="mdi:instagram" width={14} sx={{ color: '#636366' }} />
                    <Link
                      href={createSocialProfileUrl(instagramUsername, 'instagram') || instagramProfileLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      underline="hover"
                      sx={{ color: '#636366', fontSize: 12, '&:hover': { color: '#1877F2' } }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {instagramUsername}
                    </Link>
                  </Stack>
                )}
                {tiktokUsername && (
                  <Stack direction="row" alignItems="center" spacing={0.3}>
                    <Iconify icon="ic:baseline-tiktok" width={14} sx={{ color: '#636366' }} />
                    <Link
                      href={createSocialProfileUrl(tiktokUsername, 'tiktok') || tiktokProfileLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      underline="hover"
                      sx={{ color: '#636366', fontSize: 12, '&:hover': { color: '#1877F2' } }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {tiktokUsername}
                    </Link>
                  </Stack>
                )}
              </Stack>
            ) : profileUsername && (
              <Stack direction="row" alignItems="center" spacing={0.3}>
                {profileLink?.includes('instagram.com') && (
                  <Iconify icon="mdi:instagram" width={14} sx={{ color: '#636366' }} />
                )}
                {profileLink?.includes('tiktok.com') && (
                  <Iconify icon="ic:baseline-tiktok" width={14} sx={{ color: '#636366' }} />
                )}
                <Link
                  href={profileLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                  sx={{ color: '#636366', fontSize: 12, '&:hover': { color: '#1877F2' } }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {profileUsername}
                </Link>
              </Stack>
            )}
          </Stack>
        </Stack>
      </TableCell>
      {/* Outreach Status Cell */}
      <TableCell sx={{ py: { xs: 0.5, sm: 1 }, px: { xs: 1, sm: 2 } }}>
        {(() => {
          const outreachConfig = getOutreachStatusConfig(pitch.outreachStatus);
          const isSynthetic = pitch._isShortlistedOnly;

          // For synthetic shortlisted rows (no real pitch record), show "Not Set" non-clickable
          if (isSynthetic) {
            return (
              <Typography fontSize={13.5} sx={{ color: '#8E8E93' }}>
                —
              </Typography>
            );
          }

          // No status set - show placeholder
          if (!outreachConfig) {
            return (
              <Box
                onClick={handleOutreachClick}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  py: 0.5,
                  px: 1,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#8E8E93',
                  border: '1px dashed #D0D0D0',
                  borderRadius: 0.8,
                  bgcolor: 'white',
                  whiteSpace: 'nowrap',
                  cursor: isDisabled ? 'default' : 'pointer',
                  opacity: isDisabled ? 0.6 : 1,
                  '&:hover': !isDisabled && {
                    borderColor: '#8E8E93',
                    bgcolor: '#FAFAFA',
                  },
                }}
              >
                {outreachLoading ? (
                  <CircularProgress size={12} sx={{ color: '#8E8E93' }} />
                ) : (
                  <>
                    Not Set
                    {!isDisabled && <Iconify icon="eva:chevron-down-fill" width={14} />}
                  </>
                )}
              </Box>
            );
          }

          // Status is set - show colored chip
          return (
            <Box
              onClick={handleOutreachClick}
              sx={{
                textTransform: 'uppercase',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                py: 0.5,
                px: 1,
                fontSize: 12,
                border: '1px solid',
                borderBottom: '3px solid',
                borderRadius: 0.8,
                bgcolor: 'white',
                whiteSpace: 'nowrap',
                color: outreachConfig.color,
                borderColor: outreachConfig.color,
                cursor: isDisabled ? 'default' : 'pointer',
                opacity: isDisabled ? 0.6 : 1,
                '&:hover': !isDisabled && {
                  opacity: 0.85,
                },
              }}
            >
              {outreachLoading ? (
                <CircularProgress size={12} sx={{ color: outreachConfig.color }} />
              ) : (
                <>
                  {outreachConfig.label}
                  {!isDisabled && <Iconify icon="eva:chevron-down-fill" width={14} />}
                </>
              )}
            </Box>
          );
        })()}

        {/* Outreach Status Popover */}
        <Popover
          open={outreachPopoverOpen}
          anchorEl={outreachAnchorEl}
          onClose={(e) => {
            if (e && e.stopPropagation) e.stopPropagation();
            handleOutreachClose();
          }}
          onClick={(e) => e.stopPropagation()}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{
            paper: {
              sx: {
                mt: 0.5,
                p: 1.25,
                bgcolor: 'white',
                boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.12)',
                borderRadius: 1.5,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
              },
            },
          }}
        >
          {OUTREACH_STATUS_OPTIONS.map((option) => (
            <Box
              key={option.value}
              onClick={(e) => {
                e.stopPropagation();
                handleOutreachSelect(option.value);
              }}
              sx={{
                textTransform: 'uppercase',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 0.75,
                px: 1.5,
                fontSize: 13,
                border: '1px solid',
                borderBottom: '3px solid',
                borderRadius: 0.8,
                bgcolor: 'white',
                whiteSpace: 'nowrap',
                color: option.color,
                borderColor: option.color,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
                ...(pitch.outreachStatus === option.value && {
                  boxShadow: `0px 1px 3px rgba(0, 0, 0, 0.08), 0 0 0 2px ${option.color}20`,
                }),
                '&:hover': {
                  bgcolor: '#F5F5F5',
                },
              }}
            >
              <Box component="span" sx={{ flex: 1, textAlign: 'left' }}>{option.label}</Box>
              {pitch.outreachStatus === option.value && (
                <Iconify icon="eva:checkmark-fill" width={16} sx={{ ml: 1, flexShrink: 0 }} />
              )}
            </Box>
          ))}
        </Popover>
      </TableCell>
      <TableCell sx={{ py: { xs: 0.5, sm: 1 }, px: { xs: 1, sm: 2 } }}>
        {displayData.followerCount ? (
          <Tooltip 
            title={displayData.followerCount.toLocaleString()} 
            arrow
            placement="top"
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: '#221f20',
                  fontSize: '0.75rem',
                  '& .MuiTooltip-arrow': {
                    color: '#221f20',
                  },
                },
              },
            }}
          >
            <Typography variant="body2" fontSize={13.5} sx={{ cursor: 'help', display: 'inline-block' }}>
              {formatNumber(displayData.followerCount)}
            </Typography>
          </Tooltip>
        ) : (
          <Typography variant="body2" fontSize={13.5}>-</Typography>
        )}
      </TableCell>
      {isCreditTier && (
        <TableCell sx={{ py: { xs: 0.5, sm: 1 }, px: { xs: 1, sm: 2 } }}>
          {(() => {
            const tierData = getTierData();
            if (!tierData) {
              return <Typography fontSize={13.5}>-</Typography>;
            }
            return (
              <Stack alignItems="start">
                <Typography fontSize={13.5} whiteSpace="nowrap">
                  {tierData.name}
                </Typography>
                <Typography
                  variant="body2"
                  fontSize={13.5}
                  sx={{
                    color: '#8e8e93',
                    display: 'block',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tierData.creditsPerVideo} credit{tierData.creditsPerVideo !== 1 ? 's' : ''}
                </Typography>
              </Stack>
            );
          })()}
        </TableCell>
      )}
      <TableCell sx={{ py: { xs: 0.5, sm: 1 }, px: { xs: 1, sm: 2 } }}>
        <Stack alignItems="start">
          <Typography fontSize={13.5} whiteSpace="nowrap">
            {fDate(pitch.createdAt)}
          </Typography>
          <Typography
            variant="body2"
            fontSize={13.5}
            sx={{
              color: '#8e8e93',
              display: 'block',
            }}
          >
            {dayjs(pitch.createdAt).format('LT')}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell sx={{ py: { xs: 0.5, sm: 1 }, px: { xs: 1, sm: 2 } }}>
        <PitchTypeCell type={pitch.type} isGuestCreator={isGuestCreator} />
      </TableCell>
      <TableCell sx={{ py: { xs: 0.5, sm: 1 }, px: { xs: 1, sm: 2 } }}>
        <Box
          sx={{
            textTransform: 'uppercase',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            py: 0.5,
            px: 1,
            fontSize: 12,
            border: '1px solid',
            borderBottom: '3px solid',
            borderRadius: 0.8,
            bgcolor: 'white',
            whiteSpace: 'nowrap',
            color: statusInfo.color,
            borderColor: statusInfo.borderColor,
            cursor: 'default',
          }}
        >
          {getStatusText(displayStatus, pitch, campaign)}
          {pitch?.adminComments && displayStatus === 'SENT_TO_CLIENT_WITH_COMMENTS' && (
            <Tooltip title="CS Comments provided" arrow>
              <Box
                component="img"
                src="/assets/icons/components/ic-comments.svg"
                alt="Comments"
                sx={{ width: 16, height: 16, flexShrink: 0 }}
              />
            </Tooltip>
          )}
        </Box>
      </TableCell>
      <TableCell sx={{ py: { xs: 0.5, sm: 1 }, px: { xs: 1, sm: 2 } }}>
        {smUp ? (
          <V3PitchActions pitch={pitch} onViewPitch={onViewPitch} campaignId={campaign?.id} onRemoved={onRemoved} isDisabled={isDisabled} />
        ) : (
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onViewPitch(pitch);
            }}
          >
            <Iconify icon="hugeicons:view" />
          </IconButton>
        )}
      </TableCell>
    </TableRow>
  );
};

PitchRow.propTypes = {
  pitch: PropTypes.object.isRequired,
  displayStatus: PropTypes.string.isRequired,
  statusInfo: PropTypes.object.isRequired,
  isGuestCreator: PropTypes.bool,
  campaign: PropTypes.object,
  isCreditTier: PropTypes.bool,
  onViewPitch: PropTypes.func.isRequired,
  onRemoved: PropTypes.func,
  onOutreachUpdate: PropTypes.func,
  isDisabled: PropTypes.bool,
};

export default PitchRow;
