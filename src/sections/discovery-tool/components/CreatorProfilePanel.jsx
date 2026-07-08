import { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router';

import { Box, Chip, Stack, Button, Avatar, Typography } from '@mui/material';

import { formatNumber } from 'src/utils/socialMetricsCalculator';
import { createSocialProfileUrl } from 'src/utils/media-kit-utils';

import Iconify from 'src/components/iconify';

import BookmarkButton from './BookmarkButton';
import {
  ONYX,
  BLUE,
  getPlatformIcon,
  getPlatformHandle,
  resolvePlatformData,
  formatEngagementRate,
  resolveCreatorRating,
} from './creator-helpers';
import StarRating from 'src/components/star-rating';

// ─── Sub-components ───────────────────────────────────────────────────────────

const RatingStars = ({ rating }) => {
  const activeStars = Math.round(rating);
  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Iconify
          key={star}
          icon="material-symbols:star-rounded"
          width={16}
          color={star <= activeStars ? '#FFC702' : '#D9D9D9'}
        />
      ))}
    </Stack>
  );
};

RatingStars.propTypes = {
  rating: PropTypes.number.isRequired,
};

const StatItem = ({ label, value }) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography sx={{ color: BLUE, fontSize: 12, fontWeight: 600, lineHeight: '16px' }}>
      {label}
    </Typography>
    <Typography
      sx={{
        color: BLUE,
        fontFamily: 'Instrument Serif',
        fontSize: 32,
        fontWeight: 400,
        lineHeight: '36px',
      }}
    >
      {value}
    </Typography>
  </Box>
);

StatItem.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

const DetailItem = ({ label, value }) => {
  const values = (Array.isArray(value) ? value : [value]).filter((item) => item || item === 0);

  return (
    <Box sx={{ flex: '1 1 0', minWidth: 0 }}>
      <Typography
        sx={{
          color: '#8E8E93',
          fontSize: 12,
          fontWeight: 600,
          lineHeight: '16px',
          mb: 1,
        }}
      >
        {label}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
        {(values.length ? values : ['—']).map((item) => (
          <Box
            key={item}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              px: 1,
              py: '6px',
              bgcolor: '#FFFFFF',
              border: '1px solid #EBEBEB',
              boxShadow: 'inset 0px -3px 0px #E7E7E7',
              borderRadius: '6px',
            }}
          >
            <Typography
              sx={{
                color: '#636366',
                fontSize: 12,
                fontWeight: 600,
                lineHeight: '16px',
                whiteSpace: 'nowrap',
              }}
            >
              {item}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

DetailItem.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  ]),
};

DetailItem.defaultProps = {
  value: null,
};

const PopularVideo = ({ video, platform, tiktokHandle, height }) => {
  const [hasImageError, setHasImageError] = useState(false);

  const thumbnailUrl =
    platform === 'instagram'
      ? video.cached_thumbnail_url || video.thumbnail_url || video.media_url
      : video.cover_image_url;

  const normalizedTiktokHandle = tiktokHandle ? String(tiktokHandle).replace(/^@/, '') : null;
  const tiktokCanonicalUrl =
    video.video_url ||
    (normalizedTiktokHandle && video.video_id
      ? `https://www.tiktok.com/@${normalizedTiktokHandle}/video/${video.video_id}`
      : null);
  const permalink =
    platform === 'instagram' ? video.permalink : tiktokCanonicalUrl || video.embed_link;

  return (
    <Box
      component={permalink ? 'a' : 'div'}
      href={permalink || undefined}
      target={permalink ? '_blank' : undefined}
      rel={permalink ? 'noopener noreferrer' : undefined}
      sx={{
        position: 'relative',
        flex: '1 1 0',
        minWidth: 0,
        height,
        overflow: 'hidden',
        borderRadius: 1,
        cursor: permalink ? 'pointer' : 'default',
        textDecoration: 'none',
        bgcolor: '#EBEBEB',
        '&::after': thumbnailUrl
          ? {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.7) 80%)',
              pointerEvents: 'none',
            }
          : undefined,
      }}
    >
      {thumbnailUrl && !hasImageError ? (
        <Box
          component="img"
          src={thumbnailUrl}
          alt="Video thumbnail"
          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={() => setHasImageError(true)}
        />
      ) : (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Iconify icon="mdi:image-outline" width={24} color="#8E8E93" />
        </Box>
      )}
    </Box>
  );
};

PopularVideo.propTypes = {
  video: PropTypes.object.isRequired,
  platform: PropTypes.oneOf(['instagram', 'tiktok']),
  tiktokHandle: PropTypes.string,
  height: PropTypes.number,
};

PopularVideo.defaultProps = {
  platform: null,
  tiktokHandle: null,
  height: 127,
};

const PastCampaignRow = ({ campaign }) => {
  const image = campaign.image || campaign.coverUrl || campaign.thumbnail || null;
  const title = campaign.name || campaign.title || 'Untitled campaign';
  const subtitle = campaign.date || campaign.period || '';
  const views = campaign.views ?? campaign.viewCount ?? null;

  return (
    <Stack direction="row" sx={{ height: 67, borderRadius: '8px' }}>
      <Box
        sx={{
          width: 54,
          flex: '0 0 auto',
          borderRadius: '8px 0 0 8px',
          bgcolor: '#EBEBEB',
          backgroundImage: image ? `url(${image})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1.5}
        sx={{ flex: 1, minWidth: 0, p: 1.5, bgcolor: '#F5F5F5', borderRadius: '0 10px 10px 0' }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: ONYX,
              fontSize: 12,
              fontWeight: 600,
              lineHeight: '16px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              sx={{ color: '#636366', fontSize: 12, fontWeight: 400, lineHeight: '16px', mt: 0.5 }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        {views != null && (
          <Box sx={{ flex: '0 0 auto', textAlign: 'left' }}>
            <Typography sx={{ color: BLUE, fontSize: 10, fontWeight: 600, lineHeight: '14px' }}>
              Views
            </Typography>
            <Typography
              sx={{ color: BLUE, fontFamily: 'Instrument Serif', fontSize: 24, lineHeight: '28px' }}
            >
              {formatNumber(views)}
            </Typography>
          </Box>
        )}
      </Stack>
    </Stack>
  );
};

PastCampaignRow.propTypes = {
  campaign: PropTypes.object.isRequired,
};

const SECTION_HEADING_SX = {
  color: ONYX,
  fontSize: 12,
  fontWeight: 400,
  lineHeight: '16px',
};

// ─── Main Panel ───────────────────────────────────────────────────────────────

const CreatorProfilePanel = ({
  creator,
  rowKey,
  lists,
  creatorListIds,
  onToggleList,
  onOpenListManager,
  onInvite,
  variant,
}) => {
  const navigate = useNavigate();
  const isCompare = variant === 'compare';

  const platformData = resolvePlatformData(creator);
  const { platform } = platformData;
  const handle = getPlatformHandle(creator, platform);
  const platformIcon = getPlatformIcon(platform);
  const rating = resolveCreatorRating(creator);

  const profilePicture =
    platform === 'instagram'
      ? creator.instagram?.profilePictureUrl || null
      : creator.tiktok?.profilePictureUrl || null;

  const followers = platformData.followers || 0;
  const engagementRate = platformData.engagementRate || 0;
  const averageSaves = platformData.averageSaves || 0;
  const averageShares = platformData.averageShares || 0;

  const topVideos = [...(platformData.topVideos || [])]
    .sort((a, b) => Number(b?.like_count || 0) - Number(a?.like_count || 0))
    .slice(0, 3);
  const mediaSlots = Array.from({ length: 3 }, (_, index) => topVideos[index] || null);

  // location is built backend-side as "city, country"
  const [city, country] = (creator.location || '').split(',').map((part) => part.trim());

  const languages = Array.isArray(creator.languages)
    ? creator.languages.filter(Boolean)
    : [creator.languages].filter(Boolean);

  const pastCampaigns = Array.isArray(creator.pastCampaigns) ? creator.pastCampaigns : [];

  const statItems = [
    { label: 'Followers', value: formatNumber(followers) },
    { label: 'Engagement Rate', value: formatEngagementRate(engagementRate) },
    ...(platform !== 'tiktok' ? [{ label: 'Avg Saves', value: formatNumber(averageSaves) }] : []),
    { label: 'Avg Shares', value: formatNumber(averageShares) },
  ];

  const detailItems = isCompare
    ? [
        { label: 'Country', value: country },
        { label: 'Age', value: creator.age },
        { label: 'City', value: city },
        { label: 'Gender', value: creator.gender },
        { label: 'Tier', value: creator.creditTier },
        { label: 'Language', value: languages },
      ]
    : [
        { label: 'Country', value: country },
        { label: 'City', value: city },
        { label: 'Age', value: creator.age },
        { label: 'Gender', value: creator.gender },
        { label: 'Language', value: languages },
        { label: 'Tier', value: creator.creditTier },
      ];

  const videoHeight = isCompare ? 240 : 127;

  const handleMediaKit = () => {
    navigate(`/dashboard/mediakit/client/${creator.creatorId}`, {
      state: {
        returnTo: {
          pathname: window.location.pathname,
          search: window.location.search,
        },
      },
    });
  };

  return (
    <Stack
      sx={{
        flex: 1,
        minWidth: 0,
        // In compare mode the panel is a row item and needs an explicit height
        // to stretch into equal-height columns. In the drawer it's a column
        // item, so `flex: 1` must own the height — an explicit `height: 100%`
        // there would make it a full 100vh below the 72px header, overflowing
        // the Paper and pushing the footer below the fold (not sticky).
        height: isCompare ? '100%' : 'auto',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#FFFFFF',
      }}
    >
      {/* -- Scrollable body -- */}
      <Stack
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: isCompare ? 'visible' : 'auto',
          p: isCompare ? 0 : 3,
          gap: 3,
          bgcolor: '#FFFFFF',
        }}
      >
        {/* Creator block */}
        <Box sx={{ position: 'relative', p: 2, bgcolor: '#F1F1F1', borderRadius: '20px' }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
            <Avatar
              src={profilePicture}
              alt={creator.name}
              sx={{ width: 64, height: 64, border: '1px solid #EBEBEB', flex: '0 0 auto' }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  color: ONYX,
                  fontSize: 24,
                  fontWeight: 600,
                  lineHeight: '28px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {creator.name}
              </Typography>
              {handle && (
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 0 }}>
                  {platformIcon && <Iconify icon={platformIcon} width={12} color={ONYX} />}
                  <Box
                    component="a"
                    href={createSocialProfileUrl(handle, platform)}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: 'inherit',
                      minWidth: 0,
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    <Typography
                      sx={{
                        color: ONYX,
                        fontSize: 14,
                        fontWeight: 400,
                        lineHeight: '18px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {handle}
                    </Typography>
                  </Box>
                </Stack>
              )}
            </Box>
          </Stack>

          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 2 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  color: ONYX,
                  fontSize: 12,
                  fontWeight: 400,
                  lineHeight: '16px',
                  textTransform: 'uppercase',
                }}
              >
                Cult Rating
              </Typography>
              <Stack direction="row" alignItems="flex-end" spacing={1} sx={{ mt: 0.5 }}>
                <Stack direction="row" alignItems="flex-end" spacing={0}>
                  <Typography
                    sx={{ color: BLUE, fontSize: 20, fontWeight: 600, lineHeight: '24px' }}
                  >
                    {rating.toFixed(1)}
                  </Typography>
                  <Typography
                    sx={{
                      color: BLUE,
                      fontSize: 12,
                      fontWeight: 400,
                      lineHeight: '16px',
                      mb: '1px',
                    }}
                  >
                    &nbsp;/ 5.0
                  </Typography>
                </Stack>
                <StarRating
                  value={rating}
                  activeColor="#FFC702"
                  emptyColor="#D9D9D9"
                  width={17}
                  sx={{ alignItems: 'center' }}
                />
              </Stack>
            </Box>

            <BookmarkButton
              creator={creator}
              rowKey={rowKey}
              lists={lists}
              creatorListIds={creatorListIds}
              onToggleList={onToggleList}
              onOpenListManager={onOpenListManager}
              variant="card"
            />
          </Stack>

          {(creator.interests || []).length > 0 && (
            <Stack direction="row" sx={{ mt: 1.5, flexWrap: 'wrap', gap: 0.75 }}>
              {(creator.interests || []).slice(0, 3).map((interest) => (
                <Chip
                  key={interest}
                  label={interest}
                  size="small"
                  sx={{
                    height: 28,
                    bgcolor: '#FFFFFF',
                    color: ONYX,
                    borderRadius: 12,
                    pointerEvents: 'none',
                    '& .MuiChip-label': {
                      px: 1,
                      fontSize: 12,
                      fontWeight: 500,
                      lineHeight: '16px',
                    },
                  }}
                />
              ))}
            </Stack>
          )}
        </Box>

        {/* Stats block */}
        <Box sx={isCompare ? { px: 0 } : { p: 2, bgcolor: '#F5F5F5', borderRadius: '20px' }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: isCompare ? `repeat(${statItems.length}, 1fr)` : '1fr 1fr',
              columnGap: 2,
              rowGap: 3,
            }}
          >
            {statItems.map((stat) => (
              <StatItem key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </Box>
        </Box>

        {/* Details block */}
        <Box sx={isCompare ? { px: 0 } : { p: 2, bgcolor: '#F5F5F5', borderRadius: '20px' }}>
          <Typography sx={{ ...SECTION_HEADING_SX, mb: 1.5 }}>DETAILS</Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: isCompare ? 'repeat(3, 1fr)' : '1fr 1fr',
              columnGap: isCompare ? 4 : 2,
              rowGap: 1.5,
            }}
          >
            {detailItems.map((detail) => (
              <DetailItem key={detail.label} label={detail.label} value={detail.value} />
            ))}
          </Box>
        </Box>

        {/* Past campaigns */}
        {pastCampaigns.length > 0 && (
          <Box>
            <Typography sx={{ ...SECTION_HEADING_SX, mb: 1.5 }}>PAST CAMPAIGNS</Typography>
            <Stack spacing={1.5}>
              {pastCampaigns.map((campaign, index) => (
                <PastCampaignRow
                  key={campaign.id || campaign.campaignId || index}
                  campaign={campaign}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Popular videos */}
        <Box>
          <Typography sx={{ ...SECTION_HEADING_SX, mb: 1.5 }}>POPULAR VIDEOS</Typography>
          <Stack direction="row" spacing={1}>
            {mediaSlots.map((video, index) =>
              video ? (
                <PopularVideo
                  key={video.id || video.video_id || index}
                  video={video}
                  platform={platform}
                  tiktokHandle={creator.handles?.tiktok}
                  height={videoHeight}
                />
              ) : (
                <Box
                  key={`placeholder-${index}`}
                  sx={{
                    flex: '1 1 0',
                    minWidth: 0,
                    height: videoHeight,
                    borderRadius: 1,
                    bgcolor: '#EBEBEB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Iconify icon="mdi:image-outline" width={24} color="#8E8E93" />
                </Box>
              )
            )}
          </Stack>
        </Box>
      </Stack>

      {/* -- Sticky footer -- */}
      <Stack
        direction="row"
        justifyContent="flex-end"
        spacing={1}
        sx={{
          flexShrink: 0,
          px: isCompare ? 0 : 3,
          py: 2,
          bgcolor: '#FFFFFF',
          borderTop: isCompare ? 'none' : '1px solid #EBEBEB',
        }}
      >
        <Button
          onClick={handleMediaKit}
          sx={{
            height: 38,
            px: 1.5,
            color: ONYX,
            bgcolor: '#FFFFFF',
            border: '1px solid #E8E8E8',
            boxShadow: 'inset 0px -3px 0px #E7E7E7',
            borderRadius: 1,
            textTransform: 'none',
            fontSize: 14,
            fontWeight: 600,
            lineHeight: '18px',
            '&:hover': {
              bgcolor: '#FFFFFF',
              border: '1px solid #E8E8E8',
              boxShadow: 'inset 0px -3px 0px #E7E7E7',
            },
          }}
        >
          Media Kit
        </Button>
        {onInvite && (
          <Button
            onClick={() => onInvite(rowKey)}
            sx={{
              height: 38,
              px: 1.5,
              color: '#FFFFFF',
              bgcolor: '#3A3A3C',
              boxShadow: 'inset 0px -3px 0px rgba(0, 0, 0, 0.45)',
              borderRadius: 1,
              textTransform: 'none',
              fontSize: 14,
              fontWeight: 600,
              lineHeight: '18px',
              '&:hover': {
                bgcolor: '#3A3A3C',
                boxShadow: 'inset 0px -3px 0px rgba(0, 0, 0, 0.35)',
              },
            }}
          >
            + Campaign
          </Button>
        )}
      </Stack>
    </Stack>
  );
};

CreatorProfilePanel.propTypes = {
  creator: PropTypes.shape({
    creatorId: PropTypes.string,
    name: PropTypes.string,
    age: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    gender: PropTypes.string,
    location: PropTypes.string,
    creditTier: PropTypes.string,
    languages: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
    pastCampaigns: PropTypes.arrayOf(PropTypes.object),
    interests: PropTypes.arrayOf(PropTypes.string),
    handles: PropTypes.shape({
      instagram: PropTypes.string,
      tiktok: PropTypes.string,
    }),
    instagram: PropTypes.object,
    tiktok: PropTypes.object,
  }).isRequired,
  rowKey: PropTypes.string,
  lists: PropTypes.array,
  creatorListIds: PropTypes.oneOfType([PropTypes.array, PropTypes.instanceOf(Set)]),
  onToggleList: PropTypes.func,
  onOpenListManager: PropTypes.func,
  onInvite: PropTypes.func,
  variant: PropTypes.oneOf(['drawer', 'compare']),
};

CreatorProfilePanel.defaultProps = {
  rowKey: undefined,
  lists: [],
  creatorListIds: [],
  onToggleList: undefined,
  onOpenListManager: undefined,
  onInvite: undefined,
  variant: 'drawer',
};

export default CreatorProfilePanel;
