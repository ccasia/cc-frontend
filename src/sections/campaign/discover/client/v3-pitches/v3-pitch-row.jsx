import React from 'react';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import { Box, Stack, Avatar, Tooltip, TableRow, TableCell, Typography, IconButton } from '@mui/material';

import { useResponsive } from 'src/hooks/use-responsive';

import { formatNumber, extractUsernameFromProfileLink } from 'src/utils/media-kit-utils';

import Iconify from 'src/components/iconify';

import V3PitchActions from './v3-pitch-actions';
import { fDate } from 'src/utils/format-time';

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

const PitchRow = ({ pitch, displayStatus, statusInfo, isGuestCreator, campaign, onViewPitch, onRemoved }) => {
  const smUp = useResponsive('up', 'sm');

  // Extract social media usernames
  const instagramStats = pitch?.user?.creator?.instagramUser || null;
  const tiktokStats = pitch?.user?.creator?.tiktokUser || null;
  const profileLink = pitch.user?.creator?.profileLink || pitch.user?.profileLink;
  const instagramProfileLink = pitch.user?.creator?.instagramProfileLink;
  const tiktokProfileLink = pitch.user?.creator?.tiktokProfileLink;
  
  const instagramUsername = instagramStats?.username || extractUsernameFromProfileLink(instagramProfileLink);
  const tiktokUsername = tiktokStats?.username || extractUsernameFromProfileLink(tiktokProfileLink);
  const profileUsername = extractUsernameFromProfileLink(profileLink);
  
  // Check if we have any social usernames to display
  const hasSocialUsernames = instagramUsername || tiktokUsername;

  const getDisplayData = () => {
    const resolveMetric = (primary, secondary, tertiary) => {
      if (primary != null) return primary;
      if (secondary != null) return secondary;
      if (tertiary != null) return tertiary;
      return null;
    };

    if (pitch.engagementRate && pitch.followerCount) {
      return {
        engagementRate: pitch.engagementRate,
        followerCount: pitch.followerCount,
      };
    }

    // P2: Use pitch data if available (partial data)
    if (instagramStats || tiktokStats) {
      return {
        engagementRate: resolveMetric(
          instagramStats?.engagement_rate,
          tiktokStats?.engagement_rate,
          pitch.engagementRate
        ),
        followerCount: resolveMetric(
          instagramStats?.followers_count,
          tiktokStats?.follower_count,
          pitch.followerCount
        ),
      };
    }

    // Default: No data available
    return {
      engagementRate: null,
      followerCount: null,
    };
  };

  const displayData = getDisplayData();

  return (
    <TableRow hover>
      <TableCell>
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
                    <Typography variant="caption" sx={{ color: '#636366', fontSize: 12 }}>
                      {instagramUsername}
                    </Typography>
                  </Stack>
                )}
                {tiktokUsername && (
                  <Stack direction="row" alignItems="center" spacing={0.3}>
                    <Iconify icon="ic:baseline-tiktok" width={14} sx={{ color: '#636366' }} />
                    <Typography variant="caption" sx={{ color: '#636366', fontSize: 12 }}>
                      {tiktokUsername}
                    </Typography>
                  </Stack>
                )}
              </Stack>
            ) : profileUsername && (
              <Typography variant="caption" sx={{ color: '#636366', fontSize: 12 }}>
                {profileUsername}
              </Typography>
            )}
          </Stack>
        </Stack>
      </TableCell>
      <TableCell sx={{ px: 1 }}>
        <Typography variant="body2" fontSize={13.5}>
          {displayData.followerCount ? formatNumber(displayData.followerCount) : '-'}
        </Typography>
      </TableCell>
      <TableCell sx={{ px: 1 }}>
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
      <TableCell sx={{ px: 1 }}>
        <PitchTypeCell type={pitch.type} isGuestCreator={isGuestCreator} />
      </TableCell>
      <TableCell sx={{ px: 1 }}>
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
      <TableCell sx={{ padding: 0, paddingRight: 1 }}>
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
  onViewPitch: PropTypes.func.isRequired,
  onRemoved: PropTypes.func,
};

export default PitchRow;
