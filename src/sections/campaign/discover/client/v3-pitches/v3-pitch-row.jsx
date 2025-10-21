import React from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';

import {
  Box,
  Stack,
  Avatar,
  TableRow,
  TableCell,
  Typography,
  IconButton,
  CircularProgress,
  Tooltip,
} from '@mui/material';

import { useResponsive } from 'src/hooks/use-responsive';
import { useCreatorSocialMediaData } from 'src/hooks/use-get-social-media-data';

import Iconify from 'src/components/iconify';

import { formatNumber } from 'src/utils/media-kit-utils';
import V3PitchActions from './v3-pitch-actions';

const TYPE_LABELS = {
  video: 'Pitch (Video)',
  text: 'Pitch (Letter)',
  shortlisted: 'Shortlisted',
};

const PitchTypeCell = React.memo(function PitchTypeCell({ type, isGuestCreator }) {
  const label = TYPE_LABELS[type] ?? (type || '—');
  const subtitle =
    type === 'shortlisted' ? (isGuestCreator ? '(Non-platform)' : '(On Platform)') : null;

  return (
    <Stack>
      <Typography variant="body2" noWrap>
        {label}
      </Typography>
      {subtitle && <Typography variant="body2" noWrap>{subtitle}</Typography>}
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
    MAYBE: 'MAYBE',
    maybe: 'MAYBE',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    AGREEMENT_PENDING: 'AGREEMENT PENDING',
    AGREEMENT_SUBMITTED: 'AGREEMENT SUBMITTED',
  };

  if (status === 'SENT_TO_CLIENT_WITH_COMMENTS') {
    return statusTextMap.SENT_TO_CLIENT;
  }

  return statusTextMap[status] || status;
};

/**
 * PitchRow component renders a single pitch row in the table
 * Fetches social media data for the creator and displays it
 */
const PitchRow = ({ pitch, displayStatus, statusInfo, isGuestCreator, campaign, onViewPitch }) => {
  const smUp = useResponsive('up', 'sm');

  // Fetch social media data for this creator
  const { data: socialData, isLoading } = useCreatorSocialMediaData(pitch.user?.id);

  // Determine what to display for engagement rate and follower count
  const getDisplayData = () => {
    // P1: Use data from pitch object (for guest creators or manually entered data)
    if (pitch.engagementRate && pitch.followerCount) {
      return {
        engagementRate: pitch.engagementRate,
        followerCount: pitch.followerCount,
      };
    }

    // P2: Use fetched social media data (for platform creators)
    if (!isGuestCreator && socialData?.isConnected) {
      return {
        engagementRate: socialData.engagementRate,
        followerCount: socialData.followerCount,
      };
    }

    // P3: Use pitch data if available (partial data)
    if (pitch.engagementRate || pitch.followerCount) {
      return {
        engagementRate: pitch.engagementRate,
        followerCount: pitch.followerCount,
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
          </Stack>
        </Stack>
      </TableCell>
      <TableCell>
        {isLoading ? (
          <CircularProgress size={16} thickness={6} />
        ) : (
          <Typography variant="body2">
            {displayData.engagementRate || '-'}
            {displayData.engagementRate && '%'}
          </Typography>
        )}
      </TableCell>
      <TableCell>
        {isLoading ? (
          <CircularProgress size={16} thickness={6} />
        ) : (
          <Typography variant="body2">
            {displayData.followerCount ? formatNumber(displayData.followerCount) : '-'}
          </Typography>
        )}
      </TableCell>
      <TableCell>
        <Stack spacing={0.5} alignItems="start">
          <Typography variant="body2" whiteSpace="nowrap">
            {dayjs(pitch.createdAt).format('LL')}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#8e8e93',
              display: 'block',
              mt: '-2px',
            }}
          >
            {dayjs(pitch.createdAt).format('LT')}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>
        <PitchTypeCell type={pitch.type} isGuestCreator={isGuestCreator} />
      </TableCell>
      <TableCell>
        <Box
          sx={{
            textTransform: 'uppercase',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            py: 0.5,
            px: 1,
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
          <V3PitchActions pitch={pitch} onViewPitch={onViewPitch} />
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
};

export default PitchRow;
