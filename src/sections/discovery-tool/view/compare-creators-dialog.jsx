import { useState } from 'react';
import PropTypes from 'prop-types';

import { Box, Chip, Stack, Avatar, Dialog, IconButton, Typography } from '@mui/material';

import { formatNumber } from 'src/utils/socialMetricsCalculator';

import Iconify from 'src/components/iconify';

// ─── Helpers (shared with CreatorCard) ────────────────────────────────────────

const formatEngagementRate = (rate) => {
  if (!rate && rate !== 0) return '0%';
  return `${Number(rate).toFixed(2)}%`;
};

const resolvePlatformData = (creator) => {
  if (creator.platform === 'instagram' && creator.instagram?.connected) {
    return { platform: 'instagram', ...creator.instagram };
  }
  if (creator.platform === 'tiktok' && creator.tiktok?.connected) {
    return { platform: 'tiktok', ...creator.tiktok };
  }
  const ig = creator.instagram;
  const tt = creator.tiktok;
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
  <Box sx={{ textAlign: 'center' }}>
    <Typography variant="caption" sx={{ color: '#1340FF', fontWeight: 700 }}>
      {label}
    </Typography>
    <Typography
      variant="h4"
      sx={{
        fontWeight: 400,
        fontFamily: 'Instrument Serif',
        color: '#1340FF',
        justifySelf: 'flex-start',
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

const VideoThumbnail = ({ video, platform, tiktokHandle }) => {
  const [hasImageError, setHasImageError] = useState(false);

  const thumbnailUrl =
    platform === 'instagram' ? video.thumbnail_url || video.media_url : video.cover_image_url;
  const likes = video.like_count ?? 0;
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
        flex: 1,
        height: 220,
        overflow: 'hidden',
        cursor: permalink ? 'pointer' : 'default',
        textDecoration: 'none',
        '&:hover .thumbnail-overlay': { opacity: 1 },
      }}
    >
      {thumbnailUrl && !hasImageError ? (
        <Box
          component="img"
          src={thumbnailUrl}
          alt="Video thumbnail"
          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setHasImageError(true)}
        />
      ) : (
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

      {/* Stats overlay */}
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

// ─── Single Creator Column ────────────────────────────────────────────────────

const CreatorColumn = ({ creator }) => {
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
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* ─── User Card ───────────────────────────────────────────────────────── */}
      <Box
        sx={{
          width: 250,
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          bgcolor: '#F5F5F5',
          borderRadius: 2,
          boxShadow: '3px 3px 3px 2px rgba(0,0,0,0.5)',
        }}
      >
        <Avatar src={profilePicture} alt={creator.name} sx={{ width: 72, height: 72, mb: 1.5 }} />
        <Typography sx={{ fontWeight: 600, fontSize: 14, textAlign: 'center' }}>
          {creator.name}
        </Typography>
        {handle && (
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.25 }}>
            {platformIcon && <Iconify icon={platformIcon} width={14} color="text.secondary" />}
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{handle}</Typography>
          </Stack>
        )}
        {creator.interests?.length > 0 && (
          <Stack direction="row" flexWrap="wrap" justifyContent="center" gap={0.5} sx={{ mt: 1.5 }}>
            {creator.interests.slice(0, 3).map((interest) => (
              <Chip
                key={interest}
                label={interest}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: 8,
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

      {/* ─── Stats Row ───────────────────────────────────────────────────────── */}
      <Stack
        direction="row"
        justifyContent="center"
        flexWrap="wrap"
        gap={3}
        sx={{ mt: 3, width: '100%' }}
      >
        <StatItem label="Followers" value={formatNumber(followers)} />
        <StatItem label="Engagement Rate" value={formatEngagementRate(engagementRate)} />
        <StatItem label="Avg Likes" value={formatNumber(avgLikes)} />
        {platform !== 'tiktok' && <StatItem label="Avg Saves" value={formatNumber(avgSaves)} />}
        <StatItem label="Avg Shares" value={formatNumber(avgShares)} />
      </Stack>

      {/* ─── Bio ─────────────────────────────────────────────────────────────── */}
      <Typography
        sx={{
          mt: 2,
          fontSize: 13,
          color: 'text.primary',
          lineHeight: 1.6,
          textAlign: 'center',
          minHeight: 44,
        }}
      >
        {bio || 'No bio available.'}
      </Typography>

      {/* ─── Top Content ─────────────────────────────────────────────────────── */}

      <Typography sx={{ mt: 2.5, mb: 1, fontWeight: 700, fontSize: 14, alignSelf: 'flex-start' }}>
        Top Content
      </Typography>

      <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
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
              width: '100%',
              height: 180,
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

CreatorColumn.propTypes = {
  creator: PropTypes.object.isRequired,
};

// ─── Main Dialog ──────────────────────────────────────────────────────────────

const CompareCreatorsDialog = ({ open, onClose, creators }) => {
  const [left, right] = creators || [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: { xs: 2, sm: 6 },
          maxHeight: '90vh',
					maxWidth: '80vw',
          overflowY: 'auto',
          // Hide scrollbar but allow scroll
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE/Edge
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
      }}
    >
      {/* Close button */}
      <IconButton onClick={onClose} sx={{ position: 'absolute', top: 12, right: 12, zIndex: 1 }}>
        <Iconify icon="mdi:close" width={24} />
      </IconButton>

      {/* Side-by-side columns */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
				spacing={{ xs: 2, sm: 6 }}
        divider={
          <Box
            sx={{
              display: 'block',
              width: '1px',
              alignSelf: 'stretch',
              bgcolor: 'divider',
            }}
          />
        }
      >
        {left && <CreatorColumn creator={left} />}
        {right && <CreatorColumn creator={right} />}
      </Stack>
    </Dialog>
  );
};

CompareCreatorsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  creators: PropTypes.arrayOf(PropTypes.object),
};

CompareCreatorsDialog.defaultProps = {
  creators: [],
};

export default CompareCreatorsDialog;
