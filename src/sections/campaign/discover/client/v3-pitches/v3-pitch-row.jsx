import React from 'react';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import { Box, Link, Stack, Avatar, Tooltip, TableRow, TableCell, Typography, IconButton } from '@mui/material';

import { useResponsive } from 'src/hooks/use-responsive';

import { fDate } from 'src/utils/format-time';
import { formatNumber, createSocialProfileUrl, extractUsernameFromProfileLink } from 'src/utils/media-kit-utils';

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

const PitchRow = ({ pitch, displayStatus, statusInfo, isGuestCreator, campaign, isCreditTier, onViewPitch, onRemoved }) => {
  const smUp = useResponsive('up', 'sm');

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
    <TableRow
    // hover
    >
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
          <V3PitchActions pitch={pitch} onViewPitch={onViewPitch} campaignId={campaign?.id} onRemoved={onRemoved} />
        ) : (
          <IconButton onClick={() => onViewPitch(pitch)}>
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
};

export default PitchRow;
