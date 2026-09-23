import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import React, { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import {
  Box,
  Link,
  Stack,
  Avatar,
  Tooltip,
  Popover,
  TableRow,
  TableCell,
  Typography,
  IconButton,
  ButtonBase,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useResponsive } from 'src/hooks/use-responsive';

import { fDate } from 'src/utils/format-time';
import axiosInstance, { endpoints } from 'src/utils/axios';
import { resolveTierPlatformForDisplay } from 'src/utils/credit-tier-platform';
import {
  formatNumber,
  createSocialProfileUrl,
  extractUsernameFromProfileLink,
} from 'src/utils/media-kit-utils';

import { useAuthContext } from 'src/auth/hooks';
import { OUTREACH_STATUS_OPTIONS, getOutreachStatusConfig } from 'src/contants/outreach';

import Iconify from 'src/components/iconify';

import DiaTextReveal from './dia-text-reveal';
import V3PitchActions from './v3-pitch-actions';
import useJustFinished from './use-just-finished';
import { canEditFailedMetrics } from './guest-extraction/manual-metrics';
import CreatorFieldLoading from './guest-extraction/creator-field-loading';
import ManualMetricsDialog from './guest-extraction/manual-metrics-dialog';
import { failureDetails, failureLabelShort } from './guest-extraction/extraction-error-copy';
import {
  chipSx,
  CELL_SX,
  NAME_SX,
  INDEX_SX,
  VALUE_SX,
  HANDLE_SX,
  ICON_SIZE,
  NAME_SIZE,
  SMALL_SIZE,
  EmptyValue,
  FieldBlock,
  PRODUCT_SX,
  VALUE_SIZE,
  emptyChipSx,
  AVATAR_SIZE,
  NAME_HEIGHT,
  SMALL_HEIGHT,
  PlatformIcon,
  SPINNER_SIZE,
  NAME_LINK_SX,
  VALUE_HEIGHT,
  VALUE_MUTED_SX,
  VALUE_PLAIN_SX,
  CHIP_ROW_HEIGHT,
  CONTROL_ICON_SIZE,
  formatEngagementRate,
} from '../../master-list-row-kit';

const TYPE_LABELS = {
  video: 'Pitch (Video)',
  text: 'Pitch (Letter)',
  shortlisted: 'Shortlisted',
};

// Reveal styles for the scrape animation. Admin-only: the client list has no
// scrape flow, so these stay here rather than in the shared kit.
const VALUE_REVEAL_STYLE = {
  fontSize: VALUE_SIZE,
  fontWeight: 600,
  lineHeight: `${VALUE_HEIGHT}px`,
};
const VALUE_PLAIN_REVEAL_STYLE = {
  fontSize: VALUE_SIZE,
  fontWeight: 400,
  lineHeight: `${VALUE_HEIGHT}px`,
};
const NAME_REVEAL_STYLE = {
  fontSize: NAME_SIZE,
  fontWeight: 400,
  lineHeight: `${NAME_HEIGHT}px`,
};

// Proportional column widths, so the fields sit in the same place on every row
// instead of shifting with whatever text each creator happens to have.
const COLUMN_WIDTHS = {
  index: 40,
  creator: '24%',
  outreach: '14%',
  engagement: '15%',
  followers: '19%',
  status: '16%',
  actions: 108,
};

/** Followers / ER after a scrape. Sweep only when loading just ended. */
function ScrapeMetricValue({
  text,
  reveal,
  textColor = '#231F20',
  style = VALUE_REVEAL_STYLE,
  sx = VALUE_SX,
}) {
  if (reveal) {
    return (
      <DiaTextReveal
        text={text}
        textColor={textColor}
        duration={1.5}
        delay={0.05}
        style={style}
      />
    );
  }
  return <Typography sx={sx}>{text}</Typography>;
}

ScrapeMetricValue.propTypes = {
  text: PropTypes.string.isRequired,
  reveal: PropTypes.bool,
  textColor: PropTypes.string,
  style: PropTypes.object,
  sx: PropTypes.object,
};

/**
 * Pencil beside a hand-entered value. Faint so a list of numbers stays calm,
 * but always present, so keyboard and touch users can find it.
 */
const MANUAL_EDIT_CLASS = 'manual-metrics-edit';

function ManualEditButton({ onClick }) {
  return (
    <Tooltip title="Edit" arrow placement="top">
      <ButtonBase
        className={MANUAL_EDIT_CLASS}
        onClick={onClick}
        aria-label="Edit follower count and engagement rate"
        sx={{
          width: 20,
          height: 20,
          borderRadius: '6px',
          // Always visible: a hover-only action is invisible to keyboard and
          // touch users. Faint at rest, clearer on row hover, blue on its own.
          color: '#C7C7CC',
          transition: 'color 120ms ease, background-color 120ms ease',
          // `&&&` outranks the row's own hover rule, which dims this to grey.
          '&&&:hover': { color: '#1340FF', bgcolor: 'rgba(19, 64, 255, 0.08)' },
          '&&&.Mui-focusVisible': { color: '#1340FF', outline: '2px solid #1340FF', outlineOffset: 1 },
        }}
      >
        <Iconify icon="solar:pen-bold" width={12} />
      </ButtonBase>
    </Tooltip>
  );
}

ManualEditButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

/**
 * The fetch finished after the creator was added, with no usable numbers.
 *
 * One split chip, the same height and radius as the Outreach chip in this row:
 * the status on the left (amber, two words, full causes in the tooltip) and
 * the action on the right. One object, so a dense table stays calm.
 */
function FetchFailedValue({ label, details, onEnter }) {
  return (
    <Stack
      direction="row"
      alignItems="stretch"
      sx={{
        height: CHIP_ROW_HEIGHT,
        boxSizing: 'border-box',
        borderRadius: '6px',
        border: '1px solid #FFD98A',
        bgcolor: '#FFFFFF',
        overflow: 'hidden',
        maxWidth: '100%',
      }}
    >
      <Tooltip
        arrow
        placement="top"
        title={
          <Box sx={{ maxWidth: 280, py: 0.25 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, lineHeight: '16px' }}>
              {details.title}
            </Typography>
            <Typography sx={{ mt: 0.25, fontSize: 12, lineHeight: '16px' }}>{details.intro}</Typography>
            {details.reasons.length > 0 && (
              <Box component="ul" sx={{ m: 0, mt: 0.25, pl: 2 }}>
                {details.reasons.map((reason) => (
                  <Typography key={reason} component="li" sx={{ fontSize: 12, lineHeight: '16px' }}>
                    {reason}
                  </Typography>
                ))}
              </Box>
            )}
          </Box>
        }
      >
        <Stack
          tabIndex={0}
          direction="row"
          alignItems="center"
          spacing={0.5}
          aria-label={`${details.title}. ${details.intro} ${details.reasons.join('. ')}`}
          onClick={(event) => event.stopPropagation()}
          sx={{
            minWidth: 0,
            px: 0.75,
            bgcolor: '#FFF8E6',
            cursor: 'help',
            outline: 'none',
            '&:focus-visible': { boxShadow: 'inset 0 0 0 2px #FFAB00' },
          }}
        >
          <Iconify icon="eva:alert-triangle-fill" width={12} sx={{ color: '#FFAB00', flexShrink: 0 }} />
          <Typography
            noWrap
            sx={{ fontSize: SMALL_SIZE, fontWeight: 600, lineHeight: `${SMALL_HEIGHT}px`, color: '#7A4100' }}
          >
            {label}
          </Typography>
        </Stack>
      </Tooltip>
      <ButtonBase
        onClick={onEnter}
        aria-label="Enter numbers manually"
        sx={{
          flexShrink: 0,
          gap: 0.25,
          px: 0.75,
          borderLeft: '1px solid #FFD98A',
          fontSize: SMALL_SIZE,
          fontWeight: 600,
          lineHeight: `${SMALL_HEIGHT}px`,
          color: '#1340FF',
          transition: 'background-color 120ms ease',
          '&:hover': { bgcolor: 'rgba(19, 64, 255, 0.06)' },
          '&.Mui-focusVisible': { boxShadow: 'inset 0 0 0 2px #1340FF' },
        }}
      >
        <Iconify icon="eva:plus-fill" width={12} />
        Add
      </ButtonBase>
    </Stack>
  );
}

FetchFailedValue.propTypes = {
  label: PropTypes.string.isRequired,
  details: PropTypes.shape({
    title: PropTypes.string,
    intro: PropTypes.string,
    reasons: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  onEnter: PropTypes.func.isRequired,
};

const PitchTypeCell = React.memo(
  ({ type, isGuestCreator, isInvitedCreator, acceptedInviteByCreator }) => {
    const label = TYPE_LABELS[type] ?? (type || '—');

    let subtitle = null;
    if (type === 'shortlisted') {
      subtitle = isGuestCreator ? '(Non-platform)' : '(On Platform)';
    }

    if (type === 'shortlisted' && (isInvitedCreator || acceptedInviteByCreator)) {
      subtitle = '(Discovery Tool)';
    }

    // One line, so this field keeps the same height as every other one.
    return (
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Typography sx={VALUE_PLAIN_SX} noWrap>
          {label}
        </Typography>
        {subtitle && (
          <Typography sx={VALUE_MUTED_SX} noWrap>
            {subtitle}
          </Typography>
        )}
      </Stack>
    );
  }
);

PitchTypeCell.propTypes = {
  type: PropTypes.string,
  isGuestCreator: PropTypes.bool,
  isInvitedCreator: PropTypes.bool,
  acceptedInviteByCreator: PropTypes.bool,
};

const getStatusText = (status, pitch, campaign) => {
  const canonical = typeof status === 'string' ? status.toUpperCase().replace(/\s+/g, '_') : status;

  // Check for AGREEMENT_PENDING status with PENDING_REVIEW agreement form
  if (canonical === 'AGREEMENT_PENDING') {
    const agreementFormSubmission = campaign?.submission?.find(
      (sub) => sub?.submissionType?.type === 'AGREEMENT_FORM'
    );

    if (agreementFormSubmission?.status === 'PENDING_REVIEW') {
      return 'PENDING APPROVAL';
    }
  }

  if (canonical === 'APPROVED' && pitch.isInvited) {
    return 'INVITED';
  }

  const statusTextMap = {
    PENDING_REVIEW: 'PENDING REVIEW',
    SENT_TO_CLIENT: 'SENT TO CLIENT',
    INVITED: 'SENT TO CLIENT',
    SENT_TO_CLIENT_WITH_COMMENTS: 'SENT TO CLIENT',
    MAYBE: 'MAYBE',
    maybe: 'MAYBE',
    APPROVED: 'APPROVED',
    approved: 'APPROVED',
    REJECTED: 'REJECTED',
    rejected: 'REJECTED',
    WITHDRAWN: 'WITHDRAWN',
    AGREEMENT_PENDING: 'AGREEMENT PENDING',
    AGREEMENT_SUBMITTED: 'AGREEMENT SUBMITTED',
    AWAITING_APPROVAL: 'AWAITING APPROVAL',
  };

  return statusTextMap[status] || statusTextMap[canonical] || status;
};

const PitchRow = ({
  pitch,
  number,
  displayStatus,
  statusInfo,
  isGuestCreator,
  isInvitedCreator,
  campaign,
  onViewPitch,
  onRemoved,
  onOutreachUpdate,
  onMetricsUpdate,
  isDisabled = false,
  logistics,
}) => {
  const smUp = useResponsive('up', 'sm');
  const { user } = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();
  const creatorProfileId = pitch.userId || pitch.user?.id || pitch.user?.creator?.userId;
  // Same roles as the creator profile route guard.
  const canOpenCreatorProfile =
    Boolean(creatorProfileId) &&
    (user?.role === 'admin' ||
      user?.role === 'superadmin' ||
      user?.admin?.role?.name === 'sales_and_marketing' ||
      user?.admin?.role?.slug === 'sales_and_marketing');

  const acceptedInviteByCreator = pitch?.acceptedInviteByCreatorId !== null;
  const metricsPending = Boolean(pitch.pendingExtractionId);
  const revealScrapeMetrics = useJustFinished(metricsPending);
  // The fetch failed after the creator was added. The admin types the numbers.
  const isAdminUser = user?.role === 'admin' || user?.role === 'superadmin';
  const metricsEditable = isAdminUser && !isDisabled && canEditFailedMetrics(pitch);
  const [manualMetricsOpen, setManualMetricsOpen] = useState(false);
  const openManualMetrics = (event) => {
    event.stopPropagation();
    setManualMetricsOpen(true);
  };

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
      enqueueSnackbar(error?.response?.data?.message || 'Failed to update outreach status', {
        variant: 'error',
      });
    } finally {
      setOutreachLoading(false);
    }
  };

  // Helper to extract username from stats or profile link
  const getUsername = (stats, profileLink) =>
    stats?.username || (profileLink ? extractUsernameFromProfileLink(profileLink) : undefined);

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

  // Platform the row falls back to when a metric carries no platform of its own.
  const fallbackPlatform = resolveTierPlatformForDisplay(pitch, campaign);

  // Each metric reports which platform it came from, so the icon beside the
  // number always matches its source. The resolution order is unchanged.
  const getDisplayData = () => {
    const resolve = (...candidates) =>
      candidates.find(({ value }) => value != null) ?? { value: null, platform: null };

    const engagement = resolve(
      { value: instagramStats?.engagement_rate, platform: 'instagram' },
      { value: tiktokStats?.engagement_rate, platform: 'tiktok' },
      { value: pitch.engagementRate, platform: fallbackPlatform },
      // Scraped for a creator with no connected account. The pitch value
      // above already covers this campaign; these two carry the rate into
      // every other campaign the creator appears in.
      { value: pitch.user?.creator?.manualInstagramEngagementRate, platform: 'instagram' },
      { value: pitch.user?.creator?.manualTiktokEngagementRate, platform: 'tiktok' }
    );

    const followers = resolve(
      { value: instagramStats?.followers_count, platform: 'instagram' },
      { value: tiktokStats?.follower_count, platform: 'tiktok' },
      { value: pitch.followerCount, platform: fallbackPlatform },
      // Fallback for manually entered count
      { value: pitch.user?.creator?.manualFollowerCount, platform: fallbackPlatform }
    );

    return {
      engagementRate: engagement.value,
      engagementPlatform: engagement.platform,
      followerCount: followers.value,
      followerPlatform: followers.platform,
    };
  };

  // Get tier data from synthetic shortlisted row or creator's current tier
  const getTierData = () => {
    // Prefer shortlisted snapshot tier data (covers synthetic + regular pitches).
    if (pitch._creditTier) {
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
  const engagementRateText = formatEngagementRate(displayData.engagementRate);
  const tierData = getTierData();
  const credits = tierData?.creditsPerVideo;
  const creditsText = credits == null ? null : `${credits} Credit${credits === 1 ? '' : 's'}`;

  const displayProducts = useMemo(() => {
    if (!pitch?.userId || !logistics?.length) return '';

    const info = logistics.find((a) => a.creatorId === pitch.userId);
    const items = info?.deliveryDetails?.items ?? [];

    return items
      .map(({ product, quantity }) =>
        quantity > 1 ? `${product.productName} (${quantity})` : product.productName
      )
      .join(', ');
  }, [logistics, pitch?.userId]);

  const socialLinkSx = { ...HANDLE_SX, '&:hover': { color: '#1877F2' } };

  return (
    <TableRow
      hover
      onClick={() => onViewPitch(pitch)}
      sx={{
        cursor: 'pointer',
        '&:first-of-type td': { borderTop: '1px solid #EBEBEB' },
        [`&:hover .${MANUAL_EDIT_CLASS}`]: { color: '#8E8E93' },
      }}
    >
      {/* Row number */}
      <TableCell sx={{ ...CELL_SX, width: COLUMN_WIDTHS.index, px: 1, textAlign: 'center' }}>
        <Typography sx={INDEX_SX}>{number}</Typography>
      </TableCell>

      {/* Creator */}
      <TableCell sx={{ ...CELL_SX, width: COLUMN_WIDTHS.creator }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar
            src={pitch.user?.photoURL}
            alt={pitch.user?.name}
            sx={{
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              flexShrink: 0,
              bgcolor: '#D4D4D4',
              border: '1px solid #EBEBEB',
            }}
          >
            {pitch.user?.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Stack spacing={0.5}>
            {(() => {
              if (canOpenCreatorProfile) return (
              <Link
                component={RouterLink}
                to={paths.dashboard.creator.profile(creatorProfileId)}
                underline="hover"
                color="inherit"
                sx={NAME_LINK_SX}
                onClick={(event) => event.stopPropagation()}
              >
                {revealScrapeMetrics && pitch.user?.name ? (
                  <DiaTextReveal
                    text={pitch.user.name}
                    textColor="#231F20"
                    duration={1.5}
                    delay={0.05}
                    style={NAME_REVEAL_STYLE}
                  />
                ) : (
                  pitch.user?.name
                )}
              </Link>
              );
              if (revealScrapeMetrics && pitch.user?.name) return (
              <DiaTextReveal
                text={pitch.user.name}
                textColor="#231F20"
                duration={1.5}
                delay={0.05}
                style={NAME_REVEAL_STYLE}
              />
              );
              return (
              <Typography sx={NAME_SX}>{pitch.user?.name}</Typography>
              );
            })()}

            {hasSocialUsernames ? (
              /* One handle per line: Instagram first, TikTok under it. */
              <Stack spacing={0.25} alignItems="flex-start">
                {instagramUsername && (
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
                      {instagramUsername}
                    </Link>
                  </Stack>
                )}
                {tiktokUsername && (
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
                      {tiktokUsername}
                    </Link>
                  </Stack>
                )}
              </Stack>
            ) : (
              profileUsername && (
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
                    {profileUsername}
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

      {/* Outreach Status */}
      <TableCell sx={{ ...CELL_SX, width: COLUMN_WIDTHS.outreach }}>
        <FieldBlock label="Outreach status" minHeight={CHIP_ROW_HEIGHT}>
          {(() => {
            const outreachConfig = getOutreachStatusConfig(pitch.outreachStatus);
            const isSynthetic = pitch._isShortlistedOnly;

            // For synthetic shortlisted rows (no real pitch record), show "—" non-clickable
            if (isSynthetic) {
              return <EmptyValue />;
            }

            // No status set - show placeholder
            if (!outreachConfig) {
              return (
                <Box
                  onClick={handleOutreachClick}
                  sx={{
                    ...emptyChipSx,
                    alignSelf: 'flex-start',
                    cursor: isDisabled ? 'default' : 'pointer',
                    opacity: isDisabled ? 0.6 : 1,
                    '&:hover': !isDisabled && {
                      borderColor: '#8E8E93',
                      bgcolor: '#FAFAFA',
                    },
                  }}
                >
                  {outreachLoading ? (
                    <CircularProgress size={SPINNER_SIZE} sx={{ color: '#8E8E93' }} />
                  ) : (
                    <>
                      Not Set
                      {!isDisabled && (
                        <Iconify icon="eva:chevron-down-fill" width={CONTROL_ICON_SIZE} />
                      )}
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
                  ...chipSx(outreachConfig.color),
                  alignSelf: 'flex-start',
                  cursor: isDisabled ? 'default' : 'pointer',
                  opacity: isDisabled ? 0.6 : 1,
                  '&:hover': !isDisabled && {
                    opacity: 0.85,
                  },
                }}
              >
                {outreachLoading ? (
                  <CircularProgress size={SPINNER_SIZE} sx={{ color: outreachConfig.color }} />
                ) : (
                  <>
                    {outreachConfig.label}
                    {!isDisabled && (
                      <Iconify icon="eva:chevron-down-fill" width={CONTROL_ICON_SIZE} />
                    )}
                  </>
                )}
              </Box>
            );
          })()}
        </FieldBlock>

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
                ...chipSx(option.color),
                justifyContent: 'space-between',
                px: 1.5,
                fontSize: SMALL_SIZE + 1,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                ...(pitch.outreachStatus === option.value && {
                  outline: `2px solid ${option.color}20`,
                }),
                '&:hover': {
                  bgcolor: '#F5F5F5',
                },
              }}
            >
              <Box component="span" sx={{ flex: 1, textAlign: 'left' }}>
                {option.label}
              </Box>
              {pitch.outreachStatus === option.value && (
                <Iconify
                  icon="eva:checkmark-fill"
                  width={CONTROL_ICON_SIZE}
                  sx={{ ml: 1, flexShrink: 0 }}
                />
              )}
            </Box>
          ))}
        </Popover>
      </TableCell>

      {/* Engagement Rate + Tier */}
      <TableCell sx={{ ...CELL_SX, width: COLUMN_WIDTHS.engagement }}>
        <Stack spacing={0.5}>
          <FieldBlock label="Engagement rate" minHeight={CHIP_ROW_HEIGHT}>
            {(() => {
              if (metricsPending) return (
              <Box sx={{ width: 120 }}>
                <CreatorFieldLoading
                  label="Fetching engagement rate"
                  showSpinner
                  height={CHIP_ROW_HEIGHT}
                />
              </Box>
              );
              if (engagementRateText) return (
              <Stack direction="row" alignItems="center" spacing={1}>
                <PlatformIcon platform={displayData.engagementPlatform} />
                <ScrapeMetricValue text={engagementRateText} reveal={revealScrapeMetrics} />
                {metricsEditable && <ManualEditButton onClick={openManualMetrics} />}
              </Stack>
              );
              if (metricsEditable) return (
              <FetchFailedValue
                label={failureLabelShort(pitch.metricsFailureCode, pitch.selectedPlatform)}
                details={failureDetails(pitch.metricsFailureCode, pitch.selectedPlatform)}
                onEnter={openManualMetrics}
              />
              );
              return (
              <EmptyValue />
              );
            })()}
          </FieldBlock>

          {/* Tier name and its credit amount both show on every campaign. */}
          <FieldBlock label="Tier">
            {tierData ? (
              <Stack direction="row" alignItems="center" spacing={1}>
                <PlatformIcon platform={fallbackPlatform} />
                <ScrapeMetricValue
                  text={tierData.name}
                  reveal={revealScrapeMetrics}
                  style={VALUE_PLAIN_REVEAL_STYLE}
                  sx={VALUE_PLAIN_SX}
                />
                {creditsText && (
                  <ScrapeMetricValue
                    text={creditsText}
                    reveal={revealScrapeMetrics}
                    textColor="#8E8E93"
                    style={VALUE_PLAIN_REVEAL_STYLE}
                    sx={VALUE_MUTED_SX}
                  />
                )}
              </Stack>
            ) : (
              <EmptyValue />
            )}
          </FieldBlock>
        </Stack>
      </TableCell>

      {/* Followers + Type */}
      <TableCell sx={{ ...CELL_SX, width: COLUMN_WIDTHS.followers }}>
        <Stack spacing={0.5}>
          <FieldBlock label="Followers" minHeight={CHIP_ROW_HEIGHT}>
            {(() => {
              if (metricsPending) return (
              <Box sx={{ width: 120 }}>
                <CreatorFieldLoading
                  label="Fetching follower count"
                  showSpinner
                  height={CHIP_ROW_HEIGHT}
                />
              </Box>
              );
              if (displayData.followerCount) return (
              // The pencil sits outside the count tooltip, so hovering it
              // shows only its own tooltip.
              <Stack direction="row" alignItems="center" spacing={1}>
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
                  <PlatformIcon platform={displayData.followerPlatform} />
                  <ScrapeMetricValue
                    text={formatNumber(displayData.followerCount)}
                    reveal={revealScrapeMetrics}
                  />
                </Stack>
              </Tooltip>
              {metricsEditable && engagementRateText && (
                <ManualEditButton onClick={openManualMetrics} />
              )}
              </Stack>
              );
              return (
              <EmptyValue />
              );
            })()}
          </FieldBlock>

          <FieldBlock label="Type">
            <PitchTypeCell
              type={pitch.type}
              isGuestCreator={isGuestCreator}
              isInvitedCreator={isInvitedCreator}
              acceptedInviteByCreator={acceptedInviteByCreator}
            />
          </FieldBlock>
        </Stack>
      </TableCell>

      {/* Creator Status + Date */}
      <TableCell sx={{ ...CELL_SX, width: COLUMN_WIDTHS.status }}>
        <Stack spacing={0.5}>
          <FieldBlock label="Creator status" minHeight={CHIP_ROW_HEIGHT}>
            <Box
              sx={{
                ...chipSx(statusInfo.color),
                borderColor: statusInfo.borderColor,
                alignSelf: 'flex-start',
              }}
            >
              {getStatusText(displayStatus, pitch, campaign)}
              {pitch?.adminComments && displayStatus === 'SENT_TO_CLIENT_WITH_COMMENTS' && (
                <Tooltip title="CS Comments provided" arrow>
                  <Box
                    component="img"
                    src="/assets/icons/components/ic-comments.svg"
                    alt="Comments"
                    sx={{ width: CONTROL_ICON_SIZE, height: CONTROL_ICON_SIZE, flexShrink: 0 }}
                  />
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

      {/* Actions */}
      <TableCell align="right" sx={{ ...CELL_SX, width: COLUMN_WIDTHS.actions }}>
        {smUp ? (
          <V3PitchActions
            pitch={pitch}
            onViewPitch={onViewPitch}
            campaignId={campaign?.id}
            onRemoved={onRemoved}
            isDisabled={isDisabled}
          />
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

      {metricsEditable && (
        <ManualMetricsDialog
          open={manualMetricsOpen}
          onClose={() => setManualMetricsOpen(false)}
          pitch={pitch}
          // What the row shows, which can come from the creator rather than
          // the pitch. The dialog opens with the same numbers.
          initialValues={{
            followerCount: displayData.followerCount,
            engagementRate: displayData.engagementRate,
          }}
          onSaved={() => onMetricsUpdate?.()}
        />
      )}
    </TableRow>
  );
};

PitchRow.propTypes = {
  pitch: PropTypes.object.isRequired,
  number: PropTypes.number,
  displayStatus: PropTypes.string.isRequired,
  statusInfo: PropTypes.object.isRequired,
  isGuestCreator: PropTypes.bool,
  isInvitedCreator: PropTypes.bool,
  campaign: PropTypes.object,
  onViewPitch: PropTypes.func.isRequired,
  onRemoved: PropTypes.func,
  onOutreachUpdate: PropTypes.func,
  onMetricsUpdate: PropTypes.func,
  isDisabled: PropTypes.bool,
  logistics: PropTypes.array,
};

export default PitchRow;
