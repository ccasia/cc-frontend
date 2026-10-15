import PropTypes from 'prop-types';
import {
  MediaTimeRange,
  MediaController,
  MediaControlBar,
  MediaPlayButton,
  MediaMuteButton,
  MediaChromeButton,
  MediaFullscreenButton,
} from 'media-chrome/react';

import { Box } from '@mui/material';

import Iconify from 'src/components/iconify';

const Icon = ({ slot, children, filled }) => (
  <svg
    slot={slot}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={filled ? 0 : 1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

Icon.propTypes = {
  slot: PropTypes.string,
  filled: PropTypes.bool,
  children: PropTypes.node,
};

const buttonSx = {
  flexShrink: 0,
  width: 30,
  height: 30,
  p: '7px',
  border: 0,
  borderRadius: 999,
};

export default function PostMediaPlayer({ src, poster, label, postUrl, platform }) {
  const postLabel = `View on ${platform || 'platform'}`;
  const openPost = () => window.open(postUrl, '_blank', 'noopener,noreferrer');

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        '--media-primary-color': 'white',
        '--media-icon-color': 'transparent',
        '--media-control-background': 'transparent',
        '--media-control-hover-background': 'rgb(255 255 255 / 8%)',
        '--media-button-icon-width': '15px',
        '--media-button-icon-height': '15px',
        '--media-focus-box-shadow': '0 0 0 2px white',
        '& media-controller': {
          display: 'block',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          bgcolor: 'black',
        },
        '& video': { display: 'block', width: '100%', height: '100%', objectFit: 'contain' },
        '& media-control-bar': {
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          m: 1.25,
          p: '3px 6px',
          border: '1px solid rgb(255 255 255 / 12%)',
          borderRadius: 999,
          bgcolor: 'rgb(35 35 35 / 78%)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 2px 8px rgb(0 0 0 / 12%)',
        },
        '& media-play-button, & media-mute-button, & media-fullscreen-button, & media-chrome-button':
          buttonSx,
        '& media-play-button svg[slot="play"]': { fill: 'currentColor', strokeWidth: 0 },
        '& media-time-range': {
          '--media-control-hover-background': 'transparent',
          '--media-control-padding': 0,
          '--media-range-track-height': '2px',
          '--media-range-track-border-radius': '999px',
          '--media-range-track-background': 'rgb(255 255 255 / 30%)',
          '--media-range-thumb-width': '6px',
          '--media-range-thumb-height': '6px',
          '--media-range-thumb-opacity': 0,
          flex: 1,
          minWidth: 0,
          height: 30,
        },
        '& media-time-range:hover, & media-time-range:focus-within, & media-time-range[dragging]': {
          '--media-range-thumb-opacity': 1,
        },
      }}
    >
      <MediaController aria-label={label} autohide="2" nomutedpref>
        {/* Creator uploads have no caption files */}
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          slot="media"
          src={src}
          poster={poster || undefined}
          playsInline
          loop
          preload="metadata"
          aria-label={label}
        />
        <MediaControlBar>
          <MediaPlayButton>
            <Icon slot="play" filled>
              <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
            </Icon>
            <Icon slot="pause">
              <rect x="14" y="3" width="5" height="18" rx="1" />
              <rect x="5" y="3" width="5" height="18" rx="1" />
            </Icon>
          </MediaPlayButton>
          <MediaTimeRange />
          <MediaMuteButton>
            <Icon slot="off">
              <path d="M11 4.7a.7.7 0 0 0-1.2-.5L6.4 7.6A1.4 1.4 0 0 1 5.4 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.4a1.4 1.4 0 0 1 1 .4l3.4 3.4a.7.7 0 0 0 1.2-.5z" />
              <line x1="22" x2="16" y1="9" y2="15" />
              <line x1="16" x2="22" y1="9" y2="15" />
            </Icon>
            <Icon slot="high">
              <path d="M11 4.7a.7.7 0 0 0-1.2-.5L6.4 7.6A1.4 1.4 0 0 1 5.4 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.4a1.4 1.4 0 0 1 1 .4l3.4 3.4a.7.7 0 0 0 1.2-.5z" />
              <path d="M16 9a5 5 0 0 1 0 6" />
              <path d="M19.4 18.4a9 9 0 0 0 0-12.7" />
            </Icon>
          </MediaMuteButton>
          {postUrl && (
            // A media-chrome button, so its tooltip matches the other controls
            <MediaChromeButton
              aria-label={postLabel}
              onClick={openPost}
              onKeyUp={(event) => ['Enter', ' '].includes(event.key) && openPost()}
            >
              <span slot="tooltip-content">{postLabel}</span>
              <Iconify
                icon={platform === 'TikTok' ? 'ic:baseline-tiktok' : 'mdi:instagram'}
                width={16}
              />
            </MediaChromeButton>
          )}
          <MediaFullscreenButton>
            <Icon slot="enter">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" x2="14" y1="3" y2="10" />
              <line x1="3" x2="10" y1="21" y2="14" />
            </Icon>
            <Icon slot="exit">
              <polyline points="4 14 10 14 10 20" />
              <polyline points="20 10 14 10 14 4" />
              <line x1="14" x2="21" y1="10" y2="3" />
              <line x1="3" x2="10" y1="21" y2="14" />
            </Icon>
          </MediaFullscreenButton>
        </MediaControlBar>
      </MediaController>
    </Box>
  );
}

PostMediaPlayer.propTypes = {
  src: PropTypes.string.isRequired,
  poster: PropTypes.string,
  label: PropTypes.string,
  postUrl: PropTypes.string,
  platform: PropTypes.string,
};
