/* eslint-disable react/prop-types */
// components/reporting/SharedComponents.jsx
import { Box, Divider, Typography } from '@mui/material';

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
  <Box
    sx={{
      overflow: 'hidden',
      height: 'auto',
      boxShadow: 'none',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <Box
      component="img"
      src={content.mediaUrl}
      alt={content.caption || 'Content'}
      sx={{
        width: '100%',
        height: 623,
        objectFit: 'cover',
        display: 'block',
      }}
    />
    <Box
      sx={{
        height: 70,
        overflow: 'hidden'
      }}
    >
      <Typography
        sx={{
          fontSize: 14,
          color: '#333',
          mt: 2,
          lineHeight: 1.4,
          display: '-webkit-box',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical'
        }}
      >
        {content.caption ||
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna.'}
      </Typography>
    </Box>
  </Box>
);

export const StatsLegend = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
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
