import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';

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
} from '@mui/material';

import { fDate } from 'src/utils/format-time';
import { getUserDisplay } from 'src/utils/user-display';
import { resolveTierPlatformForDisplay } from 'src/utils/credit-tier-platform';
import {
  formatNumber,
  createSocialProfileUrl,
  extractUsernameFromProfileLink,
} from 'src/utils/media-kit-utils';

import { getOutreachStatusConfig } from 'src/contants/outreach';

import Iconify from 'src/components/iconify';

import {
  chipSx,
  CELL_SX,
  INDEX_SX,
  HANDLE_SX,
  ICON_SIZE,
  EmptyValue,
  FieldBlock,
  PRODUCT_SX,
  AVATAR_SIZE,
  NAME_LINK_SX,
  emptyChipSx,
  PlatformIcon,
  VALUE_MUTED_SX,
  VALUE_PLAIN_SX,
  VIEW_BUTTON_SX,
  CHIP_ROW_HEIGHT,
  CONTROL_ICON_SIZE,
  formatEngagementRate,
} from '../master-list-row-kit';

// Proportional column widths, so the fields sit in the same place on every row
// instead of shifting with whatever text each creator happens to have.
const COLUMN_WIDTHS = {
  checkbox: 32,
  index: 36,
  creator: '25%',
  outreach: '13%',
  engagement: '15%',
  followers: '12%',
  status: '18%',
  actions: 96,
};

/**
 * CreatorMasterListRow renders one creator in the client-facing master list.
 *
 * Same tall row design as the admin Pitch tab, minus what a client must not
 * have: no outreach dropdown (the PATCH is admin-only), no Withdraw or Remove,
 * and no internal pipeline "Type". The selection checkbox is the one thing this
 * row has that the admin row does not — it drives Send List for Approval.
 */
const CreatorMasterListRow = ({
  pitch,
  number,
  getStatusInfo,
  onViewPitch,
  campaign,
  isSelected,
  onToggleSelect,
  logistics,
}) => {
  const rowUser = getUserDisplay(pitch.user);
  // Profile link is stored on Creator model
  const instagramStats = pitch?.user?.creator?.instagramUser || null;
  const tiktokStats = pitch?.user?.creator?.tiktokUser || null;
  const profileLink = pitch.user?.creator?.profileLink || pitch.user?.profileLink;
  const instagramProfileLink = pitch.user?.creator?.instagramProfileLink;
  const tiktokProfileLink = pitch.user?.creator?.tiktokProfileLink;
  const profileUsername = extractUsernameFromProfileLink(profileLink);

  const displayProducts = useMemo(() => {
    if (!pitch?.user.id || !logistics?.length) return '';

    const info = logistics.find((a) => a.creatorId === pitch?.user.id);

    const items = info?.deliveryDetails?.items ?? [];

    return items
      .map(({ product, quantity }) =>
        quantity > 1 ? `${product.productName} (${quantity})` : product.productName
      )
      .join(', ');
  }, [logistics, pitch?.user.id]);

  // Extract usernames from profile links
  const instagramUsername =
    instagramStats?.username || extractUsernameFromProfileLink(instagramProfileLink);

  const tiktokUsername = tiktokStats?.username || extractUsernameFromProfileLink(tiktokProfileLink);

  // Check if we have platform-specific links
  const hasPlatformLinks =
    instagramProfileLink || tiktokProfileLink || instagramUsername || tiktokUsername;

  // Platform the row falls back to when a metric carries no platform of its own.
  const fallbackPlatform = resolveTierPlatformForDisplay(pitch, campaign);

  // Determine what to display for username, engagement rate and follower count
  const getDisplayData = () => {
    const igStats = pitch?.user?.creator?.instagramUser || null;
    const tkStats = pitch?.user?.creator?.tiktokUser || null;

    const pickValue = (...values) => {
      const foundValue = values.find(
        (value) => value === 0 || (value !== undefined && value !== null && value !== '')
      );
      return foundValue !== undefined ? foundValue : null;
    };

    const pickString = (...values) => {
      const foundValue = values.find((value) => typeof value === 'string' && value.trim());
      return foundValue ? foundValue.trim() : null;
    };

    // Select the account with the most followers and highest engagement
    const selectBestAccount = () => {
      const igFollowers = igStats?.followers_count || 0;
      const igEngagement = igStats?.engagement_rate || 0;
      const tkFollowers = tkStats?.follower_count || 0;
      const tkEngagement = tkStats?.engagement_rate || 0;

      const ig = {
        stats: igStats,
        followers: igFollowers,
        engagement: igEngagement,
        platform: 'instagram',
      };
      const tk = {
        stats: tkStats,
        followers: tkFollowers,
        engagement: tkEngagement,
        platform: 'tiktok',
      };

      // If only one account exists, use it
      if (!tkFollowers) return ig;
      if (!igFollowers) return tk;

      // If both exist, compare follower count first, then engagement rate
      return igFollowers >= tkFollowers ? ig : tk;
    };

    // P1: Prioritize connected social media stats delivered with the pitch payload
    if (igStats || tkStats) {
      const bestAccount = selectBestAccount();
      const usernameFromStats = pickString(
        bestAccount.stats?.username,
        igStats?.username,
        tkStats?.username,
        profileUsername
      );

      return {
        username: usernameFromStats || profileUsername || '-',
        platform: bestAccount.platform,
        engagementRate: pickValue(bestAccount.engagement, pitch?.engagementRate),
        followerCount: pickValue(
          bestAccount.followers,
          pitch?.followerCount,
          pitch?.user?.creator?.manualFollowerCount
        ),
      };
    }

    return {
      username: profileUsername || '-',
      platform: fallbackPlatform,
      engagementRate: pitch?.engagementRate ?? null,
      followerCount: pitch?.followerCount ?? pitch?.user?.creator?.manualFollowerCount ?? null,
    };
  };

  const displayData = getDisplayData();
  const engagementRateText = formatEngagementRate(displayData.engagementRate);

  // Get tier data: the creator's current tier, else the shortlist snapshot.
  const getTierData = () => {
    // First check creator's current tier
    const creatorTier = pitch?.user?.creator?.creditTier;
    if (creatorTier) {
      return {
        name: creatorTier.name,
        creditsPerVideo: creatorTier.creditsPerVideo,
      };
    }
    // Fallback: shortlist snapshot tier (e.g., when a guest creator was linked to a platform
    // creator whose own Creator.creditTier hasn't been computed)
    if (pitch?._creditTier) {
      return {
        name: pitch._creditTier.name,
        creditsPerVideo: pitch._creditPerVideo || pitch._creditTier.creditsPerVideo,
      };
    }
    return null;
  };

  const tierData = getTierData();
  const credits = tierData?.creditsPerVideo;
  const creditsText = credits == null ? null : `${credits} Credit${credits === 1 ? '' : 's'}`;

  const statusInfo = getStatusInfo(pitch);
  const outreachConfig = getOutreachStatusConfig(pitch.outreachStatus);
  const socialLinkSx = { ...HANDLE_SX, '&:hover': { color: '#1877F2' } };

  return (
    <TableRow
      hover
      onClick={(e) => {
        // Don't open pitch modal when clicking the checkbox cell
        if (e.target.closest('[data-checkbox-cell]')) return;
        onViewPitch(pitch);
      }}
      sx={{
        cursor: 'pointer',
        bgcolor: 'transparent',
        '&:first-of-type td': { borderTop: '1px solid #EBEBEB' },
      }}
    >
      {/* Selection — client-only, drives Send List for Approval */}
      {onToggleSelect && (
        <TableCell
          data-checkbox-cell="true"
          sx={{ ...CELL_SX, width: COLUMN_WIDTHS.checkbox, px: 1, pr: 0 }}
        >
          <Box
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(pitch);
            }}
            sx={{
              width: 18,
              height: 18,
              borderRadius: 0,
              border: `2px solid ${isSelected ? '#1340FF' : '#7B7B7B'}`,
              bgcolor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
          >
            {isSelected && (
              <Iconify icon="eva:checkmark-fill" width={13} height={13} sx={{ color: '#1340FF' }} />
            )}
          </Box>
        </TableCell>
      )}

      {/* Row number */}
      <TableCell sx={{ ...CELL_SX, width: COLUMN_WIDTHS.index, px: 1, textAlign: 'center' }}>
        <Typography sx={INDEX_SX}>{number}</Typography>
      </TableCell>

      {/* Creator */}
      <TableCell sx={{ ...CELL_SX, width: COLUMN_WIDTHS.creator }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar
            src={pitch.user?.photoURL}
            alt={rowUser.name}
            sx={{
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              flexShrink: 0,
              bgcolor: '#D4D4D4',
              border: '1px solid #EBEBEB',
            }}
          >
            {rowUser.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Stack spacing={0.5}>
            <Typography sx={NAME_LINK_SX}>{rowUser.name}</Typography>

            {hasPlatformLinks ? (
              /* One handle per line: Instagram first, TikTok under it. */
              <Stack spacing={0.25} alignItems="flex-start">
                {(instagramUsername || instagramProfileLink) && (
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Iconify icon="mdi:instagram" width={ICON_SIZE} sx={{ color: '#636366' }} />
                    <Link
                      href={
                        createSocialProfileUrl(instagramUsername, 'instagram') ||
                        instagramProfileLink
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      underline="hover"
                      sx={socialLinkSx}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {instagramUsername ||
                        extractUsernameFromProfileLink(instagramProfileLink) ||
                        '-'}
                    </Link>
                  </Stack>
                )}
                {(tiktokUsername || tiktokProfileLink) && (
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Iconify
                      icon="ic:baseline-tiktok"
                      width={ICON_SIZE}
                      sx={{ color: '#636366' }}
                    />
                    <Link
                      href={createSocialProfileUrl(tiktokUsername, 'tiktok') || tiktokProfileLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      underline="hover"
                      sx={socialLinkSx}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {tiktokUsername || extractUsernameFromProfileLink(tiktokProfileLink) || '-'}
                    </Link>
                  </Stack>
                )}
              </Stack>
            ) : (
              profileLink && (
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  {profileLink?.includes('instagram.com') && (
                    <Iconify icon="mdi:instagram" width={ICON_SIZE} sx={{ color: '#636366' }} />
                  )}
                  {profileLink?.includes('tiktok.com') && (
                    <Iconify
                      icon="ic:baseline-tiktok"
                      width={ICON_SIZE}
                      sx={{ color: '#636366' }}
                    />
                  )}
                  <Link
                    href={profileLink?.startsWith('http') ? profileLink : `https://${profileLink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    sx={socialLinkSx}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {displayData.username}
                  </Link>
                </Stack>
              )
            )}

            {displayProducts && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Iconify
                  icon="material-symbols:inventory-2-outline-rounded"
                  width={ICON_SIZE}
                  sx={{ color: '#1340FF', flexShrink: 0 }}
                />
                <Typography sx={PRODUCT_SX}>{displayProducts}</Typography>
              </Stack>
            )}
          </Stack>
        </Stack>
      </TableCell>

      {/* Outreach Status — read-only here: the PATCH is admin-only */}
      <TableCell sx={{ ...CELL_SX, width: COLUMN_WIDTHS.outreach }}>
        <FieldBlock label="Outreach status" minHeight={CHIP_ROW_HEIGHT}>
          {outreachConfig ? (
            <Box sx={{ ...chipSx(outreachConfig.color), alignSelf: 'flex-start' }}>
              {outreachConfig.label}
            </Box>
          ) : (
            <Box sx={{ ...emptyChipSx, alignSelf: 'flex-start' }}>Not Set</Box>
          )}
        </FieldBlock>
      </TableCell>

      {/* Engagement Rate + Tier */}
      <TableCell sx={{ ...CELL_SX, width: COLUMN_WIDTHS.engagement }}>
        <Stack spacing={0.5}>
          <FieldBlock label="Engagement rate" minHeight={CHIP_ROW_HEIGHT}>
            {engagementRateText ? (
              <Stack direction="row" alignItems="center" spacing={1}>
                <PlatformIcon platform={displayData.platform} />
                <Typography sx={VALUE_PLAIN_SX}>{engagementRateText}</Typography>
              </Stack>
            ) : (
              <EmptyValue />
            )}
          </FieldBlock>

          {/* Tier name and its credit amount both show on every campaign. */}
          <FieldBlock label="Tier">
            {tierData ? (
              <Stack direction="row" alignItems="center" spacing={1}>
                <PlatformIcon platform={fallbackPlatform} />
                <Typography sx={VALUE_PLAIN_SX}>{tierData.name}</Typography>
                {creditsText && <Typography sx={VALUE_MUTED_SX}>{creditsText}</Typography>}
              </Stack>
            ) : (
              <EmptyValue />
            )}
          </FieldBlock>
        </Stack>
      </TableCell>

      {/* Followers */}
      <TableCell sx={{ ...CELL_SX, width: COLUMN_WIDTHS.followers }}>
        <FieldBlock label="Followers" minHeight={CHIP_ROW_HEIGHT}>
          {displayData.followerCount ? (
            <Tooltip
              title={Number(displayData.followerCount).toLocaleString()}
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
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ cursor: 'help' }}
              >
                <PlatformIcon platform={displayData.platform} />
                <Typography sx={VALUE_PLAIN_SX}>
                  {formatNumber(displayData.followerCount)}
                </Typography>
              </Stack>
            </Tooltip>
          ) : (
            <EmptyValue />
          )}
        </FieldBlock>
      </TableCell>

      {/* Creator Status + Date */}
      <TableCell sx={{ ...CELL_SX, width: COLUMN_WIDTHS.status }}>
        <Stack spacing={0.5}>
          <FieldBlock label="Creator status" minHeight={CHIP_ROW_HEIGHT}>
            <Box sx={{ ...chipSx(statusInfo.color), alignSelf: 'flex-start' }}>
              {statusInfo.label}
              {statusInfo.normalizedStatus === 'SENT_TO_CLIENT' &&
                pitch.adminComments?.trim().length > 0 && (
                  <Tooltip title="CS Comments provided" arrow>
                    <Box sx={{ display: 'inline-flex', flexShrink: 0 }}>
                      <Iconify icon="cuida:long-text-outline" width={CONTROL_ICON_SIZE} />
                    </Box>
                  </Tooltip>
                )}
              {(statusInfo.normalizedStatus === 'APPROVED' ||
                statusInfo.normalizedStatus === 'REJECTED') &&
                pitch.clientVisibleApprovalNote?.trim() && (
                  <Tooltip title="Note from approver" arrow>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                      <Iconify
                        icon="cuida:long-text-outline"
                        width={CONTROL_ICON_SIZE}
                        sx={{ color: statusInfo.color }}
                      />
                    </Box>
                  </Tooltip>
                )}
            </Box>
          </FieldBlock>

          {/* No label of its own, but it still sits on the value row. */}
          <FieldBlock>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography sx={VALUE_PLAIN_SX} noWrap>
                {fDate(pitch.createdAt)}
              </Typography>
              <Typography sx={VALUE_MUTED_SX} noWrap>
                {dayjs(pitch.createdAt).format('LT')}
              </Typography>
            </Stack>
          </FieldBlock>
        </Stack>
      </TableCell>

      {/* Actions — View only. Withdraw and Remove are admin-side. */}
      <TableCell align="right" sx={{ ...CELL_SX, width: COLUMN_WIDTHS.actions }}>
        <Button onClick={() => onViewPitch(pitch)} sx={VIEW_BUTTON_SX}>
          View
        </Button>
      </TableCell>
    </TableRow>
  );
};

CreatorMasterListRow.propTypes = {
  pitch: PropTypes.object.isRequired,
  number: PropTypes.number,
  getStatusInfo: PropTypes.func.isRequired,
  onViewPitch: PropTypes.func.isRequired,
  campaign: PropTypes.object,
  isSelected: PropTypes.bool,
  onToggleSelect: PropTypes.func,
  logistics: PropTypes.array,
};

export default CreatorMasterListRow;
