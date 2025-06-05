// components/reporting/SharedComponents.jsx
import { Box, Typography, Divider } from '@mui/material';
import Iconify from 'src/components/iconify';

export const ContentInfoHeader = ({ content }) => (
  <Box
    sx={{
      display: 'flex',
      mb: 3,
      pb: 2,
    }}
  >
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Typography sx={{ fontSize: { xs: 18, sm: 20 }, color: '#666', mb: 1 }}>Account</Typography>
      <Typography
        sx={{
          fontSize: { xs: 30, sm: 36 },
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
      <Typography sx={{ fontSize: { xs: 18, sm: 20 }, color: '#666', mb: 1 }}>Content Type</Typography>
      <Typography
        sx={{
          fontSize: { xs: 30, sm: 36 },
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
      <Typography sx={{ fontSize: { xs: 18, sm: 20 }, color: '#666', mb: 1 }}>Date Posted</Typography>
      <Typography
        sx={{
          fontSize: { xs: 30, sm: 36 },
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
      borderRadius: 0,
      overflow: 'hidden',
      height: 'auto',
      boxShadow: 'none',
      border: '1px solid #eee',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <Box
      component="img"
      src={content.mediaUrl}
      alt={content.videoData.caption || 'Content'}
      sx={{
        width: '100%',
        height: 623,
        objectFit: 'cover',
        display: 'block',
      }}
    />
    <Box
      sx={{
        p: 2,
        borderTop: '1px solid #eee',
      }}
    >
      <Typography
        sx={{
          fontSize: 14,
          color: '#333',
          mb: 0,
          lineHeight: 1.4,
        }}
      >
        {content.videoData.caption || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna.'}
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
      <Typography sx={{ fontSize: 14, color: '#666' }}>
        Average Creator Stats
      </Typography>
    </Box>

    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box
				component="img"
				alt="legend_marker"
				src="/assets/icons/components/ic_legend_marker.svg"
        width={20}
        mr={0.5}
      />
      <Typography sx={{ fontSize: 14, color: '#666' }}>
        Current Creator Stats
      </Typography>
    </Box>
  </Box>
);