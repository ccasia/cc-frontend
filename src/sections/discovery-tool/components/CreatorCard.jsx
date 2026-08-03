import { useState } from 'react';
import PropTypes from 'prop-types';

import { Box, Chip, Stack, Button, Avatar, Typography } from '@mui/material';

import { formatNumber } from 'src/utils/socialMetricsCalculator';
import { createSocialProfileUrl } from 'src/utils/media-kit-utils';

import Iconify from 'src/components/iconify';
import StarRating from 'src/components/star-rating';

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

const StatItem = ({ label, shortLabel, value }) => (
  <Box sx={{ flex: '0 0 auto' }}>
    <Typography
      component="span"
      sx={{
        display: 'block',
        color: BLUE,
        fontSize: 10,
        fontWeight: 600,
        lineHeight: '14px',
        whiteSpace: 'nowrap',
      }}
    >
      {shortLabel ? (
        <>
          {/* Full label on wider cards, short label once the card narrows. */}
          <Box component="span" sx={{ '@container creator-card (max-width: 280px)': { display: 'none' } }}>
            {label}
          </Box>
          <Box component="span" sx={{ '@container creator-card (min-width: 280.05px)': { display: 'none' } }}>
            {shortLabel}
          </Box>
        </>
      ) : (
        label
      )}
    </Typography>
    <Typography
      sx={{
        color: BLUE,
        fontFamily: 'Instrument Serif',
        fontSize: 20,
        fontWeight: 400,
        lineHeight: '24px',
      }}
    >
      {value}
    </Typography>
  </Box>
);

StatItem.propTypes = {
  label: PropTypes.string.isRequired,
  shortLabel: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

StatItem.defaultProps = {
  shortLabel: null,
};

const CreatorRating = ({ rating }) => (
  <Box sx={{ flex: '0 0 auto' }}>
    <Typography
      sx={{
        color: ONYX,
        fontSize: 10,
        fontWeight: 400,
        lineHeight: '14px',
        textTransform: 'uppercase',
      }}
    >
      Cult Rating
    </Typography>
    <Stack direction="row" alignItems="flex-end" spacing={1} sx={{ mt: 0.5 }}>
      <Stack direction="row" alignItems="flex-end" spacing={0}>
        <Typography
          sx={{
            color: BLUE,
            fontSize: 18,
            fontWeight: 600,
            lineHeight: '22px',
          }}
        >
          {rating.toFixed(1)}
        </Typography>
        <Typography
          sx={{
            color: BLUE,
            fontSize: 13,
            fontWeight: 400,
            lineHeight: '17px',
            mb: '1px',
          }}
        >
          / 5.0
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
);

CreatorRating.propTypes = {
  rating: PropTypes.number.isRequired,
};

const VideoThumbnail = ({ video, platform }) => {
  const [hasImageError, setHasImageError] = useState(false);

  const thumbnailUrl =
    platform === 'instagram'
      ? video.cached_thumbnail_url || video.thumbnail_url || video.media_url
      : video.cover_image_url;

  // Non-interactive in the card: clicks fall through to the card so admins open
  // the details drawer instead of being redirected to the video.
  return (
    <Box
      sx={{
        position: 'relative',
        flex: '1 1 0',
        minWidth: 0,
        height: '100%',
        overflow: 'hidden',
        borderRadius: 1,
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
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
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

VideoThumbnail.propTypes = {
  video: PropTypes.object.isRequired,
  platform: PropTypes.oneOf(['instagram', 'tiktok']),
};

VideoThumbnail.defaultProps = {
  platform: null,
};

const CreatorCard = ({
  creator,
  lists,
  creatorListIds,
  onToggleList,
  onCreateList,
  onInviteOne,
  onOpenDetails,
  rowKey,
  compareMode,
  compareSelected,
  onCompareSelect,
}) => {
  const platformData = resolvePlatformData(creator);
  const { platform } = platformData;
  const handle = getPlatformHandle(creator, platform);
  const platformIcon = getPlatformIcon(platform);
  const creatorRowKey = rowKey || creator.rowId || creator.userId;
  const rating = resolveCreatorRating(creator);

  const profilePicture =
    platform === 'instagram'
      ? creator.instagram?.profilePictureUrl || null
      : creator.tiktok?.profilePictureUrl || null;
  const bio =
    platform === 'tiktok'
      ? creator.tiktok?.biography || creator.about || null
      : creator.instagram?.biography || creator.about || null;
  const followers = platformData.followers || 0;
  const engagementRate = platformData.engagementRate || 0;
  const topVideos = [...(platformData.topVideos || [])]
    .sort((a, b) => Number(b?.like_count || 0) - Number(a?.like_count || 0))
    .slice(0, 3);
  const mediaSlots = Array.from({ length: 3 }, (_, index) => topVideos[index] || null);

  const handleCardClick = () => {
    if (compareMode) {
      onCompareSelect?.(creatorRowKey);
      return;
    }
    onOpenDetails?.(creatorRowKey);
  };

  const handleInvite = (event) => {
    event.stopPropagation();
    onInviteOne?.(creatorRowKey);
  };

  return (
    <Box
      onClick={handleCardClick}
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        // Establish a container so stat labels can respond to the card's own
        // width (cards live in a 1/2/3-col grid, so viewport size ≠ card size).
        containerType: 'inline-size',
        containerName: 'creator-card',
        minHeight: { xs: 350, lg: 404, xl: 430 },
        p: 2.25,
        gap: 1.75,
        border: '2px solid transparent',
        background: compareSelected
          ? 'linear-gradient(#F5F5F5,#F5F5F5) padding-box, linear-gradient(180deg,#1340FF 0%,#8859FE 100%) border-box'
          : 'linear-gradient(#F5F5F5,#F5F5F5) padding-box, linear-gradient(#F5F5F5,#F5F5F5) border-box',
        borderRadius: '20px',
        cursor: 'pointer',
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ height: 42 }}>
        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
          <Avatar
            src={profilePicture}
            alt={creator.name}
            sx={{
              width: 42,
              height: 42,
              border: '1px solid #EBEBEB',
              flex: '0 0 auto',
            }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                color: ONYX,
                fontSize: 15,
                fontWeight: 600,
                lineHeight: '20px',
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
                  onClick={(event) => event.stopPropagation()}
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
                      fontSize: 13,
                      fontWeight: 400,
                      lineHeight: '17px',
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

        <BookmarkButton
          creator={creator}
          rowKey={creatorRowKey}
          lists={lists}
          creatorListIds={creatorListIds}
          onToggleList={onToggleList}
          onCreateList={onCreateList}
          variant="card"
        />
      </Stack>

      <Stack
        direction="row"
        alignItems="flex-end"
        sx={{
          flexWrap: 'nowrap',
        }}
      >
        <CreatorRating rating={rating} />
        <Box sx={{ flex: '1 1 auto', minWidth: 16 }} />
        <Stack
          direction="row"
          alignItems="center"
          sx={{
            columnGap: 2,
            flexWrap: 'nowrap',
            justifyContent: 'flex-end',
            flex: '0 0 auto',
          }}
        >
          <StatItem label="Followers" value={formatNumber(followers)} />
          <StatItem
            label="Engagement Rate"
            shortLabel="Engagement"
            value={formatEngagementRate(engagementRate)}
          />
        </Stack>
      </Stack>

      <Typography
        sx={{
          color: ONYX,
          fontSize: 12,
          fontWeight: 400,
          lineHeight: '16px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {bio || 'No bio available.'}
      </Typography>

      <Stack direction="row" spacing={1.25} sx={{ height: { xs: 145, lg: 190, xl: 214 } }}>
        {mediaSlots.map((video, index) =>
          video ? (
            <VideoThumbnail key={video.id || video.video_id || index} video={video} platform={platform} />
          ) : (
            <Box
              key={`placeholder-${index}`}
              sx={{
                flex: '1 1 0',
                minWidth: 0,
                height: '100%',
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

      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        sx={{ minHeight: 28, columnGap: 1, rowGap: 1, flexWrap: 'wrap' }}
      >
        <Stack
          direction="row"
          alignItems="center"
          sx={{
            columnGap: 0.625,
            rowGap: 0.75,
            flexWrap: 'wrap',
            minWidth: 0,
            maxWidth: { xs: '100%', sm: 'calc(100% - 108px)' },
          }}
        >
          {(creator.interests || []).slice(0, 3).map((interest) => (
            <Chip
              key={interest}
              label={interest}
              size="small"
              sx={{
                height: 28,
                maxWidth: { xs: 124, lg: 148 },
                bgcolor: '#FFFFFF',
                color: ONYX,
                borderRadius: 12,
                pointerEvents: 'none',
                '&:hover, &:focus, &:active': {
                  bgcolor: '#FFFFFF',
                },
                '& .MuiChip-label': {
                  px: 1,
                  fontSize: 11,
                  fontWeight: 500,
                  lineHeight: '15px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                },
              }}
            />
          ))}
        </Stack>
        {onInviteOne && (
          <Button
            type="button"
            onClick={handleInvite}
            sx={{
              width: 96,
              height: 28,
              minWidth: 96,
              px: 1,
              pt: 0.25,
              pb: 0.625,
              bgcolor: '#3A3A3C',
              borderRadius: '6px',
              boxShadow: 'inset 0px -3px 0px rgba(0, 0, 0, 0.45)',
              color: '#FFFFFF',
              flex: '0 0 auto',
              fontSize: 13,
              fontWeight: 600,
              lineHeight: '17px',
              textTransform: 'none',
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
    </Box>
  );
};

CreatorCard.propTypes = {
  creator: PropTypes.shape({
    rowId: PropTypes.string,
    platform: PropTypes.oneOf(['instagram', 'tiktok']),
    userId: PropTypes.string,
    creatorId: PropTypes.string,
    name: PropTypes.string,
    creatorRating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    rating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    averageRating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    score: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    creditScore: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    pastCampaigns: PropTypes.arrayOf(PropTypes.object),
    handles: PropTypes.shape({
      instagram: PropTypes.string,
      tiktok: PropTypes.string,
    }),
    interests: PropTypes.arrayOf(PropTypes.string),
    about: PropTypes.string,
    instagram: PropTypes.object,
    tiktok: PropTypes.object,
  }).isRequired,
  lists: PropTypes.array,
  creatorListIds: PropTypes.oneOfType([PropTypes.array, PropTypes.instanceOf(Set)]),
  onToggleList: PropTypes.func,
  onCreateList: PropTypes.func,
  onInviteOne: PropTypes.func,
  onOpenDetails: PropTypes.func,
  rowKey: PropTypes.string,
  compareMode: PropTypes.bool,
  compareSelected: PropTypes.bool,
  onCompareSelect: PropTypes.func,
};

CreatorCard.defaultProps = {
  lists: [],
  creatorListIds: [],
  onToggleList: undefined,
  onCreateList: undefined,
  onInviteOne: undefined,
  onOpenDetails: undefined,
  rowKey: undefined,
  compareMode: false,
  compareSelected: false,
  onCompareSelect: undefined,
};

export default CreatorCard;
