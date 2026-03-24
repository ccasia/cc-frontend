import React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@emotion/react';

import { Box, Link, Stack, Avatar, Button, Tooltip, TableRow, TableCell, Typography } from '@mui/material';

import { formatNumber, createSocialProfileUrl, extractUsernameFromProfileLink } from 'src/utils/media-kit-utils';

import { getOutreachStatusConfig } from 'src/contants/outreach';

import Iconify from 'src/components/iconify';

/**
 * CreatorMasterListRow component renders a single creator row in the master list table
 * Displays creator insights sourced directly from pitch payloads
 */
const CreatorMasterListRow = ({ pitch, getStatusInfo, onViewPitch, campaign, isCreditTier }) => {
  const theme = useTheme();
  // Profile link is stored on Creator model
  const instagramStats = pitch?.user?.creator?.instagramUser || null;
  const tiktokStats = pitch?.user?.creator?.tiktokUser || null;
  const profileLink = pitch.user?.creator?.profileLink || pitch.user?.profileLink;
  const instagramProfileLink = pitch.user?.creator?.instagramProfileLink;
  const tiktokProfileLink = pitch.user?.creator?.tiktokProfileLink;
  const profileUsername = extractUsernameFromProfileLink(profileLink);

  // Extract usernames from profile links
  const instagramUsername = instagramStats?.username || extractUsernameFromProfileLink(instagramProfileLink);
  const tiktokUsername = tiktokStats?.username || extractUsernameFromProfileLink(tiktokProfileLink);

  // Check if we have platform-specific links
  const hasPlatformLinks = instagramProfileLink || tiktokProfileLink || instagramUsername || tiktokUsername;

  // Determine what to display for username, engagement rate and follower count
  const getDisplayData = () => {
    const igStats = pitch?.user?.creator?.instagramUser || null;
    const tkStats = pitch?.user?.creator?.tiktokUser || null;

    const pickValue = (...values) => {
      const foundValue = values.find(value => value === 0 || (value !== undefined && value !== null && value !== ''));
      return foundValue !== undefined ? foundValue : null;
    };

    const pickString = (...values) => {
      const foundValue = values.find(value => typeof value === 'string' && value.trim());
      return foundValue ? foundValue.trim() : null;
    };

    // Select the account with the most followers and highest engagement
    const selectBestAccount = () => {
      const igFollowers = igStats?.followers_count || 0;
      const igEngagement = igStats?.engagement_rate || 0;
      const tkFollowers = tkStats?.follower_count || 0;
      const tkEngagement = tkStats?.engagement_rate || 0;

      // If only one account exists, use it
      if (!tkFollowers) return { stats: igStats, followers: igFollowers, engagement: igEngagement };
      if (!igFollowers) return { stats: tkStats, followers: tkFollowers, engagement: tkEngagement };

      // If both exist, compare follower count first, then engagement rate
      if (igFollowers >= tkFollowers) {
        return { stats: igStats, followers: igFollowers, engagement: igEngagement };
      }
      return { stats: tkStats, followers: tkFollowers, engagement: tkEngagement };
    };

    // P1: Prioritize connected social media stats delivered with the pitch payload
    if (igStats || tkStats) {
      const bestAccount = selectBestAccount();
      const usernameFromStats = pickString(
        bestAccount.stats?.username,
        igStats?.username,
        tkStats?.username,
        profileUsername,
      );

      return {
        username: usernameFromStats || profileUsername || '-',
        engagementRate: pickValue(bestAccount.engagement, pitch?.engagementRate),
        followerCount: pickValue(bestAccount.followers, pitch?.followerCount, pitch?.user?.creator?.manualFollowerCount),
      };
    }

    return {
      username: profileUsername || '-',
      engagementRate: pitch?.engagementRate ?? null,
      followerCount: pitch?.followerCount ?? pitch?.user?.creator?.manualFollowerCount ?? null,
    };
  };

  const displayData = getDisplayData();

  // Get tier data for credit tier campaigns
  const getTierData = () => {
    // First check creator's current tier
    const creatorTier = pitch?.user?.creator?.creditTier;
    if (creatorTier) {
      return {
        name: creatorTier.name,
        creditsPerVideo: creatorTier.creditsPerVideo,
      };
    }
    return null;
  };

  const tierData = isCreditTier ? getTierData() : null;

  const statusInfo = getStatusInfo(pitch);

  return (
    <TableRow
      hover
      onClick={() => onViewPitch(pitch)}
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
        {(() => {
          const outreachConfig = getOutreachStatusConfig(pitch.outreachStatus);

          if (!outreachConfig) {
            // Not Set - dashed style
            return (
              <Box
                sx={{
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  py: 0.5,
                  px: 1,
                  fontSize: 12,
                  color: '#8E8E93',
                  border: '1px dashed #D0D0D0',
                  borderRadius: 0.8,
                  bgcolor: 'white',
                  whiteSpace: 'nowrap',
                }}
              >
                Not Set
              </Box>
            );
          }

          // Status is set - colored chip
          return (
            <Box
              sx={{
                textTransform: 'uppercase',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
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
              }}
            >
              {outreachConfig.label}
            </Box>
          );
        })()}
      </TableCell>
      <TableCell>
        {hasPlatformLinks ? (
          <Stack spacing={2} direction="row">
            {/* Instagram row */}
            {(instagramUsername || instagramProfileLink) && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Iconify icon="mdi:instagram" width={16} sx={{ color: '#E4405F', flexShrink: 0 }} />
                <Link
                  onClick={(e) => e.stopPropagation()}
                  href={
                    createSocialProfileUrl(instagramUsername, 'instagram') || instagramProfileLink
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                  sx={{
                    color: 'primary.main',
                    fontWeight: 500,
                    fontSize: '0.85rem',
                  }}
                >
                  {instagramUsername || extractUsernameFromProfileLink(instagramProfileLink) || '-'}
                </Link>
              </Stack>
            )}
            {/* TikTok row */}
            {(tiktokUsername || tiktokProfileLink) && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Iconify icon="ic:baseline-tiktok" width={16} sx={{ color: '#000000', flexShrink: 0 }} />
                <Link
                  onClick={(e) => e.stopPropagation()}
                  href={createSocialProfileUrl(tiktokUsername, 'tiktok') || tiktokProfileLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                  sx={{
                    color: 'primary.main',
                    fontWeight: 500,
                    fontSize: '0.85rem',
                  }}
                >
                  {tiktokUsername || extractUsernameFromProfileLink(tiktokProfileLink) || '-'}
                </Link>
              </Stack>
            )}
          </Stack>
        ) : (
          // Fallback to generic profileLink
          <>
            {profileLink ? (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                {profileLink?.includes('instagram.com') && (
                  <Iconify icon="mdi:instagram" width={16} sx={{ color: '#E4405F', flexShrink: 0 }} />
                )}
                {profileLink?.includes('tiktok.com') && (
                  <Iconify icon="ic:baseline-tiktok" width={16} sx={{ color: '#000000', flexShrink: 0 }} />
                )}
                <Link
                  href={profileLink}
                  onClick={(e) => e.stopPropagation()}
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
              </Stack>
            ) : (
              <Typography variant="body2">{displayData.username}</Typography>
            )}
          </>
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
      {isCreditTier && (
        <TableCell>
          <Typography variant="body2">{tierData?.name || '-'}</Typography>
        </TableCell>
      )}
      {isCreditTier && (
        <TableCell>
          <Typography variant="body2">
            {tierData?.creditsPerVideo ? `${tierData.creditsPerVideo}` : '-'}
          </Typography>
        </TableCell>
      )}
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
          onClick={() => onViewPitch(pitch)}
          sx={{
            bgcolor: '#FFFFFF',
            border: '1.5px solid #e7e7e7',
            borderBottom: '3px solid #e7e7e7',
            borderRadius: 1,
            color: '#1340FF',
            height: 36,
            px: 2,
            py: 1.5,
            fontWeight: 600,
            fontSize: '0.85rem',
            textTransform: 'none',
            whiteSpace: 'nowrap',
            minWidth: '90px',
            display: 'flex',
            alignItems: 'center',
            '&:hover': {
              bgcolor: 'rgba(19, 64, 255, 0.08)',
              border: '1.5px solid #1340FF',
              borderBottom: '3px solid #1340FF',
              color: '#1340FF',
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
  campaign: PropTypes.object,
  isCreditTier: PropTypes.bool,
};

export default CreatorMasterListRow;
