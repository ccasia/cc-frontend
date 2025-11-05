import React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@emotion/react';

import {
  Box,
  Link,
  Stack,
  Avatar,
  Button,
  Tooltip,
  TableRow,
  TableCell,
  Typography,
  CircularProgress,
} from '@mui/material';

import { useCreatorSocialMediaData } from 'src/hooks/use-get-social-media-data';

import { formatNumber } from 'src/utils/media-kit-utils';

/**
 * CreatorMasterListRow component renders a single creator row in the master list table
 * Fetches social media data for the creator and displays it
 */
const CreatorMasterListRow = ({ pitch, getStatusInfo, onViewPitch }) => {
  const theme = useTheme();

  // Fetch social media data for this creator
  const { data: socialData, isLoading } = useCreatorSocialMediaData(pitch.user?.id);

  // Determine what to display for username, engagement rate and follower count
  const getDisplayData = () => {
    const isGuestCreator = pitch.user?.creator?.isGuest;

    // P1: Use data from pitch (for guest creators or manually entered data)
    if (pitch?.username || pitch?.engagementRate || pitch?.followerCount) {
      return {
        username: pitch?.username || '-',
        engagementRate: pitch?.engagementRate || null,
        followerCount: pitch?.followerCount || null,
      };
    }

    // P2: Use fetched social media data (for platform creators with connected accounts)
    if (!isGuestCreator && socialData?.isConnected) {
      return {
        username: socialData.username || pitch.user?.username || '-',
        engagementRate: socialData.engagementRate,
        followerCount: socialData.followerCount,
      };
    }

    // P3: Use pitch user data if available (partial data)
    if (pitch?.username || pitch?.engagementRate || pitch?.followerCount) {
      return {
        username: pitch?.username || '-',
        engagementRate: pitch?.engagementRate || null,
        followerCount: pitch?.followerCount || null,
      };
    }

    // Default: No data available
    return {
      username: '-',
      engagementRate: null,
      followerCount: null,
    };
  };

  const displayData = getDisplayData();

  // Get profile link - prioritize creator.profileLink, fallback to user.guestProfileLink
  const profileLink = pitch.user?.creator?.profileLink || pitch.user?.guestProfileLink;
  const statusInfo = getStatusInfo(pitch);

  return (
    <TableRow
      hover
      sx={{
        bgcolor: 'transparent',
        '& td': {
          borderBottom: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <TableCell>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar
            src={pitch.user?.photoURL}
            alt={pitch.user?.name}
            sx={{
              width: 40,
              height: 40,
              border: '2px solid',
              borderColor: 'background.paper',
              boxShadow: theme.customShadows.z8,
            }}
          >
            {pitch.user?.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="body2">{pitch.user?.name}</Typography>
        </Stack>
      </TableCell>
      <TableCell>
        {isLoading && <CircularProgress size={16} thickness={6} />}
        {!isLoading && profileLink && (
          <Link
            href={profileLink}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            sx={{
              color: 'primary.main',
              fontWeight: 500,
              fontSize: '0.875rem',
            }}
          >
            {displayData.username}
          </Link>
        )}
        {!isLoading && !profileLink && (
          <Typography variant="body2">{displayData.username}</Typography>
        )}
      </TableCell>
      {/* <TableCell>
        {isLoading ? (
          <CircularProgress size={16} thickness={6} />
        ) : (
          <Typography variant="body2">
            {displayData.engagementRate ? `${displayData.engagementRate}%` : '-'}
          </Typography>
        )}
      </TableCell> */}
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
        <Box
          sx={{
            textTransform: 'uppercase',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.25,
            px: 1.5,
            py: 0.5,
            fontSize: '0.75rem',
            border: '1px solid',
            borderBottom: '3px solid',
            borderRadius: 0.8,
            bgcolor: 'white',
            whiteSpace: 'nowrap',
            color: statusInfo.color,
            borderColor: statusInfo.color,
          }}
        >
          {statusInfo.label}
          {statusInfo.normalizedStatus === 'SENT_TO_CLIENT' &&
            pitch.adminComments &&
            pitch.adminComments.trim().length > 0 && (
              <Tooltip title="CS Comments provided" arrow>
                <Box
                  component="img"
                  src="/assets/icons/components/ic-comments.svg"
                  alt="Comments"
                  sx={{ width: 16, height: 16 }}
                />
              </Tooltip>
            )}
        </Box>
      </TableCell>
      <TableCell>
        <Button
          variant="outlined"
          size="small"
          onClick={() => onViewPitch(pitch)}
          sx={{
            cursor: 'pointer',
            px: 1.5,
            py: 2,
            border: '1px solid #e7e7e7',
            borderBottom: '3px solid #e7e7e7',
            borderRadius: 1,
            color: '#203ff5',
            fontSize: '0.85rem',
            fontWeight: 600,
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            textTransform: 'none',
            bgcolor: 'transparent',
            whiteSpace: 'nowrap',
            '&:hover': {
              bgcolor: 'rgba(32, 63, 245, 0.04)',
              border: '1px solid #e7e7e7',
              borderBottom: '3px solid #e7e7e7',
            },
          }}
        >
          View Profile
        </Button>
      </TableCell>
    </TableRow>
  );
};

CreatorMasterListRow.propTypes = {
  pitch: PropTypes.object.isRequired,
  getStatusInfo: PropTypes.func.isRequired,
  onViewPitch: PropTypes.func.isRequired,
};

export default CreatorMasterListRow;
