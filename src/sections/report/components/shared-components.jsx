/* eslint-disable react/prop-types */
// components/reporting/SharedComponents.jsx
import { Box, Button, Divider, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

import PostMediaPlayer from './post-media-player';

export const ContentInfoHeader = ({ content }) => (
  <Box
    sx={{
      display: 'flex',
      mb: 4,
    }}
  >
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Typography sx={{ fontSize: { xs: 14, sm: 20 }, color: '#666', mb: 1 }}>Account</Typography>
      <Typography
        sx={{
          fontSize: { xs: 20, sm: 36 },
          color: '#0066FF',
          fontWeight: 400,
          fontFamily: '"Instrument Serif", serif',
        }}
      >
        {content.account}
      </Typography>
    </Box>

    <Divider
      orientation="vertical"
      flexItem
      sx={{ mx: 2, borderColor: '#0066FF', borderWidth: 0.5 }}
    />

    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Typography sx={{ fontSize: { xs: 14, sm: 20 }, color: '#666', mb: 1 }}>Content Type</Typography>

      <Typography
        sx={{
          fontSize: { xs: 20, sm: 36 },
          color: '#0066FF',
          fontWeight: 400,
          fontFamily: '"Instrument Serif", serif',
        }}
      >
        {content.contentType}
      </Typography>
    </Box>

    <Divider
      orientation="vertical"
      flexItem
      sx={{ mx: 2, borderColor: '#0066FF', borderWidth: 0.5 }}
    />

    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

      <Typography sx={{ fontSize: { xs: 14, sm: 20 }, color: '#666', mb: 1 }}>Date Posted</Typography>

      <Typography
        sx={{
          fontSize: { xs: 20, sm: 36 },
          color: '#0066FF',
          fontWeight: 400,
          fontFamily: '"Instrument Serif", serif',
        }}
      >
        {content.datePosted}
      </Typography>
    </Box>
  </Box>
);

export const ContentImageCard = ({ content }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
    <Box sx={{ overflow: 'hidden', height: 623, bgcolor: 'black' }}>
      {content.videoDraftLink ? (
        <PostMediaPlayer
          src={content.videoDraftLink}
          poster={content.mediaUrl}
          label={`${content.creatorName || 'Creator'} post video`}
          postUrl={content.pathname}
          platform={content.account}
        />
      ) : (
        <Box
          component="img"
          src={content.mediaUrl}
          alt={content.caption || 'Content'}
          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      )}
    </Box>

    {/* The video player carries its own post link */}
    {content.pathname && !content.videoDraftLink && (
      <Button
        component="a"
        href={content.pathname}
        target="_blank"
        rel="noopener noreferrer"
        variant="outlined"
        startIcon={
          <Iconify icon={content.account === 'TikTok' ? 'ic:baseline-tiktok' : 'mdi:instagram'} />
        }
        endIcon={<Iconify icon="eva:external-link-fill" width={16} />}
        sx={{ mt: 2, alignSelf: 'flex-start', borderRadius: 1, color: '#231F20', borderColor: '#E7E7E7' }}
      >
        View on {content.account || 'platform'}
      </Button>
    )}

    {content.caption && (
      <Typography
        sx={{
          fontSize: 14,
          color: '#333',
          mt: 2,
          lineHeight: 1.4,
          display: '-webkit-box',
          overflow: 'hidden',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {content.caption}
      </Typography>
    )}
  </Box>
);

export const StatsLegend = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box
        component="img"
        alt="legend_marker"
        src="/assets/icons/components/ic_legend_marker_gray.svg"
        width={20}
        mr={0.5}
      />
      <Typography sx={{ fontSize: 14, color: '#666' }}>Average Creator Stats</Typography>
    </Box>

    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box
        component="img"
        alt="legend_marker"
        src="/assets/icons/components/ic_legend_marker.svg"
        width={20}
        mr={0.5}
      />
      <Typography sx={{ fontSize: 14, color: '#666' }}>Current Creator Stats</Typography>
    </Box>
  </Box>
);
