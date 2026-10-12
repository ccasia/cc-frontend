import PropTypes from 'prop-types';

import { Box, Divider, Typography } from '@mui/material';

import CreatorFieldLoading from 'src/sections/campaign/discover/client/v3-pitches/guest-extraction/creator-field-loading';

/**
 * Metric slots while a post's Bright Data scrape runs. Same loader as the
 * creator master list: every slot shimmers, spins, and shows the live status
 * tooltip.
 *
 * The desktop layout copies the loaded metrics row in UserPerformanceCard
 * (slot widths, padding, dividers), so the row does not jump when the
 * numbers arrive.
 */

const LOADER_HEIGHT = 36;
const LOADER_MAX_WIDTH = 120;

const labelSx = { whiteSpace: 'nowrap' };

const dividerSx = { width: '1px', height: '55px', backgroundColor: '#1340FF', flexShrink: 0 };

function MetricLabel({ children }) {
  return (
    <Typography
      fontFamily="Aileron"
      fontSize={{ md: 14, lg: 16, xl: 18 }}
      fontWeight={600}
      color="#636366"
      mb={0.5}
      sx={labelSx}
    >
      {children}
    </Typography>
  );
}

MetricLabel.propTypes = { children: PropTypes.node };

function Loader({ label, progress }) {
  return (
    <Box sx={{ width: '100%', maxWidth: LOADER_MAX_WIDTH }}>
      <CreatorFieldLoading
        label={`Fetching ${label.toLowerCase()}`}
        showSpinner
        height={LOADER_HEIGHT}
        progress={progress}
      />
    </Box>
  );
}

Loader.propTypes = {
  label: PropTypes.string.isRequired,
  progress: PropTypes.object,
};

export default function ScrapeMetricsLoading({ showSaves, progress, isMobile }) {
  const counts = ['Views', 'Likes', 'Comments', 'Shares', ...(showSaves ? ['Saves'] : [])];

  if (isMobile) {
    return (
      <Box
        display="grid"
        gridTemplateColumns="repeat(2, 1fr)"
        gap={1.5}
        width="100%"
        mb={1.5}
        px={1}
      >
        {['Engagement Rate', ...counts].map((label) => (
          <Box key={label} sx={{ minWidth: 0 }}>
            <Typography fontSize={12} color="text.secondary" mb={0.5} sx={labelSx}>
              {label}
            </Typography>
            <Loader label={label} progress={progress} />
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      alignItems="center"
      flex={1}
      justifyContent="space-between"
      sx={{ mx: 1, minWidth: 0, overflow: 'hidden' }}
    >
      <Box sx={{ textAlign: 'left', minWidth: 110 }}>
        <MetricLabel>
          <Box component="span" pr={1.5} sx={{ display: { xs: 'none', xl: 'inline' } }}>
            Engagement Rate
          </Box>
          <Box component="span" sx={{ display: { xs: 'inline', xl: 'none' } }}>
            Eng. Rate
          </Box>
        </MetricLabel>
        <Loader label="Engagement rate" progress={progress} />
      </Box>

      {counts.map((label) => (
        <Box key={label} display="flex" alignItems="center" flex={1} minWidth={0}>
          <Divider sx={dividerSx} />
          <Box sx={{ textAlign: 'left', flex: 1, minWidth: 0, overflow: 'hidden', px: 1 }}>
            <MetricLabel>{label}</MetricLabel>
            <Loader label={label} progress={progress} />
          </Box>
        </Box>
      ))}

      {/* TikTok has no Saves. A blank slot keeps its columns in line with Instagram rows. */}
      {!showSaves && (
        <Box display="flex" alignItems="center" flex={1} minWidth={0}>
          <Divider sx={{ ...dividerSx, backgroundColor: 'transparent' }} />
          <Box sx={{ flex: 1, px: 1 }} />
        </Box>
      )}
    </Box>
  );
}

ScrapeMetricsLoading.propTypes = {
  showSaves: PropTypes.bool,
  isMobile: PropTypes.bool,
  /** `{ status, startedAt }` for the status tooltip. */
  progress: PropTypes.object,
};
