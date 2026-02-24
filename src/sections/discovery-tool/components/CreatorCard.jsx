import PropTypes from 'prop-types';
import { useState } from 'react';

import { Box, Chip, Stack, Avatar, Checkbox, Typography, Icon } from '@mui/material';

import Iconify from 'src/components/iconify';
import { formatNumber } from 'src/utils/socialMetricsCalculator';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatEngagementRate = (rate) => {
  if (!rate && rate !== 0) return '0%';
  return `${Number(rate).toFixed(2)}%`;
};

/** Pick the primary platform stats for the card */
const resolvePlatformData = (creator) => {
  if (creator.platform === 'instagram' && creator.instagram?.connected) {
    return { platform: 'instagram', ...creator.instagram };
  }

  if (creator.platform === 'tiktok' && creator.tiktok?.connected) {
    return { platform: 'tiktok', ...creator.tiktok };
  }

  const ig = creator.instagram;
  const tt = creator.tiktok;

  // Prefer the platform with a connection; if both, pick the one with more followers
  if (ig?.connected && tt?.connected) {
    return ig.followers >= tt.followers
      ? { platform: 'instagram', ...ig }
      : { platform: 'tiktok', ...tt };
  }
  if (ig?.connected) return { platform: 'instagram', ...ig };
  if (tt?.connected) return { platform: 'tiktok', ...tt };
  return { platform: null };
};

const getPlatformHandle = (creator, platform) => {
  if (platform === 'instagram')
    return creator.handles?.instagram ? `${creator.handles.instagram}` : null;
  if (platform === 'tiktok') return creator.handles?.tiktok ? `${creator.handles.tiktok}` : null;
  return null;
};

const getPlatformIcon = (platform) => {
  if (platform === 'instagram') return 'mdi:instagram';
  if (platform === 'tiktok') return 'ic:baseline-tiktok';
  return null;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatItem = ({ label, value }) => (
  <Box>
    <Typography
      variant="caption"
      sx={{
        color: '#1340FF',
        fontWeight: 700,
      }}
    >
      {label}
    </Typography>
    <Typography
      variant="h3"
      sx={{ fontWeight: 400, fontFamily: 'Instrument Serif', color: '#1340FF' }}
    >
      {value}
    </Typography>
  </Box>
);

StatItem.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

const VideoThumbnail = ({ video, platform, tiktokHandle }) => {
  const [hasImageError, setHasImageError] = useState(false);

  const thumbnailUrl =
    platform === 'instagram' ? video.thumbnail_url || video.media_url : video.cover_image_url;

  const likes = platform === 'instagram' ? video.like_count : video.like_count;
  const comments = platform === 'instagram' ? video.comments_count : video.comment_count;

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
        width: '100%',
        height: 200,
        overflow: 'hidden',
        cursor: permalink ? 'pointer' : 'default',
        textDecoration: 'none',
        '&:hover .thumbnail-overlay': {
          opacity: 1,
        },
      }}
    >
      {/* Thumbnail image */}
      {thumbnailUrl && !hasImageError && (
        <Box
          component="img"
          src={thumbnailUrl}
          alt="Video thumbnail"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          onError={() => {
            setHasImageError(true);
          }}
        />
      )}

      {/* Fallback when no thumbnail */}
      {(!thumbnailUrl || hasImageError) && (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            bgcolor: 'grey.200',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Iconify icon="mdi:video-outline" width={32} color="grey.500" />
        </Box>
      )}

      {/* Stats overlay at bottom */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
          px: 1,
          py: 0.75,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Iconify icon="mdi:heart-outline" width={20} color="#fff" />
          <Typography sx={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>
            {formatNumber(likes || 0)}
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Iconify icon="tabler:message-circle" width={20} color="#fff" />
          <Typography sx={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>
            {formatNumber(comments || 0)}
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
};

VideoThumbnail.propTypes = {
  video: PropTypes.object.isRequired,
  platform: PropTypes.oneOf(['instagram', 'tiktok']).isRequired,
  tiktokHandle: PropTypes.string,
};

// ─── Main Component ───────────────────────────────────────────────────────────

const CreatorCard = ({ creator, selected, onSelect }) => {
  const platformData = resolvePlatformData(creator);
  const { platform } = platformData;
  const handle = getPlatformHandle(creator, platform);
  const platformIcon = getPlatformIcon(platform);

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
  const avgLikes = platformData.averageLikes || 0;
  const avgSaves = platformData.averageSaves || 0;
  const avgShares = platformData.averageShares || 0;

  const topVideos = (platformData.topVideos || []).slice(0, 3);

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        bgcolor: 'background.paper',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, #1340FF 0%, #FFFFFF 22%)',
          opacity: selected ? 1 : 0,
          transition: 'opacity 150ms ease',
          pointerEvents: 'none',
          zIndex: 0,
        },
        '& > *': {
          position: 'relative',
          zIndex: 1,
        },
        p: 1,
        gap: 2,
      }}
    >
      {/* ─── Left: User Card ─────────────────────────────────────────────────── */}
      <Box
        sx={{
          width: 200,
          height: 200,
          minWidth: 200,
          p: 2,
          display: 'flex',
          flex: 0.5,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          bgcolor: '#F5F5F5',
          borderRadius: 2,
          boxShadow: '2px 2px 2px 1px rgba(0,0,0,0.08)',
          transition: 'box-shadow 0.2s, transform 0.3s',
          '&:hover': {
            boxShadow: '3px 3px 5px 2px rgba(0,0,0,0.5)',
            transform: 'translateY(-1px)',
          },
        }}
      >
        {/* Selection checkbox */}
        <Checkbox
          checked={selected}
          onChange={() => onSelect?.(creator.rowId || creator.userId)}
          size="medium"
					checkedIcon={<Iconify icon='fluent-mdl2:checkbox-composite' width={14} />}
					icon={<Iconify icon='fluent-mdl2:checkbox' width={14} />}
          sx={{
            position: 'absolute',
            top: 14,
            left: 14,
            p: 0,
            color: '#7B7B7B',
            '&.Mui-checked': {
              color: '#1340FF',
            },
          }}
        />

        {/* Profile picture */}
        <Avatar src={profilePicture} alt={creator.name} sx={{ width: 61, height: 61, mb: 1 }} />

        {/* Name */}
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: 12,
            textAlign: 'center',
            lineHeight: 1.3,
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {creator.name}
        </Typography>

        {/* Social handle */}
        {handle && (
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.25 }}>
            {platformIcon && <Iconify icon={platformIcon} width={14} color="text.secondary" />}
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{handle}</Typography>
          </Stack>
        )}

        {/* Interests */}
        {creator.interests?.length > 0 && (
          <Stack direction="row" flexWrap="wrap" justifyContent="center" gap={0.5} sx={{ mt: 1.5 }}>
            {creator.interests.slice(0, 3).map((interest) => (
              <Chip
                key={interest}
                label={interest}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: 7,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  bgcolor: '#fff',
                  borderColor: '#EBEBEB',
                  color: '#8E8E93',
                  boxShadow: '0px -2px 0px 0px #EBEBEB inset',
                  borderRadius: '4px',
                }}
              />
            ))}
          </Stack>
        )}
      </Box>

      {/* ─── Middle: Stats + Bio ──────────────────────────────────────────────── */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Stats row */}
        <Stack direction="row" justifyContent={'space-between'} sx={{ mb: 2 }}>
          <StatItem label="Followers" value={formatNumber(followers)} />
          <StatItem label="Engagement Rate" value={formatEngagementRate(engagementRate)} />
          <StatItem label="Avg Likes" value={formatNumber(avgLikes)} />
          {platform !== 'tiktok' && <StatItem label="Avg Saves" value={formatNumber(avgSaves)} />}
          <StatItem label="Avg Shares" value={formatNumber(avgShares)} />
        </Stack>

        {/* Bio / About */}
        <Typography
          sx={{
            fontSize: 13,
            color: 'text.primary',
            lineHeight: 1.6,
          }}
        >
          {bio || 'No bio available.'}
        </Typography>
      </Box>

      {/* ─── Right: Top Videos ────────────────────────────────────────────────── */}
      <Stack direction="row" spacing={1} flex={1}>
        {topVideos.length > 0 ? (
          topVideos.map((video, idx) => (
            <VideoThumbnail
              key={video.id || video.video_id || idx}
              video={video}
              platform={platform}
              tiktokHandle={creator.handles?.tiktok}
            />
          ))
        ) : (
          <Box
            sx={{
              width: 150,
              height: 200,
              borderRadius: 1.5,
              bgcolor: 'grey.100',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>No videos</Typography>
          </Box>
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
    gender: PropTypes.string,
    age: PropTypes.number,
    location: PropTypes.string,
    creditTier: PropTypes.string,
    handles: PropTypes.shape({
      instagram: PropTypes.string,
      tiktok: PropTypes.string,
    }),
    interests: PropTypes.arrayOf(PropTypes.string),
    about: PropTypes.string,
    instagram: PropTypes.object,
    tiktok: PropTypes.object,
  }).isRequired,
  selected: PropTypes.bool,
  onSelect: PropTypes.func,
};

CreatorCard.defaultProps = {
  selected: false,
  onSelect: undefined,
};

export default CreatorCard;
