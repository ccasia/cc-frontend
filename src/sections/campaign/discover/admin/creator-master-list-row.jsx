import React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@emotion/react';

import { Box, Link, Stack, Avatar, Button, Tooltip, TableRow, TableCell, Typography } from '@mui/material';

import { formatNumber, extractUsernameFromProfileLink } from 'src/utils/media-kit-utils';
import Iconify from 'src/components/iconify';

/**
 * CreatorMasterListRow component renders a single creator row in the master list table
 * Displays creator insights sourced directly from pitch payloads
 */
const CreatorMasterListRow = ({ pitch, getStatusInfo, onViewPitch }) => {
  const theme = useTheme();
  const profileLink = pitch.user?.profileLink;
  const profileUsername = extractUsernameFromProfileLink(profileLink);

  // Determine what to display for username, engagement rate and follower count
  const getDisplayData = () => {
    const instagramStats = pitch?.user?.creator?.instagramUser || null;
    const tiktokStats = pitch?.user?.creator?.tiktokUser || null;

    const pickValue = (...values) => {
      for (const value of values) {
        if (value === 0) return value;
        if (value !== undefined && value !== null && value !== '') return value;
      }
      return null;
    };

    const pickString = (...values) => {
      for (const value of values) {
        if (typeof value === 'string' && value.trim()) {
          return value.trim();
        }
      }
      return null;
    };

    // P1: Prioritize connected social media stats delivered with the pitch payload
    if (instagramStats || tiktokStats) {
      const usernameFromStats = pickString(
        instagramStats?.username,
        tiktokStats?.username,
        profileUsername,
        pitch?.username,
        pitch?.user?.username
      );

      return {
        username: usernameFromStats || '-',
        engagementRate: pickValue(
          instagramStats?.engagement_rate,
          tiktokStats?.engagement_rate,
          pitch?.engagementRate
        ),
        followerCount: pickValue(
          instagramStats?.followers_count,
          tiktokStats?.follower_count,
          pitch?.followerCount
        ),
      };
    }

    // P2: Use manually entered data from the pitch
    if (pitch?.username || pitch?.engagementRate || pitch?.followerCount) {
      return {
        username: pickString(pitch?.username, profileUsername, pitch?.user?.username) || '-',
        engagementRate: pitch?.engagementRate || null,
        followerCount: pitch?.followerCount || null,
      };
    }

    // P3: Attempt to derive username from profile link
    if (profileUsername) {
      return {
        username: profileUsername,
        engagementRate: null,
        followerCount: null,
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
        {profileLink && (
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
        {!profileLink && (
          <Typography variant="body2">{displayData.username}</Typography>
        )}
      </TableCell>
      {/* <TableCell>
        <Typography variant="body2">
          {displayData.engagementRate ? `${displayData.engagementRate}%` : '-'}
        </Typography>
      </TableCell> */}
      <TableCell>
        <Typography variant="body2">
          {displayData.followerCount ? formatNumber(displayData.followerCount) : '-'}
        </Typography>
      </TableCell>
      <TableCell>
        <Box
          sx={{
            textTransform: 'uppercase',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.25,
            px: 1.2,
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
            pitch.adminComments?.trim().length > 0 && (
              <Tooltip title="CS Comments provided" arrow>
                <Box sx={{ display: 'inline-flex', mb: 0.15 }}>
                  <Iconify icon="cuida:long-text-outline" width={18} height={18} />
                </Box>
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
