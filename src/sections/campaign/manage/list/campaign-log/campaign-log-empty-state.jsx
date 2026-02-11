import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';

// ---------------------------------------------------------------------------

const SUBTITLES = {
  all: 'No activity has been recorded for this campaign yet.',
  admin: 'No admin actions have been recorded yet.',
  creator: 'No creator submissions have been recorded yet.',
  client: 'No client actions have been recorded yet.',
  invoice: 'No invoice activity has been recorded yet.',
};

// ---------------------------------------------------------------------------

export default function CampaignLogEmptyState({ tab, query }) {
  if (query) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 10,
          px: 3,
        }}
      >
        <Iconify icon="eva:search-fill" width={56} sx={{ color: '#8e8e93', mb: 2 }} />

        <Typography
          sx={{
            fontFamily: 'fontSecondaryFamily',
            fontSize: 28,
            fontWeight: 400,
            color: '#636366',
            mb: 0.5,
          }}
        >
          No results found
        </Typography>

        <Typography variant="body1" sx={{ color: '#8e8e93' }}>
          Try a different search term or filter
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 10,
        px: 3,
      }}
    >
      <Iconify
        icon="solar:document-text-linear"
        width={56}
        sx={{ color: '#8e8e93', mb: 2 }}
      />

      <Typography
        sx={{
          fontFamily: 'fontSecondaryFamily',
          fontSize: 28,
          fontWeight: 400,
          color: '#636366',
          mb: 0.5,
        }}
      >
        No activity yet
      </Typography>

      <Typography variant="body1" sx={{ color: '#8e8e93' }}>
        {SUBTITLES[tab] || SUBTITLES.all}
      </Typography>
    </Box>
  );
}

CampaignLogEmptyState.propTypes = {
  tab: PropTypes.string,
  query: PropTypes.string,
};
